'use client';

import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FrameContextValue } from './types';
import { GateScope, RenderGate, createRenderGate, getGateInternals, isRenderGate } from './render-gate';
import { AudioCollector, getAudioCollectorInternals, isAudioCollector } from './audio-collector';
import { StaticFiles, makeStaticFileResolver } from './static-files';
import { InputEvent, InputEventInit, checkInputLog } from './input-log';

// Layout effects do not run on the server.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

// Frame Context - provides the frame being rendered to all children
const FrameContext = createContext<FrameContextValue | null>(null);

export const useCurrentFrame = (): number => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error('useCurrentFrame must be used within a FrameProvider');
  }
  return context.frame;
};

export const useVideoConfig = () => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error('useVideoConfig must be used within a FrameProvider');
  }
  return {
    fps: context.fps,
    durationInFrames: context.durationInFrames,
    width: context.width,
    height: context.height,
  };
};

/**
 * The render gate the components below register their delayRender() handles
 * with, and the premount scope they are in (see Sequence premountFor).
 */
export interface GateContextValue {
  gate: RenderGate;
  scope: GateScope | null;
}

export const GateContext = createContext<GateContextValue | null>(null);

/**
 * Where the content below sits on the composition's timeline: the enclosing
 * Sequences shift the frame, and audio tracks and input events are mapped
 * with it.
 */
export interface TimelineContextValue {
  /** The composition frame at which local frame 0 (useCurrentFrame() === 0) is. */
  offset: number;
  /** The first composition frame the content is shown (the latest start of the enclosing sequences). */
  start: number;
  /** The composition frame (exclusive) at which it stops being shown. */
  end: number;
  /** A component between the FrameProvider and here that remaps time (Freeze, Retiming, Reverse), or null. */
  remappedBy: string | null;
}

export const TimelineContext = createContext<TimelineContextValue | null>(null);

/** What the host passed to the FrameProvider, for the components below. */
export interface HostContextValue {
  /** The collector audio tracks register with, or null (the host does not want audio). */
  audio: AudioCollector | null;
  /** Resolves a static file path to its URL (useStaticFile()), or null when the host set none. */
  staticFiles: ((path: string) => string) | null;
  /** The input log (checked; empty without one), in composition frames. */
  input: readonly InputEvent[];
  /** Hands a scene's event, stamped with the frame shown, to the host's onInput (dropped without one). */
  emit: (event: InputEventInit) => void;
}

export const HostContext = createContext<HostContextValue | null>(null);

export interface FrameProviderProps {
  /** The frame to render. The host app owns time: it sets this for playback, seeking or export. */
  frame: number;
  /**
   * Render gate from createRenderGate(): the host awaits
   * `gate.waitUntilReady()` before it captures or shows the frame. Without one,
   * a FrameProvider inside another uses the outer gate; an outermost one uses
   * a private gate nobody waits on, and a cancelRender() error is thrown
   * during render, to the nearest error boundary.
   */
  gate?: RenderGate;
  /**
   * Collector from createAudioCollector(): `<Audio>`, `<Video>` and the
   * generated sounds of 'motionforge/audio' register their tracks with it
   * (see AudioCollector). Without one nothing is collected. A FrameProvider
   * inside another one does not use the outer collector: its frames are its own.
   */
  audio?: AudioCollector;
  /**
   * Where the static files of useStaticFile() come from: a base URL
   * ("https://cdn.example.com/creative-42/", "/static/") or a function
   * (path) => url (signed URLs, blob: URLs). A FrameProvider without it
   * inside another one uses the outer one's.
   */
  staticFiles?: StaticFiles;
  /**
   * The input log of a playable: events `{ frame, type, ... }` in frame
   * order, owned by the host and only appended to (live taps it recorded, or
   * a scripted log for a video of the playable). useInputEvents(),
   * useReducedState() and useLastEvent() read it; the scene sees the events
   * up to the frame it renders, so a frame is a function of the frame and
   * the log. A FrameProvider inside another one does not use the outer log.
   */
  input?: readonly InputEvent[];
  /**
   * Receives the events scenes emit with useEmitInput(), with `frame` set to
   * the frame shown. The host decides whether to append them to `input`
   * (live play) or not (a video). Without it they are dropped.
   */
  onInput?: (event: InputEvent) => void;
  fps?: number;
  durationInFrames: number;
  width: number;
  height: number;
  children: React.ReactNode;
}

const NO_EVENTS: readonly InputEvent[] = Object.freeze([]);

const isPositive = (value: number) => typeof value === 'number' && Number.isFinite(value) && value > 0;

