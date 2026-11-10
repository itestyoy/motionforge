'use client';

import React, { useContext, useMemo } from 'react';
import { HostContext, TimelineContext, useVideoConfig } from '../../core/context';
import { AudioVolume, useAudioTrack, useIsCollectingAudio } from '../../core/audio-track';
import { generatedAudio } from '../../core/generated-audio';
import { buildZzfxSamples, ZZFX_VOLUME } from './zzfx';
import { checkSeed, seededRandom } from './seeded-random';
import { checkKnownProps, describe, type KnownProps, toAudioBuffer } from './generated-utils';

/**
 * ZzFX parameters, as the ZzFX designer (https://killedbyapixel.github.io/ZzFX/)
 * copies them: `[volume, randomness, frequency, attack, sustain, release,
 * shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime,
 * noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]`.
 * Holes and `undefined` take ZzFX's defaults.
 */
export type ZzfxParams = ReadonlyArray<number | undefined>;

const MAX_PARAMS = 21;

/** ZzFX parameters for the examples in error messages (a short blip). */
export const ZZFX_EXAMPLE = '[1, 0, 900, 0, 0.02, 0.04]';

/**
 * Checks ZzFX parameters. `usage` shows how they are passed where they are
 * missing or wrong (`zzfx={[...]}` on `<Sfx>`), `name` names them.
 */
export const checkParams = (
  component: string,
  params: unknown,
  usage = `zzfx={${ZZFX_EXAMPLE}}`,
  name = 'zzfx',
): (number | undefined)[] => {
  if (params === undefined) {
    throw new Error(`${component}: pass the ZzFX parameters as \`${usage}\` (got no \`${name}\`)`);
  }
  if (!Array.isArray(params)) {
    throw new Error(
      `${component}: \`${name}\` must be an array of numbers (the ZzFX parameters), e.g. \`${usage}\`, got ${describe(params)}`,
    );
  }
  if (params.length > MAX_PARAMS) {
    throw new Error(`${component}: ZzFX takes at most ${MAX_PARAMS} parameters, got ${params.length}`);
  }
  // Array.from turns holes into undefined, which takes ZzFX's default.
  return Array.from(params, (value, index) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`${component}: ZzFX parameter ${index} must be a finite number or left out, got ${JSON.stringify(value)}`);
    }
    return value;
  });
};

export const checkSampleRate = (component: string, sampleRate: unknown): number => {
  if (!Number.isInteger(sampleRate) || (sampleRate as number) < 3000 || (sampleRate as number) > 768000) {
    throw new Error(`${component}: sampleRate must be an integer from 3000 to 768000 (Hz), got ${JSON.stringify(sampleRate)}`);
  }
  return sampleRate as number;
};

/**
 * The samples of a ZzFX sound, at the loudness `zzfx()` plays them (ZzFX's
 * master volume 0.3 applied). Pure: ZzFX's randomness (parameter 1) draws
 * from a generator seeded with `seed`, so the same arguments always give the
 * same samples. Needs no Web Audio.
 *
 *   const samples = renderZzfx([, , 925, 0.04, 0.3, 0.6, 1, 0.3, , 6.27, -184, 0.09, 0.17]);
 */
export const renderZzfx = (params: ZzfxParams, sampleRate = 44100, seed = 0): Float32Array => {
  const values = checkParams('renderZzfx', params, `renderZzfx(${ZZFX_EXAMPLE})`, 'params');
  checkSampleRate('renderZzfx', sampleRate);
  checkSeed('renderZzfx', seed);
  const samples = buildZzfxSamples(sampleRate, seededRandom(seed), values);
  for (let i = 0; i < samples.length; i++) samples[i] *= ZZFX_VOLUME;
  return samples;
};

/**
 * The cache key of a ZzFX sound: its parameters (holes and `undefined` alike,
 * as `null`), sample rate and seed. Where and how it plays (`at`, `volume`,
 * `muted`, `name`) is not part of it.
 */
export const sfxKey = (params: ReadonlyArray<number | undefined>, sampleRate: number, seed: number): string =>
  JSON.stringify(['zzfx', params, sampleRate, seed]);

// Samples by key, the most recent last: the length of a sound is needed to
// place its track also when no AudioBuffer is made (collectAudioTracks()).
const samplesByKey = new Map<string, Float32Array>();
const zzfxSamples = (key: string, params: ReadonlyArray<number | undefined>, sampleRate: number, seed: number) => {
  let samples = samplesByKey.get(key);
  if (samples) {
    samplesByKey.delete(key);
  } else {
    samples = renderZzfx(params, sampleRate, seed);
  }
  samplesByKey.set(key, samples);
  while (samplesByKey.size > 64) samplesByKey.delete(samplesByKey.keys().next().value as string);
  return samples;
};

/** The samples of a ZzFX sound as generated audio, shared by every Sfx and usePrepareAudio() with the same key. */
export const sfxAudio = (params: ReadonlyArray<number | undefined>, sampleRate: number, seed: number) => {
  const key = sfxKey(params, sampleRate, seed);
  return {
    generated: generatedAudio('zzfx', key, () => toAudioBuffer('<Sfx>', [zzfxSamples(key, params, sampleRate, seed)], sampleRate)),
    length: () => zzfxSamples(key, params, sampleRate, seed).length,
  };
};

