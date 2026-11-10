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
export type { DelayRenderApi } from './core/delay-render';
export {
  preloadImage,
  preloadVideo,
  preloadAudio,
  preloadFont,
  usePreloadAssets,
} from './core/preload';
export type { PreloadAsset, PreloadFontOptions } from './core/preload';

// Components
export { Composition, useVideoConfig as useConfig, useComposition } from './components/Composition';
export {
  Sequence,
  Loop,
  Freeze,
  Retiming,
  Reverse,
  Series,
  useSequence,
  useRelativeCurrentFrame,
  useLoopInfo,
} from './components/Sequence';
export {
  AbsoluteFill,
  Div,
  Video,
  Audio,
  Img,
  Text,
  SVG,
  Rect,
  Circle,
  Path,
  G,
  staticFile,
} from './components/Media';
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
  noise2D,
  Easing,
  easing,
} from './utils/animation';

// SVG path geometry (no DOM needed)
export {
  getLength,
  getPointAtLength,
  getTangentAtLength,
  evolvePath,
  pathFromPoints,
} from './utils/path';
export type { Point, PathFromPointsOptions } from './utils/path';

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
  CompositionProps,
  SequenceProps,
  LayerProps,
  VideoProps,
  AudioProps,
  ImageProps,
  TextProps,
  SpringConfig,
  InterpolateOptions,
  EasingFunction,
  Keyframe,
  AnimationTrack,
  FrameContextValue,
} from './core/types';
