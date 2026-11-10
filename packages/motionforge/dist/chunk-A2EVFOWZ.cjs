'use strict';

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
var FrameProvider = ({
  frame,
  fps = 30,
  durationInFrames,
  width,
  height,
  children
}) => {
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
//# sourceMappingURL=chunk-A2EVFOWZ.cjs.map
//# sourceMappingURL=chunk-A2EVFOWZ.cjs.map