// Core types shared by the SDK. The props types of components are exported
// from the components themselves (CompositionProps, SequenceProps, ...).

export interface VideoConfig {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
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
  /** Left of the input range (default 'extend', as in Remotion). */
  extrapolateLeft?: ExtrapolateType;
  /** Right of the input range (default 'extend', as in Remotion). */
  extrapolateRight?: ExtrapolateType;
  /** One easing for every segment, or one per segment (length inputRange.length - 1). */
  easing?: EasingFunction | readonly EasingFunction[];
  /** Steps the input: it is rounded down to a multiple of this positive number first. */
  posterize?: number;
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
