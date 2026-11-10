'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { FrameContextValue } from './types';

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

interface FrameProviderProps {
  /** The frame to render. The host app owns time: it sets this for playback, seeking or export. */
  frame: number;
  fps?: number;
  durationInFrames: number;
  width: number;
  height: number;
  children: React.ReactNode;
}

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
  children,
}) => {
  const value = useMemo<FrameContextValue>(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height],
  );
  return <FrameContext.Provider value={value}>{children}</FrameContext.Provider>;
};

export { FrameContext };
