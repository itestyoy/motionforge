'use client';

import React, { createContext, useContext } from 'react';
import { VideoConfig } from '../core/types';
import { FrameProvider } from '../core/context';
import { RenderGate } from '../core/render-gate';
import { AudioCollector } from '../core/audio-collector';
import { StaticFiles } from '../core/static-files';
import { InputEvent } from '../core/input-log';

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

export interface CompositionProps {
  id: string;
  component: React.ComponentType<Record<string, unknown>>;
  /** The frame to render; the host app drives it. */
  frame: number;
  width?: number;
  height?: number;
  fps?: number;
  durationInFrames: number;
  defaultProps?: Record<string, unknown>;
  /** Render gate for this composition's FrameProvider (see createRenderGate). */
  gate?: RenderGate;
  /** Audio collector for this composition's FrameProvider (see createAudioCollector). */
  audio?: AudioCollector;
  /** Where static files come from (FrameProvider's staticFiles). */
  staticFiles?: StaticFiles;
  /** The input log of a playable (FrameProvider's input). */
  input?: readonly InputEvent[];
  /** Receives the events the scene emits (FrameProvider's onInput). */
  onInput?: (event: InputEvent) => void;
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
  gate,
  audio,
  staticFiles,
  input,
  onInput,
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
        gate={gate}
        audio={audio}
        staticFiles={staticFiles}
        input={input}
        onInput={onInput}
      >
        <Component {...defaultProps} />
      </FrameProvider>
    </CompositionContext.Provider>
  );
};
