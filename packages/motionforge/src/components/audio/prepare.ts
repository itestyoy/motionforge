'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { HostContext, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import { useIsCollectingAudio } from '../../core/audio-track';
import { checkParams, checkSampleRate, sfxAudio, sfxKey, type ZzfxParams } from './Sfx';
import { checkToneProps, toneAudio, toneKey, type ToneAudioProps } from './ToneAudio';
import { checkSeed } from './seeded-random';

/**
 * A generated sound to render ahead of use: the props of `<Sfx>` or
 * `<ToneAudio>` that make up its cache key (where and how it plays, `at`,
 * `volume`, `muted`, `name`, is not part of it).
 */
export type PreparedSound =
  | {
      type: 'sfx';
      zzfx: ZzfxParams;
      seed?: number;
      sampleRate?: number;
    }
  | {
      type: 'tone';
      durationInFrames: number;
      render: ToneAudioProps['render'];
      deps?: readonly unknown[];
      seed?: number;
      sampleRate?: number;
      channels?: 1 | 2;
    };

const describe = (value: unknown) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const SFX_KEYS = ['type', 'zzfx', 'seed', 'sampleRate'];
const TONE_KEYS = ['type', 'durationInFrames', 'render', 'deps', 'seed', 'sampleRate', 'channels'];

/**
 * Renders generated sounds before they play: a sound that starts on input
 * (a tap, whose frame is not known in advance) then plays at once. Holds the
 * render gate until every sound is rendered and cached (inside a premounted
 * sequence it does not), and returns whether they are. A `<Sfx>` or
 * `<ToneAudio>` mounted later with the same key (see PreparedSound) uses the
 * cached samples: it holds nothing and its track has `generated.buffer` set
 * when it registers. A failed render goes to cancelRender(). Without an
 * audio collector on the FrameProvider, and in collectAudioTracks(), nothing
 * is rendered and it returns true.
 *
 *   usePrepareAudio([
 *     { type: 'sfx', zzfx: POP },
 *     { type: 'tone', durationInFrames: 30, render: chime },
 *   ]);
 */
export const usePrepareAudio = (sounds: readonly PreparedSound[]): boolean => {
  if (!Array.isArray(sounds)) {
    throw new Error(`usePrepareAudio: sounds must be an array, got ${describe(sounds)}`);
  }
  const host = useContext(HostContext);
  const listened = Boolean(host?.audio);
  const collecting = useIsCollectingAudio();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();

  // Checked like the components' props; the keys identify the sounds.
  const keys = sounds.map((sound, index) => {
    const where = `usePrepareAudio: sounds[${index}]`;
    if (typeof sound !== 'object' || sound === null || (sound.type !== 'sfx' && sound.type !== 'tone')) {
      throw new Error(`${where} must be { type: 'sfx', zzfx, ... } or { type: 'tone', durationInFrames, render, ... }, got ${describe(sound)}`);
    }
    const allowed = sound.type === 'sfx' ? SFX_KEYS : TONE_KEYS;
    for (const key of Object.keys(sound)) {
      if (!allowed.includes(key)) {
        throw new Error(
          `${where}: a ${sound.type} sound takes ${allowed.join(', ')}, not ${JSON.stringify(key)} (where and how it plays is the component's)`,
        );
      }
    }
    const seed = sound.seed ?? 0;
    checkSeed(where, seed);
    if (sound.type === 'sfx') {
      const sampleRate = sound.sampleRate ?? 44100;
      checkSampleRate(where, sampleRate);
      return sfxKey(checkParams(where, sound.zzfx), sampleRate, seed);
    }
    const sampleRate = sound.sampleRate ?? 48000;
    const channels = sound.channels ?? 2;
    checkToneProps(where, { ...sound, sampleRate, channels });
    return toneKey(sound.render, sound.deps ?? [], sound.durationInFrames, fps, sampleRate, channels, seed);
  });
  const key = keys.join('\n');

  // The latest sounds (their inputs are in `key`).
  const latest = useRef(sounds);
  latest.current = sounds;
  const generated = useMemo(
    () =>
      listened && !collecting
        ? latest.current.map((sound) =>
            sound.type === 'sfx'
              ? sfxAudio(checkParams('usePrepareAudio', sound.zzfx), sound.sampleRate ?? 44100, sound.seed ?? 0).generated
              : toneAudio({
                  render: sound.render,
                  deps: sound.deps ?? [],
                  durationInFrames: sound.durationInFrames,
                  fps,
                  durationInSeconds: sound.durationInFrames / fps,
                  sampleRate: sound.sampleRate ?? 48000,
                  channels: sound.channels ?? 2,
                  seed: sound.seed ?? 0,
                }),
          )
        : [],
    [listened, collecting, key, fps],
  );
  const cached = generated.every((sound) => sound.buffer !== null);
  const [renderedKey, setRenderedKey] = useState<string | null>(null);
  const handle = useRef<number | null>(null);

  useEffect(() => {
    if (cached) return undefined;
    const current = delayRender(`usePrepareAudio rendering ${generated.length} sound${generated.length === 1 ? '' : 's'}`);
    handle.current = current;
    let active = true;
    Promise.all(generated.map((sound) => sound.render())).then(
      () => {
        if (active) setRenderedKey(key);
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
  }, [generated, cached, key, delayRender, continueRender, cancelRender]);

  // Released once the component has rendered with the sounds cached.
  useEffect(() => {
    if (renderedKey === key && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [renderedKey, key, continueRender]);

  return cached || renderedKey === key;
};
