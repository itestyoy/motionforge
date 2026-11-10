import React$1, { ReactNode, AudioHTMLAttributes, ImgHTMLAttributes, VideoHTMLAttributes } from 'react';

interface VideoConfig {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
}
interface CompositionProps$1 {
    id: string;
    component: React.ComponentType<Record<string, unknown>>;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    defaultProps?: Record<string, unknown>;
}
interface SequenceProps$1 {
    from: number;
    durationInFrames?: number;
    offset?: number;
    name?: string;
    children: React.ReactNode;
}
interface LayerProps {
    index?: number;
    children: React.ReactNode;
}
interface VideoProps$1 {
    src: string;
    startFrom?: number;
    endAt?: number;
    volume?: number | ((frame: number) => number);
    playbackRate?: number;
    muted?: boolean;
    style?: React.CSSProperties;
}
interface AudioProps$1 {
    src: string;
    startFrom?: number;
    endAt?: number;
    volume?: number | ((frame: number) => number);
    playbackRate?: number;
    muted?: boolean;
}
interface ImageProps {
    src: string;
    style?: React.CSSProperties;
}
interface TextProps$1 {
    style?: React.CSSProperties;
    children: React.ReactNode;
}
interface SpringConfig {
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
interface InterpolateOptions {
    extrapolateLeft?: 'clamp' | 'extend' | 'identity';
    extrapolateRight?: 'clamp' | 'extend' | 'identity';
    easing?: (t: number) => number;
}
type EasingFunction = (t: number) => number;
interface Keyframe {
    frame: number;
    value: number | string;
    easing?: EasingFunction;
}
interface AnimationTrack {
    property: string;
    keyframes: Keyframe[];
}
interface FrameContextValue {
    frame: number;
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
}

declare const useCurrentFrame: () => number;
declare const useVideoConfig$1: () => {
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
};
interface FrameProviderProps {
    /** The frame to render. The host app owns time: it sets this for playback, seeking or export. */
    frame: number;
    fps?: number;
    durationInFrames: number;
    width: number;
    height: number;
    children: React$1.ReactNode;
}
/**
 * Renders its children at `frame`. MotionForge has no clock of its own; the
 * same `frame` always renders the same picture, whatever frame came before.
 */
declare const FrameProvider: React$1.FC<FrameProviderProps>;

declare const useComposition: () => {
    id: string;
    config: VideoConfig;
};
declare const useVideoConfig: () => {
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
};
interface CompositionProps {
    id: string;
    component: React$1.ComponentType<Record<string, unknown>>;
    /** The frame to render; the host app drives it. */
    frame: number;
    width?: number;
    height?: number;
    fps?: number;
    durationInFrames: number;
    defaultProps?: Record<string, unknown>;
}
declare const Composition: React$1.FC<CompositionProps>;

interface SequenceContextValue {
    relativeFrom: number;
    durationInFrames?: number;
    isActive: boolean;
    startFrame: number;
    endFrame: number;
}
declare const useSequence: () => SequenceContextValue;
interface SequenceProps {
    from: number;
    durationInFrames?: number;
    offset?: number;
    name?: string;
    children: ReactNode;
    showInTimeline?: boolean;
    layout?: 'absolute-fill' | 'none';
}
declare const Sequence: React$1.FC<SequenceProps>;
declare const useRelativeCurrentFrame: () => number | null;
interface LoopProps {
    durationInFrames: number;
    times?: number;
    children: ReactNode;
    name?: string;
}
declare const Loop: React$1.FC<LoopProps>;
interface FreezeProps {
    frame: number;
    durationInFrames: number;
    children: ReactNode;
    name?: string;
}
declare const Freeze: React$1.FC<FreezeProps>;
interface RetimingProps {
    children: ReactNode;
    playbackRate: number | ((frame: number) => number);
    name?: string;
}
declare const Retiming: React$1.FC<RetimingProps>;
interface ReverseProps {
    children: ReactNode;
    durationInFrames: number;
}
declare const Reverse: React$1.FC<ReverseProps>;
interface SeriesProps {
    children: ReactNode;
}
declare const Series: React$1.FC<SeriesProps>;

interface AbsoluteFillProps {
    children?: React$1.ReactNode;
    style?: React$1.CSSProperties;
    className?: string;
}
declare const AbsoluteFill: React$1.FC<AbsoluteFillProps>;
interface VideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
    src: string;
    startFrom?: number;
    endAt?: number;
    volume?: number | ((frame: number) => number);
    playbackRate?: number;
    muted?: boolean;
    style?: React$1.CSSProperties;
    pauseOnFrame?: boolean;
}
declare const Video: React$1.FC<VideoProps>;
interface AudioProps extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src'> {
    src: string;
    startFrom?: number;
    endAt?: number;
    volume?: number | ((frame: number) => number);
    playbackRate?: number;
    muted?: boolean;
}
declare const Audio: React$1.FC<AudioProps>;
interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
    src: string;
    style?: React$1.CSSProperties;
    startFrom?: number;
    endAt?: number;
}
declare const Img: React$1.FC<ImgProps>;
declare const staticFile: (path: string) => string;
interface TextProps {
    children: React$1.ReactNode;
    style?: React$1.CSSProperties;
    className?: string;
}
declare const Text: React$1.FC<TextProps>;
interface SVGProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    children: React$1.ReactNode;
    style?: React$1.CSSProperties;
}
declare const SVG: React$1.FC<SVGProps>;
interface RectProps {
    width: number | string;
    height: number | string;
    x?: number;
    y?: number;
    rx?: number;
    ry?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: React$1.CSSProperties;
}
declare const Rect: React$1.FC<RectProps>;
interface CircleProps {
    r: number;
    cx?: number;
    cy?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: React$1.CSSProperties;
}
declare const Circle: React$1.FC<CircleProps>;
interface PathProps {
    d: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: React$1.CSSProperties;
}
declare const Path: React$1.FC<PathProps>;
interface GroupProps {
    children: React$1.ReactNode;
    transform?: string;
    style?: React$1.CSSProperties;
}
declare const G: React$1.FC<GroupProps>;

