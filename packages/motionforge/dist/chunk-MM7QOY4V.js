'use client';import { checkOptions, byDirection } from './chunk-WVKK7RVQ.js';
import { interpolate, Easing } from './chunk-ZPHXLDRN.js';
import { AbsoluteFill } from './chunk-6ZUQCR5A.js';
import { jsxs, jsx } from 'react/jsx-runtime';

var clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
var finite = (name, value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`pushCut(): ${name} must be a finite number, got ${JSON.stringify(value)}`);
  }
};
var PushCutPresentation = ({
  children,
  presentationDirection,
  presentationDurationInFrames,
  presentationProgress,
  passedProps
}) => {
  const {
    cutProgress = 5 / 11,
    outgoingScale = 1.04,
    incomingStartScale = 1.04,
    incomingEndScale = 1.07,
    transformOrigin = "50% 50%",
    flashColor = "#f5f2ed",
    flashOpacity: peakFlashOpacity = 0.2,
    flashFrames = 2,
    outerEnterStyle,
    outerExitStyle,
    innerEnterStyle,
    innerExitStyle
  } = passedProps;
  const isEntering = presentationDirection === "entering";
  const outgoing = interpolate(presentationProgress, [0, cutProgress], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const incoming = interpolate(presentationProgress, [cutProgress, 1], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const scale = isEntering ? interpolate(incoming, [0, 1], [incomingStartScale, incomingEndScale]) : interpolate(outgoing, [0, 1], [1, outgoingScale]);
  const frames = Math.max(1, presentationDurationInFrames);
  const flashOpacity = isEntering ? interpolate(presentationProgress, [cutProgress, cutProgress + flashFrames / frames], [peakFlashOpacity, 0], clamp) : interpolate(presentationProgress, [cutProgress - 1 / frames, cutProgress], [0, peakFlashOpacity], clamp);
  return /* @__PURE__ */ jsxs(
    AbsoluteFill,
    {
      style: {
        // The entering scene is hidden until the cut.
        opacity: isEntering && presentationProgress < cutProgress ? 0 : 1,
        overflow: "hidden",
        ...byDirection(isEntering, outerEnterStyle, outerExitStyle)
      },
      children: [
        /* @__PURE__ */ jsx(
          AbsoluteFill,
          {
            style: {
              transform: `scale(${scale})`,
              transformOrigin,
              willChange: "transform",
              ...byDirection(isEntering, innerEnterStyle, innerExitStyle)
            },
            children
          }
        ),
        flashOpacity > 0 ? /* @__PURE__ */ jsx(AbsoluteFill, { style: { backgroundColor: flashColor, opacity: flashOpacity, pointerEvents: "none" } }) : null
      ]
    }
  );
};
var pushCut = (props) => {
  const options = checkOptions("pushCut", props);
  const cutProgress = options.cutProgress ?? 5 / 11;
  finite("cutProgress", cutProgress);
  if (cutProgress <= 0 || cutProgress >= 1) {
    throw new Error(`pushCut(): cutProgress must be greater than 0 and less than 1, got ${cutProgress}`);
  }
  for (const name of ["outgoingScale", "incomingStartScale", "incomingEndScale"]) {
    const value = options[name] ?? (name === "incomingEndScale" ? 1.07 : 1.04);
    finite(name, value);
    if (value <= 0) throw new Error(`pushCut(): ${name} must be greater than 0, got ${value}`);
  }
  const flashOpacity = options.flashOpacity ?? 0.2;
  finite("flashOpacity", flashOpacity);
  if (flashOpacity < 0 || flashOpacity > 1) {
    throw new Error(`pushCut(): flashOpacity must be between 0 and 1, got ${flashOpacity}`);
  }
  const flashFrames = options.flashFrames ?? 2;
  finite("flashFrames", flashFrames);
  if (flashFrames < 0) throw new Error(`pushCut(): flashFrames must be >= 0, got ${flashFrames}`);
  return { component: PushCutPresentation, props: options };
};

export { pushCut };
//# sourceMappingURL=chunk-MM7QOY4V.js.map
//# sourceMappingURL=chunk-MM7QOY4V.js.map