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
  /** Frames to wait before the spring is released. */
  delay?: number;
  /** Play the motion backwards in time: from `to` back to `from`. */
  reverse?: boolean;
}

export type ExtrapolateType = 'clamp' | 'extend' | 'identity' | 'wrap';

export interface InterpolateOptions {
  extrapolateLeft?: ExtrapolateType;
  extrapolateRight?: ExtrapolateType;
  /** One easing for every segment, or one per segment (length inputRange.length - 1). */
  easing?: EasingFunction | readonly EasingFunction[];
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

