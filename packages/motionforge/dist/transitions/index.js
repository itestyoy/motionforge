'use client';export { pushCut } from '../chunk-MM7QOY4V.js';
import { slide } from '../chunk-DQ42PE65.js';
import '../chunk-WVKK7RVQ.js';
import { interpolate, spring, measureSpring } from '../chunk-ZPHXLDRN.js';
import '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import { Sequence, flattenChildren, describeChild } from '../chunk-POVQTMPB.js';
import { rejectProps } from '../chunk-WVAVUOFE.js';
import { useCurrentFrame, useVideoConfig } from '../chunk-L5HQH5HH.js';
import React2, { createContext, useMemo, useContext } from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

var EnteringContext = createContext(null);
var ExitingContext = createContext(null);
var WrapInEnteringProgress = ({
  progress,
  children
}) => {
  const value = useMemo(() => ({ enteringProgress: progress }), [progress]);
  return /* @__PURE__ */ jsx(EnteringContext.Provider, { value, children });
};
var WrapInExitingProgress = ({
  progress,
  children
}) => {
  const value = useMemo(() => ({ exitingProgress: progress }), [progress]);
  return /* @__PURE__ */ jsx(ExitingContext.Provider, { value, children });
};
var useTransitionProgress = () => {
  const entering = useContext(EnteringContext);
  const exiting = useContext(ExitingContext);
  if (!entering && !exiting) {
    return { isInTransitionSeries: false, entering: 1, exiting: 0 };
  }
  return {
    isInTransitionSeries: true,
    entering: entering?.enteringProgress ?? 1,
    exiting: exiting?.exitingProgress ?? 0
  };
};
var layoutNoneError = (component) => `${component} must be absolutely positioned (layout="absolute-fill", the default), as transitions overlap the scenes; got layout="none"`;
var UNSUPPORTED_SEQUENCE_PROPS = {
  playbackRate: "put a <Retiming> inside the scene instead",
  trimBefore: "put a <Sequence from={-n}> inside the scene instead",
  freeze: "put a <Freeze> inside the scene instead",
  loop: "put a looping <Loop> inside the scene instead",
  hidden: "leave the scene out instead",
  showInTimeline: "there is no timeline"
};
var SeriesSequence = () => {
  throw new Error("<TransitionSeries.Sequence> must be a direct child of <TransitionSeries>");
};
var SeriesTransition = (_props) => {
  throw new Error("<TransitionSeries.Transition> must be a direct child of <TransitionSeries>");
};
var SeriesOverlay = () => {
  throw new Error("<TransitionSeries.Overlay> must be a direct child of <TransitionSeries>");
};
var KIND_NAMES = {
  sequence: "<TransitionSeries.Sequence>",
  transition: "<TransitionSeries.Transition>",
  overlay: "<TransitionSeries.Overlay>"
};
var kindOf = (child, index) => {
  if (React2.isValidElement(child)) {
    if (child.type === SeriesSequence) return "sequence";
    if (child.type === SeriesTransition) return "transition";
    if (child.type === SeriesOverlay) return "overlay";
  }
  throw new Error(
    `TransitionSeries: children must be <TransitionSeries.Sequence>, <TransitionSeries.Transition> or <TransitionSeries.Overlay> elements, got ${describeChild(child)} at index ${index}`
  );
};
var checkInteger = (component, name, value, index, positive) => {
  if (!Number.isInteger(value) || positive && value <= 0) {
    throw new Error(
      `${component}: ${name} must be ${positive ? "a positive" : "an"} integer, got ${JSON.stringify(value)} at index ${index}`
    );
  }
};
var resolveTransition = (props, fps, index) => {
  const component = KIND_NAMES.transition;
  const timing = props.timing;
  if (typeof timing !== "object" || timing === null || typeof timing.getDurationInFrames !== "function" || typeof timing.getProgress !== "function") {
    throw new Error(
      `${component}: timing must be a timing such as linearTiming({ durationInFrames }) or springTiming(), got ${JSON.stringify(timing)} at index ${index}`
    );
  }
  const presentation = props.presentation ?? slide();
  if (typeof presentation !== "object" || presentation === null || typeof presentation.component !== "function") {
    throw new Error(
      `${component}: presentation must be a presentation such as fade() or slide(), got ${JSON.stringify(presentation)} at index ${index}`
    );
  }
  const durationInFrames = timing.getDurationInFrames({ fps });
  if (!Number.isInteger(durationInFrames) || durationInFrames < 0) {
    throw new Error(
      `${component}: timing.getDurationInFrames() must return a non-negative integer, got ${durationInFrames} at index ${index}`
    );
  }
  return { timing, presentation, durationInFrames };
};
var progressOf = (transition, frame, fps, index) => {
  const progress = transition.timing.getProgress({ frame, fps });
  if (typeof progress !== "number" || !Number.isFinite(progress)) {
    throw new Error(
      `${KIND_NAMES.transition}: timing.getProgress() must return a finite number, got ${progress} at frame ${frame} (index ${index})`
    );
  }
  return progress;
};
var TransitionSeriesChildren = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const items = [];
  flattenChildren(children).forEach(({ key, child }, index) => {
    if (child === null || child === void 0 || typeof child === "boolean") return;
    if (typeof child === "string" && child.trim() === "") return;
    const kind = kindOf(child, index);
    items.push({ key, index, kind, props: child.props });
  });
  items.forEach((item, i) => {
    if (item.kind === "sequence") return;
    const previous = items[i - 1];
    const next = items[i + 1];
    if (previous && previous.kind !== "sequence") {
      throw new Error(
        `TransitionSeries: a ${KIND_NAMES[previous.kind]} must not be followed by a ${KIND_NAMES[item.kind]} (children ${previous.index} and ${item.index}); put a <TransitionSeries.Sequence> between them`
      );
    }
    if (!previous && !next) {
      throw new Error(`TransitionSeries: a ${KIND_NAMES[item.kind]} needs a <TransitionSeries.Sequence> before or after it`);
    }
  });
  const transitions = /* @__PURE__ */ new Map();
  items.forEach((item, i) => {
    if (item.kind === "transition") transitions.set(i, resolveTransition(item.props, fps, item.index));
  });
  const sequences = [];
  const overlays = [];
  let startFrame = 0;
  let transitionOffsets = 0;
  const sequenceDurations = [];
  let pendingOverlay = null;
  items.forEach((item, i) => {
    if (item.kind === "transition") return;
    if (item.kind === "overlay") {
      const component2 = KIND_NAMES.overlay;
      const props = item.props;
      rejectProps(component2, props, { hidden: "leave the overlay out instead" });
      checkInteger(component2, "durationInFrames", props.durationInFrames, item.index, true);
      const offset2 = props.offset ?? 0;
      checkInteger(component2, "offset", offset2, item.index, false);
      const cutPoint = startFrame + transitionOffsets;
      const halfDuration = props.durationInFrames / 2;
      const overlayFrom = cutPoint - halfDuration + offset2;
      if (overlayFrom < 0) {
        throw new Error(
          `${component2} extends before frame 0: it starts at frame ${overlayFrom}. Reduce the duration or adjust the offset.`
        );
      }
      const previousDuration = sequenceDurations[sequenceDurations.length - 1];
      if (previousDuration !== void 0 && halfDuration - offset2 > previousDuration) {
        throw new Error(
          `${component2} extends beyond the previous sequence: it needs ${halfDuration - offset2} frames before the cut, but the previous sequence is only ${previousDuration} frames long.`
        );
      }
      pendingOverlay = { framesAfterCut: halfDuration + offset2 };
      overlays.push(
        /* @__PURE__ */ jsx(
          Sequence,
          {
            from: Math.round(overlayFrom),
            durationInFrames: props.durationInFrames,
            name: "<TS.Overlay>",
            premountFor: props.premountFor,
            postmountFor: props.postmountFor,
            styleWhilePremounted: props.styleWhilePremounted,
            styleWhilePostmounted: props.styleWhilePostmounted,
            children: props.children
          },
          `overlay-${item.key}`
        )
      );
      return;
    }
    const component = KIND_NAMES.sequence;
    const { durationInFrames, offset = 0, name, children: content, ...layoutProps } = item.props;
    if (layoutProps.layout === "none") throw new Error(layoutNoneError(component));
    rejectProps(component, layoutProps, UNSUPPORTED_SEQUENCE_PROPS);
    checkInteger(component, "durationInFrames", durationInFrames, item.index, true);
    checkInteger(component, "offset", offset, item.index, false);
    const prev = items[i - 1]?.kind === "transition" ? transitions.get(i - 1) : null;
    const next = items[i + 1]?.kind === "transition" ? transitions.get(i + 1) : null;
    for (const [transition, side] of [
      [prev, "previous"],
      [next, "next"]
    ]) {
      if (transition && durationInFrames < transition.durationInFrames) {
        throw new Error(
          `${component}: a sequence must not be shorter than the ${side} <TransitionSeries.Transition>: the transition is ${transition.durationInFrames} frames long, but the sequence is only ${durationInFrames} frames long (index ${item.index})`
        );
      }
    }
    if (prev) transitionOffsets -= prev.durationInFrames;
    let actualStart = startFrame + offset + transitionOffsets;
    startFrame += durationInFrames + offset;
    if (actualStart < 0) {
      startFrame -= actualStart;
      actualStart = 0;
    }
    sequenceDurations.push(durationInFrames);
    if (pendingOverlay) {
      if (pendingOverlay.framesAfterCut > durationInFrames) {
        throw new Error(
          `${KIND_NAMES.overlay} extends beyond the next sequence: it needs ${pendingOverlay.framesAfterCut} frames after the cut, but the next sequence is only ${durationInFrames} frames long.`
        );
      }
      pendingOverlay = null;
    }
    let node = content;
    if (prev) {
      const progress = progressOf(prev, frame - actualStart, fps, items[i - 1].index);
      const Presentation = prev.presentation.component;
      node = /* @__PURE__ */ jsx(
        Presentation,
        {
          passedProps: prev.presentation.props ?? {},
          presentationDirection: "entering",
          presentationProgress: progress,
          presentationDurationInFrames: prev.durationInFrames,
          bothEnteringAndExiting: Boolean(next),
          children: /* @__PURE__ */ jsx(WrapInEnteringProgress, { progress, children: node })
        }
      );
    }
    if (next) {
      const progress = progressOf(next, frame - actualStart - durationInFrames + next.durationInFrames, fps, items[i + 1].index);
      const Presentation = next.presentation.component;
      node = /* @__PURE__ */ jsx(
        Presentation,
        {
          passedProps: next.presentation.props ?? {},
          presentationDirection: "exiting",
          presentationProgress: progress,
          presentationDurationInFrames: next.durationInFrames,
          bothEnteringAndExiting: Boolean(prev),
          children: /* @__PURE__ */ jsx(WrapInExitingProgress, { progress, children: node })
        }
      );
    }
    sequences.push(
      /* @__PURE__ */ jsx(
        Sequence,
        {
          ...layoutProps,
          name: name ?? "<TS.Sequence>",
          from: actualStart,
          durationInFrames,
          children: node
        },
        item.key
      )
    );
  });
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    sequences,
    overlays
  ] });
};
var TransitionSeriesRoot = (props) => {
  if (props.layout === "none") throw new Error(layoutNoneError("<TransitionSeries>"));
  const { children, name, ...sequenceProps } = props;
  return /* @__PURE__ */ jsx(Sequence, { ...sequenceProps, name: name ?? "<TransitionSeries>", children: /* @__PURE__ */ jsx(TransitionSeriesChildren, { children }) });
};
var TransitionSeries = Object.assign(TransitionSeriesRoot, {
  Sequence: SeriesSequence,
  Transition: SeriesTransition,
  Overlay: SeriesOverlay
});

