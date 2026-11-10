'use client';import { createContext, useContext, useMemo } from 'react';
import { jsx } from 'react/jsx-runtime';

// src/core/context.tsx
var FrameContext = createContext(null);
var useCurrentFrame = () => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error("useCurrentFrame must be used within a FrameProvider");
  }
  return context.frame;
};
var useVideoConfig = () => {
  const context = useContext(FrameContext);
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
  const value = useMemo(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height]
  );
  return /* @__PURE__ */ jsx(FrameContext.Provider, { value, children });
};

export { FrameContext, FrameProvider, useCurrentFrame, useVideoConfig };
//# sourceMappingURL=chunk-UU3G2NRN.js.map
//# sourceMappingURL=chunk-UU3G2NRN.js.map