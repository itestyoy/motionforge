'use client';'use strict';

var chunkVLRD4ANM_cjs = require('./chunk-VLRD4ANM.cjs');
var react = require('react');

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
  const host = react.useContext(chunkVLRD4ANM_cjs.HostContext);
  const timeline = react.useContext(chunkVLRD4ANM_cjs.TimelineContext);
  if (!host || !timeline) {
    throw new Error(`<${component}> must be used within a FrameProvider`);
  }
  if (timeline.noAudio !== null) {
    throw new Error(`<${component}> cannot be inside <${timeline.noAudio.inside}>: ${timeline.noAudio.why}`);
  }
  const collector = host.audio;
  const internals = collector ? chunkVLRD4ANM_cjs.getAudioCollectorInternals(collector) : null;
  const instance = react.useId();
  const at = description?.at ?? 0;
  const length = description?.lengthInFrames;
  const windows = timeline.placements.map((p) => `${p.offset},${p.start},${p.end}`).join(";");
  const volume = description?.volume;
  const iterationLength = description && description.loop && description.trimAfter !== null ? (description.trimAfter - description.trimBefore) / description.playbackRate : void 0;
  const tracks = react.useMemo(() => {
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
      const id = chunkVLRD4ANM_cjs.hashString(
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
  react.useEffect(() => {
    if (!internals || internals.collecting || tracks.length === 0) return void 0;
    const releases = tracks.map((track) => internals.mount(track));
    return () => releases.forEach((release) => release());
  }, [internals, tracks]);
};
var useIsCollectingAudio = () => {
  const host = react.useContext(chunkVLRD4ANM_cjs.HostContext);
  return host?.audio ? chunkVLRD4ANM_cjs.getAudioCollectorInternals(host.audio).collecting : false;
};

exports.useAudioTrack = useAudioTrack;
exports.useIsCollectingAudio = useIsCollectingAudio;
//# sourceMappingURL=chunk-M5DYJOS5.cjs.map
//# sourceMappingURL=chunk-M5DYJOS5.cjs.map