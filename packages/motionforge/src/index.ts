/**
 * MotionForge - headless React SDK for frame-based motion: scenes are a pure
 * function of the frame; the host app owns time, rendering and playback.
 *
 * Build stunning videos with React components, spring animations,
 * and frame-perfect control. Perfect for data visualization,
 * marketing videos, and automated video generation.
 *
 * @package MotionForge
 * @version 2.0.0
 * @license MIT
 */

// Core exports
export * from './core/types';
export {
  useCurrentFrame,
  useVideoConfig,
  FrameProvider,
} from './core/context';

// Render readiness
export { createRenderGate } from './core/render-gate';
export type { RenderGate, PendingDelay, WaitUntilReadyOptions } from './core/render-gate';
export { useDelayRender } from './core/delay-render';
export type { DelayRenderApi, DelayRenderOptions } from './core/delay-render';
export { usePreloadAssets } from './core/preload';
export type { PreloadAsset } from './core/preload';
export { prefetch } from './core/prefetch';
export type { Prefetch, PrefetchOptions, PrefetchOnProgress } from './core/prefetch';
export { loadFont } from './core/fonts';
export type { LoadFontOptions } from './core/fonts';

// Components
export { Composition, useComposition } from './components/Composition';
export type { CompositionProps } from './components/Composition';
export {
  Sequence,
  Loop,
  Freeze,
  Retiming,
  Reverse,
  Series,
  useSequence,
  useRelativeCurrentFrame,
} from './components/Sequence';
export type {
  SequenceProps,
  SequenceLayoutProps,
  SeriesSequenceProps,
  LoopProps,
  LoopContextValue,
} from './components/Sequence';
export {
  AbsoluteFill,
  Div,
  Video,
  Audio,
  Img,
  Text,
  SVG,
  Path,
  G,
  staticFile,
} from './components/Media';
export type { VideoProps, AudioProps, ImgProps } from './components/Media';
export { AnimatedImage } from './components/animated-image/AnimatedImage';
export type {
  AnimatedImageProps,
  AnimatedImageFillMode,
  AnimatedImageLoopBehavior,
} from './components/animated-image/AnimatedImage';
export { HyperFrame } from './components/HyperFrame';
export { Particles } from './components/Particles';
export type { ParticlesProps } from './components/Particles';
export { getParticles } from './utils/particles';
export type { Particle, ParticleEmitterOptions, ParticleRange, ParticlePoint } from './utils/particles';

// Effect components
export {
  Fade,
  Scale,
  Slide,
  Rotate,
  Typewriter,
  Counter,
  ProgressBar,
  Glitch,
  ShakeEffect,
  Highlight,
  MaskReveal,
  NeonGlow,
  // 3D Transform Effects
  Rotate3D,
  Flip3D,
  Perspective3D,
  Cube3D,
  // Particle System
  ParticleSystem,
  // Text Animation Effects
  LetterByLetter,
  WordByWord,
  WaveText,
  RainbowText,
  GradientText,
  // Additional Effects
  Blur,
  Bounce,
  Pulse,
  Swing,
  Confetti,
} from './components/Effects';

// New Cinematic Animations
export { KineticTypography } from './components/animations/KineticTypography';
export { LiquidText } from './components/animations/LiquidText';
export { TextStack3D } from './components/animations/TextStack3D';
export { StickyGridScroll } from './components/animations/StickyGridScroll';
export { FlipImageReveal } from './components/animations/FlipImageReveal';
export { CardExpansionMask } from './components/animations/CardExpansionMask';
// 3D components live in 'motionforge/three', Lottie in 'motionforge/lottie',
// so the main entry does not pull in three.js or lottie-web.

// Animation utilities
export {
  spring,
  interpolate,
  interpolateColors,
  useKeyframes,
  measureSpring,
  getFramesFromSeconds,
  getSecondsFromFrames,
  range,
  random,
  Easing,
  easing,
} from './utils/animation';
export type { EasingSpringConfig, InterpolateColorsOptions } from './utils/animation';
export { noise2D, noise3D, noise4D } from './utils/noise';

// CSS transforms and style interpolation (as in @remotion/animation-utils)
export {
  makeTransform,
  matrix,
  matrix3d,
  perspective,
  rotate,
  rotate3d,
  rotateX,
  rotateY,
  rotateZ,
  scale,
  scale3d,
  scaleX,
  scaleY,
  scaleZ,
  skew,
  skewX,
  skewY,
  translate,
  translate3d,
  translateX,
  translateY,
  translateZ,
} from './utils/transform';
export type {
  AngleUnit,
  AngleUnitString,
  LengthUnit,
  LengthUnitString,
  LengthPercentageUnit,
  LengthPercentageUnitString,
} from './utils/transform';
export { interpolateStyles } from './utils/interpolate-styles';

// SVG paths (as in @remotion/paths; no DOM needed)
export {
  parsePath,
  serializeInstructions,
  normalizePath,
  reduceInstructions,
  getLength,
  getPointAtLength,
  getTangentAtLength,
  getInstructionIndexAtLength,
  evolvePath,
  getBoundingBox,
  translatePath,
  resetPath,
  centerPath,
  scalePath,
  reversePath,
  getSubpaths,
  cutPath,
  extendViewBox,
  warpPath,
  interpolatePath,
  interpolatePaths,
  pathFromPoints,
} from './utils/path';
export type {
  Instruction,
  AbsoluteInstruction,
  ReducedInstruction,
  Point,
  BoundingBox,
  CenterPathTarget,
  WarpPathFn,
  InterpolatePathsOptions,
  PathFromPointsOptions,
} from './utils/path';

// Transitions
export {
  fade,
  slide,
  scale as scaleTransition,
  rotate as rotateTransition,
  zoom,
  wipe,
  blur,
  glitch,
  shake as shakeTransition,
  pulse as pulseTransition,
  bounce,
  flash,
  slideWithFade,
  flip,
  combine,
  transitions,
} from './utils/transitions';
export type { TransitionConfig, TransitionName } from './utils/transitions';

// Animation hooks
export {
  useSpring,
  useInterpolate,
  useCycle,
  useDurationInFrames,
  useDelay,
  useProgress,
  useLoop,
  useTimeline,
  useWindowedFrame,
  useAnimation,
  useKeyframeState,
  useTransform,
  useFade,
  useSlide,
  useShake,
  usePulse,
} from './hooks/animation';

// Performance hooks
export {
  useMemoizedFrame,
  useAnimationValue,
  useCachedFrame,
  useFrameRange,
  usePrecomputeFrames,
  useOptimizedSpring,
  useOptimizedInterpolate,
} from './hooks/performance';

// Types
export type {
  VideoConfig,
  SpringConfig,
  ExtrapolateType,
  InterpolateOptions,
  EasingFunction,
  Keyframe,
  AnimationTrack,
  FrameContextValue,
} from './core/types';
import type { ComponentProps } from 'react';
import type { Text as TextComponent } from './components/Media';
export type TextProps = ComponentProps<typeof TextComponent>;
