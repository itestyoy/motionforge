'use client';

import React, { useContext, useEffect, useRef, useState } from 'react';
import type * as ToneModule from 'tone';
import { HostContext, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import { AudioVolume, useAudioTrack } from '../../core/audio-track';
import { checkSeed, seededRandom, withRandom } from './seeded-random';
import { checkJson, deleteGenerated, getGenerated, setGenerated } from './generated-cache';

/** Tone.js itself: what `import * as Tone from 'tone'` gives. */
export type Tone = typeof ToneModule;

/** The second argument of ToneAudio's `render`. */
export interface ToneRenderContext {
  /** The offline context the sound renders in (also `Tone.getContext()` during `render`); its transport is `context.transport`. */
  context: ToneModule.OfflineContext;
  /** Frames per second of the composition. */
  fps: number;
  /** Length of the render in seconds (`durationInFrames / fps`). */
  durationInSeconds: number;
  /** Seconds of `frames` composition frames, for Tone's times: `framesToSeconds(15)`. */
  framesToSeconds: (frames: number) => number;
}

export interface ToneAudioProps {
  /** Length of the sound in frames (a positive integer): the offline render is this long. */
  durationInFrames: number;
  /**
   * Ordinary Tone.js code: build the graph and schedule notes, e.g.
   * `(Tone) => { new Tone.Synth().toDestination().triggerAttackRelease('C4', '8n', 0) }`.
   * It runs inside an offline context, synchronously (async work and
   * `await` are not allowed; samples loaded by Tone are awaited before the
   * render, so start them from the transport). It must be a pure function
   * of its source and `deps`: the result is cached by them.
   */
  render: (tone: Tone, context: ToneRenderContext) => void;
  /** JSON data `render` reads from outside (props, notes): part of the cache key, like useMemo's deps. */
  deps?: readonly unknown[];
  /** Seed of Math.random during the render (an integer, default 0). */
  seed?: number;
  /** Sample rate of the render (default 48000; fixed, so the samples do not depend on the device). */
  sampleRate?: number;
  /** 1 or 2 (default 2). */
  channels?: 1 | 2;
  /** Gain ≥ 0, or a function of the frame counted from the start of the sound. */
  volume?: AudioVolume;
  muted?: boolean;
  /** A label for the audio track. */
  name?: string;
}

const loadTone = (): Promise<Tone> => import('tone');

const MISSING_TONE =
  '<ToneAudio> needs Tone.js, an optional peer dependency of motionforge: install it (npm install tone@15)';

// Tone fills one noise buffer per type (white, pink, brown) the first time
// noise plays, from Math.random, and keeps it for the page. Filling them
// before the first render, from their own fixed seed, keeps them the same on
// every page load and keeps that draw out of the render's sequence.
const prewarmed = new WeakSet<object>();
const prewarmNoise = (Tone: Tone) => {
  if (prewarmed.has(Tone) || typeof Tone.Noise !== 'function') return;
  withRandom(seededRandom(0x6e6f6973), () => {
    for (const type of ['white', 'pink', 'brown'] as const) {
      const noise = new Tone.Noise(type);
      noise.start(0);
      noise.dispose();
    }
  });
  prewarmed.add(Tone);
};

// One offline render at a time: Tone has one global context, which each
// render replaces while its callback runs.
let queue: Promise<unknown> = Promise.resolve();

interface RenderJob {
  render: ToneAudioProps['render'];
  fps: number;
  durationInSeconds: number;
  sampleRate: number;
  channels: number;
  seed: number;
}

const renderOffline = async ({ render, fps, durationInSeconds, sampleRate, channels, seed }: RenderJob): Promise<AudioBuffer> => {
  let Tone: Tone;
  try {
    Tone = await loadTone();
  } catch (error) {
    throw new Error(`${MISSING_TONE}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const random = seededRandom(seed);
  const context = new Tone.OfflineContext(channels, durationInSeconds, sampleRate);
  const original = Tone.getContext();
  Tone.setContext(context);
  try {
    prewarmNoise(Tone);
    const result: unknown = withRandom(random, () =>
      render(Tone, { context, fps, durationInSeconds, framesToSeconds: (frames: number) => frames / fps }),
    );
    if (typeof (result as { then?: unknown } | null)?.then === 'function') {
      (result as Promise<unknown>).then(undefined, () => undefined);
      throw new Error(
        '<ToneAudio>: render must be synchronous (no async function, no await): Math.random is seeded only while it runs. ' +
          'Samples loaded by Tone are awaited before the render; start them from the transport.',
      );
    }
  } finally {
    Tone.setContext(original);
  }
  await Tone.loaded();
  // Transport callbacks (Loop, Part, Sequence, scheduled events) run on the
  // render clock's ticks: each tick runs with the seeded Math.random, and the
  // page keeps the real one in between.
  const emit = context.emit;
  context.emit = function seededEmit(this: typeof context, ...args: Parameters<typeof emit>) {
    return withRandom(random, () => emit.apply(this, args));
  };
  const rendered = await context.render();
  const buffer = rendered.get();
  if (!buffer) throw new Error('<ToneAudio>: the offline render returned no audio');
  return buffer;
};

const renderTone = (key: string, job: RenderJob): Promise<AudioBuffer> => {
  const cached = getGenerated<Promise<AudioBuffer>>(key);
  if (cached) return cached;
  const promise = queue.then(() => renderOffline(job));
  queue = promise.catch(() => undefined);
  // A failed render is not kept, so a later mount tries again.
  promise.catch(() => deleteGenerated(key, promise));
  return setGenerated(key, promise);
};

// Rendered buffers by key, to use at once (without holding the gate again)
// when the same sound mounts again.
const rendered = new Map<string, AudioBuffer>();
const remember = (key: string, buffer: AudioBuffer) => {
  rendered.delete(key);
  rendered.set(key, buffer);
  while (rendered.size > 64) rendered.delete(rendered.keys().next().value as string);
};

const checkProps = ({ durationInFrames, render, deps, sampleRate, channels }: ToneAudioProps) => {
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`<ToneAudio>: durationInFrames must be a positive integer, got ${JSON.stringify(durationInFrames)}`);
  }
  if (typeof render !== 'function') {
    throw new Error(`<ToneAudio>: render must be a function (Tone) => { ... }, got ${JSON.stringify(render)}`);
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error(`<ToneAudio>: deps must be an array, got ${JSON.stringify(deps)}`);
  }
  if (deps !== undefined) checkJson('<ToneAudio>', 'deps', deps);
  if (!Number.isInteger(sampleRate) || (sampleRate as number) < 3000 || (sampleRate as number) > 768000) {
    throw new Error(`<ToneAudio>: sampleRate must be an integer from 3000 to 768000 (Hz), got ${JSON.stringify(sampleRate)}`);
  }
  if (channels !== 1 && channels !== 2) {
    throw new Error(`<ToneAudio>: channels must be 1 or 2, got ${JSON.stringify(channels)}`);
  }
};

/**
 * A sound written with Tone.js, rendered offline (an OfflineAudioContext,
 * faster than real time) into an AudioBuffer and registered as an audio
 * track at the start of the enclosing sequence. While it renders it holds
 * the render gate; the result is cached by the source of `render`, `deps`
 * and the options. Renders nothing.
 *
 *   <ToneAudio durationInFrames={60} render={(Tone, { framesToSeconds }) => {
 *     const synth = new Tone.Synth().toDestination();
 *     synth.triggerAttackRelease('C5', '16n', 0);
 *     synth.triggerAttackRelease('G5', '16n', framesToSeconds(8));
 *   }} />
 */
export const ToneAudio: React.FC<ToneAudioProps> = (props) => {
  const { durationInFrames, render, deps = [], seed = 0, sampleRate = 48000, channels = 2, volume, muted = false, name } = props;
  checkProps({ ...props, sampleRate, channels });
  checkSeed('<ToneAudio>', seed);
  if (typeof muted !== 'boolean') throw new Error(`<ToneAudio>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  if (name !== undefined && typeof name !== 'string') throw new Error(`<ToneAudio>: name must be a string, got ${JSON.stringify(name)}`);
  if (volume !== undefined && typeof volume !== 'function' && !(typeof volume === 'number' && Number.isFinite(volume) && volume >= 0)) {
    throw new Error(`<ToneAudio>: volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  const host = useContext(HostContext);
  const collector = host?.audio ?? null;
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const key = JSON.stringify(['tone', String(render), deps, durationInFrames, fps, sampleRate, channels, seed]);

  // The latest render function (its source is in `key`).
  const renderRef = useRef(render);
  renderRef.current = render;
  const [done, setDone] = useState<{ key: string; buffer: AudioBuffer } | null>(null);
  const buffer = done?.key === key ? done.buffer : rendered.get(key) ?? null;
  const handle = useRef<number | null>(null);

  useEffect(() => {
    // Without a collector nobody plays it: nothing is rendered.
    if (!collector || rendered.has(key)) return;
    const current = delayRender(`<ToneAudio> rendering ${durationInFrames} frames offline`);
    handle.current = current;
    let active = true;
    renderTone(key, {
      render: renderRef.current,
      fps,
      durationInSeconds: durationInFrames / fps,
      sampleRate,
      channels,
      seed,
    }).then(
      (result) => {
        remember(key, result);
        if (active) setDone({ key, buffer: result });
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(current);
      },
    );
    return () => {
      active = false;
      continueRender(current);
      handle.current = null;
    };
    // The other inputs are in `key`.
  }, [collector, key, delayRender, continueRender, cancelRender]);

  useAudioTrack(
    'ToneAudio',
    buffer && {
      src: null,
      buffer,
      bufferKey: key,
      name: name ?? null,
      trimBefore: 0,
      trimAfter: null,
      playbackRate: 1,
      loop: false,
      muted,
      volume,
      at: 0,
      lengthInFrames: durationInFrames,
    },
  );

  // Released once the track is registered (the effect above in useAudioTrack ran first).
  useEffect(() => {
    if (buffer && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [buffer, continueRender]);

  return null;
};
