'use client';

import React, { useContext, useEffect, useMemo } from 'react';
import type * as ToneModule from 'tone';
import { HostContext, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import { AudioVolume, useAudioTrack } from '../../core/audio-track';
import { generatedAudio } from '../../core/generated-audio';
import { checkSeed, seededRandom, withRandom } from './seeded-random';
import { checkJson, checkKnownProps, describe, type KnownProps } from './generated-utils';

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
  // render(false): the clock ticks in one synchronous run. By default Tone
  // yields with setTimeout once per second of audio, and a hidden tab runs
  // those timers about once a second, so the render took as long as the sound.
  const rendered = await context.render(false);
  const buffer = rendered.get();
  if (!buffer) throw new Error('<ToneAudio>: the offline render returned no audio');
  return buffer;
};

const renderQueued = (job: RenderJob): Promise<AudioBuffer> => {
  const promise = queue.then(() => renderOffline(job));
  queue = promise.catch(() => undefined);
  return promise;
};

/**
 * The cache key of a Tone sound: the source text of `render`, `deps`,
 * `durationInFrames`, the composition's `fps`, `sampleRate`, `channels` and
 * `seed`. Where and how it plays (`volume`, `muted`, `name`, the enclosing
 * sequences) is not part of it.
 */
export const toneKey = (
  render: ToneAudioProps['render'],
  deps: readonly unknown[],
  durationInFrames: number,
  fps: number,
  sampleRate: number,
  channels: number,
  seed: number,
): string => JSON.stringify(['tone', String(render), deps, durationInFrames, fps, sampleRate, channels, seed]);

/** A Tone sound as generated audio, shared by every ToneAudio and usePrepareAudio() with the same key. */
export const toneAudio = (job: RenderJob & { deps: readonly unknown[]; durationInFrames: number }) =>
  generatedAudio(
    'tone',
    toneKey(job.render, job.deps, job.durationInFrames, job.fps, job.sampleRate, job.channels, job.seed),
    () => renderQueued(job),
  );

const RENDER_EXAMPLE = "(Tone) => { new Tone.Synth().toDestination().triggerAttackRelease('C5', '8n', 0); }";

/** How a prop is written in an error's example: as a JSX attribute or an object key. */
export type Usage = 'jsx' | 'object';
const usage = (style: Usage, name: string, value: string) => (style === 'jsx' ? `${name}={${value}}` : `${name}: ${value}`);

export const checkToneProps = (
  component: string,
  { durationInFrames, render, deps, sampleRate, channels }: Pick<ToneAudioProps, 'durationInFrames' | 'render' | 'deps' | 'sampleRate' | 'channels'>,
  style: Usage = 'jsx',
) => {
  if (durationInFrames === undefined) {
    throw new Error(
      `${component}: pass the length of the sound in frames as \`${usage(style, 'durationInFrames', '30')}\` (got no \`durationInFrames\`)`,
    );
  }
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`${component}: durationInFrames must be a positive integer, got ${JSON.stringify(durationInFrames)}`);
  }
  if (render === undefined) {
    throw new Error(`${component}: pass the Tone.js code as \`${usage(style, 'render', RENDER_EXAMPLE)}\` (got no \`render\`)`);
  }
  if (typeof render !== 'function') {
    throw new Error(
      `${component}: \`render\` must be a function of Tone with the Tone.js code, e.g. \`${usage(style, 'render', RENDER_EXAMPLE)}\`, got ${describe(render)}`,
    );
  }
  if (deps !== undefined && !Array.isArray(deps)) {
    throw new Error(`${component}: deps must be an array, got ${JSON.stringify(deps)}`);
  }
  if (deps !== undefined) checkJson(component, 'deps', deps);
  if (!Number.isInteger(sampleRate) || (sampleRate as number) < 3000 || (sampleRate as number) > 768000) {
    throw new Error(`${component}: sampleRate must be an integer from 3000 to 768000 (Hz), got ${JSON.stringify(sampleRate)}`);
  }
  if (channels !== 1 && channels !== 2) {
    throw new Error(`${component}: channels must be 1 or 2, got ${JSON.stringify(channels)}`);
  }
};

// Names a scene may use for a prop of <ToneAudio> (lower case, without - and _).
export const TONE_ALIASES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    ['duration', 'durationframes', 'length', 'lengthinframes', 'frames', 'numframes'].map((name) => [name, 'durationInFrames']),
  ),
  ...Object.fromEntries(
    ['code', 'fn', 'func', 'function', 'synth', 'callback', 'cb', 'play', 'compose', 'build', 'tone', 'music', 'onrender', 'children'].map(
      (name) => [name, 'render'],
    ),
  ),
  ...Object.fromEntries(['dependencies', 'dependson', 'inputs', 'data'].map((name) => [name, 'deps'])),
  ...Object.fromEntries(['gain', 'vol', 'level', 'loudness'].map((name) => [name, 'volume'])),
  ...Object.fromEntries(['mute', 'silent'].map((name) => [name, 'muted'])),
  ...Object.fromEntries(['label', 'title', 'trackname'].map((name) => [name, 'name'])),
  ...Object.fromEntries(['rate', 'hz'].map((name) => [name, 'sampleRate'])),
  ...Object.fromEntries(['channelcount', 'numberofchannels', 'numchannels'].map((name) => [name, 'channels'])),
  ...Object.fromEntries(['randomseed', 'rngseed'].map((name) => [name, 'seed'])),
};

