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
    layout?: 'absolute-fill' | 'none';
    /** Frames to mount the children before the start, invisible and at their frame 0. */
    premountFor?: number;
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
    /** Frames to wait before the spring is released. */
    delay?: number;
    /** Play the motion backwards in time: from `to` back to `from`. */
    reverse?: boolean;
}
type ExtrapolateType = 'clamp' | 'extend' | 'identity' | 'wrap';
interface InterpolateOptions {
    extrapolateLeft?: ExtrapolateType;
    extrapolateRight?: ExtrapolateType;
    /** One easing for every segment, or one per segment (length inputRange.length - 1). */
    easing?: EasingFunction | readonly EasingFunction[];
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

/**
 * Render readiness: a scene holds the frame with delayRender() while it waits
 * for something asynchronous (an image to decode, a video to seek, data to
 * load); the host waits for the frame with gate.waitUntilReady() before it
 * captures or shows it.
 *
 * A gate belongs to one FrameProvider. Handles are plain numbers counted per
 * gate (1, 2, 3, ...), so nothing is global and nothing touches `window`.
 */
interface PendingDelay {
    /** The number delayRender() returned. */
    handle: number;
    /** The label passed to delayRender(), or null. */
    label: string | null;
}
interface WaitUntilReadyOptions {
    /**
     * The frame the host passed to FrameProvider. When given, the wait also
     * covers the time until React has rendered and committed that frame, so the
     * host can call it right after setting the frame. Without it, the wait is
     * for the frame FrameProvider has committed last.
     */
    frame?: number;
    /** Rejects after this many milliseconds (default 30000; Infinity waits forever). */
    timeoutMs?: number;
}
interface RenderGate {
    /**
     * Resolves when FrameProvider has committed the frame (see `frame`) and no
     * delayRender() handle of a visible component is pending. Rejects with the
     * cancelRender() error, or on timeout with an error listing the pending
     * labels.
     */
    waitUntilReady(options?: WaitUntilReadyOptions): Promise<void>;
    /** Handles that hold the frame right now (premounted content is not counted). */
    getPending(): PendingDelay[];
    /** The error passed to cancelRender(), if any. A cancelled gate stays cancelled. */
    readonly error: Error | null;
}
/**
 * Creates a render gate for one FrameProvider:
 *
 *   const gate = createRenderGate();
 *   <FrameProvider gate={gate} frame={n} ...>
 *   await gate.waitUntilReady({ frame: n, timeoutMs: 10000 });
 */
declare const createRenderGate: () => RenderGate;

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
    /**
     * Render gate from createRenderGate(): the host awaits
     * `gate.waitUntilReady()` before it captures or shows the frame. Without one,
     * a FrameProvider inside another uses the outer gate; an outermost one uses
     * a private gate nobody waits on, and a cancelRender() error is thrown
     * during render, to the nearest error boundary.
     */
    gate?: RenderGate;
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

interface DelayRenderApi {
    /**
     * Holds the current frame until continueRender(handle) is called. Call it
     * from an effect or a callback, never during render. Handles still pending
     * when the component unmounts are continued automatically.
     */
    delayRender: (label?: string) => number;
    /** Releases a handle. Releasing one twice is allowed. */
    continueRender: (handle: number) => void;
    /**
     * Fails the render: the gate's waitUntilReady() rejects with this error.
     * Without a host gate the error is thrown to the nearest error boundary.
     */
    cancelRender: (error: unknown) => void;
}
/**
 * delayRender / continueRender / cancelRender for the FrameProvider this
 * component is in.
 *
 *   const { delayRender, continueRender, cancelRender } = useDelayRender();
 *   const handle = useRef<number | null>(null);
 *   useEffect(() => {
 *     handle.current = delayRender('fetch data');
 *     fetchData().then(setData, cancelRender);
 *     return () => continueRender(handle.current!);
 *   }, []);
 *   // Release after the data has rendered (setData renders later).
 *   useEffect(() => {
 *     if (data !== null) continueRender(handle.current!);
 *   }, [data]);
 *
 * Inside a premounted Sequence the handles do not hold the frame until the
 * sequence starts.
 */
declare const useDelayRender: () => DelayRenderApi;

/** Resolves with the image once it is loaded and decoded. */
declare const preloadImage: (src: string) => Promise<HTMLImageElement>;
/** Resolves with the video element once its first frame is loaded. */
declare const preloadVideo: (src: string) => Promise<HTMLVideoElement>;
/** Resolves with the audio element once its first samples are loaded. */
declare const preloadAudio: (src: string) => Promise<HTMLAudioElement>;
interface PreloadFontOptions {
    /** CSS font-weight, e.g. 400 or 'bold' (default 400). */
    weight?: string | number;
    /** CSS font-style, e.g. 'italic' (default 'normal'). */
    style?: string;
    /**
     * URL of the font file. When given, the face is created and added to
     * document.fonts; without it the family must be declared in CSS (@font-face).
     */
    source?: string;
}
/**
 * Loads a font face with the CSS Font Loading API. Rejects when the face
 * cannot be loaded or no declared face matches the family, weight and style.
 */
declare const preloadFont: (family: string, options?: PreloadFontOptions) => Promise<void>;
type PreloadAsset = {
    type: 'image' | 'video' | 'audio';
    src: string;
} | ({
    type: 'font';
    family: string;
} & PreloadFontOptions);
/**
 * Holds the frame (delayRender) until all `assets` are loaded and returns
 * whether they are. A failure goes to cancelRender(). The list is compared
 * by value, so an inline array does not restart the loading.
 *
 *   const ready = usePreloadAssets([
 *     { type: 'image', src: '/hero.png' },
 *     { type: 'font', family: 'Inter', weight: 700 },
 *   ]);
 */
declare const usePreloadAssets: (assets: readonly PreloadAsset[]) => boolean;

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
    /** Render gate for this composition's FrameProvider (see createRenderGate). */
    gate?: RenderGate;
}
declare const Composition: React$1.FC<CompositionProps>;

