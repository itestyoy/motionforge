import { useEffect, useRef, type MutableRefObject } from 'react';

/**
 * Wall-clock playback: the frame shown is derived from the time elapsed since
 * playback (re)started, not counted one per repaint. Counting frames per
 * `requestAnimationFrame` drifts whenever the repaint interval is not an exact
 * multiple of the frame duration (a 30 fps video on a 60 Hz screen advanced
 * every third repaint and played at ~20 fps).
 */
export interface PlaybackClock {
  /** Frame shown when playback (re)started. */
  baseFrame: number;
  /** Milliseconds elapsed since that moment. */
  elapsedMs: number;
  fps: number;
  playbackRate: number;
  durationInFrames: number;
  loop: boolean;
}

export interface PlaybackPosition {
  frame: number;
  /** True once a non-looping playback has reached its last frame. */
  ended: boolean;
}

export const advancePlayback = ({
  baseFrame,
  elapsedMs,
  fps,
  playbackRate,
  durationInFrames,
  loop,
}: PlaybackClock): PlaybackPosition => {
  const lastFrame = Math.max(0, durationInFrames - 1);
  // The epsilon absorbs float error so that exactly one frame duration
  // (e.g. 1000 / 30 ms) lands on the next frame rather than just before it.
  const advanced = Math.floor((Math.max(0, elapsedMs) * fps * playbackRate) / 1000 + 1e-9);
  const frame = baseFrame + advanced;
  if (frame <= lastFrame) return { frame, ended: false };
  if (loop && durationInFrames > 0) return { frame: frame % durationInFrames, ended: false };
  return { frame: lastFrame, ended: true };
};

interface PlaybackLoopOptions {
  playing: boolean;
  fps: number;
  playbackRate: number;
  durationInFrames: number;
  loop: boolean;
  /** The frame currently shown; the loop reads it on (re)start and writes it on every step. */
  frameRef: MutableRefObject<number>;
  /** Bumped by every manual seek so a running loop restarts its clock from the new frame. */
  seekVersionRef: MutableRefObject<number>;
  onFrame: (frame: number) => void;
  onEnded?: () => void;
}

/** Drives `onFrame` from the wall clock while `playing` is true. */
export const usePlaybackLoop = ({
  playing,
  fps,
  playbackRate,
  durationInFrames,
  loop,
  frameRef,
  seekVersionRef,
  onFrame,
  onEnded,
}: PlaybackLoopOptions): void => {
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

    const tick = (now: number) => {
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
        loop,
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