interface HyperFrameProps {
    html: string;
    css?: string;
    js?: string;
    frameVariableName?: string;
    className?: string;
    style?: React$1.CSSProperties;
}
/**
 * HyperFrame Component
 *
 * Enables creating video frames using pure HTML/CSS/JS.
 * Optimized using a persistent iframe and postMessage to avoid flicker.
 */
declare const HyperFrame: React$1.FC<HyperFrameProps>;

interface FadeProps {
    children: React$1.ReactNode;
    durationInFrames?: number;
    startFrame?: number;
    style?: React$1.CSSProperties;
}
declare const Fade: React$1.FC<FadeProps>;
interface ScaleProps {
    children: React$1.ReactNode;
    from?: number;
    to?: number;
    durationInFrames?: number;
    startFrame?: number;
    easing?: (t: number) => number;
    style?: React$1.CSSProperties;
}
declare const Scale: React$1.FC<ScaleProps>;
interface SlideProps {
    children: React$1.ReactNode;
    direction: 'left' | 'right' | 'up' | 'down';
    distance?: number;
    durationInFrames?: number;
    startFrame?: number;
    easing?: (t: number) => number;
    style?: React$1.CSSProperties;
}
declare const Slide: React$1.FC<SlideProps>;
interface RotateProps {
    children: React$1.ReactNode;
    degrees?: number;
    durationInFrames?: number;
    startFrame?: number;
    easing?: (t: number) => number;
    style?: React$1.CSSProperties;
}
declare const Rotate: React$1.FC<RotateProps>;
interface TypewriterProps {
    text: string;
    durationInFrames?: number;
    startFrame?: number;
    style?: React$1.CSSProperties;
    cursor?: boolean;
    cursorChar?: string;
}
declare const Typewriter: React$1.FC<TypewriterProps>;
interface CounterProps {
    from?: number;
    to: number;
    durationInFrames?: number;
    startFrame?: number;
    easing?: (t: number) => number;
    style?: React$1.CSSProperties;
    format?: (value: number) => string;
}
declare const Counter: React$1.FC<CounterProps>;
interface ProgressBarProps {
    progress: number;
    width?: number;
    height?: number;
    backgroundColor?: string;
    fillColor?: string;
    borderRadius?: number;
    style?: React$1.CSSProperties;
}
declare const ProgressBar: React$1.FC<ProgressBarProps>;
interface GlitchProps {
    children: React$1.ReactNode;
    intensity?: number;
    style?: React$1.CSSProperties;
}
declare const Glitch: React$1.FC<GlitchProps>;
interface TrailProps {
    children: React$1.ReactNode;
    trailLength?: number;
    opacityDecay?: number;
    style?: React$1.CSSProperties;
}
declare const Trail: React$1.FC<TrailProps>;
interface ShakeEffectProps {
    children: React$1.ReactNode;
    intensity?: number;
    active?: boolean;
    style?: React$1.CSSProperties;
}
declare const ShakeEffect: React$1.FC<ShakeEffectProps>;
interface HighlightProps {
    children: React$1.ReactNode;
    color?: string;
    progress?: number;
    style?: React$1.CSSProperties;
}
declare const Highlight: React$1.FC<HighlightProps>;
interface MaskRevealProps {
    children: React$1.ReactNode;
    direction: 'left' | 'right' | 'up' | 'down';
    progress: number;
    style?: React$1.CSSProperties;
}
declare const MaskReveal: React$1.FC<MaskRevealProps>;
interface NeonGlowProps {
    children: React$1.ReactNode;
    color?: string;
    intensity?: number;
    style?: React$1.CSSProperties;
}
declare const NeonGlow: React$1.FC<NeonGlowProps>;
interface Rotate3DProps {
    children: React$1.ReactNode;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    durationInFrames?: number;
    startFrame?: number;
    perspective?: number;
    easing?: (t: number) => number;
    style?: React$1.CSSProperties;
}
declare const Rotate3D: React$1.FC<Rotate3DProps>;
interface Flip3DProps {
    children: React$1.ReactNode;
    front: React$1.ReactNode;
    back: React$1.ReactNode;
    durationInFrames?: number;
    startFrame?: number;
    direction?: 'horizontal' | 'vertical';
    perspective?: number;
    style?: React$1.CSSProperties;
}
declare const Flip3D: React$1.FC<Flip3DProps>;
interface Perspective3DProps {
    children: React$1.ReactNode;
    rotateX?: number;
    rotateY?: number;
    perspective?: number;
    durationInFrames?: number;
    startFrame?: number;
    style?: React$1.CSSProperties;
}
declare const Perspective3D: React$1.FC<Perspective3DProps>;
interface Cube3DProps {
    size?: number;
    durationInFrames?: number;
    colors?: {
        front?: string;
        back?: string;
        left?: string;
        right?: string;
        top?: string;
        bottom?: string;
    };
    style?: React$1.CSSProperties;
}
declare const Cube3D: React$1.FC<Cube3DProps>;
interface ParticleSystemProps {
    count?: number;
    colors?: string[];
    minSize?: number;
    maxSize?: number;
    speed?: number;
    direction?: 'random' | 'up' | 'down' | 'left' | 'right' | 'explode';
    fadeOut?: boolean;
    style?: React$1.CSSProperties;
    particleShape?: 'circle' | 'square' | 'star' | 'triangle';
}
declare const ParticleSystem: React$1.FC<ParticleSystemProps>;
interface LetterByLetterProps {
    text: string;
    durationInFrames?: number;
    startFrame?: number;
    delayPerLetter?: number;
    animation?: 'fade' | 'scale' | 'slide' | 'rotate' | 'bounce';
    easing?: (t: number) => number;
    style?: React$1.CSSProperties;
    letterStyle?: React$1.CSSProperties;
}
declare const LetterByLetter: React$1.FC<LetterByLetterProps>;
interface WordByWordProps {
    text: string;
    durationInFrames?: number;
    startFrame?: number;
    delayPerWord?: number;
    animation?: 'fade' | 'scale' | 'slide' | 'pop';
    style?: React$1.CSSProperties;
    wordStyle?: React$1.CSSProperties;
}
declare const WordByWord: React$1.FC<WordByWordProps>;
interface WaveTextProps {
    text: string;
    amplitude?: number;
    frequency?: number;
    speed?: number;
    style?: React$1.CSSProperties;
    letterStyle?: React$1.CSSProperties;
}
declare const WaveText: React$1.FC<WaveTextProps>;
interface RainbowTextProps {
    text: string;
    speed?: number;
    saturation?: number;
    lightness?: number;
    style?: React$1.CSSProperties;
    letterStyle?: React$1.CSSProperties;
}
declare const RainbowText: React$1.FC<RainbowTextProps>;
interface GradientTextProps {
    text: string;
    colors?: string[];
    speed?: number;
    angle?: number;
    style?: React$1.CSSProperties;
}
declare const GradientText: React$1.FC<GradientTextProps>;
interface BlurProps {
    children: React$1.ReactNode;
    from?: number;
    to?: number;
    durationInFrames?: number;
    startFrame?: number;
    style?: React$1.CSSProperties;
}
declare const Blur: React$1.FC<BlurProps>;
interface BounceProps {
    children: React$1.ReactNode;
    height?: number;
    durationInFrames?: number;
    startFrame?: number;
    times?: number;
    damping?: number;
    style?: React$1.CSSProperties;
}
declare const Bounce: React$1.FC<BounceProps>;
interface PulseProps {
    children: React$1.ReactNode;
    minScale?: number;
    maxScale?: number;
    speed?: number;
    style?: React$1.CSSProperties;
}
declare const Pulse: React$1.FC<PulseProps>;
interface SwingProps {
    children: React$1.ReactNode;
    angle?: number;
    speed?: number;
    damping?: number;
    durationInFrames?: number;
    style?: React$1.CSSProperties;
}
declare const Swing: React$1.FC<SwingProps>;
interface ConfettiProps {
    count?: number;
    colors?: string[];
    style?: React$1.CSSProperties;
}
declare const Confetti: React$1.FC<ConfettiProps>;

