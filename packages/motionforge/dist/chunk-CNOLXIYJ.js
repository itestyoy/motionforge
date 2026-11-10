import { createContext, useRef, useEffect, useContext, useState, useCallback } from 'react';
import { jsx } from 'react/jsx-runtime';

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
  const onFrameRef = useRef(onFrame);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onFrameRef.current = onFrame;
    onEndedRef.current = onEnded;
  });
  useEffect(() => {
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
var FrameContext = createContext(null);
var useCurrentFrame = () => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error("useCurrentFrame must be used within a FrameContext.Provider");
  }
  return context.frame;
};
var useVideoConfig = () => {
  const context = useContext(FrameContext);
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
  const context = useContext(FrameContext);
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
var CompositionManagerContext = createContext(null);
var PlayerContext = createContext(null);
var FrameProvider = ({
  fps = 30,
  durationInFrames,
  width,
  height,
  children,
  initialFrame = 0
}) => {
  const [frame, setFrameState] = useState(initialFrame);
  const [playing, setPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const frameRef = useRef(initialFrame);
  const seekVersionRef = useRef(0);
  const setFrame = useCallback((newFrame) => {
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
  return /* @__PURE__ */ jsx(FrameContext.Provider, { value, children });
};
var CompositionManagerProvider = ({ children }) => {
  const [compositions] = useState(() => /* @__PURE__ */ new Map());
  const [currentCompositionId, setCurrentCompositionId] = useState(null);
  const registerComposition = useCallback((composition) => {
    compositions.set(composition.id, composition);
  }, [compositions]);
  const unregisterComposition = useCallback((id) => {
    compositions.delete(id);
  }, [compositions]);
  const setCurrentComposition = useCallback((id) => {
    if (compositions.has(id)) {
      setCurrentCompositionId(id);
    }
  }, [compositions]);
  const currentComposition = currentCompositionId ? compositions.get(currentCompositionId) || null : null;
  return /* @__PURE__ */ jsx(
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
  const [frame, setFrameState] = useState(0);
  const [playing, setPlayingState] = useState(false);
  const [playbackRate] = useState(1);
  const frameRef = useRef(0);
  const seekVersionRef = useRef(0);
  const seek = useCallback((targetFrame) => {
    const clampedFrame = Math.max(0, Math.min(targetFrame, durationInFrames - 1));
    frameRef.current = clampedFrame;
    seekVersionRef.current += 1;
    setFrameState(clampedFrame);
  }, [durationInFrames]);
  const play = useCallback(() => setPlayingState(true), []);
  const pause = useCallback(() => setPlayingState(false), []);
  const toggle = useCallback(() => setPlayingState((p) => !p), []);
  const restart = useCallback(() => seek(0), [seek]);
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
  return /* @__PURE__ */ jsx(
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

export { CompositionManagerProvider, FrameContext, FrameProvider, PlayerProvider, useCurrentFrame, usePlaybackLoop, useTimelineState, useVideoConfig };
//# sourceMappingURL=chunk-CNOLXIYJ.js.map
//# sourceMappingURL=chunk-CNOLXIYJ.js.map