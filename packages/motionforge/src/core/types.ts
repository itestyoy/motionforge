// Core types for Remotion-like video framework

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
}

export interface CompositionProps {
  id: string;
  component: React.ComponentType<Record<string, unknown>>;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  defaultProps?: Record<string, unknown>;
}

export interface SequenceProps {
  from: number;
  durationInFrames?: number;
  offset?: number;
  name?: string;
  layout?: 'absolute-fill' | 'none';
  /** Frames to mount the children before the start, invisible and at their frame 0. */
  premountFor?: number;
  children: React.ReactNode;
}

export interface LayerProps {
  index?: number;
  children: React.ReactNode;
}

export interface VideoProps {
  src: string;
  startFrom?: number;
  endAt?: number;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
  muted?: boolean;
  style?: React.CSSProperties;
}

export interface AudioProps {
  src: string;
  startFrom?: number;
  endAt?: number;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
  muted?: boolean;
}

export interface ImageProps {
  src: string;
  style?: React.CSSProperties;
}

export interface TextProps {
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export interface SpringConfig {
  frame: number;
  fps: number;
  config?: {
    damping?: number;
    mass?: number;
    stiffness?: number;
    overshootClamping?: boolean;
  };
  from?: number;
  to?: number;
  durationInFrames?: number;
  durationRestThreshold?: number;
}

export interface InterpolateOptions {
  extrapolateLeft?: 'clamp' | 'extend' | 'identity';
  extrapolateRight?: 'clamp' | 'extend' | 'identity';
  easing?: (t: number) => number;
}

export type EasingFunction = (t: number) => number;

export interface Keyframe {
  frame: number;
  value: number | string;
  easing?: EasingFunction;
}

export interface AnimationTrack {
  property: string;
  keyframes: Keyframe[];
}

export interface FrameContextValue {
  frame: number;
  fps: number;
  durationInFrames: number;
  width: number;
  height: number;
}

