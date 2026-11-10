'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FrameContextValue } from './types';
import { GateScope, RenderGate, createRenderGate, getGateInternals, isRenderGate } from './render-gate';

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

interface FrameProviderProps {
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
  fps?: number;
  durationInFrames: number;
  width: number;
  height: number;
  children: React.ReactNode;
}

const isPositive = (value: number) => typeof value === 'number' && Number.isFinite(value) && value > 0;

// The host passes these in; a wrong value would otherwise render NaN or a
// frame the composition does not have.
const validateFrameProps = ({
  frame,
  fps,
  durationInFrames,
  width,
  height,
}: Omit<FrameProviderProps, 'children' | 'gate'> & { fps: number }) => {
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
  children,
}) => {
  validateFrameProps({ frame, fps, durationInFrames, width, height });
  if (gate !== undefined && !isRenderGate(gate)) {
    throw new Error('FrameProvider: gate must be created with createRenderGate()');
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

  useEffect(() => (owned ? getGateInternals(owned).attach() : undefined), [owned]);
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
      <FrameContext.Provider value={value}>{children}</FrameContext.Provider>
    </GateContext.Provider>
  );
};

export { FrameContext };
