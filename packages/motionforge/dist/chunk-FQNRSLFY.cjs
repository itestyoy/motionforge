'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/core/playback.ts
var advancePlayback = ({
  baseFrame,
  elapsedMs,
  fps,
  playbackRate,
  durationInFrames,
  loop
}) => {
  const lastFrame = Math.max(0, durationInFrames - 1);
  const advanced = Math.floor(Math.max(0, elapsedMs) * fps * playbackRate / 1e3 + 1e-9);
  const frame = baseFrame + advanced;
  if (frame <= lastFrame) return { frame, ended: false };
  if (loop && durationInFrames > 0) return { frame: frame % durationInFrames, ended: false };
  return { frame: lastFrame, ended: true };
};
var usePlaybackLoop = ({
  playing,
  fps,
  playbackRate,
  durationInFrames,
  loop,
  frameRef,
  seekVersionRef,
  onFrame,
  onEnded
}) => {
  const onFrameRef = react.useRef(onFrame);
  const onEndedRef = react.useRef(onEnded);
  react.useEffect(() => {
    onFrameRef.current = onFrame;
    onEndedRef.current = onEnded;
  });
  react.useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let baseFrame = frameRef.current;
    let baseTime = performance.now();
    let seenVersion = seekVersionRef.current;
    const tick = (now) => {
      if (seekVersionRef.current !== seenVersion) {
        seenVersion = seekVersionRef.current;
        baseFrame = frameRef.current;
        baseTime = now;
      }
      const { frame, ended } = advancePlayback({
        baseFrame,
        elapsedMs: now - baseTime,
        fps,
        playbackRate,
        durationInFrames,
        loop
      });
      if (frame !== frameRef.current) {
        frameRef.current = frame;
        onFrameRef.current(frame);
      }
      if (ended) {
        onEndedRef.current?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, fps, playbackRate, durationInFrames, loop, frameRef, seekVersionRef]);
};
var FrameContext = react.createContext(null);
var useCurrentFrame = () => {
  const context = react.useContext(FrameContext);
  if (!context) {
    throw new Error("useCurrentFrame must be used within a FrameContext.Provider");
  }
  return context.frame;
};
var useVideoConfig = () => {
  const context = react.useContext(FrameContext);
  if (!context) {
    throw new Error("useVideoConfig must be used within a FrameContext.Provider");
  }
  return {
    fps: context.fps,
    durationInFrames: context.durationInFrames,
    width: context.width,
    height: context.height
  };
};
var useTimelineState = () => {
  const context = react.useContext(FrameContext);
  if (!context) {
    throw new Error("useTimelineState must be used within a FrameContext.Provider");
  }
  return {
    frame: context.frame,
    playing: context.playing,
    playbackRate: context.playbackRate,
    setFrame: context.setFrame,
    setPlaying: context.setPlaying,
    setPlaybackRate: context.setPlaybackRate
  };
};
var CompositionManagerContext = react.createContext(null);
var PlayerContext = react.createContext(null);
var FrameProvider = ({
  fps = 30,
  durationInFrames,
  width,
  height,
  children,
  initialFrame = 0
}) => {
  const [frame, setFrameState] = react.useState(initialFrame);
  const [playing, setPlaying] = react.useState(false);
  const [playbackRate, setPlaybackRate] = react.useState(1);
  const frameRef = react.useRef(initialFrame);
  const seekVersionRef = react.useRef(0);
  const setFrame = react.useCallback((newFrame) => {
    const clampedFrame = Math.max(0, Math.min(newFrame, durationInFrames - 1));
    frameRef.current = clampedFrame;
    seekVersionRef.current += 1;
    setFrameState(clampedFrame);
  }, [durationInFrames]);
  usePlaybackLoop({
    playing,
    fps,
    playbackRate,
    durationInFrames,
    loop: true,
    frameRef,
    seekVersionRef,
    onFrame: setFrameState
  });
  const value = {
    frame,
    fps,
    durationInFrames,
    width,
    height,
    playing,
    playbackRate,
    setFrame,
    setPlaying,
    setPlaybackRate
  };
  return /* @__PURE__ */ jsxRuntime.jsx(FrameContext.Provider, { value, children });
};
var CompositionManagerProvider = ({ children }) => {
  const [compositions] = react.useState(() => /* @__PURE__ */ new Map());
  const [currentCompositionId, setCurrentCompositionId] = react.useState(null);
  const registerComposition = react.useCallback((composition) => {
    compositions.set(composition.id, composition);
  }, [compositions]);
  const unregisterComposition = react.useCallback((id) => {
    compositions.delete(id);
  }, [compositions]);
  const setCurrentComposition = react.useCallback((id) => {
    if (compositions.has(id)) {
      setCurrentCompositionId(id);
    }
  }, [compositions]);
  const currentComposition = currentCompositionId ? compositions.get(currentCompositionId) || null : null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    CompositionManagerContext.Provider,
    {
      value: {
        compositions,
        currentComposition,
        registerComposition,
        unregisterComposition,
        setCurrentComposition
      },
      children
    }
  );
};
var PlayerProvider = ({
  durationInFrames,
  fps = 30,
  children
}) => {
  const [frame, setFrameState] = react.useState(0);
  const [playing, setPlayingState] = react.useState(false);
  const [playbackRate] = react.useState(1);
  const frameRef = react.useRef(0);
  const seekVersionRef = react.useRef(0);
  const seek = react.useCallback((targetFrame) => {
    const clampedFrame = Math.max(0, Math.min(targetFrame, durationInFrames - 1));
    frameRef.current = clampedFrame;
    seekVersionRef.current += 1;
    setFrameState(clampedFrame);
  }, [durationInFrames]);
  const play = react.useCallback(() => setPlayingState(true), []);
  const pause = react.useCallback(() => setPlayingState(false), []);
  const toggle = react.useCallback(() => setPlayingState((p) => !p), []);
  const restart = react.useCallback(() => seek(0), [seek]);
  usePlaybackLoop({
    playing,
    fps,
    playbackRate,
    durationInFrames,
    loop: true,
    frameRef,
    seekVersionRef,
    onFrame: setFrameState
  });
  return /* @__PURE__ */ jsxRuntime.jsx(
    PlayerContext.Provider,
    {
      value: {
        frame,
        playing,
        playbackRate,
        durationInFrames,
        fps,
        seek,
        play,
        pause,
        toggle,
        restart,
        frameRef
      },
      children
    }
  );
};

exports.CompositionManagerProvider = CompositionManagerProvider;
exports.FrameContext = FrameContext;
exports.FrameProvider = FrameProvider;
exports.PlayerProvider = PlayerProvider;
exports.useCurrentFrame = useCurrentFrame;
exports.usePlaybackLoop = usePlaybackLoop;
exports.useTimelineState = useTimelineState;
exports.useVideoConfig = useVideoConfig;
//# sourceMappingURL=chunk-FQNRSLFY.cjs.map
//# sourceMappingURL=chunk-FQNRSLFY.cjs.map