interface KineticTypographyProps {
    text: string;
    durationInFrames?: number;
    startFrame?: number;
    stagger?: number;
    fontSize?: number;
    fontWeight?: string | number;
    fontFamily?: string;
    color?: string;
    className?: string;
    type?: 'velocity' | 'stretching' | 'glitch' | 'reveal';
    style?: React$1.CSSProperties;
}
declare const KineticTypography: React$1.FC<KineticTypographyProps>;

interface LiquidTextProps {
    text: string;
    width?: number;
    height?: number;
    fillColor?: string;
    strokeColor?: string;
    strokeWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string | number;
    speed?: number;
    amplitude?: number;
    className?: string;
    style?: React$1.CSSProperties;
}
declare const LiquidText: React$1.FC<LiquidTextProps>;

interface TextStack3DProps {
    text: string;
    layers?: number;
    depth?: number;
    fontSize?: number;
    fontWeight?: string | number;
    fontFamily?: string;
    mainColor?: string;
    layerColor?: string;
    durationInFrames?: number;
    startFrame?: number;
    className?: string;
    style?: React$1.CSSProperties;
}
declare const TextStack3D: React$1.FC<TextStack3DProps>;

interface StickyGridScrollProps {
    items: React$1.ReactNode[];
    columns?: number;
    gap?: number;
    padding?: number;
    scrollDuration?: number;
    startFrame?: number;
    className?: string;
    style?: React$1.CSSProperties;
}
declare const StickyGridScroll: React$1.FC<StickyGridScrollProps>;