// The host passes these in; a wrong value would otherwise render NaN or a
// frame the composition does not have.
const validateFrameProps = ({
  frame,
  fps,
  durationInFrames,
  width,
  height,
}: Pick<FrameProviderProps, 'frame' | 'durationInFrames' | 'width' | 'height'> & { fps: number }) => {
  if (!isPositive(fps)) {
    throw new Error(`FrameProvider: fps must be a positive number, got ${fps}`);
  }
  if (!isPositive(width) || !isPositive(height)) {
    throw new Error(`FrameProvider: width and height must be positive numbers, got ${width}x${height}`);
  }
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(
      `FrameProvider: durationInFrames must be a positive integer, got ${durationInFrames}`,
    );
  }
  if (!Number.isInteger(frame) || frame < 0 || frame > durationInFrames - 1) {
    throw new Error(
      `FrameProvider: frame must be an integer from 0 to ${durationInFrames - 1} (durationInFrames - 1), got ${frame}`,
    );
  }
};

/**
 * Renders its children at `frame`. MotionForge has no clock of its own; the
 * same `frame` always renders the same picture, whatever frame came before.
 */
export const FrameProvider: React.FC<FrameProviderProps> = ({
  frame,
  fps = 30,
  durationInFrames,
  width,
  height,
  gate,
  audio,
  staticFiles,
  input,
  onInput,
  children,
}) => {
  validateFrameProps({ frame, fps, durationInFrames, width, height });
  if (gate !== undefined && !isRenderGate(gate)) {
    throw new Error('FrameProvider: gate must be created with createRenderGate()');
  }
  if (audio !== undefined && !isAudioCollector(audio)) {
    throw new Error('FrameProvider: audio must be created with createAudioCollector()');
  }
  const value = useMemo<FrameContextValue>(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height],
  );

  const outer = useContext(GateContext);
  const [privateGate] = useState(createRenderGate);
  // The gate this provider owns: it reports its commits to it.
  const owned = gate ?? (outer ? null : privateGate);
  const gateValue = useMemo<GateContextValue>(
    () => (owned ? { gate: owned, scope: null } : (outer as GateContextValue)),
    [owned, outer],
  );

  const timeline = useMemo<TimelineContextValue>(
    () => ({ offset: 0, start: 0, end: durationInFrames, remappedBy: null }),
    [durationInFrames],
  );
  const outerHost = useContext(HostContext);
  const resolveStaticFile = useMemo(
    () => (staticFiles === undefined ? outerHost?.staticFiles ?? null : makeStaticFileResolver(staticFiles)),
    [staticFiles, outerHost],
  );
  if (onInput !== undefined && typeof onInput !== 'function') {
    throw new Error(`FrameProvider: onInput must be a function (event) => void, got ${JSON.stringify(onInput)}`);
  }
  // Checking an appended log costs only the new events.
  const lastLog = useRef<readonly InputEvent[] | null>(null);
  const log = input === undefined ? NO_EVENTS : checkInputLog(input, lastLog.current);
  lastLog.current = log;
  const emitState = useRef({ frame, onInput });
  useIsomorphicLayoutEffect(() => {
    emitState.current = { frame, onInput };
  });
  const emit = useCallback((event: InputEventInit) => {
    if (typeof event !== 'object' || event === null || typeof event.type !== 'string' || event.type === '') {
      throw new Error(`emitInput: the event must be { type, ... } with a non-empty type, got ${JSON.stringify(event)}`);
    }
    if ('frame' in event) {
      throw new Error('emitInput: leave out frame: the event happens at the frame shown, which MotionForge sets');
    }
    const { frame: shown, onInput: handler } = emitState.current;
    handler?.({ ...event, frame: shown });
  }, []);
  const host = useMemo<HostContextValue>(
    () => ({ audio: audio ?? null, staticFiles: resolveStaticFile, input: log, emit }),
    [audio, resolveStaticFile, log, emit],
  );

  useEffect(() => (owned ? getGateInternals(owned).attach() : undefined), [owned]);
  useEffect(() => (audio ? getAudioCollectorInternals(audio).attach() : undefined), [audio]);
  // Effects run children first, so when this one runs every component below
  // has registered its delayRender() handles for this frame.
  useEffect(() => {
    if (owned) getGateInternals(owned).commit(frame);
  }, [owned, frame]);

  // Nobody waits on the private gate: its errors are thrown here instead.
  const [cancelled, setCancelled] = useState<Error | null>(null);
  useEffect(
    () => (owned === privateGate ? getGateInternals(privateGate).onError((error) => setCancelled(() => error)) : undefined),
    [owned, privateGate],
  );
  if (cancelled && owned === privateGate) throw cancelled;

  return (
    <GateContext.Provider value={gateValue}>
      <HostContext.Provider value={host}>
        <TimelineContext.Provider value={timeline}>
          <FrameContext.Provider value={value}>{children}</FrameContext.Provider>
        </TimelineContext.Provider>
      </HostContext.Provider>
    </GateContext.Provider>
  );
};

export { FrameContext };
