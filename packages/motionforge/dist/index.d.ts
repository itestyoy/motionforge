import { V as VideoConfig, E as EasingFunction, I as InterpolateOptions, S as SpringConfig, K as Keyframe } from './Sequence-DLzWab-6.js';
export { A as AnimationTrack, a as ExtrapolateType, F as FrameContextValue, b as Freeze, L as Loop, c as LoopContextValue, d as LoopProps, R as Retiming, e as Reverse, f as Sequence, g as SequenceLayoutProps, h as SequenceProps, i as Series, j as SeriesSequenceProps, u as useRelativeCurrentFrame, k as useSequence } from './Sequence-DLzWab-6.js';
import React$1, { ImgHTMLAttributes, VideoHTMLAttributes, CSSProperties, ComponentProps } from 'react';
import { A as AudioVolume } from './audio-track-2QqcG4WJ.js';
import { I as ImageFit } from './image-fit-BNU-zyWh.js';
import { P as Point } from './instructions-CHagViH-.js';
export { A as AbsoluteInstruction, I as Instruction, R as ReducedInstruction, n as normalizePath, p as parsePath, r as reduceInstructions, s as serializeInstructions } from './instructions-CHagViH-.js';

/**
 * Render readiness: a scene holds the frame with delayRender() while it waits
 * for something asynchronous (an image to decode, a video to seek, data to
 * load); the host waits for the frame with gate.waitUntilReady() before it
 * captures or shows it.
 *
 * A gate belongs to one FrameProvider. Handles are plain numbers counted per
 * gate (1, 2, 3, ...). The one thing shared by all gates is page-wide loading
 * (loadFont()): fonts belong to the document, so a font that is loading holds
 * every gate, and one that failed fails every gate.
 */