interface FlipImageRevealProps {
    src: string;
    thumbnailRect: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    durationInFrames?: number;
    startFrame?: number;
    className?: string;
    style?: React$1.CSSProperties;
}
declare const FlipImageReveal: React$1.FC<FlipImageRevealProps>;

interface CardExpansionMaskProps {
    children: React$1.ReactNode;
    durationInFrames?: number;
    startFrame?: number;
    centerX?: number;
    centerY?: number;
    className?: string;
    style?: React$1.CSSProperties;
}
declare const CardExpansionMask: React$1.FC<CardExpansionMaskProps>;

declare const Easing: {
    linear: (t: number) => number;
    easeInQuad: (t: number) => number;
    easeOutQuad: (t: number) => number;
    easeInOutQuad: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
    easeInQuart: (t: number) => number;
    easeOutQuart: (t: number) => number;
    easeInOutQuart: (t: number) => number;
    easeInQuint: (t: number) => number;
    easeOutQuint: (t: number) => number;
    easeInOutQuint: (t: number) => number;
    easeInSine: (t: number) => number;
    easeOutSine: (t: number) => number;
    easeInOutSine: (t: number) => number;
    easeInExpo: (t: number) => number;
    easeOutExpo: (t: number) => number;
    easeInOutExpo: (t: number) => number;
    easeInCirc: (t: number) => number;
    easeOutCirc: (t: number) => number;
    easeInOutCirc: (t: number) => number;
    easeInBack: (t: number) => number;
    easeOutBack: (t: number) => number;
    easeInOutBack: (t: number) => number;
    easeInElastic: (t: number) => number;
    easeOutElastic: (t: number) => number;
    easeInOutElastic: (t: number) => number;
    easeInBounce: (t: number) => number;
    easeOutBounce: (t: number) => number;
    easeInOutBounce: (t: number) => number;
    bezier: (x1: number, y1: number, x2: number, y2: number) => EasingFunction;
};
declare const spring: ({ frame, fps, config, from, to, durationInFrames, durationRestThreshold, }: SpringConfig) => number;
declare const interpolate: (input: number, inputRange: number[], outputRange: number[], options?: InterpolateOptions) => number;
declare const interpolateColors: (input: number, inputRange: number[], outputRange: string[]) => string;
declare const useKeyframes: (keyframes: Keyframe[], frame: number) => number | string;
declare const measureSpring: ({ fps, config, threshold, }: {
    fps: number;
    config?: SpringConfig["config"];
    threshold?: number;
}) => number;
declare const getFramesFromSeconds: (seconds: number, fps: number) => number;
declare const getSecondsFromFrames: (frames: number, fps: number) => number;
declare const range: (start: number, end: number, step?: number) => number[];
declare const random: (seed: string | number, min?: number, max?: number) => number;
declare const noise2D: (x: number, y: number) => number;