interface SequenceContextValue {
    relativeFrom: number;
    durationInFrames?: number;
    isActive: boolean;
    /** True while the sequence is premounted (before its start, invisible). */
    isPremounted: boolean;
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
    /**
     * Mount the children this many frames before the start, invisible (opacity
     * 0, no pointer events) and at their frame 0, so images, video and fonts
     * load in time. Their delayRender() handles hold the frame only once the
     * sequence has started. Needs layout 'absolute-fill'.
     */
    premountFor?: number;
}
declare const Sequence: React$1.FC<SequenceProps>;
declare const useRelativeCurrentFrame: () => number | null;
interface LoopProps {
    /** Length of one iteration (a positive integer). */
    durationInFrames: number;
    /** Number of iterations (a positive integer, default Infinity); after them nothing is rendered. */
    times?: number;
    children: ReactNode;
    name?: string;
}
declare const Loop: React$1.FC<LoopProps>;
/** Inside a `Loop`: the frame within the current iteration, the iteration index and the loop length. */
declare const useLoopInfo: () => {
    loopedFrame: number;
    currentLoop: number;
    durationInFrames: number;
};
interface FreezeProps {
    /** The frame the children see while frozen (an integer). */
    frame: number;
    /**
     * Whether to freeze: a boolean, or a function of the current frame (default
     * true). While inactive the children see the current frame.
     */
    active?: boolean | ((frame: number) => boolean);
    children: ReactNode;
}
declare const Freeze: React$1.FC<FreezeProps>;
interface RetimingProps {
    children: ReactNode;
    /**
     * Speed: a number, or a pure function of the parent frame. With a function
     * the content advances by `playbackRate(i)` on each frame `i`, so the
     * content frame at `frame` is floor(sum of playbackRate(i) for i < frame).
     */
    playbackRate: number | ((frame: number) => number);
}
declare const Retiming: React$1.FC<RetimingProps>;
interface ReverseProps {
    children: ReactNode;
    /** Length of the reversed content (a positive integer); it repeats after that. */
    durationInFrames: number;
}
declare const Reverse: React$1.FC<ReverseProps>;
interface SeriesSequenceProps {
    /** Length of this sequence in frames (a positive integer). */
    durationInFrames: number;
    /**
     * Shift of this sequence's start (and so of all following ones) in frames:
     * negative overlaps the previous sequence, positive leaves a gap.
     */
    offset?: number;
    name?: string;
    layout?: 'absolute-fill' | 'none';
    /** See Sequence premountFor. */
    premountFor?: number;
    children?: ReactNode;
}
declare const Series: React$1.FC<{
    children?: ReactNode;
}> & {
    Sequence: React$1.FC<SeriesSequenceProps>;
};

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
/**
 * Video synced to the frame. It holds the render gate (delayRender) until the
 * element shows the frame's time: until its data is loaded and, when it has
 * to seek, until `seeked`. A load error goes to cancelRender().
 */
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
/**
 * Image that holds the render gate (delayRender) until it is loaded and
 * decoded (HTMLImageElement.decode()). A load or decode error goes to
 * cancelRender().
 */
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