const TONE_NOTES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    ['at', 'from', 'start', 'startat', 'startframe', 'startfrom', 'frame', 'delay', 'offset', 'time', 'when'].map((name) => [
      name,
      '<ToneAudio> starts at the start of its sequence: put it in <Sequence from={12}>, or schedule notes later inside render',
    ]),
  ),
  ...Object.fromEntries(
    ['durationinseconds', 'seconds'].map((name) => [name, 'the length is durationInFrames, in frames (seconds × fps)']),
  ),
  ...Object.fromEntries(
    ['zzfx', 'params', 'parameters', 'preset'].map((name) => [
      name,
      "a ZzFX sound is <Sfx zzfx={[1, 0, 900, 0, 0.02, 0.04]} />, also from 'motionforge/audio'",
    ]),
  ),
  ...Object.fromEntries(['src', 'url', 'file'].map((name) => [name, `a sound file is <Audio src="..." /> from 'motionforge'`])),
};

/** The props of <ToneAudio>, for the error on one it does not take. */
export const TONE_PROPS: KnownProps = {
  component: '<ToneAudio>',
  noun: 'prop',
  accepted: ['durationInFrames', 'render', 'deps', 'seed', 'sampleRate', 'channels', 'volume', 'muted', 'name'],
  required: ['durationInFrames', 'render'],
  aliases: TONE_ALIASES,
  notes: TONE_NOTES,
  example: `<ToneAudio durationInFrames={30} render={${RENDER_EXAMPLE}} />`,
};

/**
 * A sound written with Tone.js, rendered offline (an OfflineAudioContext,
 * faster than real time) into an AudioBuffer and registered as an audio
 * track at the start of the enclosing sequence. The track is registered at
 * once (`track.generated` describes the sound); while the samples render the
 * component holds the render gate. The result is cached by the source of
 * `render`, `deps` and the options (see toneKey). Renders nothing.
 *
 *   <ToneAudio durationInFrames={60} render={(Tone, { framesToSeconds }) => {
 *     const synth = new Tone.Synth().toDestination();
 *     synth.triggerAttackRelease('C5', '16n', 0);
 *     synth.triggerAttackRelease('G5', '16n', framesToSeconds(8));
 *   }} />
 */
export const ToneAudio: React.FC<ToneAudioProps> = (props) => {
  const { durationInFrames, render, deps = [], seed = 0, sampleRate = 48000, channels = 2, volume, muted = false, name } = props;
  checkKnownProps(TONE_PROPS, props);
  checkToneProps('<ToneAudio>', { ...props, sampleRate, channels });
  checkSeed('<ToneAudio>', seed);
  if (typeof muted !== 'boolean') throw new Error(`<ToneAudio>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  if (name !== undefined && typeof name !== 'string') throw new Error(`<ToneAudio>: name must be a string, got ${JSON.stringify(name)}`);
  if (volume !== undefined && typeof volume !== 'function' && !(typeof volume === 'number' && Number.isFinite(volume) && volume >= 0)) {
    throw new Error(`<ToneAudio>: volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  const host = useContext(HostContext);
  const listened = Boolean(host?.audio);
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const key = toneKey(render, deps, durationInFrames, fps, sampleRate, channels, seed);

  // Without a collector nobody plays it: nothing is described or rendered.
  // The render function of the first descriptor for `key` is used (its
  // source and every input are in the key).
  const generated = useMemo(
    () =>
      listened
        ? toneAudio({ render, deps, durationInFrames, fps, durationInSeconds: durationInFrames / fps, sampleRate, channels, seed })
        : null,
    // The other inputs are in `key`.
    [listened, key],
  );

  useAudioTrack(
    'ToneAudio',
    generated && {
      src: null,
      generated,
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

  // Holds the frame until the samples are rendered (collectAudioTracks()
  // runs no effects, so it renders nothing).
  useEffect(() => {
    if (!generated || generated.buffer) return;
    const handle = delayRender(`<ToneAudio> rendering ${durationInFrames} frames offline`);
    let active = true;
    generated.render().then(
      () => {
        if (active) continueRender(handle);
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(handle);
      },
    );
    return () => {
      active = false;
      continueRender(handle);
    };
  }, [generated, durationInFrames, delayRender, continueRender, cancelRender]);

  return null;
};
