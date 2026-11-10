'use client';

import { useContext, useEffect, useMemo } from 'react';
import { AudioTrack, getAudioCollectorInternals, hashString } from './audio-collector';
import { HostContext, TimelineContext } from './context';

/** A volume: a gain ≥ 0, or a function of the track's frame returning one. */
export type AudioVolume = number | ((frame: number) => number);

/** What a component describes; the hook places it on the composition's timeline. */
export interface AudioTrackDescription {
  src: string | null;
  buffer: AudioBuffer | null;
  /** Identifies `buffer` (the cache key of generated audio); null for a URL. */
  bufferKey: string | null;
  name: string | null;
  trimBefore: number;
  trimAfter: number | null;
  playbackRate: number;
  loop: boolean;
  muted: boolean;
  volume: AudioVolume | undefined;
  /** Local frame (of the enclosing sequence) at which the track's frame 0 plays. */
  at: number;
  /** Frames after which the track ends on its own (undefined: with the media, or never with `loop`). */
  lengthInFrames: number | undefined;
}

const describe = (value: unknown) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * The volume per frame from `startFrame` to `endFrame - 1`: the function is
 * called with the track's own frame (0 where it starts; per iteration with
 * `loop` when the iteration length is known, i.e. with `trimAfter`).
 */
const sampleVolume = (
  component: string,
  volume: (frame: number) => number,
  from: number,
  startFrame: number,
  endFrame: number,
  iterationLength: number | undefined,
): readonly number[] => {
  const values: number[] = [];
  for (let f = startFrame; f < endFrame; f++) {
    const local = f - from;
    const frame = iterationLength === undefined ? local : local % iterationLength;
    const value = volume(frame);
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw new Error(`<${component}>: volume(${frame}) must return a finite number >= 0, got ${describe(value)}`);
    }
    values.push(value);
  }
  return Object.freeze(values);
};

/**
 * Registers the track `description` (null: nothing yet, e.g. still
 * rendering) with the FrameProvider's audio collector while the component is
 * mounted: one track per window the component plays in, i.e. one per
 * iteration of the enclosing Loops, all of them as soon as it mounts. Throws
 * inside Freeze, Retiming and Reverse: their content's frames do not run with
 * the composition's, and a track plays in real time.
 */
export const useAudioTrack = (component: string, description: AudioTrackDescription | null): void => {
  const host = useContext(HostContext);
  const timeline = useContext(TimelineContext);
  if (!host || !timeline) {
    throw new Error(`<${component}> must be used within a FrameProvider`);
  }
  if (timeline.remappedBy !== null) {
    throw new Error(
      `<${component}> cannot be inside <${timeline.remappedBy}>: it remaps time (Trail and CameraMotionBlur render ` +
        'through <Freeze>), and an audio track plays in real time. Put the sound outside of it.',
    );
  }
  const collector = host.audio;

  const at = description?.at ?? 0;
  const length = description?.lengthInFrames;
  // The windows as a value: a Loop moving to its next iteration gives the
  // same windows again, which must not register the tracks anew.
  const windows = timeline.placements.map((p) => `${p.offset},${p.start},${p.end}`).join(';');
  const volume = description?.volume;
  const iterationLength =
    description && description.loop && description.trimAfter !== null
      ? (description.trimAfter - description.trimBefore) / description.playbackRate
      : undefined;

  // The volume function is sampled once per description: a new function
  // object on every render (an inline arrow) is taken to be the same function.
  const tracks = useMemo<readonly AudioTrack[]>(() => {
    if (!description) return [];
    const list: AudioTrack[] = [];
    for (const window of windows === '' ? [] : windows.split(';')) {
      const [offset, start, end] = window.split(',').map(Number);
      const from = offset + at;
      const startFrame = Math.max(start, from);
      // A media ending between two frames is heard during the frame it ends in.
      const endFrame = Math.min(end, length === undefined ? Infinity : from + Math.ceil(length - 1e-9));
      if (startFrame >= endFrame) continue;
      const volumeValue =
        typeof volume === 'function'
          ? sampleVolume(component, volume, from, startFrame, endFrame, iterationLength)
          : volume ?? 1;
      const { src, buffer, bufferKey, name, trimBefore, trimAfter, playbackRate, loop, muted } = description;
      const id = hashString(
        JSON.stringify([src, bufferKey, name, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volumeValue]),
      );
      list.push({ id, name, src, buffer, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volume: volumeValue });
    }
    return list;
    // `description` is listed by its fields; the volume function by its kind (see above).
  }, [
    component,
    description === null,
    description?.src,
    description?.buffer,
    description?.bufferKey,
    description?.name,
    description?.trimBefore,
    description?.trimAfter,
    description?.playbackRate,
    description?.loop,
    description?.muted,
    typeof volume === 'function' ? 'function' : volume,
    at,
    length,
    windows,
    iterationLength,
  ]);

  useEffect(() => {
    if (!collector || tracks.length === 0) return undefined;
    const internals = getAudioCollectorInternals(collector);
    const releases = tracks.map((track) => internals.mount(track));
    return () => releases.forEach((release) => release());
  }, [collector, tracks]);
};