// src/components/transitions/timings.ts
var checkDuration = (fn, value) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fn}: durationInFrames must be a positive integer, got ${JSON.stringify(value)}`);
  }
};
var linearTiming = (options) => {
  if (typeof options !== "object" || options === null) {
    throw new Error(`linearTiming: expected { durationInFrames, easing? }, got ${JSON.stringify(options)}`);
  }
  const { durationInFrames, easing } = options;
  checkDuration("linearTiming", durationInFrames);
  if (easing !== void 0 && typeof easing !== "function") {
    throw new Error(`linearTiming: easing must be a function, got ${JSON.stringify(easing)}`);
  }
  return {
    getDurationInFrames: () => durationInFrames,
    getProgress: ({ frame }) => interpolate(frame, [0, durationInFrames], [0, 1], {
      easing,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp"
    })
  };
};
var springTiming = (options = {}) => {
  if (typeof options !== "object" || options === null) {
    throw new Error(`springTiming: expected an options object, got ${JSON.stringify(options)}`);
  }
  if (options.durationInFrames !== void 0) checkDuration("springTiming", options.durationInFrames);
  if (options.reverse !== void 0 && typeof options.reverse !== "boolean") {
    throw new Error(`springTiming: reverse must be a boolean, got ${JSON.stringify(options.reverse)}`);
  }
  return {
    getDurationInFrames: ({ fps }) => options.durationInFrames ?? measureSpring({ fps, config: options.config, threshold: options.durationRestThreshold }),
    getProgress: ({ fps, frame }) => spring({
      fps,
      frame,
      from: options.reverse ? 1 : 0,
      to: options.reverse ? 0 : 1,
      config: options.config,
      durationInFrames: options.durationInFrames,
      durationRestThreshold: options.durationRestThreshold,
      reverse: options.reverse
    })
  };
};

export { TransitionSeries, linearTiming, springTiming, useTransitionProgress };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map