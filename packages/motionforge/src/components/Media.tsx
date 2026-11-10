'use client';

import React, { useCallback, useRef, useEffect, useState, VideoHTMLAttributes, AudioHTMLAttributes, ImgHTMLAttributes } from 'react';
import { useCurrentFrame, useVideoConfig } from '../core/context';
import { useDelayRender } from '../core/delay-render';
import { usePrefetchedSrc } from '../core/prefetch';

// Absolute Fill - Container component
interface AbsoluteFillProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const AbsoluteFill: React.FC<AbsoluteFillProps> = ({
  children,
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// The element ref is needed internally; a caller's ref (a prop in React 19)
// gets the element too.
const useElementRef = <T,>(callerRef: unknown) => {
  const ref = useRef<T | null>(null);
  const setRef = useCallback(
    (element: T | null) => {
      ref.current = element;
      if (typeof callerRef === 'function') callerRef(element);
      else if (callerRef && typeof callerRef === 'object') (callerRef as { current: T | null }).current = element;
    },
    [callerRef],
  );
  return [ref, setRef] as const;
};

/**
 * Timing props of Video and Audio, as in Remotion. All in frames of the
 * composition's fps; `trimBefore`, `trimAfter` and `durationInFrames` count
 * frames of the media, `playbackRate` media frames per composition frame.
 */
interface MediaTimingProps {
  /** Media frames cut from the start: frame 0 shows media frame `trimBefore`. */
  trimBefore?: number;
  /** Media frame to end at (exclusive); the element unmounts once it is reached (unless `loop`). */
  trimAfter?: number;
  /** Media frames to play from `trimBefore` (ends at `trimBefore + durationInFrames`, or `trimAfter` if earlier). */
  durationInFrames?: number;
  /** Speed (> 0, default 1): composition frame f shows media frame `trimBefore + f × playbackRate`. */
  playbackRate?: number;
  /** Repeat the range from `trimBefore` to `trimAfter` (or to the end of the media). */
  loop?: boolean;
  /** 0..1, or a function of the frame (counted from the start of the media, per iteration with `loop`). */
  volume?: number | ((frame: number) => number);
  muted?: boolean;
}

interface MediaTiming {
  trimBefore: number;
  /** Effective end in media frames, if any. */
  end: number | undefined;
  rate: number;
  loop: boolean;
  /** Composition frames the media is shown for without `loop`, if it has an end. */
  shownFor: number | undefined;
}

const resolveTiming = (
  component: string,
  { trimBefore, trimAfter, durationInFrames, playbackRate = 1, loop = false, volume }: MediaTimingProps,
): MediaTiming => {
  const fail = (message: string): never => {
    throw new Error(`<${component}>: ${message}`);
  };
  if (trimBefore !== undefined && !(typeof trimBefore === 'number' && Number.isFinite(trimBefore) && trimBefore >= 0)) {
    fail(`trimBefore must be a finite number >= 0, got ${trimBefore}`);
  }
  if (trimAfter !== undefined && !(typeof trimAfter === 'number' && Number.isFinite(trimAfter) && trimAfter > 0)) {
    fail(`trimAfter must be a positive finite number, got ${trimAfter}`);
  }
  if (trimAfter !== undefined && trimBefore !== undefined && trimAfter <= trimBefore) {
    fail(`trimAfter (${trimAfter}) must be greater than trimBefore (${trimBefore})`);
  }
  if (
    durationInFrames !== undefined &&
    !(typeof durationInFrames === 'number' && Number.isFinite(durationInFrames) && durationInFrames > 0)
  ) {
    fail(`durationInFrames must be a positive finite number, got ${durationInFrames}`);
  }
  if (!(typeof playbackRate === 'number' && Number.isFinite(playbackRate) && playbackRate > 0)) {
    fail(`playbackRate must be a finite number above 0 (playing backwards is not supported), got ${playbackRate}`);
  }
  if (typeof loop !== 'boolean') fail(`loop must be a boolean, got ${JSON.stringify(loop)}`);
  if (
    volume !== undefined &&
    typeof volume !== 'function' &&
    !(typeof volume === 'number' && Number.isFinite(volume) && volume >= 0)
  ) {
    fail(`volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  const start = trimBefore ?? 0;
  const byDuration = durationInFrames === undefined ? undefined : start + durationInFrames;
  const end =
    byDuration === undefined ? trimAfter : trimAfter === undefined ? byDuration : Math.min(trimAfter, byDuration);
  return {
    trimBefore: start,
    end,
    rate: playbackRate,
    loop,
    shownFor: end === undefined || loop ? undefined : (end - start) / playbackRate,
  };
};

// Length of one loop iteration in media frames: to the end, or to the end of
// the media (`mediaDuration` seconds).
const loopSpan = (component: string, timing: MediaTiming, mediaDuration: number, fps: number): number => {
  const span = (timing.end ?? mediaDuration * fps) - timing.trimBefore;
  if (!Number.isFinite(span) || span <= 0) {
    throw new Error(
      `<${component}>: loop needs a media with a finite duration after trimBefore, or trimAfter / durationInFrames (duration: ${mediaDuration} s)`,
    );
  }
  return span;
};

/**
 * Media time in seconds for local frame `frame`: media frame
 * `trimBefore + frame × playbackRate`, repeated every loop span with `loop`.
 */
const getMediaTime = (component: string, frame: number, fps: number, timing: MediaTiming, mediaDuration: number) => {
  let elapsed = Math.max(0, frame) * timing.rate;
  if (timing.loop) {
    elapsed %= loopSpan(component, timing, mediaDuration, fps);
  }
  return (timing.trimBefore + elapsed) / fps;
};

// The frame a volume function sees: from the start of the media, and from the
// start of each iteration with `loop` (when the iteration length is known).
const getVolume = (
  component: string,
  volume: MediaTimingProps['volume'],
  frame: number,
  fps: number,
  timing: MediaTiming,
  mediaDuration: number,
): number => {
  if (volume === undefined) return 1;
  if (typeof volume === 'number') return Math.min(1, volume);
  let volumeFrame = frame;
  if (timing.loop && (timing.end !== undefined || Number.isFinite(mediaDuration))) {
    volumeFrame = frame % (loopSpan(component, timing, mediaDuration, fps) / timing.rate);
  }
  const value = volume(volumeFrame);
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`<${component}>: volume(${volumeFrame}) must return a finite number, got ${JSON.stringify(value)}`);
  }
  // A media element plays at most at full volume.
  return Math.min(1, Math.max(0, value));
};

// Seek when the element is more than half a frame away from the frame's time.
const needsSeek = (currentTime: number, targetTime: number, fps: number): boolean =>
  Math.abs(currentTime - targetTime) > 0.5 / fps;

const OBJECT_FITS = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;

export interface VideoProps
  extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src' | 'autoPlay' | 'controls' | 'loop' | 'muted'>,
    MediaTimingProps {
  src: string;
  /** How the picture fits the element (CSS object-fit, default 'contain'). */
  objectFit?: (typeof OBJECT_FITS)[number];
  style?: React.CSSProperties;
}

/**
 * Video synced to the frame, with Remotion's props. It holds the render gate
 * (delayRender) until the element shows the frame's time: until its data is
 * loaded and, when it has to seek, until `seeked`. A load error goes to
 * cancelRender(). Without `loop`, it unmounts once `trimAfter` (or
 * `trimBefore + durationInFrames`) is reached; past the end of the media it
 * shows the last frame. The element has no default size: size it with
 * `style` or `className`.
 */
export const Video: React.FC<VideoProps> = ({
  src,
  trimBefore,
  trimAfter,
  durationInFrames,
  volume,
  playbackRate,
  muted = false,
  loop,
  objectFit,
  style,
  ...props
}) => {
  const [videoRef, setVideoRef] = useElementRef<HTMLVideoElement>((props as { ref?: unknown }).ref);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const timing = resolveTiming('Video', { trimBefore, trimAfter, durationInFrames, playbackRate, loop, volume });
  const { trimBefore: start, end, rate, loop: looping } = timing;
  const resolvedSrc = usePrefetchedSrc(src);
  if (objectFit !== undefined && !OBJECT_FITS.includes(objectFit)) {
    throw new Error(`<Video>: objectFit must be one of ${OBJECT_FITS.join(', ')}, got ${JSON.stringify(objectFit)}`);
  }
  if (objectFit !== undefined && style?.objectFit !== undefined && style.objectFit !== objectFit) {
    throw new Error(`<Video>: objectFit="${objectFit}" and style.objectFit="${style.objectFit}" disagree; pass one`);
  }
  const shown = timing.shownFor === undefined || currentFrame < timing.shownFor;

  // Show the frame's time, holding the frame until the element is there.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handle = delayRender(`<Video> ${src} at frame ${currentFrame}`);
    let settled = false;
    const removeListeners = () => {
      video.removeEventListener('loadeddata', sync);
      video.removeEventListener('seeked', done);
      video.removeEventListener('error', fail);
    };
    function done() {
      if (settled) return;
      settled = true;
      removeListeners();
      continueRender(handle);
    }
    function cancel(error: Error) {
      if (settled) return;
      settled = true;
      removeListeners();
      cancelRender(error);
      continueRender(handle);
    }
    function fail() {
      const detail = video!.error ? `: ${video!.error.message || `media error code ${video!.error.code}`}` : '';
      cancel(new Error(`<Video> could not load ${src}${detail}`));
    }
    function sync() {
      video!.removeEventListener('loadeddata', sync);
      let time: number;
      try {
        time = getMediaTime('Video', currentFrame, fps, { ...timing }, video!.duration);
      } catch (error) {
        cancel(error as Error);
        return;
      }
      if (needsSeek(video!.currentTime, time, fps)) {
        video!.addEventListener('seeked', done);
        video!.currentTime = time;
      } else {
        done();
      }
    }

    video.addEventListener('error', fail);
    if (video.error) {
      fail();
    } else if (video.readyState >= 2) {
      // HAVE_CURRENT_DATA: the element can seek and show a frame.
      sync();
    } else {
      video.addEventListener('loadeddata', sync);
    }
    return () => {
      removeListeners();
      if (!settled) {
        settled = true;
        continueRender(handle);
      }
    };
    // `timing` is derived from the listed props.
  }, [currentFrame, fps, start, end, rate, looping, resolvedSrc, shown, delayRender, continueRender, cancelRender]);

  // Volume of the frame (a media element plays at most at 1).
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = getVolume('Video', volume, currentFrame, fps, timing, videoRef.current.duration);
    }
  });

  if (!shown) return null;

  return (
    <video
      src={resolvedSrc}
      muted={muted}
      playsInline
      style={{ ...style, objectFit: objectFit ?? style?.objectFit ?? 'contain' }}
      {...props}
      ref={setVideoRef}
    />
  );
};

export interface AudioProps
  extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src' | 'autoPlay' | 'controls' | 'loop' | 'muted'>,
    MediaTimingProps {
  src: string;
}

/**
 * Audio synced to the frame, with Remotion's props: it seeks to the frame's
 * time once loaded and on every frame (Video's timing rules). It does not
 * hold the render gate (a frame has no sound to capture).
 */
export const Audio: React.FC<AudioProps> = ({
  src,
  trimBefore,
  trimAfter,
  durationInFrames,
  volume,
  playbackRate,
  muted = false,
  loop,
  onLoadedData,
  ...props
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [loaded, setLoaded] = useState(false);
  const timing = resolveTiming('Audio', { trimBefore, trimAfter, durationInFrames, playbackRate, loop, volume });
  const { trimBefore: start, end, rate, loop: looping } = timing;
  const resolvedSrc = usePrefetchedSrc(src);
  const shown = timing.shownFor === undefined || currentFrame < timing.shownFor;

  // Seek to the frame's time.
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && loaded) {
      const time = getMediaTime('Audio', currentFrame, fps, { ...timing }, audio.duration);
      if (needsSeek(audio.currentTime, time, fps)) {
        audio.currentTime = time;
      }
    }
    // `timing` is derived from the listed props.
  }, [currentFrame, fps, start, end, rate, looping, loaded]);

  // Volume of the frame.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = getVolume('Audio', volume, currentFrame, fps, timing, audioRef.current.duration);
    }
  });

  // A new source loads again.
  useEffect(() => setLoaded(false), [resolvedSrc]);

  // The caller's onLoadedData runs after ours; it must not replace it.
  const handleLoadedData = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    setLoaded(true);
    onLoadedData?.(event);
  };

  if (!shown) return null;

  return (
    <audio
      ref={audioRef}
      src={resolvedSrc}
      muted={muted}
      {...props}
      onLoadedData={handleLoadedData}
    />
  );
};

// Image Component
export interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  style?: React.CSSProperties;
  startFrom?: number;
  endAt?: number;
}

/**
 * Image that holds the render gate (delayRender) until it is loaded and
 * decoded (HTMLImageElement.decode()). A load or decode error goes to
 * cancelRender().
 */
export const Img: React.FC<ImgProps> = ({
  src,
  style,
  startFrom,
  endAt,
  ...props
}) => {
  const currentFrame = useCurrentFrame();
  const [imageRef, setImageRef] = useElementRef<HTMLImageElement>((props as { ref?: unknown }).ref);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  // From memory once prefetch() has downloaded it.
  const resolvedSrc = usePrefetchedSrc(src);

  // Check if should render based on frame range
  const shown =
    !(startFrom !== undefined && currentFrame < startFrom) && !(endAt !== undefined && currentFrame > endAt);

  useEffect(() => {
    const image = imageRef.current;
    if (!shown || !image) return;
    const handle = delayRender(`<Img> ${src}`);
    let active = true;
    const settle = (error?: Error) => {
      if (!active) return;
      active = false;
      if (error) cancelRender(error);
      continueRender(handle);
    };
    if (typeof image.decode !== 'function') {
      settle(new Error('<Img> needs HTMLImageElement.decode() to know when the image is ready'));
    } else {
      // decode() waits for the load and rejects when loading or decoding fails.
      image.decode().then(
        () => settle(),
        () => settle(new Error(`<Img> could not load or decode ${src}`)),
      );
    }
    return () => settle();
  }, [src, resolvedSrc, shown, delayRender, continueRender, cancelRender]);

  if (!shown) {
    return null;
  }

  return (
    <img
      src={resolvedSrc}
      alt=""
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
      {...props}
      ref={setImageRef}
    />
  );
};

// StaticFile component - for local static assets
interface StaticFileProps {
  src: string;
  style?: React.CSSProperties;
}

export const staticFile = (path: string): string => {
  // In a real implementation, this would resolve to a static file path
  return `/static/${path}`;
};

// Text Component
interface TextProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const Text: React.FC<TextProps> = ({
  children,
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        display: 'inline-block',
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// SVG Components
interface SVGProps {
  width?: number | string;
  height?: number | string;
  viewBox?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const SVG: React.FC<SVGProps> = ({
  width = '100%',
  height = '100%',
  viewBox = '0 0 100 100',
  children,
  style,
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      style={{
        overflow: 'visible',
        ...style,
      }}
    >
      {children}
    </svg>
  );
};

// Path Component
interface PathProps {
  d: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export const Path: React.FC<PathProps> = ({
  d,
  fill = 'black',
  stroke,
  strokeWidth,
  style,
}) => {
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};

// G (Group) Component
interface GroupProps {
  children: React.ReactNode;
  transform?: string;
  style?: React.CSSProperties;
}

export const G: React.FC<GroupProps> = ({
  children,
  transform,
  style,
}) => {
  return (
    <g transform={transform} style={style}>
      {children}
    </g>
  );
};

export { AbsoluteFill as Div };
