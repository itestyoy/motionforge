'use client';'use strict';

var chunk6BVXSAAW_cjs = require('./chunk-6BVXSAAW.cjs');
var chunkWEQRPTIM_cjs = require('./chunk-WEQRPTIM.cjs');
var chunkWQ6AZCZD_cjs = require('./chunk-WQ6AZCZD.cjs');
var jsxRuntime = require('react/jsx-runtime');

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
  const outgoing = chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, cutProgress], [0, 1], { ...clamp, easing: chunkWEQRPTIM_cjs.Easing.in(chunkWEQRPTIM_cjs.Easing.quad) });
  const incoming = chunkWEQRPTIM_cjs.interpolate(presentationProgress, [cutProgress, 1], [0, 1], { ...clamp, easing: chunkWEQRPTIM_cjs.Easing.out(chunkWEQRPTIM_cjs.Easing.quad) });
  const scale = isEntering ? chunkWEQRPTIM_cjs.interpolate(incoming, [0, 1], [incomingStartScale, incomingEndScale]) : chunkWEQRPTIM_cjs.interpolate(outgoing, [0, 1], [1, outgoingScale]);
  const frames = Math.max(1, presentationDurationInFrames);
  const flashOpacity = isEntering ? chunkWEQRPTIM_cjs.interpolate(presentationProgress, [cutProgress, cutProgress + flashFrames / frames], [peakFlashOpacity, 0], clamp) : chunkWEQRPTIM_cjs.interpolate(presentationProgress, [cutProgress - 1 / frames, cutProgress], [0, peakFlashOpacity], clamp);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    chunkWQ6AZCZD_cjs.AbsoluteFill,
    {
      style: {
        // The entering scene is hidden until the cut.
        opacity: isEntering && presentationProgress < cutProgress ? 0 : 1,
        overflow: "hidden",
        ...chunk6BVXSAAW_cjs.byDirection(isEntering, outerEnterStyle, outerExitStyle)
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          chunkWQ6AZCZD_cjs.AbsoluteFill,
          {
            style: {
              transform: `scale(${scale})`,
              transformOrigin,
              willChange: "transform",
              ...chunk6BVXSAAW_cjs.byDirection(isEntering, innerEnterStyle, innerExitStyle)
            },
            children
          }
        ),
        flashOpacity > 0 ? /* @__PURE__ */ jsxRuntime.jsx(chunkWQ6AZCZD_cjs.AbsoluteFill, { style: { backgroundColor: flashColor, opacity: flashOpacity, pointerEvents: "none" } }) : null
      ]
    }
  );
};
var pushCut = (props) => {
  const options = chunk6BVXSAAW_cjs.checkOptions("pushCut", props);
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

exports.pushCut = pushCut;
//# sourceMappingURL=chunk-JI6EV2SO.cjs.map
//# sourceMappingURL=chunk-JI6EV2SO.cjs.map