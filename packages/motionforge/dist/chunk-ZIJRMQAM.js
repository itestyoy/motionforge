'use client';import { HostContext, TimelineContext, getAudioCollectorInternals, hashString } from './chunk-3P73E4TK.js';
import { useContext, useId, useMemo, useEffect } from 'react';

var describe = (value) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var sampleVolume = (component, volume, from, startFrame, endFrame, iterationLength) => {
  const values = [];
  for (let f = startFrame; f < endFrame; f++) {
    const local = f - from;
    const frame = iterationLength === void 0 ? local : local % iterationLength;
    const value = volume(frame);
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new Error(`<${component}>: volume(${frame}) must return a finite number >= 0, got ${describe(value)}`);
    }
    values.push(value);
  }
  return Object.freeze(values);
};
var useAudioTrack = (component, description) => {
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
  const instance = useId();
  const at = description?.at ?? 0;
  const length = description?.lengthInFrames;
  const windows = timeline.placements.map((p) => `${p.offset},${p.start},${p.end}`).join(";");
  const volume = description?.volume;
  const iterationLength = description && description.loop && description.trimAfter !== null ? (description.trimAfter - description.trimBefore) / description.playbackRate : void 0;
  const tracks = useMemo(() => {
    if (!description) return [];
    const list = [];
    for (const window of windows === "" ? [] : windows.split(";")) {
      const [offset, start, end] = window.split(",").map(Number);
      const from = offset + at;
      const startFrame = Math.max(start, from);
      const endFrame = Math.min(end, length === void 0 ? Infinity : from + Math.ceil(length - 1e-9));
      if (startFrame >= endFrame) continue;
      const volumeValue = typeof volume === "function" ? sampleVolume(component, volume, from, startFrame, endFrame, iterationLength) : volume ?? 1;
      const { src, generated, name, trimBefore, trimAfter, playbackRate, loop, muted } = description;
      const id = hashString(
        JSON.stringify([src, generated?.key ?? null, name, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volumeValue])
      );
      list.push({ id, name, src, generated, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volume: volumeValue });
    }
    return list;
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
    typeof volume === "function" ? "function" : volume,
    at,
    length,
    windows,
    iterationLength
  ]);
  if (internals?.collecting) {
    tracks.forEach((track, index) => internals.collect(`${instance}/${index}`, track));
  }
  useEffect(() => {
    if (!internals || internals.collecting || tracks.length === 0) return void 0;
    const releases = tracks.map((track) => internals.mount(track));
    return () => releases.forEach((release) => release());
  }, [internals, tracks]);
};
var useIsCollectingAudio = () => {
  const host = useContext(HostContext);
  return host?.audio ? getAudioCollectorInternals(host.audio).collecting : false;
};

export { useAudioTrack, useIsCollectingAudio };
//# sourceMappingURL=chunk-ZIJRMQAM.js.map
//# sourceMappingURL=chunk-ZIJRMQAM.js.map