// Names a scene may use for a prop of <Sfx> (lower case, without - and _).
export const SFX_ALIASES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    ['params', 'param', 'parameters', 'zzfxparams', 'zzfxparameters', 'sound', 'sfx', 'preset', 'effect', 'args', 'values', 'settings', 'config'].map(
      (name) => [name, 'zzfx'],
    ),
  ),
  ...Object.fromEntries(
    ['start', 'startat', 'startframe', 'startfrom', 'from', 'frame', 'atframe', 'delay', 'offset', 'time', 'when'].map((name) => [name, 'at']),
  ),
  ...Object.fromEntries(['gain', 'vol', 'level', 'loudness'].map((name) => [name, 'volume'])),
  ...Object.fromEntries(['mute', 'silent'].map((name) => [name, 'muted'])),
  ...Object.fromEntries(['label', 'title', 'trackname'].map((name) => [name, 'name'])),
  ...Object.fromEntries(['rate', 'hz'].map((name) => [name, 'sampleRate'])),
  ...Object.fromEntries(['randomseed', 'rngseed'].map((name) => [name, 'seed'])),
};

const SFX_NOTES: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    ['duration', 'durationinframes', 'length', 'lengthinframes', 'frames'].map((name) => [
      name,
      'a ZzFX sound is as long as its parameters make it: attack, sustain and release, zzfx[3], zzfx[4] and zzfx[5], in seconds',
    ]),
  ),
  ...Object.fromEntries(
    ['render', 'code', 'fn', 'synth'].map((name) => [
      name,
      "Tone.js code is <ToneAudio durationInFrames={30} render={(Tone) => { ... }} />, also from 'motionforge/audio'",
    ]),
  ),
  ...Object.fromEntries(['src', 'url', 'file'].map((name) => [name, `a sound file is <Audio src="..." /> from 'motionforge'`])),
  children: '<Sfx> renders nothing and takes no children',
};

/** The props of <Sfx>, for the error on one it does not take. */
export const SFX_PROPS: KnownProps = {
  component: '<Sfx>',
  noun: 'prop',
  accepted: ['zzfx', 'at', 'seed', 'sampleRate', 'volume', 'muted', 'name'],
  required: ['zzfx'],
  aliases: SFX_ALIASES,
  notes: SFX_NOTES,
  example: `<Sfx at={12} zzfx={${ZZFX_EXAMPLE}} />`,
};

export interface SfxProps {
  /** ZzFX parameters (see ZzfxParams). */
  zzfx: ZzfxParams;
  /** The frame the sound starts at, in the frames of the enclosing sequence (an integer ≥ 0, default 0). */
  at?: number;
  /** Seed of ZzFX's randomness (an integer, default 0). */
  seed?: number;
  /** Sample rate of the samples (default 44100, as ZzFX's). */
  sampleRate?: number;
  /** Gain ≥ 0, or a function of the frame counted from `at`. */
  volume?: AudioVolume;
  muted?: boolean;
  /** A label for the audio track. */
  name?: string;
}

/**
 * A ZzFX sound effect as an audio track: `<Sfx at={12} zzfx={[...]} />`
 * plays the sound at frame 12 of the enclosing sequence. The samples are
 * computed when the component mounts (no gate needed) and handed to the
 * host as an AudioBuffer (`track.generated`); renders nothing.
 */
export const Sfx: React.FC<SfxProps> = (props) => {
  const { zzfx, at = 0, seed = 0, sampleRate = 44100, volume, muted = false, name } = props;
  const host = useContext(HostContext);
  const timeline = useContext(TimelineContext);
  const collecting = useIsCollectingAudio();
  const { fps } = useVideoConfig();
  checkKnownProps(SFX_PROPS, props);
  const params = checkParams('<Sfx>', zzfx);
  checkSampleRate('<Sfx>', sampleRate);
  checkSeed('<Sfx>', seed);
  if (!Number.isInteger(at) || at < 0) {
    throw new Error(`<Sfx>: at must be an integer >= 0 (a frame of the enclosing sequence), got ${JSON.stringify(at)}`);
  }
  if (timeline && timeline.offset + at >= timeline.end) {
    throw new Error(
      `<Sfx>: at={${at}} is not before the end of its sequence (it ends at its frame ${timeline.end - timeline.offset})`,
    );
  }
  if (volume !== undefined && typeof volume !== 'function' && !(typeof volume === 'number' && Number.isFinite(volume) && volume >= 0)) {
    throw new Error(`<Sfx>: volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  if (typeof muted !== 'boolean') throw new Error(`<Sfx>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  if (name !== undefined && typeof name !== 'string') throw new Error(`<Sfx>: name must be a string, got ${JSON.stringify(name)}`);

  const key = sfxKey(params, sampleRate, seed);
  const listened = Boolean(host?.audio);
  // Without a collector nobody plays it: nothing is computed (and no Web
  // Audio is needed). collectAudioTracks() needs only the length.
  const sound = useMemo(() => {
    if (!listened) return null;
    const { generated, length } = sfxAudio(params, sampleRate, seed);
    if (!collecting) generated.renderNow();
    return { generated, length: length() };
    // `params`, `sampleRate` and `seed` are in `key`.
  }, [listened, collecting, key]);

  useAudioTrack(
    'Sfx',
    sound && {
      src: null,
      generated: sound.generated,
      name: name ?? null,
      trimBefore: 0,
      trimAfter: null,
      playbackRate: 1,
      loop: false,
      muted,
      volume,
      at,
      lengthInFrames: (sound.length / sampleRate) * fps,
    },
  );
  return null;
};
