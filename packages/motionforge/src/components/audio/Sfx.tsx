'use client';

import React, { useContext, useMemo } from 'react';
import { HostContext, TimelineContext, useVideoConfig } from '../../core/context';
import { AudioVolume, useAudioTrack } from '../../core/audio-track';
import { buildZzfxSamples, ZZFX_VOLUME } from './zzfx';
import { checkSeed, seededRandom } from './seeded-random';
import { getGenerated, setGenerated, toAudioBuffer } from './generated-cache';

/**
 * ZzFX parameters, as the ZzFX designer (https://killedbyapixel.github.io/ZzFX/)
 * copies them: `[volume, randomness, frequency, attack, sustain, release,
 * shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime,
 * noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]`.
 * Holes and `undefined` take ZzFX's defaults.
 */
export type ZzfxParams = ReadonlyArray<number | undefined>;

const MAX_PARAMS = 21;

const checkParams = (component: string, params: unknown): (number | undefined)[] => {
  if (!Array.isArray(params)) {
    throw new Error(`${component}: the ZzFX parameters must be an array of numbers, got ${JSON.stringify(params)}`);
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

const checkSampleRate = (component: string, sampleRate: unknown): number => {
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
  const values = checkParams('renderZzfx', params);
  checkSampleRate('renderZzfx', sampleRate);
  checkSeed('renderZzfx', seed);
  const samples = buildZzfxSamples(sampleRate, seededRandom(seed), values);
  for (let i = 0; i < samples.length; i++) samples[i] *= ZZFX_VOLUME;
  return samples;
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
 * host as an AudioBuffer; renders nothing.
 */
export const Sfx: React.FC<SfxProps> = ({ zzfx, at = 0, seed = 0, sampleRate = 44100, volume, muted = false, name }) => {
  const host = useContext(HostContext);
  const timeline = useContext(TimelineContext);
  const { fps } = useVideoConfig();
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

  const key = JSON.stringify(['zzfx', params, sampleRate, seed]);
  const collect = Boolean(host?.audio);
  // Without a collector nobody plays it: nothing is computed (and no Web Audio is needed).
  const buffer = useMemo(() => {
    if (!collect) return null;
    return (
      getGenerated<AudioBuffer>(key) ??
      setGenerated(key, toAudioBuffer('<Sfx>', [renderZzfx(params, sampleRate, seed)], sampleRate))
    );
    // `params`, `sampleRate` and `seed` are in `key`.
  }, [collect, key]);

  useAudioTrack(
    'Sfx',
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
      at,
      lengthInFrames: (buffer.length / buffer.sampleRate) * fps,
    },
  );
  return null;
};
