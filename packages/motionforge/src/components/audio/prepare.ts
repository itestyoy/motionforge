'use client';

import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { HostContext, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import { useIsCollectingAudio } from '../../core/audio-track';
import { checkParams, checkSampleRate, SFX_ALIASES, sfxAudio, sfxKey, ZZFX_EXAMPLE, type ZzfxParams } from './Sfx';
import { checkToneProps, TONE_ALIASES, toneAudio, toneKey, type ToneAudioProps } from './ToneAudio';
import { checkSeed } from './seeded-random';
import { checkKnownProps, describe, type KnownProps } from './generated-utils';

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

// Where and how a sound plays is the component's, not part of the prepared sound.
const PLAYBACK = ['at', 'volume', 'muted', 'name'];

/**
 * The keys of a prepared sound: the component's cache-key props, with the
 * component's aliases; its playback props (and their aliases) are explained.
 */
const soundKeys = (type: 'sfx' | 'tone', where: string, accepted: string[], required: string[], aliases: Readonly<Record<string, string>>, example: string): KnownProps => {
  const component = type === 'sfx' ? '<Sfx>' : '<ToneAudio>';
  const playback = (name: string) => `where and how a sound plays (\`${name}\`) goes on the ${component} that plays it, not in the prepared sound`;
  const notes: Record<string, string> = Object.fromEntries(PLAYBACK.map((name) => [name.toLowerCase(), playback(name)]));
  const own: Record<string, string> = {};
  for (const [alias, name] of Object.entries(aliases)) {
    if (accepted.includes(name)) own[alias] = name;
    else if (PLAYBACK.includes(name)) notes[alias] = playback(name);
  }
  return { component: where, subject: `A ${type} sound`, noun: 'key', accepted, required, aliases: own, notes, example };
};

const sfxKeys = (where: string) =>
  soundKeys('sfx', where, ['type', 'zzfx', 'seed', 'sampleRate'], ['type', 'zzfx'], SFX_ALIASES, `{ type: 'sfx', zzfx: ${ZZFX_EXAMPLE} }`);
const toneKeys = (where: string) =>
  soundKeys(
    'tone',
    where,
    ['type', 'durationInFrames', 'render', 'deps', 'seed', 'sampleRate', 'channels'],
    ['type', 'durationInFrames', 'render'],
    TONE_ALIASES,
    "{ type: 'tone', durationInFrames: 30, render: (Tone) => { new Tone.Synth().toDestination().triggerAttackRelease('C5', '8n', 0); } }",
  );

const SOUND_SHAPES = `{ type: 'sfx', zzfx: ${ZZFX_EXAMPLE} } (a ZzFX sound) or { type: 'tone', durationInFrames: 30, render: (Tone) => { ... } } (Tone.js code)`;

/** The `type` a sound without a valid one most likely means, as a hint. */
const typeHint = (sound: Record<string, unknown>): string => {
  const keys = Object.keys(sound).map((key) => key.toLowerCase());
  const type = typeof sound.type === 'string' ? sound.type.toLowerCase() : null;
  if (type === 'zzfx' || keys.includes('zzfx')) return ` (with \`zzfx\` it is \`type: 'sfx'\`)`;
  if (type === 'toneaudio' || keys.includes('render') || keys.includes('durationinframes')) {
    return ` (with \`render\` it is \`type: 'tone'\`)`;
  }
  return '';
};

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
    if (typeof sound !== 'object' || sound === null || Array.isArray(sound)) {
      throw new Error(`${where} must be ${SOUND_SHAPES}, got ${describe(sound)}`);
    }
    if (sound.type !== 'sfx' && sound.type !== 'tone') {
      const raw = sound as Record<string, unknown>;
      const got = 'type' in raw ? `\`type: ${describe(raw.type)}\`` : 'no `type`';
      throw new Error(`${where} must be ${SOUND_SHAPES}${typeHint(raw)}, got ${got}: ${describe(raw)}`);
    }
    checkKnownProps(sound.type === 'sfx' ? sfxKeys(where) : toneKeys(where), sound);
    const seed = sound.seed ?? 0;
    checkSeed(where, seed);
    if (sound.type === 'sfx') {
      const sampleRate = sound.sampleRate ?? 44100;
      checkSampleRate(where, sampleRate);
      return sfxKey(checkParams(where, sound.zzfx, `zzfx: ${ZZFX_EXAMPLE}`), sampleRate, seed);
    }
    const sampleRate = sound.sampleRate ?? 48000;
    const channels = sound.channels ?? 2;
    checkToneProps(where, { ...sound, sampleRate, channels }, 'object');
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
