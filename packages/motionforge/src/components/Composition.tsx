'use client';

import React, { createContext, useContext } from 'react';
import { VideoConfig } from '../core/types';
import { FrameProvider, useVideoConfig as useVideoConfigContext } from '../core/context';

// Composition Context
const CompositionContext = createContext<{
  id: string;
  config: VideoConfig;
} | null>(null);

export const useComposition = () => {
  const context = useContext(CompositionContext);
  if (!context) {
    throw new Error('useComposition must be used within a Composition');
  }
  return context;
};

// Re-export useVideoConfig for convenience
export const useVideoConfig = () => useVideoConfigContext();

interface CompositionProps {
  id: string;
  component: React.ComponentType<Record<string, unknown>>;
  /** The frame to render; the host app drives it. */
  frame: number;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames: number;
  defaultProps?: Record<string, unknown>;
}

// A composition rendered at `frame`, with its config available to useComposition().
export const Composition: React.FC<CompositionProps> = ({
  id,
  component: Component,
  frame,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames,
  defaultProps = {},
}) => {
  return (
    <CompositionContext.Provider
      value={{
        id,
        config: { width, height, fps, durationInFrames },
      }}
    >
      <FrameProvider
        frame={frame}
        fps={fps}
        durationInFrames={durationInFrames}
        width={width}
        height={height}
      >
        <Component {...defaultProps} />
      </FrameProvider>
    </CompositionContext.Provider>
  );
};

// Export types
export type { CompositionProps };