interface PendingDelay {
    /** The number delayRender() returned; negative for a page-wide load (loadFont()). */
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
    /** Handles that hold the frame right now (premounted content is not counted), and page-wide loads. */
    getPending(): PendingDelay[];
    /**
     * The error passed to cancelRender() (or of a delayRender() timeout, or of a
     * failed loadFont()), if any. A cancelled gate stays cancelled.
     */
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

/**
 * The audio manifest: the SDK describes the sound of a scene as tracks, the
 * host plays and mixes them. `<Audio>`, `<Video>` and the generated sounds of
 * `motionforge/audio` register their track with the collector of the
 * FrameProvider they are in.
 */
/**
 * One sound of the scene. All frames are frames of the composition (the fps
 * of the FrameProvider), counted from the start of the composition; media
 * frames (`trimBefore`, `trimAfter`) count the media at that fps too.
 *
 * At an absolute frame `f` in `[startFrame, endFrame)` the track plays media
 * frame `trimBefore + (f - from) × playbackRate`, i.e. media time
 * `(trimBefore + (f - from) × playbackRate) / fps` seconds; with `loop` the
 * range `trimBefore`..`trimAfter` (or the end of the media) repeats.
 */
interface AudioTrack {
    /**
     * Derived from the description (source, timing, volume, name), so the same
     * track gets the same id whatever frames were rendered and in what order,
     * and manifests of several FrameProviders rendering the same scene merge by
     * id. Identical tracks playing at the same time get `#2`, `#3`, ... appended.
     */
    id: string;
    /** The `name` prop, or null. */
    name: string | null;
    /** URL of the media (`<Audio>`, `<Video>`), or null for generated audio. */
    src: string | null;
    /** The samples of generated audio (`motionforge/audio`), or null for a URL. */
    buffer: AudioBuffer | null;
    /**
     * The frame at which the track's own frame 0 plays (media frame
     * `trimBefore`): the start of the enclosing sequences. It is below
     * `startFrame` when the track starts before the composition or before an
     * enclosing sequence is shown (e.g. `<Sequence from={-30}>`); the host then
     * starts the media `startFrame - from` frames in.
     */
    from: number;
    /** The first frame the track is heard. */
    startFrame: number;
    /**
     * The frame (exclusive) at which it stops: the end of an enclosing sequence,
     * of the composition, or of the trimmed media (without `loop`), whichever
     * comes first. Without `trimAfter` the media may end earlier on its own.
     */
    endFrame: number;
    /** Media frames cut from the start. */
    trimBefore: number;
    /** Media frame (exclusive) to end at: the earlier of `trimAfter` and `trimBefore + durationInFrames`; null for the end of the media. */
    trimAfter: number | null;
    /** Media frames per composition frame (> 0). */
    playbackRate: number;
    /** Repeat `trimBefore`..`trimAfter` (or ..the end of the media) until `endFrame`. */
    loop: boolean;
    /** The track is described but must not be heard. */
    muted: boolean;
    /**
     * Gain (≥ 0; above 1 amplifies). A number when constant; for a volume
     * function, one value per frame from `startFrame` to `endFrame - 1`
     * (`volume[f - startFrame]`).
     */
    volume: number | readonly number[];
}
interface AudioCollector {
    /**
     * Every track registered so far, ordered by `startFrame`, then `id`. Tracks
     * register when their component mounts (a sequence mounts when it starts,
     * or `premountFor` frames earlier) and stay listed after it unmounts, so
     * after the host has rendered every frame this is the whole manifest. The
     * same array is returned until a track is added.
     */
    getTracks(): readonly AudioTrack[];
    /** Calls `listener` whenever a track is added; returns the unsubscribe function. */
    subscribe(listener: () => void): () => void;
}
/**
 * Collects the audio tracks of one FrameProvider:
 *
 *   const audio = createAudioCollector();
 *   <FrameProvider audio={audio} frame={n} ...>
 *   audio.getTracks(); audio.subscribe(() => ...);
 */
declare const createAudioCollector: () => AudioCollector;

/**
 * Where static files come from, as the host passes it to FrameProvider: a
 * base URL (the path is appended, each segment URL-encoded), or a function
 * that returns the URL of a path (a CDN, blob: or signed URLs).
 */
type StaticFiles = string | ((path: string) => string);

/**
 * The input log of a playable scene: events the host records (live taps) or
 * scripts (a video of the playable), each at the frame it happened.
 */
/**
 * One input event. `frame` is the frame it happened at: in the log, a frame
 * of the composition; inside a Sequence the hooks hand it out in the
 * sequence's frames (as useCurrentFrame() counts them). Everything besides
 * `frame` and `type` is the scene's own payload (keep it serializable, so a
 * recorded log can be replayed).
 */
interface InputEvent {
    frame: number;
    type: string;
    [key: string]: unknown;
}
/** What a scene emits with useEmitInput(): an event without `frame` (the SDK stamps it). */
interface InputEventInit {
    type: string;
    frame?: never;
    [key: string]: unknown;
}

declare const useCurrentFrame: () => number;
declare const useVideoConfig: () => {
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
    /**
     * Collector from createAudioCollector(): `<Audio>`, `<Video>` and the
     * generated sounds of 'motionforge/audio' register their tracks with it
     * (see AudioCollector). Without one nothing is collected. A FrameProvider
     * inside another one does not use the outer collector: its frames are its own.
     */
    audio?: AudioCollector;
    /**
     * Where the static files of useStaticFile() come from: a base URL
     * ("https://cdn.example.com/creative-42/", "/static/") or a function
     * (path) => url (signed URLs, blob: URLs). A FrameProvider without it
     * inside another one uses the outer one's.
     */
    staticFiles?: StaticFiles;
    /**
     * The input log of a playable: events `{ frame, type, ... }` in frame
     * order, owned by the host and only appended to (live taps it recorded, or
     * a scripted log for a video of the playable). useInputEvents(),
     * useReducedState() and useLastEvent() read it; the scene sees the events
     * up to the frame it renders, so a frame is a function of the frame and
     * the log. A FrameProvider inside another one does not use the outer log.
     */
    input?: readonly InputEvent[];
    /**
     * Receives the events scenes emit with useEmitInput(), with `frame` set to
     * the frame shown. The host decides whether to append them to `input`
     * (live play) or not (a video). Without it they are dropped.
     */
    onInput?: (event: InputEvent) => void;
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

/** Options of delayRender(), as in Remotion. */
interface DelayRenderOptions {
    /**
     * When the handle is still pending after this many milliseconds, the render
     * is cancelled with an error naming the label (the gate's waitUntilReady()
     * rejects with it). Without it, only the host's waitUntilReady() timeout applies.
     */
    timeoutInMilliseconds?: number;
}
interface DelayRenderApi {
    /**
     * Holds the current frame until continueRender(handle) is called. Call it
     * from an effect or a callback, never during render. Handles still pending
     * when the component unmounts are continued automatically.
     */
    delayRender: (label?: string, options?: DelayRenderOptions) => number;
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

type PreloadAsset = {
    type: 'image' | 'video' | 'audio';
    src: string;
} | {
    type: 'font';
    /** A family declared with @font-face (a stylesheet, e.g. Google Fonts) or loaded with loadFont(). */
    family: string;
    /** Only the faces covering this weight (default: all). */
    weight?: string | number;
    /** Only the faces of this style, e.g. 'italic' (default: all). */
    style?: string;
};
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

/** Progress of a prefetch(): bytes loaded and the total, if the response has a Content-Length. */
type PrefetchOnProgress = (progress: {
    loadedBytes: number;
    totalBytes: number | null;
}) => void;
/** Options of prefetch(), as in Remotion. */
interface PrefetchOptions {
    /** 'blob-url' (default): a blob: URL; 'base64': a data: URL. */
    method?: 'blob-url' | 'base64';
    /** Content type of the blob (default: the response's Content-Type). */
    contentType?: string;
    credentials?: RequestCredentials;
    onProgress?: PrefetchOnProgress;
}
interface Prefetch {
    /** Aborts the download if it is still running and frees the memory. */
    free: () => void;
    /** Resolves with the blob: or data: URL once the asset is downloaded. */
    waitUntilDone: () => Promise<string>;
}
/**
 * Downloads an asset into memory, like Remotion's prefetch(). Once it is
 * done, Img and Video with the same `src` show it from memory (a blob:
 * or data: URL), so seeking never waits for the network. It does not hold the
 * render gate: await waitUntilDone() where you need it.
 *
 *   const { free, waitUntilDone } = prefetch('/clip.mp4');
 *   await waitUntilDone();
 *   // ... later
 *   free();
 */
declare const prefetch: (src: string, options?: PrefetchOptions) => Prefetch;

/** Options of loadFont(), as in @remotion/fonts. */
interface LoadFontOptions {
    /** The name to use in CSS `font-family`. */
    family: string;
    /** URL of the font file. */
    url: string;
    /** Format of the file; by default the browser detects it. */
    format?: 'woff2' | 'woff' | 'opentype' | 'truetype';
    ascentOverride?: string;
    descentOverride?: string;
    display?: 'auto' | 'block' | 'fallback' | 'optional' | 'swap';
    featureSettings?: string;
    lineGapOverride?: string;
    stretch?: string;
    style?: string;
    unicodeRange?: string;
    variant?: string;
    weight?: string;
}
/**
 * Loads a font file and adds it to `document.fonts` under `family`, like
 * @remotion/fonts' loadFont(). Until the font is loaded every render gate on
 * the page waits for it (fonts belong to the document, not to one
 * FrameProvider); if it fails, every gate fails with the error. Call it
 * anywhere, e.g. at the top of a module:
 *
 *   loadFont({ family: 'Bangers', url: '/fonts/bangers.woff2' });
 *
 * The whole file is loaded whatever its unicode-range, so every script it
 * covers is ready. Without a DOM (server rendering) the promise rejects.
 */
declare const loadFont: (options: LoadFontOptions) => Promise<void>;

/**
 * The input events up to the current frame, oldest first, with `frame` in
 * the frames of the enclosing sequence. The same array while no event is
 * added or removed.
 */
declare const useInputEvents: <E extends InputEvent = InputEvent>() => readonly E[];
/**
 * The function scene handlers call to report input: `emit({ type: 'tap', x, y })`.
 * MotionForge stamps it with the composition frame shown and hands it to the
 * FrameProvider's `onInput`; the host appends it to the input log (live
 * play), and the scene reacts when it renders with the new log. Handlers
 * must not change the scene's own state: what the input changes is derived
 * from the log (useReducedState()), so a scripted log renders the same.
 */
declare const useEmitInput: () => ((event: InputEventInit) => void);
/**
 * State derived from the input log: `reducer` folded over the events up to
 * the current frame (with `frame` in the sequence's frames), starting from
 * `initialState`, like useReducer() over the log. Each event is folded once:
 * frames moving forward fold only the new events, seeking back reads a
 * stored state, and a log that is not the previous one with events appended
 * (a new session) is folded again. `reducer` must be pure and return a new
 * state instead of changing the old one (the states are kept); like
 * useReducer's initial state, `initialState` is read when the fold starts.
 *
 *   const score = useReducedState((score, e) => (e.type === 'hit' ? score + 1 : score), 0);
 */
declare const useReducedState: <S, E extends InputEvent = InputEvent>(reducer: (state: S, event: E) => S, initialState: S) => S;
/** The last input event up to the current frame, and how many frames ago it was. */
interface LastInputEvent<E extends InputEvent = InputEvent> {
    /** The event, with `frame` in the frames of the enclosing sequence. */
    event: E;
    /** useCurrentFrame() - event.frame: 0 on the frame it happened, then 1, 2, ... */
    framesSince: number;
}
/**
 * The latest event up to the current frame (that `predicate` accepts), with
 * the frames since it: for animating from the moment of an input.
 *
 *   const tap = useLastEvent((e) => e.type === 'tap');
 *   const pop = tap ? spring({ frame: tap.framesSince, fps }) : 0;
 *   const idle = useLastEvent();  // no input for (idle?.framesSince ?? frame) frames: show a hint
 */
declare const useLastEvent: <E extends InputEvent = InputEvent>(predicate?: (event: E) => boolean) => LastInputEvent<E> | null;

/**
 * Remotion's staticFile() for the FrameProvider this component is in: returns
 * a function from a path inside the static files ("images/hero.png") to its
 * URL, as the host configured with FrameProvider's `staticFiles`. The URLs
 * are plain strings: use them with Img, Video, Audio, prefetch(), CSS or
 * anything else.
 *
 *   const staticFile = useStaticFile();
 *   <Img src={staticFile('images/hero.png')} />
 */
declare const useStaticFile: () => ((path: string) => string);

/**
 * fitRect(): CSS object-fit arithmetic without the DOM, to place a picture in
 * a box and to cut or align pieces of it (a piece at (px, py) of the picture
 * is at x + px × scaleX, y + py × scaleY).
 */
/** CSS object-fit values. */
type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
/** The box the content is fitted into; `x`, `y` (default 0) offset the result. */
interface FitRectContainer {
    x?: number;
    y?: number;
    width: number;
    height: number;
}
/** The natural size of the content (e.g. an image's pixels). */
interface FitRectSize {
    width: number;
    height: number;
}
/**
 * Where the content sits in the box where it does not fill it, as CSS
 * object-position percentages / 100: 0 left (top), 0.5 centred, 1 right
 * (bottom); values outside 0..1 push it further.
 */
interface FitRectAnchor {
    x: number;
    y: number;
}
/** The content's rectangle in the container's coordinates and its scale from natural size. */
interface FittedRect {
    x: number;
    y: number;
    width: number;
    height: number;
    /** width / content width. */
    scaleX: number;
    /** height / content height; equal to scaleX except with 'fill'. */
    scaleY: number;
}
/**
 * Places `content` in `container` as CSS `object-fit: fit` with
 * `object-position: anchor` would (default: centred).
 *
 *   const r = fitRect({ width: 1080, height: 1920 }, { width: 2000, height: 1500 }, 'cover');
 *   // { x: -740, y: 0, width: 2560, height: 1920, scaleX: 1.28, scaleY: 1.28 }
 */
declare const fitRect: (container: FitRectContainer, content: FitRectSize, fit: ObjectFit, anchor?: FitRectAnchor) => FittedRect;

declare const useComposition: () => {
    id: string;
    config: VideoConfig;
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
    /** Audio collector for this composition's FrameProvider (see createAudioCollector). */
    audio?: AudioCollector;
    /** Where static files come from (FrameProvider's staticFiles). */
    staticFiles?: StaticFiles;
    /** The input log of a playable (FrameProvider's input). */
    input?: readonly InputEvent[];
    /** Receives the events the scene emits (FrameProvider's onInput). */
    onInput?: (event: InputEvent) => void;
}
declare const Composition: React$1.FC<CompositionProps>;

interface AbsoluteFillProps {
    children?: React$1.ReactNode;
    style?: React$1.CSSProperties;
    className?: string;
}
declare const AbsoluteFill: React$1.FC<AbsoluteFillProps>;
/**
 * Timing props of Video and Audio, as in Remotion. All in frames of the
 * composition's fps; `trimBefore`, `trimAfter` and `durationInFrames` count
 * frames of the media, `playbackRate` media frames per composition frame.
 */
interface MediaTimingProps {
    /** Media frames cut from the start: frame 0 shows media frame `trimBefore`. */
    trimBefore?: number;
    /** Media frame to end at (exclusive); once it is reached the track stops and Video unmounts (unless `loop`). */
    trimAfter?: number;
    /** Media frames to play from `trimBefore` (ends at `trimBefore + durationInFrames`, or `trimAfter` if earlier). */
    durationInFrames?: number;
    /** Speed (> 0, default 1): composition frame f shows media frame `trimBefore + f × playbackRate`. */
    playbackRate?: number;
    /** Repeat the range from `trimBefore` to `trimAfter` (or to the end of the media). */
    loop?: boolean;
    /**
     * Gain ≥ 0 (1: as recorded; above 1 amplifies), or a function of the frame
     * returning one (the frame counts from the start of the media, per
     * iteration with `loop` and `trimAfter`). It goes to the audio track.
     */
    volume?: AudioVolume;
    /** The track is described but not heard. */
    muted?: boolean;
    /** A label for the audio track (`AudioTrack.name`). */
    name?: string;
}
declare const OBJECT_FITS: readonly ["contain", "cover", "fill", "none", "scale-down"];
interface VideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'autoPlay' | 'controls' | 'loop' | 'muted' | 'name'>, MediaTimingProps {
    src: string;
    /** How the picture fits the element (CSS object-fit, default 'contain'). */
    objectFit?: (typeof OBJECT_FITS)[number];
    style?: React$1.CSSProperties;
}
/**
 * Video synced to the frame, with Remotion's props. It holds the render gate
 * (delayRender) until the element shows the frame's time: until its data is
 * loaded and, when it has to seek, until `seeked`. A load error goes to
 * cancelRender(). Without `loop`, it unmounts once `trimAfter` (or
 * `trimBefore + durationInFrames`) is reached; past the end of the media it
 * shows the last frame. The element has no default size: size it with
 * `style` or `className`.
 *
 * Its sound is an audio track (as `<Audio>` describes one: `volume`, `muted`,
 * `name` go there); the element itself is always muted, the host plays the
 * track.
 */
declare const Video: React$1.FC<VideoProps>;
interface AudioProps extends MediaTimingProps {
    /** URL of the audio file. */
    src: string;
}
/**
 * Describes a sound, with Remotion's props: it registers an audio track with
 * the FrameProvider's collector (see createAudioCollector()) and renders
 * nothing. The host plays and mixes the tracks. The track starts at the
 * start of the enclosing sequence and stops at its end, at the end of the
 * composition, or at `trimAfter` / `trimBefore + durationInFrames`.
 */
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
interface TextProps$1 {
    children: React$1.ReactNode;
    style?: React$1.CSSProperties;
    className?: string;
}
declare const Text: React$1.FC<TextProps$1>;
interface SVGProps {
    width?: number | string;
    height?: number | string;
    viewBox?: string;
    children: React$1.ReactNode;
    style?: React$1.CSSProperties;
}
declare const SVG: React$1.FC<SVGProps>;
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

type AnimatedImageLoopBehavior = 'loop' | 'pause-after-finish' | 'clear-after-finish';

type AnimatedImageFillMode = ImageFit;
interface AnimatedImageProps extends Omit<React$1.CanvasHTMLAttributes<HTMLCanvasElement>, 'width' | 'height' | 'onError' | 'onLoad'> {
    /** URL of an animated GIF, PNG (APNG), AVIF or WebP; a remote one must allow CORS. */
    src: string;
    /** Canvas width in px (default: the image's width). */
    width?: number;
    /** Canvas height in px (default: the image's height). */
    height?: number;
    /** Called with a load or decode error instead of failing the render. */
    onError?: (error: Error) => void;
    /** 'fill' (default, stretched), 'contain' or 'cover'. */
    fit?: AnimatedImageFillMode;
    /** Speed of the animation (default 1). */
    playbackRate?: number;
    style?: React$1.CSSProperties;
    /** 'loop' (default), 'pause-after-finish' (last frame) or 'clear-after-finish' (empty canvas). */
    loopBehavior?: AnimatedImageLoopBehavior;
    id?: string;
    className?: string;
    /** Passed to fetch() (credentials, headers). */
    requestInit?: RequestInit;
}
/**
 * Remotion's `<AnimatedImage>`: an animated GIF, APNG, AVIF or WebP drawn on
 * a `<canvas>` at the frame's time (`frame / fps × playbackRate`). It decodes
 * with the WebCodecs `ImageDecoder` (Chromium, Firefox; not Safari) and holds
 * the render gate while the image loads and until each frame is drawn. A load
 * or decode error goes to `onError`, or else to `cancelRender()`.
 */
declare const AnimatedImage: React$1.ForwardRefExoticComponent<AnimatedImageProps & React$1.RefAttributes<HTMLCanvasElement>>;

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

/** Options of Easing.spring(): a spring config, as in Remotion. */
interface EasingSpringConfig {
    damping?: number;
    mass?: number;
    stiffness?: number;
    overshootClamping?: boolean;
    /**
     * Without it (default false) the spring is stretched so that it settles (to
     * within `durationRestThreshold`) at t = 1, and is exactly 1 from t = 1 on.
     * With it, t = 1 is the time the spring settles, and the motion goes on
     * after it: interpolate() continues it past the end of the segment, even
     * with extrapolateRight 'clamp'.
     */
    allowTail?: boolean;
    /** Distance from the target that counts as settled (default 0.005). */
    durationRestThreshold?: number;
}
/**
 * Easing functions for interpolate(). Two families:
 *
 * - Remotion's (from React Native): base curves `linear`, `ease`, `quad`,
 *   `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `elastic(bounciness)`,
 *   `back(s)`, `bounce`, `bezier(x1, y1, x2, y2)`, `step0`, `step1`,
 *   `spring(config)`, composed with `Easing.in(f)` (as is), `Easing.out(f)`
 *   (mirrored) and `Easing.inOut(f)` (in for the first half, out for the
 *   second): `Easing.out(Easing.cubic)`.
 * - Named curves: `easeInQuad`, `easeOutCubic`, `easeInOutBack`, ...
 *
 * Every easing returns exactly 0 at 0 and 1 at 1 (a spring with `allowTail`
 * is at its settle threshold at 1, not exactly 1).
 */
declare const Easing: {
    /** 1 for any t > 0, else 0. */
    step0: (t: number) => number;
    /** 1 for any t >= 1, else 0. */
    step1: (t: number) => number;
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
    /**
     * A spring as an easing (Remotion's Easing.spring, same values): the
     * spring() motion from 0 to 1 with this config, on a 30 fps clock. See
     * EasingSpringConfig for `allowTail`.
     */
    spring: (config?: EasingSpringConfig) => EasingFunction;
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
 * Spring from `from` to `to`, as Remotion's spring(): the same values for the
 * same input.
 *
 * The spring is released at rest at frame `delay` (default 0) and before that
 * is at `from`. A damping ratio `damping / (2·√(stiffness·mass))` of 1 or
 * more is critically damped (as in Remotion, so `damping: 200` is a fast
 * spring without bounce, not a slow overdamped one). `overshootClamping`
 * keeps the motion from passing `to`.
 *
 * With `durationInFrames` the motion is stretched in time so that its natural
 * settle time (`measureSpring({ fps, config, threshold:
 * durationRestThreshold })`) becomes `durationInFrames`: at that frame it is
 * within the threshold of `to` (not exactly `to`), and after it it is exactly
 * `to`.
 *
 * `reverse` plays the motion backwards in time: it starts near `to` and comes
 * to rest at `from` after its length (`durationInFrames`, or the natural
 * settle time); `delay` then holds it at its start for `delay` frames.
 */
declare const spring: ({ frame, fps, config, from, to, durationInFrames, durationRestThreshold, delay, reverse, }: SpringConfig) => number;
/**
 * Maps `input` from `inputRange` to `outputRange` (Remotion's interpolate()).
 *
 * - `inputRange` is ascending; a zero-length segment is a step at its end.
 *   With one element the output is `outputRange[0]`.
 * - `extrapolateLeft` / `extrapolateRight`: 'extend' (default) continues the
 *   outermost segment, 'clamp' holds the end value, 'identity' returns the
 *   input, 'wrap' repeats the whole range.
 * - `easing`: one function, or one per segment.
 * - `posterize`: the input is first rounded down to a multiple of it.
 */
declare const interpolate: (input: number, inputRange: readonly number[], outputRange: readonly number[], options?: InterpolateOptions) => number;
/** Options of interpolateColors(), as in Remotion. */
interface InterpolateColorsOptions {
    easing?: InterpolateOptions['easing'];
    posterize?: number;
}
/**
 * Maps `input` to a color between the colors of `outputRange` (Remotion's
 * interpolateColors()). Outside the input range the end colors hold. The
 * channels are mixed in sRGB; the result is `rgba(r, g, b, a)` with integer
 * channels and alpha rounded to 3 decimals.
 *
 * Colors: #rgb, #rgba, #rrggbb, #rrggbbaa, CSS named colors (and
 * `transparent`), rgb()/rgba(), hsl()/hsla(), hwb(), lab(), lch(), oklab(),
 * oklch() in the comma or the space syntax (`rgb(255 0 0 / 50%)`).
 */
declare const interpolateColors: (input: number, inputRange: readonly number[], outputRange: readonly string[], options?: InterpolateColorsOptions) => string;
declare const useKeyframes: (keyframes: Keyframe[], frame: number) => number | string;
/**
 * Number of frames until a spring released at frame 0 has settled, as
 * Remotion's measureSpring() (same values): the first frame within
 * `threshold` (a fraction of the distance from `from` to `to`, default 0.005)
 * of its target, moved past any frame within the next 20 that is outside it
 * again. A threshold of 0 gives Infinity, of 1 or more 0.
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

/** 2D simplex noise in [-1, 1] at (x, y) for `seed`. */
declare const noise2D: (seed: string | number, x: number, y: number) => number;
/** 3D simplex noise in [-1, 1] at (x, y, z) for `seed`. */
declare const noise3D: (seed: string | number, x: number, y: number, z: number) => number;
/** 4D simplex noise in [-1, 1] at (x, y, z, w) for `seed`. */
declare const noise4D: (seed: string | number, x: number, y: number, z: number, w: number) => number;

/**
 * CSS transform builders with the API of @remotion/animation-utils:
 *
 *   makeTransform([translateX(100), rotate(45), scale(1.2)])
 *   // 'translateX(100px) rotate(45deg) scale(1.2, 1.2)'
 *
 * Numbers get a default unit (px for lengths, deg for angles); strings must
 * carry a CSS unit ('50%', '0.5turn'). Wrong arguments throw.
 */
declare const lengthUnits: readonly ["px", "em", "rem", "pt", "cap", "ch", "ex", "ic", "lh", "rlh", "vmax", "vmin", "vb", "vi", "cqw", "vh", "vw", "cqh", "cqi", "cqb", "cqmin", "cqmax", "cm", "mm", "Q", "in", "pc"];
declare const angleUnits: readonly ["rad", "deg", "grad", "turn"];
declare const lengthPercentageUnits: readonly ["%", "px", "em", "rem", "pt", "cap", "ch", "ex", "ic", "lh", "rlh", "vmax", "vmin", "vb", "vi", "cqw", "vh", "vw", "cqh", "cqi", "cqb", "cqmin", "cqmax", "cm", "mm", "Q", "in", "pc"];
type LengthUnit = (typeof lengthUnits)[number];
type AngleUnit = (typeof angleUnits)[number];
type LengthPercentageUnit = (typeof lengthPercentageUnits)[number];
type LengthUnitString = `${number}${LengthUnit}`;
type LengthPercentageUnitString = `${number}${LengthPercentageUnit}`;
type AngleUnitString = `${number}${AngleUnit}`;
/** Joins transform functions into one CSS `transform` value. */
declare const makeTransform: (transforms: readonly string[]) => string;
declare function matrix(a: number, b: number, c: number, d: number, tx: number, ty: number): string;
declare function matrix3d(...values: number[]): string;
declare function perspective(length: LengthUnitString): string;
declare function perspective(length: number, unit?: LengthUnit): string;
declare function rotate(angle: AngleUnitString): string;
declare function rotate(angle: number, unit?: AngleUnit): string;
declare function rotate3d(x: number, y: number, z: number, angle: AngleUnitString): string;
declare function rotate3d(x: number, y: number, z: number, angle: number, unit?: AngleUnit): string;
declare function rotateX(angle: AngleUnitString): string;
declare function rotateX(angle: number, unit?: AngleUnit): string;
declare function rotateY(angle: AngleUnitString): string;
declare function rotateY(angle: number, unit?: AngleUnit): string;
declare function rotateZ(angle: AngleUnitString): string;
declare function rotateZ(angle: number, unit?: AngleUnit): string;
/** scale(x) scales both axes; scale(x, y) each. */
declare function scale(x: number, y?: number): string;
declare function scale3d(x: number, y: number, z: number): string;
declare function scaleX(x: number): string;
declare function scaleY(y: number): string;
declare function scaleZ(z: number): string;
/** skew(a) skews both axes by `a`; skew(x, y) each (numbers in deg). */
declare function skew(angle: number | AngleUnitString): string;
declare function skew(angle: AngleUnitString, angle2: AngleUnitString): string;
declare function skew(angle: number, unit: AngleUnit): string;
declare function skew(angleX: number, angleY: number): string;
declare function skew(angleX: number, unitX: AngleUnit, angleY: number, unitY: AngleUnit): string;
declare function skewX(angle: AngleUnitString): string;
declare function skewX(angle: number, unit?: AngleUnit): string;
declare function skewY(angle: AngleUnitString): string;
declare function skewY(angle: number, unit?: AngleUnit): string;
/** translate(x), translate(x, y), with numbers in px or strings with units. */
declare function translate(x: number | LengthPercentageUnitString): string;
declare function translate(x: number, y: number): string;
declare function translate(x: LengthPercentageUnitString, y: LengthPercentageUnitString): string;
declare function translate(translation: number, unit: LengthPercentageUnit): string;
declare function translate(x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit): string;
declare function translate3d(x: number | LengthPercentageUnitString, y: number | LengthPercentageUnitString, z: number | LengthUnitString): string;
declare function translate3d(x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit, z: number, unitZ: LengthUnit): string;
declare function translateX(x: LengthPercentageUnitString): string;
declare function translateX(x: number, unit?: LengthPercentageUnit): string;
declare function translateY(y: LengthPercentageUnitString): string;
declare function translateY(y: number, unit?: LengthPercentageUnit): string;
declare function translateZ(z: LengthUnitString): string;
declare function translateZ(z: number, unit?: LengthUnit): string;

/**
 * interpolateStyles() with the API of @remotion/animation-utils: maps `input`
 * from `inputRange` to a style between the styles of `outputStylesRange`.
 *
 *   interpolateStyles(frame, [0, 30], [
 *     { opacity: 0, transform: makeTransform([translateY(-50)]) },
 *     { opacity: 1, transform: makeTransform([translateY(0)]) },
 *   ]);
 *
 * Every number in a value is interpolated (units must match, except for a
 * unitless 0), colors are mixed like interpolateColors(), transform and filter
 * functions argument by argument; keywords must be equal. Properties of the
 * start style that the end style lacks keep their start value.
 */

declare const interpolateStyles: (input: number, inputRange: readonly number[], outputStylesRange: readonly CSSProperties[], options?: InterpolateOptions) => CSSProperties;

/**
 * Path geometry without the DOM: length, point and tangent at a length. Arcs
 * and curves are measured exactly (Gauss-Legendre quadrature), so the numbers
 * are the same in Node and in every browser.
 */

/** Length of the path (moves do not count), like SVGPathElement.getTotalLength(). */
declare const getLength: (path: string) => number;
/**
 * Point at `length` along the path, as Remotion's getPointAtLength(): `null`
 * when `length` is greater than the length of the path. Throws for a negative
 * or non-finite length.
 */
declare const getPointAtLength: (path: string, length: number) => Point | null;
/**
 * Unit vector of the direction of travel at `length`, as Remotion's
 * getTangentAtLength(): `null` when `length` is greater than the length of
 * the path, `{ x: 0, y: 0 }` for a path without length. Rotate something
 * along the path with Math.atan2(y, x).
 */
declare const getTangentAtLength: (path: string, length: number) => Point | null;
/**
 * Index into parsePath(path) and the length into that part at `length`, as
 * Remotion's getInstructionIndexAtLength(): `index` is the last instruction
 * whose end lies before `length` (0 at the start), and `lengthIntoInstruction`
 * is `length` minus the path length up to its end.
 *
 *   getInstructionIndexAtLength('M 0 0 L 100 0 L 200 0', 105) // { lengthIntoInstruction: 5, index: 1 }
 *
 * Throws for a length below 0 or above the length of the path.
 */
declare const getInstructionIndexAtLength: (path: string, length: number) => {
    lengthIntoInstruction: number;
    index: number;
};
/**
 * Stroke values that draw `progress` (0 to 1) of the path, as in Remotion:
 *
 *   <path d={d} {...evolvePath(progress, d)} />
 *
 * At progress 0 the dash is 1.5 times the length, so rounding in the browser
 * cannot leave a dot of the stroke visible.
 */
declare const evolvePath: (progress: number, path: string) => {
    strokeDasharray: string;
    strokeDashoffset: number;
};

type BoundingBox = {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    viewBox: string;
    width: number;
    height: number;
};
/**
 * Bounding box of the drawn path `{ x1, y1, x2, y2, width, height, viewBox }`,
 * as Remotion's getBoundingBox(): curves are measured to their extrema,
 * control points do not count.
 */
declare const getBoundingBox: (d: string) => BoundingBox;
/** Moves the path by `x` and `y`; relative commands stay relative (as in Remotion). */
declare const translatePath: (path: string, x: number, y: number) => string;
/** Moves the path so that the top left corner of its bounding box is at 0, 0. */
declare const resetPath: (d: string) => string;
type CenterPathTarget = {
    x: number;
    y: number;
};
/** Moves the path so that the center of its bounding box is at `target` (default 0, 0). */
declare const centerPath: (d: string, target?: CenterPathTarget) => string;
/**
 * Scales the path by `scaleX` and `scaleY` around the top left corner of its
 * bounding box, as Remotion's scalePath(). The result has only M, L, C and Z.
 */
declare const scalePath: (d: string, scaleX: number, scaleY: number) => string;
/**
 * Splits the path at each M or m into subpaths, as Remotion's getSubpaths().
 * Each starts with an absolute M; the other commands are kept as they are.
 */
declare const getSubpaths: (path: string) => string[];
/** Reverses the direction of the path (end becomes start), as Remotion's reversePath(). */
declare const reversePath: (path: string) => string;
/**
 * The first `length` of the path, as Remotion's cutPath(): the path is
 * reduced to M, L, C and Z and the instruction at `length` is cut there (a
 * curve split at the point at that length, a closing Z cut as a line).
 */
declare const cutPath: (d: string, length: number) => string;
/**
 * Widens a viewBox (`"x y width height"`) in all directions by `scale`
 * around its center, as Remotion's extendViewBox(): 2 doubles width and height.
 */
declare const extendViewBox: (currentViewBox: string, scale: number) => string;
type WarpPathFn = (point: {
    x: number;
    y: number;
}) => {
    x: number;
    y: number;
};
/**
 * Remaps every point of the path with `transformer`, as Remotion's
 * warpPath(): the path is reduced to M, L, C and Z, a closing Z gets an
 * explicit line, and each line and curve is halved until its chord is at most
 * `interpolationThreshold` long (default 1% of the larger side of the
 * bounding box), so the warp bends straight lines too.
 */
declare const warpPath: (path: string, transformer: WarpPathFn, options?: {
    interpolationThreshold?: number;
}) => string;

/**
 * Morphing between paths, as Remotion's interpolatePath() and
 * interpolatePaths(). The algorithm is the one of d3-interpolate-path
 * (Peter Beshai, BSD-3-Clause), which Remotion adapted: both paths are reduced
 * to M, L, C and Z, the shorter one is extended by splitting its segments
 * until both have as many instructions, lines become curves where the other
 * path has a curve, and the coordinates are mixed.
 */

/**
 * The path between `firstPath` (at 0) and `secondPath` (at 1), as Remotion's
 * interpolatePath(). At exactly 0 and 1 the paths come back unchanged;
 * values outside 0..1 extrapolate. A closing Z is kept only if both paths
 * end with one.
 */
declare const interpolatePath: (value: number, firstPath: string, secondPath: string) => string;
type InterpolatePathsOptions = Pick<InterpolateOptions, 'easing' | 'posterize'> & {
    extrapolateLeft?: 'extend' | 'clamp' | 'wrap';
    extrapolateRight?: 'extend' | 'clamp' | 'wrap';
};
/**
 * Interpolates between several paths with keyframes, as Remotion's
 * interpolatePaths(): `inputRange` and the options work as in
 * interpolate() (`extrapolateLeft` / `extrapolateRight`: 'extend' (default),
 * 'clamp' or 'wrap'). At a keyframe the path comes back unchanged.
 *
 *   interpolatePaths(frame, [0, 30, 60], [circle, star, heart], { easing: Easing.inOut(Easing.cubic) })
 */
declare const interpolatePaths: (input: number, inputRange: readonly number[], outputRange: readonly string[], options?: InterpolatePathsOptions) => string;

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

type TextProps = ComponentProps<typeof Text>;

export { AbsoluteFill, type AngleUnit, type AngleUnitString, AnimatedImage, type AnimatedImageFillMode, type AnimatedImageLoopBehavior, type AnimatedImageProps, Audio, type AudioCollector, type AudioProps, type AudioTrack, AudioVolume, Blur, Bounce, type BoundingBox, CardExpansionMask, type CenterPathTarget, Composition, type CompositionProps, Confetti, Counter, Cube3D, type DelayRenderApi, type DelayRenderOptions, AbsoluteFill as Div, Easing, EasingFunction, type EasingSpringConfig, Fade, type FitRectAnchor, type FitRectContainer, type FitRectSize, type FittedRect, Flip3D, FlipImageReveal, FrameProvider, type FrameProviderProps, G, Glitch, GradientText, Highlight, HyperFrame, Img, type ImgProps, type InputEvent, type InputEventInit, type InterpolateColorsOptions, InterpolateOptions, type InterpolatePathsOptions, Keyframe, KineticTypography, type LastInputEvent, type LengthPercentageUnit, type LengthPercentageUnitString, type LengthUnit, type LengthUnitString, LetterByLetter, LiquidText, type LoadFontOptions, MaskReveal, NeonGlow, type ObjectFit, type Particle, type ParticleEmitterOptions, type ParticlePoint, type ParticleRange, ParticleSystem, Particles, type ParticlesProps, Path, type PathFromPointsOptions, type PendingDelay, Perspective3D, Point, type Prefetch, type PrefetchOnProgress, type PrefetchOptions, type PreloadAsset, ProgressBar, Pulse, RainbowText, type RenderGate, Rotate, Rotate3D, SVG, Scale, ShakeEffect, Slide, SpringConfig, type StaticFiles, StickyGridScroll, Swing, Text, type TextProps, TextStack3D, Typewriter, Video, VideoConfig, type VideoProps, type WaitUntilReadyOptions, type WarpPathFn, WaveText, WordByWord, centerPath, createAudioCollector, createRenderGate, cutPath, Easing as easing, evolvePath, extendViewBox, fitRect, getBoundingBox, getFramesFromSeconds, getInstructionIndexAtLength, getLength, getParticles, getPointAtLength, getSecondsFromFrames, getSubpaths, getTangentAtLength, interpolate, interpolateColors, interpolatePath, interpolatePaths, interpolateStyles, loadFont, makeTransform, matrix, matrix3d, measureSpring, noise2D, noise3D, noise4D, pathFromPoints, perspective, prefetch, random, range, resetPath, reversePath, rotate, rotate3d, rotateX, rotateY, rotateZ, scale, scale3d, scalePath, scaleX, scaleY, scaleZ, skew, skewX, skewY, spring, translate, translate3d, translatePath, translateX, translateY, translateZ, useAnimation, useAnimationValue, useCachedFrame, useComposition, useCurrentFrame, useCycle, useDelay, useDelayRender, useDurationInFrames, useEmitInput, useFade, useFrameRange, useInputEvents, useInterpolate, useKeyframeState, useKeyframes, useLastEvent, useLoop, useMemoizedFrame, useOptimizedInterpolate, useOptimizedSpring, usePrecomputeFrames, usePreloadAssets, useProgress, usePulse, useReducedState, useShake, useSlide, useSpring, useStaticFile, useTimeline, useTransform, useVideoConfig, useWindowedFrame, warpPath };
