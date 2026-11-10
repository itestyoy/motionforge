'use client';'use strict';

var chunkNS6WDBHG_cjs = require('./chunk-NS6WDBHG.cjs');
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
  const host = react.useContext(chunkNS6WDBHG_cjs.HostContext);
  const timeline = react.useContext(chunkNS6WDBHG_cjs.TimelineContext);
  if (!host || !timeline) {
    throw new Error(`<${component}> must be used within a FrameProvider`);
  }
  if (timeline.remappedBy !== null) {
    throw new Error(
      `<${component}> cannot be inside <${timeline.remappedBy}>: it remaps time (Trail and CameraMotionBlur render through <Freeze>), and an audio track plays in real time. Put the sound outside of it.`
    );
  }
  const collector = host.audio;
  const from = timeline.offset + (description?.at ?? 0);
  const startFrame = Math.max(timeline.start, from);
  const length = description?.lengthInFrames;
  const endFrame = Math.min(timeline.end, length === void 0 ? Infinity : from + Math.ceil(length - 1e-9));
  const volume = description?.volume;
  const iterationLength = description && description.loop && description.trimAfter !== null ? (description.trimAfter - description.trimBefore) / description.playbackRate : void 0;
  const track = react.useMemo(() => {
    if (!description || startFrame >= endFrame) return null;
    const volumeValue = typeof volume === "function" ? sampleVolume(component, volume, from, startFrame, endFrame, iterationLength) : volume ?? 1;
    const { src, buffer, bufferKey, name, trimBefore, trimAfter, playbackRate, loop, muted } = description;
    const id = chunkNS6WDBHG_cjs.hashString(
      JSON.stringify([src, bufferKey, name, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volumeValue])
    );
    return { id, name, src, buffer, from, startFrame, endFrame, trimBefore, trimAfter, playbackRate, loop, muted, volume: volumeValue };
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
    typeof volume === "function" ? "function" : volume,
    from,
    startFrame,
    endFrame,
    iterationLength
  ]);
  react.useEffect(
    () => collector && track ? chunkNS6WDBHG_cjs.getAudioCollectorInternals(collector).mount(track) : void 0,
    [collector, track]
  );
};

exports.useAudioTrack = useAudioTrack;
//# sourceMappingURL=chunk-SW2AKXWG.cjs.map
//# sourceMappingURL=chunk-SW2AKXWG.cjs.map