interface TransitionConfig {
    durationInFrames: number;
    easing?: EasingFunction;
    startFrame?: number;
}
declare const fade: (progress: number) => number;
declare const slide: (progress: number, direction?: "left" | "right" | "up" | "down") => {
    x: number;
    y: number;
};
declare const scale: (progress: number, from?: number, to?: number) => number;
declare const rotate: (progress: number, degrees?: number) => number;
declare const zoom: (progress: number) => {
    scale: number;
    opacity: number;
};
declare const wipe: (progress: number, direction?: "left" | "right" | "up" | "down") => {
    clipPath: string;
};
declare const blur: (progress: number, maxBlur?: number) => {
    filter: string;
    opacity: number;
};
declare const glitch: (frame: number, intensity?: number) => {
    transform: string;
};
declare const shake: (frame: number, intensity?: number) => {
    transform: string;
};
declare const pulse: (frame: number, minScale?: number, maxScale?: number) => {
    transform: string;
};
declare const bounce: (progress: number) => number;
declare const flash: (progress: number, flashAt?: number) => {
    opacity: number;
    backgroundColor: string;
};
declare const slideWithFade: (progress: number, direction?: "left" | "right" | "up" | "down") => {
    transform: string;
    opacity: number;
};
declare const flip: (progress: number, direction?: "horizontal" | "vertical") => {
    transform: string;
    opacity: number;
};
declare const combine: (progress: number, ...transitions: ((p: number) => Record<string, unknown>)[]) => Record<string, unknown>;
declare const transitions: {
    fade: {
        enter: (p: number) => {
            opacity: number;
        };
        exit: (p: number) => {
            opacity: number;
        };
    };
    slideRight: {
        enter: (p: number) => {
            transform: string;
        };
        exit: (p: number) => {
            transform: string;
        };
    };
    slideLeft: {
        enter: (p: number) => {
            transform: string;
        };
        exit: (p: number) => {
            transform: string;
        };
    };
    slideUp: {
        enter: (p: number) => {
            transform: string;
        };
        exit: (p: number) => {
            transform: string;
        };
    };
    slideDown: {
        enter: (p: number) => {
            transform: string;
        };
        exit: (p: number) => {
            transform: string;
        };
    };
    scale: {
        enter: (p: number) => {
            transform: string;
        };
        exit: (p: number) => {
            transform: string;
        };
    };
    zoom: {
        enter: (p: number) => {
            transform: string;
            opacity: number;
        };
        exit: (p: number) => {
            transform: string;
            opacity: number;
        };
    };
    flipX: {
        enter: (p: number) => {
            transform: string;
            opacity: number;
        };
        exit: (p: number) => {
            transform: string;
            opacity: number;
        };
    };
    flipY: {
        enter: (p: number) => {
            transform: string;
            opacity: number;
        };
        exit: (p: number) => {
            transform: string;
            opacity: number;
        };
    };
};
type TransitionName = keyof typeof transitions;

