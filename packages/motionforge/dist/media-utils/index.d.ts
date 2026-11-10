type MediaUtilsAudioData = {
    /** One array of samples (-1 to 1) per channel. */
    channelWaveforms: Float32Array[];
    sampleRate: number;
    durationInSeconds: number;
    numberOfChannels: number;
    /** Identifies this data (the same source and options give the same id). */
    resultId: string;
    /** Whether the source is on another origin than the page. */
    isRemote: boolean;
};
type VideoMetadata = {
    durationInSeconds: number;
    width: number;
    height: number;
    aspectRatio: number;
    isRemote: boolean;
};
type ImageDimensions = {
    width: number;
    height: number;
};

/**
 * Remotion's `getVideoMetadata()` (`@remotion/media-utils`): duration, size,
 * aspect ratio of a video, read by an invisible `<video>` element. Browser only.
 */
declare const getVideoMetadata: (src: string) => Promise<VideoMetadata>;

/**
 * Remotion's `getImageDimensions()` (`@remotion/media-utils`): the natural
 * width and height of an image. Browser only.
 */
declare const getImageDimensions: (src: string) => Promise<ImageDimensions>;

/**
 * Remotion's `getAudioDurationInSeconds()` (`@remotion/media-utils`): the
 * duration of an audio (or video) file, read by an invisible `<audio>`
 * element. Browser only.
 */
declare const getAudioDurationInSeconds: (src: string) => Promise<number>;

type GetAudioDataOptions = {
    /** Sample rate the audio is decoded at (default 48000). */
    sampleRate?: number;
    /** Passed to fetch() (credentials, headers). */
    requestInit?: RequestInit;
};
/**
 * Remotion's `getAudioData()` (`@remotion/media-utils`): fetches an audio (or
 * video) file and decodes it with the Web Audio API into one Float32Array of
 * samples per channel, resampled to `sampleRate`. Browser only. Results are
 * cached per source and options.
 */
declare const getAudioData: (src: string, options?: GetAudioDataOptions) => Promise<MediaUtilsAudioData>;

type UseAudioDataOptions = {
    /** Sample rate the audio is decoded at (default 48000). */
    sampleRate?: number;
    /** Passed to fetch(); read on the first render only, so an inline object does not reload. */
    requestInit?: RequestInit;
};
/**
 * Hook around getAudioData() (Remotion's `useAudioData()`): returns null
 * until the audio is decoded, then its data. It holds the render gate until
 * the data has rendered; a failure goes to cancelRender().
 */
declare const useAudioData: (src: string, options?: UseAudioDataOptions) => MediaUtilsAudioData | null;

type UseWindowedAudioDataOptions = {
    src: string;
    frame: number;
    fps: number;
    /** Length of one window in seconds. */
    windowInSeconds: number;
    /** The channel to return (default 0). */
    channelIndex?: number;
    /** Passed to fetch(); read on the first render only. */
    requestInit?: RequestInit;
};
type UseWindowedAudioDataReturnValue = {
    /** One channel: the window at the frame and its neighbours; null before loading and after the end. */
    audioData: MediaUtilsAudioData | null;
    /** Start of `audioData` in the file, in seconds: pass it to visualizeAudio() / visualizeAudioWaveform(). */
    dataOffsetInSeconds: number;
};
/**
 * Remotion's `useWindowedAudioData()`: the samples of one channel around the
 * frame, the window `frame` is in (windows of `windowInSeconds`) and the
 * windows before and after it, with `dataOffsetInSeconds` where they start.
 * The file is fetched and decoded once with getAudioData() (48 kHz) and the
 * windows are cut from it. Holds the render gate while loading.
 */
declare const useWindowedAudioData: ({ src, frame, fps, windowInSeconds, channelIndex, requestInit, }: UseWindowedAudioDataOptions) => UseWindowedAudioDataReturnValue;

type VisualizeAudioOptions = {
    audioData: MediaUtilsAudioData;
    frame: number;
    fps: number;
    /** Number of frequency bars (a power of two, e.g. 32, 64, 128). */
    numberOfSamples: number;
    /** 'accuracy' (default) or 'speed': two FFT implementations. */
    optimizeFor?: 'accuracy' | 'speed';
    /** Start of `audioData` in the source, in seconds (from useWindowedAudioData()). */
    dataOffsetInSeconds?: number;
    /** Average with the frames before and after (default true). */
    smoothing?: boolean;
};
/**
 * Remotion's `visualizeAudio()` (`@remotion/media-utils`): the frequency
 * spectrum of the first channel at `frame`, as `numberOfSamples` values
 * (about 0 to 1), low frequencies first. A pure function of its arguments.
 */
declare const visualizeAudio: ({ smoothing, optimizeFor, dataOffsetInSeconds, ...parameters }: VisualizeAudioOptions) => number[];

type VisualizeAudioWaveformOptions = {
    audioData: MediaUtilsAudioData;
    frame: number;
    fps: number;
    /** Length of audio shown, centred on the frame's time. */
    windowInSeconds: number;
    /** Number of values returned. */
    numberOfSamples: number;
    /** Channel to read (default 0). */
    channel?: number;
    /** Start of `audioData` in the source, in seconds (from useWindowedAudioData()). */
    dataOffsetInSeconds?: number;
    /** Scale so that the loudest value is 1 (default false). */
    normalize?: boolean;
};
/**
 * Remotion's `visualizeAudioWaveform()` (`@remotion/media-utils`): the
 * waveform of `windowInSeconds` of audio centred on the frame's time, as
 * `numberOfSamples` amplitudes, alternately negative and positive (draw them
 * as bars around a centre line, or through createSmoothSvgPath()). Time
 * outside the audio counts as silence. A pure function of its arguments.
 */
declare const visualizeAudioWaveform: ({ audioData, frame, fps, windowInSeconds, numberOfSamples, channel, dataOffsetInSeconds, normalize, }: VisualizeAudioWaveformOptions) => number[];

type Point = {
    x: number;
    y: number;
};
/**
 * Remotion's `createSmoothSvgPath()` (`@remotion/media-utils`): an SVG path
 * `d` through `points`, joined by cubic Bézier curves (smoothing 0.2).
 */
declare const createSmoothSvgPath: ({ points }: {
    points: Point[];
}) => string;

export { type ImageDimensions, type MediaUtilsAudioData, type Point, type UseAudioDataOptions, type UseWindowedAudioDataOptions, type UseWindowedAudioDataReturnValue, type VideoMetadata, type VisualizeAudioOptions, type VisualizeAudioWaveformOptions, createSmoothSvgPath, getAudioData, getAudioDurationInSeconds, getImageDimensions, getVideoMetadata, useAudioData, useWindowedAudioData, visualizeAudio, visualizeAudioWaveform };