/**
 * Particle emitter as a pure function of the frame: bursts, sparkles,
 * confetti rains, trails. Time quantities are in seconds and motion in px per
 * second, so the same emitter looks the same at any fps; `startFrame` is the
 * timeline position of the first birth. All randomness comes from
 * random(seed, ...).
 */
/** A fixed value, or [min, max] to pick per particle (uniformly, from the seed). */
type ParticleRange = number | readonly [number, number];
interface ParticlePoint {
    x: number;
    y: number;
}
interface ParticleEmitterOptions {
    /** Seed of all randomness: the same seed gives the same particles. */
    seed: string | number;
    /**
     * Where particles are born, in px. A function gets the birth frame (it may
     * be fractional) and lets the emitter move, e.g. for trails.
     */
    origin: ParticlePoint | ((frame: number) => ParticlePoint);
    /** Particles are born anywhere in a width x height rectangle centred on the origin (default 0 x 0). */
    area?: {
        width: number;
        height: number;
    };
    /** Frame of the first birth (default 0). */
    startFrame?: number;
    /** Number of particles (a non-negative integer). */
    count: number;
    /** Seconds over which the births are spread evenly (default 0: all at once, a burst). */
    emitDuration?: number;
    /** Seconds each particle lives (> 0). */
    lifetime: ParticleRange;
    /** Initial speed in px per second (>= 0). */
    speed: ParticleRange;
    /** Direction of emission in degrees: 0 right, 90 down, -90 up (default -90). */
    angle?: number;
    /** Width of the emission cone in degrees, centred on `angle`, 0 to 360 (default 360). */
    spread?: number;
    /** Acceleration in px per second² along +y (down; default 0). */
    gravity?: number;
    /** Air drag in 1/s: velocity decays as e^(-drag·t) towards the fall speed (default 0). */
    drag?: number;
    /** Size in px (>= 0). */
    size: ParticleRange;
    /** Colors; each particle gets one (default ['#ffffff']). */
    colors?: readonly string[];
    /** Initial rotation in degrees (default 0). */
    rotation?: ParticleRange;
    /** Rotation speed in degrees per second (default 0). */
    spin?: ParticleRange;
    /** Opacity goes linearly from 1 at birth to 0 at the end of the life (default true). */
    fadeOut?: boolean;
}
interface Particle {
    /** Stable index of the particle (0 to count - 1). */
    index: number;
    /** Position in px. */
    x: number;
    y: number;
    /** Velocity in px per second. */
    vx: number;
    vy: number;
    size: number;
    /** Rotation in degrees. */
    rotation: number;
    color: string;
    opacity: number;
    /** Seconds since birth. */
    age: number;
    /** Seconds the particle lives. */
    lifetime: number;
    /** age / lifetime, from 0 up to (not including) 1. */
    progress: number;
}
/**
 * The particles alive at `frame`, with their position, velocity, size,
 * rotation, color and opacity. Particle `i` is born `emitDuration · i / count`
 * seconds after `startFrame` and lives `lifetime` seconds.
 */
declare const getParticles: (options: ParticleEmitterOptions & {
    frame: number;
    fps: number;
}) => Particle[];

declare const SHAPES: {
    readonly circle: undefined;
    readonly square: undefined;
    readonly triangle: "polygon(50% 0%, 100% 100%, 0% 100%)";
    readonly star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
};
interface ParticlesProps extends ParticleEmitterOptions {
    /** Shape of the default particle element (default 'circle'). */
    shape?: keyof typeof SHAPES;
    /** Draws one particle instead of the default element (position it yourself, e.g. at particle.x / particle.y). */
    render?: (particle: Particle) => React$1.ReactNode;
    /** Style of the container: an absolutely positioned layer over the parent. */
    style?: React$1.CSSProperties;
    className?: string;
}
/**
 * Particle emitter: the particles of getParticles() at the current frame,
 * drawn in a layer over the parent (positions in px from its top left).
 *
 *   <Particles seed="burst" origin={{ x: 540, y: 960 }} count={60}
 *     lifetime={[0.6, 1.2]} speed={[300, 900]} gravity={1200} drag={1.5}
 *     size={[8, 16]} colors={['#ffd700', '#ff4d6d']} shape="star" />
 */
declare const Particles: React$1.FC<ParticlesProps>;

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
    /** Locale for the default number format (rounded, with grouping). Default 'en-US', whatever the host's locale. */
    locale?: string;
    /** Custom formatter; replaces the default format and `locale`. */
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
    direction?: 'random' | 'up' | 'down' | 'left' | 'right';
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
    /** Frames of the animation, shared by the words: each word animates for durationInFrames / words. */
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
    /** Alt text of the image. */
    alt?: string;
    /** Heading shown over the image at the end of the reveal; nothing is shown without it. */
    title?: React$1.ReactNode;
    /** Text under the title. */
    description?: React$1.ReactNode;
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

