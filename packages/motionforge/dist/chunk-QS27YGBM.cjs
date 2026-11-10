'use client';'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/core/context.tsx
var FrameContext = react.createContext(null);
var useCurrentFrame = () => {
  const context = react.useContext(FrameContext);
  if (!context) {
    throw new Error("useCurrentFrame must be used within a FrameProvider");
  }
  return context.frame;
};
var useVideoConfig = () => {
  const context = react.useContext(FrameContext);
  if (!context) {
    throw new Error("useVideoConfig must be used within a FrameProvider");
  }
  return {
    fps: context.fps,
    durationInFrames: context.durationInFrames,
    width: context.width,
    height: context.height
  };
};
var isPositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var validateFrameProps = ({
  frame,
  fps,
  durationInFrames,
  width,
  height
}) => {
  if (!isPositive(fps)) {
    throw new Error(`FrameProvider: fps must be a positive number, got ${fps}`);
  }
  if (!isPositive(width) || !isPositive(height)) {
    throw new Error(`FrameProvider: width and height must be positive numbers, got ${width}x${height}`);
  }
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(
      `FrameProvider: durationInFrames must be a positive integer, got ${durationInFrames}`
    );
  }
  if (!Number.isInteger(frame) || frame < 0 || frame > durationInFrames - 1) {
    throw new Error(
      `FrameProvider: frame must be an integer from 0 to ${durationInFrames - 1} (durationInFrames - 1), got ${frame}`
    );
  }
};
var FrameProvider = ({
  frame,
  fps = 30,
  durationInFrames,
  width,
  height,
  children
}) => {
  validateFrameProps({ frame, fps, durationInFrames, width, height });
  const value = react.useMemo(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(FrameContext.Provider, { value, children });
};

exports.FrameContext = FrameContext;
exports.FrameProvider = FrameProvider;
exports.useCurrentFrame = useCurrentFrame;
exports.useVideoConfig = useVideoConfig;
//# sourceMappingURL=chunk-QS27YGBM.cjs.map
//# sourceMappingURL=chunk-QS27YGBM.cjs.map