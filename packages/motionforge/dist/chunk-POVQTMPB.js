'use client';import { useCurrentFrame, FrameContext, GateContext, TimelineContext, getGateInternals } from './chunk-L5HQH5HH.js';
import React, { createContext, useMemo, useContext, useState, useEffect } from 'react';
import { jsx, Fragment } from 'react/jsx-runtime';

var SequenceContext = createContext({
  relativeFrom: 0,
  isActive: true,
  isPremounted: false,
  isPostmounted: false,
  startFrame: 0,
  endFrame: Infinity
});
var useSequence = () => useContext(SequenceContext);
var checkFrames = (component, name, value) => {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${component}: ${name} must be a non-negative integer, got ${value}`);
  }
};
var checkSize = (name, value) => {
  if (value !== void 0 && !(typeof value === "number" && Number.isFinite(value) && value > 0)) {
    throw new Error(`Sequence: ${name} must be a positive number of pixels, got ${value}`);
  }
};
var Sequence = (props) => {
  const { from = 0, durationInFrames, offset = 0, name, width, height, children } = props;
  const layout = props.layout ?? "absolute-fill";
  const fill = props.layout === "none" ? null : props;
  const premountFor = fill?.premountFor ?? 0;
  const postmountFor = fill?.postmountFor ?? 0;
  const currentFrame = useCurrentFrame();
  const parent = useContext(FrameContext);
  const parentGate = useContext(GateContext);
  const parentTimeline = useContext(TimelineContext);
  if (layout !== "absolute-fill" && layout !== "none") {
    throw new Error(`Sequence: layout must be "absolute-fill" or "none", got ${JSON.stringify(layout)}`);
  }
  if (!Number.isInteger(from)) {
    throw new Error(`Sequence: from must be an integer, got ${from}`);
  }
  if (!Number.isInteger(offset)) {
    throw new Error(`Sequence: offset must be an integer, got ${offset}`);
  }
  if (durationInFrames !== void 0 && (!Number.isInteger(durationInFrames) || durationInFrames <= 0)) {
    throw new Error(
      `Sequence: durationInFrames must be a positive integer (leave it out to run to the end), got ${durationInFrames}`
    );
  }
  checkSize("width", width);
  checkSize("height", height);
  if (layout === "none") {
    const rest = props;
    for (const key of ["style", "className", "premountFor", "postmountFor", "styleWhilePremounted", "styleWhilePostmounted"]) {
      if (rest[key] !== void 0) {
        throw new Error(
          `Sequence: layout="none" renders no element, so it takes no ${key} (it needs layout="absolute-fill")`
        );
      }
    }
  }
  checkFrames("Sequence", "premountFor", premountFor);
  checkFrames("Sequence", "postmountFor", postmountFor);
  if (postmountFor > 0 && durationInFrames === void 0) {
    throw new Error("Sequence: postmountFor needs durationInFrames (a sequence without one never ends)");
  }
  const startFrame = from + offset;
  const endFrame = durationInFrames !== void 0 ? startFrame + durationInFrames : Infinity;
  const timelineOffset = (parentTimeline?.offset ?? 0) + startFrame;
  const timelineStart = Math.max(parentTimeline?.start ?? 0, timelineOffset);
  const timelineEnd = Math.min(parentTimeline?.end ?? Infinity, timelineOffset + (durationInFrames ?? Infinity));
  const remappedBy = parentTimeline?.remappedBy ?? null;
  const timeline = useMemo(
    () => ({ offset: timelineOffset, start: timelineStart, end: timelineEnd, remappedBy }),
    [timelineOffset, timelineStart, timelineEnd, remappedBy]
  );
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;
  const isPremounted = !isActive && currentFrame >= startFrame - premountFor && currentFrame < startFrame;
  const isPostmounted = !isActive && currentFrame >= endFrame && currentFrame < endFrame + postmountFor;
  const hidden = isPremounted || isPostmounted;
  const relativeFrame = isPremounted ? 0 : isPostmounted ? durationInFrames - 1 : currentFrame - startFrame;
  const [scope] = useState(() => ({ visible: !hidden, parent: parentGate?.scope ?? null }));
  useEffect(() => {
    if (!parentGate || scope.visible === !hidden) return;
    scope.visible = !hidden;
    getGateInternals(parentGate.gate).changed();
  }, [hidden, parentGate, scope]);
  const mounts = premountFor > 0 || postmountFor > 0;
  const gateValue = useMemo(
    () => parentGate && mounts ? { gate: parentGate.gate, scope } : parentGate,
    [parentGate, mounts, scope]
  );
  const contextValue = {
    relativeFrom: startFrame,
    durationInFrames,
    isActive,
    isPremounted,
    isPostmounted,
    startFrame,
    endFrame
  };
  if (!isActive && !hidden) {
    return null;
  }
  const localDuration = durationInFrames ?? (parent ? parent.durationInFrames - startFrame : void 0);
  const content = /* @__PURE__ */ jsx(GateContext.Provider, { value: gateValue, children: /* @__PURE__ */ jsx(TimelineContext.Provider, { value: timeline, children: /* @__PURE__ */ jsx(
    SequenceFrameProvider,
    {
      relativeFrame,
      durationInFrames: localDuration,
      width,
      height,
      children
    }
  ) }) });
  if (fill === null) {
    return /* @__PURE__ */ jsx(SequenceContext.Provider, { value: contextValue, children: content });
  }
  return /* @__PURE__ */ jsx(SequenceContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx(
    "div",
    {
      "data-sequence-name": name,
      "data-sequence-from": startFrame,
      "data-sequence-duration": durationInFrames,
      className: fill.className,
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        ...width !== void 0 ? { width } : null,
        ...height !== void 0 ? { height } : null,
        ...fill.style,
        ...hidden ? { opacity: 0, pointerEvents: "none" } : null,
        ...isPremounted ? fill.styleWhilePremounted : null,
        ...isPostmounted ? fill.styleWhilePostmounted : null
      },
      children: content
    }
  ) });
};
var SequenceFrameProvider = ({
  relativeFrame,
  durationInFrames,
  width,
  height,
  children
}) => {
  const parent = useContext(FrameContext);
  const frameValue = useMemo(
    () => parent ? {
      ...parent,
      frame: relativeFrame,
      durationInFrames: durationInFrames ?? parent.durationInFrames,
      width: width ?? parent.width,
      height: height ?? parent.height
    } : null,
    [parent, relativeFrame, durationInFrames, width, height]
  );
  return /* @__PURE__ */ jsx(FrameContext.Provider, { value: frameValue, children: /* @__PURE__ */ jsx(RelativeFrameContext.Provider, { value: relativeFrame, children }) });
};
var RelativeFrameContext = createContext(null);
var Remapped = ({ by, children }) => {
  const parent = useContext(TimelineContext);
  const value = useMemo(
    () => parent ? { ...parent, remappedBy: parent.remappedBy ?? by } : null,
    [parent, by]
  );
  return /* @__PURE__ */ jsx(TimelineContext.Provider, { value, children });
};
var useRelativeCurrentFrame = () => useContext(RelativeFrameContext);
var checkFrameNotNegative = (component, frame) => {
  if (frame < 0) {
    throw new Error(`${component}: the current frame must be >= 0, got ${frame} (a parent shifted it below 0)`);
  }
};
var LoopContext = createContext(null);
var useLoop = () => useContext(LoopContext);
var LoopRoot = (props) => {
  const { durationInFrames, times = Infinity, name, children } = props;
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Loop: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  if (times !== Infinity && (!Number.isInteger(times) || times < 0)) {
    throw new Error(`Loop: times must be a non-negative integer or Infinity, got ${times}`);
  }
  checkFrameNotNegative("Loop", currentFrame);
  const iteration = Math.floor(currentFrame / durationInFrames);
  const loopContext = useMemo(() => ({ iteration, durationInFrames }), [iteration, durationInFrames]);
  if (iteration >= times) {
    return null;
  }
  const layoutProps = props.layout === "none" ? { layout: "none" } : { layout: props.layout, style: props.style, className: props.className };
  return /* @__PURE__ */ jsx(LoopContext.Provider, { value: loopContext, children: /* @__PURE__ */ jsx(Sequence, { from: iteration * durationInFrames, durationInFrames, name, ...layoutProps, children }) });
};
var Loop = Object.assign(LoopRoot, { useLoop });
var Freeze = ({
  frame: frozenFrame,
  active = true,
  children
}) => {
  const currentFrame = useCurrentFrame();
  if (typeof frozenFrame !== "number" || !Number.isFinite(frozenFrame)) {
    throw new Error(`Freeze: frame must be a finite number, got ${frozenFrame}`);
  }
  if (typeof active !== "boolean" && typeof active !== "function") {
    throw new Error(`Freeze: active must be a boolean or a function of the frame, got ${active}`);
  }
  const isActive = typeof active === "function" ? active(currentFrame) : active;
  if (typeof isActive !== "boolean") {
    throw new Error(`Freeze: active(${currentFrame}) must return a boolean, got ${isActive}`);
  }
  return /* @__PURE__ */ jsx(Remapped, { by: "Freeze", children: /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: isActive ? frozenFrame : currentFrame, children }) });
};
var checkRate = (rate, frame) => {
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`Retiming: playbackRate must be a finite number, got ${rate} at frame ${frame}`);
  }
  return rate;
};
var cumulativeTables = /* @__PURE__ */ new WeakMap();
var cumulativeRate = (rate, frame) => {
  const whole = Math.floor(frame);
  const partial = frame - whole === 0 ? 0 : (frame - whole) * checkRate(rate(whole), whole);
  if (whole < 0) {
    let sum = 0;
    for (let i = whole; i < 0; i++) sum -= checkRate(rate(i), i);
    return sum + partial;
  }
  let table = cumulativeTables.get(rate);
  if (!table) {
    table = [0];
    cumulativeTables.set(rate, table);
  }
  for (let n = table.length; n <= whole; n++) {
    table.push(table[n - 1] + checkRate(rate(n - 1), n - 1));
  }
  return table[whole] + partial;
};
var Retiming = ({
  children,
  playbackRate
}) => {
  const currentFrame = useCurrentFrame();
  const retimedFrame = typeof playbackRate === "function" ? Math.floor(cumulativeRate(playbackRate, currentFrame)) : Math.floor(currentFrame * checkRate(playbackRate, currentFrame));
  return /* @__PURE__ */ jsx(Remapped, { by: "Retiming", children: /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: retimedFrame, children }) });
};
var Reverse = ({
  children,
  durationInFrames
}) => {
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Reverse: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  checkFrameNotNegative("Reverse", currentFrame);
  const reversedFrame = durationInFrames - 1 - currentFrame % durationInFrames;
  return /* @__PURE__ */ jsx(Remapped, { by: "Reverse", children: /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: reversedFrame, durationInFrames, children }) });
};
var SeriesSequence = () => {
  throw new Error("<Series.Sequence> must be a direct child of <Series>");
};
var describeChild = (child) => {
  if (typeof child === "string") return `the string ${JSON.stringify(child)}`;
  if (React.isValidElement(child)) {
    const type = child.type;
    const name = typeof type === "string" ? type : type.displayName ?? type.name ?? "Component";
    return `<${name}>`;
  }
  return String(child);
};
var flattenChildren = (children, prefix = "") => React.Children.toArray(children).flatMap((child, index) => {
  const key = `${prefix}${React.isValidElement(child) && child.key !== null ? child.key : index}`;
  if (React.isValidElement(child) && child.type === React.Fragment) {
    return flattenChildren(child.props.children, `${key}/`);
  }
  return [{ key, child }];
});
var SeriesRoot = ({ children }) => {
  let start = 0;
  const sequences = flattenChildren(children).map(({ key, child }, index) => {
    if (typeof child === "string" && child.trim() === "") return null;
    if (!React.isValidElement(child) || child.type !== SeriesSequence) {
      throw new Error(`Series: children must be <Series.Sequence> elements, got ${describeChild(child)} at index ${index}`);
    }
    const { durationInFrames, offset = 0, children: content, ...sequenceProps } = child.props;
    if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
      throw new Error(
        `Series.Sequence: durationInFrames must be a positive integer, got ${durationInFrames} at index ${index}`
      );
    }
    if (!Number.isInteger(offset)) {
      throw new Error(`Series.Sequence: offset must be an integer, got ${offset} at index ${index}`);
    }
    const from = start + offset;
    start = from + durationInFrames;
    return /* @__PURE__ */ jsx(Sequence, { ...sequenceProps, from, durationInFrames, children: content }, key);
  });
  return /* @__PURE__ */ jsx(Fragment, { children: sequences });
};
var Series = Object.assign(SeriesRoot, { Sequence: SeriesSequence });

export { Freeze, Loop, Retiming, Reverse, Sequence, SequenceContext, Series, describeChild, flattenChildren, useRelativeCurrentFrame, useSequence };
//# sourceMappingURL=chunk-POVQTMPB.js.map
//# sourceMappingURL=chunk-POVQTMPB.js.map