interface UseSpringOptions {
    fps?: number;
    frame?: number;
    config?: {
        damping?: number;
        mass?: number;
        stiffness?: number;
        overshootClamping?: boolean;
    };
    from?: number;
    to?: number;
    durationInFrames?: number;
}
declare const useSpring: (options?: UseSpringOptions) => number;
declare const useInterpolate: (inputRange: number[], outputRange: number[], options?: {
    extrapolateLeft?: "clamp" | "extend" | "identity";
    extrapolateRight?: "clamp" | "extend" | "identity";
    easing?: (t: number) => number;
}) => number;
declare const useCycle: <T>(items: T[], frame: number, durationPerItem: number) => T;
declare const useDurationInFrames: (seconds: number) => number;
declare const useDelay: (delayInFrames: number) => boolean;
declare const useProgress: () => number;
declare const useLoop: (loopDuration: number) => number;
declare const useTimeline: () => {
    frame: number;
    durationInFrames: number;
    fps: number;
    progress: number;
    timeInSeconds: number;
    durationInSeconds: number;
    remainingFrames: number;
    remainingTimeInSeconds: number;
};
declare const useWindowedFrame: (startFrame: number, endFrame: number) => {
    isInWindow: boolean;
    relativeFrame: number;
};
interface AnimationState {
    isAnimating: boolean;
    isComplete: boolean;
    progress: number;
    direction: 'forward' | 'backward' | 'none';
}
declare const useAnimation: (startFrame: number, endFrame: number) => AnimationState;
interface KeyframeState<T> {
    current: T;
    previous: T | null;
    next: T | null;
    progress: number;
}
declare const useKeyframeState: <T extends number>(keyframes: {
    frame: number;
    value: T;
}[]) => KeyframeState<T>;
interface TransformOptions {
    translateX?: (frame: number) => number;
    translateY?: (frame: number) => number;
    scale?: (frame: number) => number;
    rotate?: (frame: number) => number;
    opacity?: (frame: number) => number;
}
declare const useTransform: (options: TransformOptions) => React.CSSProperties;
declare const useFade: (fadeInDuration: number, fadeOutDuration: number, options?: {
    startFrame?: number;
    endFrame?: number;
}) => number;
declare const useSlide: (direction: "left" | "right" | "up" | "down", distance: number, duration: number, startFrame?: number) => {
    transform: string;
};
declare const useShake: (intensity: number, duration: number, startFrame?: number) => {
    transform: string;
};
declare const usePulse: (minScale: number, maxScale: number, frequency: number) => {
    transform: string;
};

/**
 * Memoized frame value hook
 * Caches computed values based on frame and dependencies
 */
declare function useMemoizedFrame<T>(compute: () => T, deps?: unknown[]): T;
/**
 * Memoized animation value hook
 * Only recomputes when frame changes
 */