/**
 * Easing functions for interpolate(). Two families:
 *
 * - Remotion's (from React Native): base curves `linear`, `ease`, `quad`,
 *   `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `elastic(bounciness)`,
 *   `back(s)`, `bounce`, `bezier(x1, y1, x2, y2)`, composed with
 *   `Easing.in(f)` (as is), `Easing.out(f)` (mirrored) and `Easing.inOut(f)`
 *   (in for the first half, out for the second): `Easing.out(Easing.cubic)`.
 * - Named curves: `easeInQuad`, `easeOutCubic`, `easeInOutBack`, ...
 *
 * Every easing returns exactly 0 at 0 and 1 at 1.
 */
declare const Easing: {
    linear: (t: number) => number;
    /** Remotion's `ease`: bezier(0.42, 0, 1, 1). */
    ease: EasingFunction;
    quad: EasingFunction;
    cubic: EasingFunction;
    /** t to the power n (n > 0). */
    poly: (n: number) => EasingFunction;
    sin: EasingFunction;
    circle: EasingFunction;
    exp: EasingFunction;
    /** Springy overshoot; `bounciness` (default 1) sets how many times it goes back and forth. */
    elastic: (bounciness?: number) => EasingFunction;
    /** Pulls back before moving; `s` (default 1.70158) sets how far. */
    back: (s?: number) => EasingFunction;
    bounce: EasingFunction;
    bezier: (x1: number, y1: number, x2: number, y2: number) => EasingFunction;
    /** Runs the easing forwards (returns it as is). */
    in: (easing: EasingFunction) => EasingFunction;
    /** Runs the easing backwards: out(f)(t) = 1 - f(1 - t). */
    out: (easing: EasingFunction) => EasingFunction;
    /** Symmetric: the easing for the first half, mirrored for the second. */
    inOut: (easing: EasingFunction) => EasingFunction;
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
};
/**
 * Spring from `from` to `to`, released at rest at frame `delay` (default 0).
 *
 * Without `durationInFrames` it follows the physics of `config` and settles
 * when it settles. With `durationInFrames` the motion is stretched in time so
 * that it settles (to within `durationRestThreshold`) at `durationInFrames`,
 * and from that frame on it is exactly `to`.
 *
 * `reverse` plays the motion backwards in time, as in Remotion: it starts at
 * `to` and comes to rest at `from` after its length (`durationInFrames`, or
 * the natural settle time measureSpring({ fps, config, threshold:
 * durationRestThreshold })). Before it starts it is exactly `to`.
 */
declare const spring: ({ frame, fps, config, from, to, durationInFrames, durationRestThreshold, delay, reverse, }: SpringConfig) => number;
declare const interpolate: (input: number, inputRange: number[], outputRange: number[], options?: InterpolateOptions) => number;
declare const interpolateColors: (input: number, inputRange: number[], outputRange: string[]) => string;
declare const useKeyframes: (keyframes: Keyframe[], frame: number) => number | string;
/**
 * Number of frames until a spring released at frame 0 has settled: from the
 * returned frame on, it stays within `threshold` (a fraction of the distance
 * from `from` to `to`) of its target.
 */
declare const measureSpring: ({ fps, config, threshold, }: {
    fps: number;
    config?: SpringConfig["config"];
    threshold?: number;
}) => number;
declare const getFramesFromSeconds: (seconds: number, fps: number) => number;
declare const getSecondsFromFrames: (frames: number, fps: number) => number;
declare const range: (start: number, end: number, step?: number) => number[];
declare const random: (seed: string | number, min?: number, max?: number) => number;
/**
 * 2D value noise: smooth (continuous) in x and y, deterministic, in [0, 1).
 * Each integer lattice point gets a value from random(); between them the
 * values are mixed bilinearly with smoothstep weights.
 */
declare const noise2D: (x: number, y: number) => number;

/**
 * SVG path geometry without the DOM: length, point and tangent at a length,
 * stroke-drawing values, and paths built from points. Works in Node (SSR,
 * export) and gives the same numbers everywhere.
 *
 * Supported commands: M L H V C S Q T A Z, absolute and relative, with the
 * SVG rules for implicit repetition (extra pairs after M are lines), S/T
 * reflection, arc radius scaling and zero-radius arcs (straight lines).
 */
