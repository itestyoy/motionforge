'use client';

import { useContext, useEffect, useId, useMemo } from 'react';
import { AudioTrack, getAudioCollectorInternals, hashString } from './audio-collector';
import { HostContext, TimelineContext } from './context';
import type { GeneratedAudio } from './generated-audio';

/** A volume: a gain ≥ 0, or a function of the track's frame returning one. */
export type AudioVolume = number | ((frame: number) => number);

/** What a component describes; the hook places it on the composition's timeline. */
export interface AudioTrackDescription {
  src: string | null;
  /** Generated audio (its `key` is part of the track's id); null for a URL. */
  generated: GeneratedAudio | null;
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
 * iteration of the enclosing Loops, all of them as soon as it mounts. In
 * collectAudioTracks() it reports them while rendering instead. Throws where
 * sound cannot be: inside Freeze, Retiming and Reverse (their content's frames
 * do not run with the composition's, and a track plays in real time) and
 * inside ThreeCanvas (a React root collectAudioTracks() cannot render).
 */
export const useAudioTrack = (component: string, description: AudioTrackDescription | null): void => {
  const host = useContext(HostContext);
  const timeline = useContext(TimelineContext);
  if (!host || !timeline) {
    throw new Error(`<${component}> must be used within a FrameProvider`);
  }
  if (timeline.noAudio !== null) {
    throw new Error(`<${component}> cannot be inside <${timeline.noAudio.inside}>: ${timeline.noAudio.why}`);
  }
  const collector = host.audio;
  const internals = collector ? getAudioCollectorInternals(collector) : null;
  // Tells the copies of a track apart in collectAudioTracks() (stable within one render).
  const instance = useId();

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
      const { src, generated, name, trimBefore, trimAfter, playbackRate, loop, muted } = description;
      const id = hashString(
        JSON.stringify([src, generated?.key ?? null, name, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volumeValue]),
      );
      list.push({ id, name, src, generated, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volume: volumeValue });
    }
    return list;
    // `description` is listed by its fields; the volume function by its kind (see above).
  }, [
    component,
    description === null,
    description?.src,
    description?.generated,
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

  // collectAudioTracks(): reported while rendering (no effect runs there).
  if (internals?.collecting) {
    tracks.forEach((track, index) => internals.collect(`${instance}/${index}`, track));
  }

  useEffect(() => {
    if (!internals || internals.collecting || tracks.length === 0) return undefined;
    const releases = tracks.map((track) => internals.mount(track));
    return () => releases.forEach((release) => release());
  }, [internals, tracks]);
};

/**
 * True while collectAudioTracks() renders the scene: no effect runs, nothing
 * is loaded and no audio is rendered; only the audio tracks are collected.
 * Components that need the DOM while rendering (measuring text, a canvas)
 * can render nothing then (ThreeCanvas does).
 */
export const useIsCollectingAudio = (): boolean => {
  const host = useContext(HostContext);
  return host?.audio ? getAudioCollectorInternals(host.audio).collecting : false;
};