declare function useAnimationValue<T>(compute: (frame: number) => T, _frameDeps?: number[]): T;
/**
 * Cached frame hook - simplified version
 */
declare function useCachedFrame<T>(compositionId: string, renderer: (frame: number) => T): T;
/**
 * Throttled frame update hook - returns frame directly
 * Throttling is handled by the player
 */
declare function useThrottledFrame(_throttleMs?: number): number;
/**
 * Batch frame processing hook - simplified
 */
declare function useBatchFrameProcessor<T, R>(processor: (items: T[]) => R[], _batchSize?: number): (items: T[]) => R[];
/**
 * Frame range hook for efficient range queries
 */
declare function useFrameRange(startFrame: number, endFrame: number): number[];
/**
 * Pre-compute frames hook - returns pre-computed values
 */
declare function usePrecomputeFrames<T>(compute: (frame: number) => T, lookahead?: number): Map<number, T>;
/**
 * Optimized spring hook with caching
 */
declare function useOptimizedSpring(config: {
    damping?: number;
    stiffness?: number;
    mass?: number;
}, from?: number, to?: number): number;
/**
 * Optimized interpolate hook with caching
 */
declare function useOptimizedInterpolate(inputRange: number[], outputRange: number[], options?: {
    easing?: (t: number) => number;
    extrapolateLeft?: 'clamp' | 'extend' | 'identity';
    extrapolateRight?: 'clamp' | 'extend' | 'identity';
}): (frame: number) => number;
/**
 * Performance monitoring hook
 * Returns static metrics - actual monitoring should use external tools
 */
declare function usePerformanceMonitor(): {
    fps: number;
    frameTime: number;
    renderTime: number;
};
/**
 * Render priority hook
 * Returns render priority based on configuration
 */
declare function useRenderPriority(): 'high' | 'medium' | 'low';

export { AbsoluteFill, type AnimationTrack, Audio, type AudioProps$1 as AudioProps, Blur, Bounce, CardExpansionMask, Circle, Composition, type CompositionProps$1 as CompositionProps, Confetti, Counter, Cube3D, AbsoluteFill as Div, Easing, type EasingFunction, Fade, Flip3D, FlipImageReveal, type FrameContextValue, FrameProvider, Freeze, G, Glitch, GradientText, Highlight, HyperFrame, type ImageProps, Img, type InterpolateOptions, type Keyframe, KineticTypography, type LayerProps, LetterByLetter, LiquidText, Loop, MaskReveal, NeonGlow, ParticleSystem, Path, Perspective3D, ProgressBar, Pulse, RainbowText, Rect, Retiming, Reverse, Rotate, Rotate3D, SVG, Scale, Sequence, type SequenceProps$1 as SequenceProps, Series, ShakeEffect, Slide, type SpringConfig, StickyGridScroll, Swing, Text, type TextProps$1 as TextProps, TextStack3D, Trail, type TransitionConfig, type TransitionName, Typewriter, Video, type VideoConfig, type VideoProps$1 as VideoProps, WaveText, WordByWord, blur, bounce, combine, Easing as easing, fade, flash, flip, getFramesFromSeconds, getSecondsFromFrames, glitch, interpolate, interpolateColors, measureSpring, noise2D, pulse as pulseTransition, random, range, rotate as rotateTransition, scale as scaleTransition, shake as shakeTransition, slide, slideWithFade, spring, staticFile, transitions, useAnimation, useAnimationValue, useBatchFrameProcessor, useCachedFrame, useComposition, useVideoConfig as useConfig, useCurrentFrame, useCycle, useDelay, useDurationInFrames, useFade, useFrameRange, useInterpolate, useKeyframeState, useKeyframes, useLoop, useMemoizedFrame, useOptimizedInterpolate, useOptimizedSpring, usePerformanceMonitor, usePrecomputeFrames, useProgress, usePulse, useRelativeCurrentFrame, useRenderPriority, useSequence, useShake, useSlide, useSpring, useThrottledFrame, useTimeline, useTransform, useVideoConfig$1 as useVideoConfig, useWindowedFrame, wipe, zoom };
