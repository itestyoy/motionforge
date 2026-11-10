import { createContext, useContext, useMemo } from 'react';
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
var FrameProvider = ({
  frame,
  fps = 30,
  durationInFrames,
  width,
  height,
  children
}) => {
  const value = useMemo(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height]
  );
  return /* @__PURE__ */ jsx(FrameContext.Provider, { value, children });
};

export { FrameContext, FrameProvider, useCurrentFrame, useVideoConfig };
//# sourceMappingURL=chunk-HRUP2L62.js.map
//# sourceMappingURL=chunk-HRUP2L62.js.map