interface Point {
    x: number;
    y: number;
}
/** Length of the path (moves do not count), like SVGPathElement.getTotalLength(). */
declare const getLength: (d: string) => number;
/**
 * Point at `length` along the path, like SVGPathElement.getPointAtLength().
 * `length` is clamped to [0, getLength(d)].
 */
declare const getPointAtLength: (d: string, length: number) => Point;
/**
 * Unit vector of the direction of travel at `length` (clamped to the path).
 * Rotate something along the path with Math.atan2(y, x). Throws for a path
 * without length.
 */
declare const getTangentAtLength: (d: string, length: number) => Point;
/**
 * Stroke values that draw `progress` (0 to 1) of the path, as in Remotion:
 *
 *   <path d={d} {...evolvePath(progress, d)} />
 */
declare const evolvePath: (progress: number, d: string) => {
    strokeDasharray: string;
    strokeDashoffset: number;
};
interface PathFromPointsOptions {
    /**
     * Radius of the circular arcs that round the corners (default 0: sharp).
     * Where two edges are too short for it, the corner gets the largest radius
     * that fits in half of each edge.
     */
    cornerRadius?: number;
    /** Close the polygon (Z); its first point gets a rounded corner too. */
    closed?: boolean;
}
/**
 * Path through `points`: a polyline (or a polygon with `closed`) whose
 * corners can be rounded with circular arcs.
 *
 *   pathFromPoints([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }], { cornerRadius: 12 })
 */
declare const pathFromPoints: (points: readonly Point[], options?: PathFromPointsOptions) => string;

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
declare const useInterpolate: (inputRange: number[], outputRange: number[], options?: InterpolateOptions) => number;
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
 * Memoized frame value hook: `compute()` runs again when the frame or one of
 * `deps` changes. The value belongs to the calling component.
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
declare function useOptimizedInterpolate(inputRange: number[], outputRange: number[], options?: InterpolateOptions): (frame: number) => number;

export { AbsoluteFill, type AnimationTrack, Audio, type AudioProps$1 as AudioProps, Blur, Bounce, CardExpansionMask, Circle, Composition, type CompositionProps$1 as CompositionProps, Confetti, Counter, Cube3D, type DelayRenderApi, AbsoluteFill as Div, Easing, type EasingFunction, type ExtrapolateType, Fade, Flip3D, FlipImageReveal, type FrameContextValue, FrameProvider, Freeze, G, Glitch, GradientText, Highlight, HyperFrame, type ImageProps, Img, type InterpolateOptions, type Keyframe, KineticTypography, type LayerProps, LetterByLetter, LiquidText, Loop, MaskReveal, NeonGlow, type Particle, type ParticleEmitterOptions, type ParticlePoint, type ParticleRange, ParticleSystem, Particles, type ParticlesProps, Path, type PathFromPointsOptions, type PendingDelay, Perspective3D, type Point, type PreloadAsset, type PreloadFontOptions, ProgressBar, Pulse, RainbowText, Rect, type RenderGate, Retiming, Reverse, Rotate, Rotate3D, SVG, Scale, Sequence, type SequenceProps$1 as SequenceProps, Series, ShakeEffect, Slide, type SpringConfig, StickyGridScroll, Swing, Text, type TextProps$1 as TextProps, TextStack3D, Trail, type TransitionConfig, type TransitionName, Typewriter, Video, type VideoConfig, type VideoProps$1 as VideoProps, type WaitUntilReadyOptions, WaveText, WordByWord, blur, bounce, combine, createRenderGate, Easing as easing, evolvePath, fade, flash, flip, getFramesFromSeconds, getLength, getParticles, getPointAtLength, getSecondsFromFrames, getTangentAtLength, glitch, interpolate, interpolateColors, measureSpring, noise2D, pathFromPoints, preloadAudio, preloadFont, preloadImage, preloadVideo, pulse as pulseTransition, random, range, rotate as rotateTransition, scale as scaleTransition, shake as shakeTransition, slide, slideWithFade, spring, staticFile, transitions, useAnimation, useAnimationValue, useCachedFrame, useComposition, useVideoConfig as useConfig, useCurrentFrame, useCycle, useDelay, useDelayRender, useDurationInFrames, useFade, useFrameRange, useInterpolate, useKeyframeState, useKeyframes, useLoop, useLoopInfo, useMemoizedFrame, useOptimizedInterpolate, useOptimizedSpring, usePrecomputeFrames, usePreloadAssets, useProgress, usePulse, useRelativeCurrentFrame, useSequence, useShake, useSlide, useSpring, useTimeline, useTransform, useVideoConfig$1 as useVideoConfig, useWindowedFrame, wipe, zoom };
