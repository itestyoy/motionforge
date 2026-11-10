/**
 * MotionForge - headless React SDK for frame-based motion: scenes are a pure
 * function of the frame; the host app owns time, rendering and playback.
 *
 * Build stunning videos with React components, spring animations,
 * and frame-perfect control. Perfect for data visualization,
 * marketing videos, and automated video generation.
 *
 * @package MotionForge
 * @version 4.0.1
 * @license MIT
 */

// Core exports
export * from './core/types';
export {
  useCurrentFrame,
  useVideoConfig,
  FrameProvider,
} from './core/context';
export type { FrameProviderProps } from './core/context';

// Audio manifest: scenes describe the sound, the host plays it
export { createAudioCollector } from './core/audio-collector';
export type { AudioCollector, AudioTrack } from './core/audio-collector';
export type { AudioVolume } from './core/audio-track';
export type { GeneratedAudio } from './core/generated-audio';
// The whole manifest up front, without the DOM (a dry pass)
export { collectAudioTracks } from './core/collect-audio-tracks';
export type { CollectAudioTracksOptions } from './core/collect-audio-tracks';
export { useIsCollectingAudio } from './core/audio-track';

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

// Playable mode: the scene as a function of the frame and the host's input log
export { useInputEvents, useEmitInput, useReducedState, useLastEvent } from './core/input';
export type { LastInputEvent } from './core/input';
export type { InputEvent, InputEventInit } from './core/input-log';

// Assets: where static files come from is the host's choice
export { useStaticFile } from './core/use-static-file';
export type { StaticFiles } from './core/static-files';
export { fitRect } from './utils/fit-rect';
export type { ObjectFit, FitRectContainer, FitRectSize, FitRectAnchor, FittedRect } from './utils/fit-rect';

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
} from './components/Media';
export type { AbsoluteFillProps, VideoProps, AudioProps, ImgProps } from './components/Media';
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
