interface VideoConfig {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
}
interface CompositionProps {
    id: string;
    component: React.ComponentType<Record<string, unknown>>;
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    defaultProps?: Record<string, unknown>;
}
interface SequenceProps {
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
interface VideoProps {
    src: string;
    startFrom?: number;
    endAt?: number;
    volume?: number | ((frame: number) => number);
    playbackRate?: number;
    muted?: boolean;
    style?: React.CSSProperties;
}
interface AudioProps {
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
interface TextProps {
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
interface TimelineState {
    frame: number;
    playing: boolean;
    playbackRate: number;
}
interface RenderJob {
    id: string;
    compositionId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    outputUrl?: string;
    error?: string;
    createdAt: Date;
}
interface FrameContextValue {
    frame: number;
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
    playing: boolean;
    playbackRate: number;
    setFrame: (frame: number) => void;
    setPlaying: (playing: boolean) => void;
    setPlaybackRate: (rate: number) => void;
}
interface VideoRendererConfig {
    quality: 'low' | 'medium' | 'high';
    format: 'mp4' | 'webm' | 'gif';
    codec?: 'h264' | 'h265' | 'vp8' | 'vp9';
    crf?: number;
    pixelFormat?: string;
    bitrate?: number;
}
interface CompositionManager {
    compositions: Map<string, CompositionProps>;
    currentComposition: string | null;
    registerComposition: (composition: CompositionProps) => void;
    unregisterComposition: (id: string) => void;
    setCurrentComposition: (id: string) => void;
    getComposition: (id: string) => CompositionProps | undefined;
}

/**
 * Cache Statistics
 */
interface CacheStats {
    hits: number;
    misses: number;
    size: number;
    entries: number;
    hitRate: number;
}
/**
 * LRU Cache with TTL support for frame caching
 */
declare class FrameCache<T = ImageData> {
    private cache;
    private maxSize;
    private maxAge;
    private stats;
    constructor(options?: {
        maxSize?: number;
        maxAge?: number;
    });
    /**
     * Generate cache key for a frame
     */
    static createKey(compositionId: string, frame: number, width: number, height: number): string;
    /**
     * Get a cached frame
     */
    get(key: string): T | null;
    /**
     * Set a cached frame
     */
    set(key: string, data: T, size?: number): void;
    /**
     * Check if key exists and is valid
     */
    has(key: string): boolean;
    /**
     * Delete a cached frame
     */
    delete(key: string): boolean;
    /**
     * Clear all cached frames
     */
    clear(): void;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Get current cache size in bytes
     */
    getSize(): number;
    /**
     * Evict entries until we have enough space
     */
    private evictIfNeeded;
    /**
     * Estimate size of data
     */
    private estimateSize;
}
/**
 * Singleton frame cache instance
 */
declare const frameCache: FrameCache<ImageData>;
/**
 * Memoization cache for computed values
 */
declare class MemoCache {
    private static instance;
    private cache;
    static getInstance(): MemoCache;
    /**
     * Get or compute a memoized value
     */
    getOrCompute<T>(key: string, compute: () => T, deps?: unknown[]): T;
    /**
     * Check if dependencies are equal
     */
    private depsEqual;
    /**
     * Clear all memoized values
     */
    clear(): void;
}
/**
 * Debounced function cache
 */
declare function createDebouncedCache<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): T;
/**
 * Throttled function cache
 */
declare function createThrottledCache<T extends (...args: unknown[]) => unknown>(fn: T, limit: number): T;

/**
 * Render progress information
 */
interface RenderProgress {
    frame: number;
    totalFrames: number;
    percentage: number;
    elapsedMs: number;
    estimatedRemainingMs: number;
    framesPerSecond: number;
}
/**
 * Render options
 */
interface ExportOptions {
    compositionId: string;
    config: VideoConfig;
    rendererConfig?: Partial<VideoRendererConfig>;
    onProgress?: (progress: RenderProgress) => void;
    onFrame?: (frameNumber: number, imageData: ImageData) => void;
    signal?: AbortSignal;
}
/**
 * Render result
 */
interface ExportResult {
    success: boolean;
    blob?: Blob;
    url?: string;
    frameCount: number;
    duration: number;
    error?: string;
}
/**
 * Canvas renderer for frame capture
 */
declare class CanvasRenderer {
    private canvas;
    private ctx;
    private config;
    constructor(config: VideoConfig);
    /**
     * Capture a single frame from a DOM element
     */
    captureFrame(element: HTMLElement): Promise<ImageData>;
    private domToDataUrl;
    private inlineStyles;
    private loadImage;
    /**
     * Convert ImageData to Blob
     */
    imageDataToBlob(imageData: ImageData, format?: string): Promise<Blob>;
    /**
     * Convert ImageData to data URL
     */
    imageDataToDataURL(imageData: ImageData, format?: string): string;
    /**
     * Get canvas element
     */
    getCanvas(): HTMLCanvasElement;
    /**
     * Get context
     */
    getContext(): CanvasRenderingContext2D;
    /**
     * Dispose renderer
     */
    dispose(): void;
}
/**
 * WebCodecs Video Encoder for high-performance encoding
 */
declare class WebCodecsEncoder {
    private encoder;
    private chunks;
    private config;
    private frameCount;
    constructor(config: VideoConfig);
    start(fps: number, bitrate?: number): Promise<void>;
    addFrame(canvas: HTMLCanvasElement): Promise<void>;
    stop(): Promise<Blob>;
}
/**
 * WebM Video Encoder using MediaRecorder
 */
declare class WebMEncoder {
    private mediaRecorder;
    private chunks;
    private canvas;
    private stream;
    constructor(canvas: HTMLCanvasElement);
    /**
     * Start recording
     */
    start(fps: number, bitrate?: number): Promise<void>;
    /**
     * Stop recording and get result
     */
    stop(): Promise<Blob>;
    /**
     * Check if recording
     */
    isRecording(): boolean;
}
/**
 * Frame sequence encoder for GIF/WebP
 */
declare class FrameSequenceEncoder {
    private frames;
    private delays;
    /**
     * Add a frame
     */
    addFrame(imageData: ImageData, delay: number): void;
    /**
     * Get all frames
     */
    getFrames(): ImageData[];
    /**
     * Clear frames
     */
    clear(): void;
    /**
     * Get frame count
     */
    getFrameCount(): number;
}
/**
 * Video Export Manager - Main export functionality
 */
declare class VideoExportManager {
    private renderer;
    private encoder;
    private isRendering;
    private abortController;
    /**
     * Export video by driving frames manually (frame-by-frame)
     * This is much more robust than real-time recording
     */
    exportVideo(setFrame: (frame: number) => void, element: HTMLElement, options: Omit<ExportOptions, 'compositionId'>): Promise<ExportResult>;
    /**
     * Export video from frames (LEGACY/REAL-TIME)
     */
    exportFromCanvas(canvas: HTMLCanvasElement, options: Omit<ExportOptions, 'compositionId'>): Promise<ExportResult>;
    /**
     * Export frame sequence as images
     */
    exportFrames(frames: ImageData[], format?: 'png' | 'jpeg' | 'webp'): Promise<Blob[]>;
    /**
     * Create downloadable zip of frames
     */
    createFrameZip(frames: ImageData[], compositionId: string): Promise<Blob>;
    /**
     * Abort current render
     */
    abort(): void;
    /**
     * Check if currently rendering
     */
    getIsRendering(): boolean;
    /**
     * Merge multiple abort signals
     */
    private mergeSignals;
}
/**
 * Calculate render progress
 */
declare function calculateProgress(frame: number, totalFrames: number, startTime: number): RenderProgress;
/**
 * Estimate video file size
 */
declare function estimateFileSize(config: VideoConfig, bitrate?: number): number;
/**
 * Check browser support for video encoding
 */
declare function checkEncodingSupport(): {
    webm: boolean;
    mp4: boolean;
    codecs: string[];
};
declare const videoExportManager: VideoExportManager;

interface RenderOptions {
    compositionId: string;
    config: VideoConfig;
    outputDir: string;
    onProgress?: (progress: number) => void;
    onFrame?: (frame: number, imageData: string) => void;
}
interface RenderResult {
    success: boolean;
    outputUrl?: string;
    frameCount: number;
    duration: number;
    error?: string;
}
declare const generateFrames: (component: React.ComponentType<Record<string, unknown>>, config: VideoConfig, options?: {
    startFrame?: number;
    endFrame?: number;
    onProgress?: (frame: number, total: number) => void;
}) => Promise<string[]>;
declare const renderVideo: (options: RenderOptions & VideoRendererConfig) => Promise<RenderResult>;
declare const buildFFmpegCommand: (inputPattern: string, outputPath: string, config: VideoConfig, rendererConfig: VideoRendererConfig) => string[];
declare const frameToDataURL: (canvas: HTMLCanvasElement) => string;
declare const calculateVideoSize: (width: number, height: number, fps: number, durationInSeconds: number, bitrate?: number) => number;
declare const estimateRenderTime: (durationInFrames: number, complexity?: "low" | "medium" | "high") => number;
declare const validateRenderConfig: (config: VideoConfig) => string[];
declare class RenderJobManager {
    private jobs;
    createJob(id: string, config: VideoConfig): void;
    startJob(id: string): void;
    updateProgress(id: string, progress: number): void;
    completeJob(id: string, outputUrl: string): void;
    failJob(id: string, error: string): void;
    getJob(id: string): RenderJobState | undefined;
    getActiveJobs(): RenderJobState[];
}
interface RenderJobState {
    id: string;
    config: VideoConfig;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    startTime: number | null;
    endTime: number | null;
    outputUrl?: string;
    error?: string;
}
declare const renderJobManager: RenderJobManager;
declare function renderCompositionToVideo(setFrame: (frame: number) => void, element: HTMLElement, config: VideoConfig, options?: {
    onProgress?: (progress: number) => void;
    onComplete?: (blob: Blob) => void;
}): Promise<Blob | null>;
declare function downloadVideo(blob: Blob, filename?: string): void;
declare function downloadFrame(imageData: ImageData, filename?: string): void;

export { type AnimationTrack as A, frameCache as B, type CacheStats as C, frameToDataURL as D, type EasingFunction as E, FrameCache as F, generateFrames as G, renderCompositionToVideo as H, type InterpolateOptions as I, renderJobManager as J, type Keyframe as K, type LayerProps as L, MemoCache as M, renderVideo as N, validateRenderConfig as O, videoExportManager as P, type RenderOptions as Q, type RenderJob as R, type SpringConfig as S, type TextProps as T, type RenderResult as U, type VideoConfig as V, WebMEncoder as W, WebCodecsEncoder as X, type AudioProps as a, CanvasRenderer as b, type CompositionManager as c, type CompositionProps as d, type ExportOptions as e, type ExportResult as f, type FrameContextValue as g, FrameSequenceEncoder as h, type ImageProps as i, RenderJobManager as j, type RenderProgress as k, type SequenceProps as l, type TimelineState as m, VideoExportManager as n, type VideoProps as o, type VideoRendererConfig as p, buildFFmpegCommand as q, calculateProgress as r, calculateVideoSize as s, checkEncodingSupport as t, createDebouncedCache as u, createThrottledCache as v, downloadFrame as w, downloadVideo as x, estimateFileSize as y, estimateRenderTime as z };
