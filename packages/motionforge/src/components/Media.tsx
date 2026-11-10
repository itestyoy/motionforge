'use client';

import React, { useCallback, useRef, useEffect, useState, VideoHTMLAttributes, AudioHTMLAttributes, ImgHTMLAttributes } from 'react';
import { useCurrentFrame, useVideoConfig } from '../core/context';
import { useDelayRender } from '../core/delay-render';

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
 * Media time in seconds for a composition frame. `startFrom` is in frames of
 * the media; each composition frame advances `playbackRate` media frames.
 */
const getMediaTime = (
  frame: number,
  fps: number,
  startFrom: number,
  playbackRate: number
): number => (startFrom + frame * playbackRate) / fps;

// Seek when the element is more than half a frame away from the frame's time.
const needsSeek = (currentTime: number, targetTime: number, fps: number): boolean =>
  Math.abs(currentTime - targetTime) > 0.5 / fps;

// Video Component
interface VideoProps extends Omit<VideoHTMLAttributes<HTMLVideoElement>, 'src'> {
  src: string;
  startFrom?: number;
  endAt?: number;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
  muted?: boolean;
  style?: React.CSSProperties;
  pauseOnFrame?: boolean;
}

/**
 * Video synced to the frame. It holds the render gate (delayRender) until the
 * element shows the frame's time: until its data is loaded and, when it has
 * to seek, until `seeked`. A load error goes to cancelRender().
 */
export const Video: React.FC<VideoProps> = ({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = true,
  style,
  pauseOnFrame = true,
  ...props
}) => {
  const [videoRef, setVideoRef] = useElementRef<HTMLVideoElement>((props as { ref?: unknown }).ref);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();

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
    function fail() {
      if (settled) return;
      settled = true;
      removeListeners();
      const detail = video!.error ? `: ${video!.error.message || `media error code ${video!.error.code}`}` : '';
      cancelRender(new Error(`<Video> could not load ${src}${detail}`));
      continueRender(handle);
    }
    function sync() {
      video!.removeEventListener('loadeddata', sync);
      const time = getMediaTime(currentFrame, fps, startFrom, playbackRate);
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
  }, [currentFrame, fps, startFrom, playbackRate, src, delayRender, continueRender, cancelRender]);

  // Handle volume
  useEffect(() => {
    if (videoRef.current) {
      const vol = typeof volume === 'function' ? volume(currentFrame) : volume;
      videoRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [currentFrame, volume]);

  // Handle playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  return (
    <video
      src={src}
      muted={muted}
      playsInline
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
      {...props}
      ref={setVideoRef}
    />
  );
};

// Audio Component
interface AudioProps extends Omit<AudioHTMLAttributes<HTMLAudioElement>, 'src'> {
  src: string;
  startFrom?: number;
  endAt?: number;
  volume?: number | ((frame: number) => number);
  playbackRate?: number;
  muted?: boolean;
}

export const Audio: React.FC<AudioProps> = ({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = false,
  onLoadedData,
  ...props
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [loaded, setLoaded] = useState(false);

  // Calculate audio time based on frame
  useEffect(() => {
    if (audioRef.current && loaded) {
      const time = getMediaTime(currentFrame, fps, startFrom, playbackRate);
      if (needsSeek(audioRef.current.currentTime, time, fps)) {
        audioRef.current.currentTime = time;
      }
    }
  }, [currentFrame, fps, startFrom, playbackRate, loaded]);

  // Handle volume
  useEffect(() => {
    if (audioRef.current) {
      const vol = typeof volume === 'function' ? volume(currentFrame) : volume;
      audioRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [currentFrame, volume]);

  // Handle playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  // The caller's onLoadedData runs after ours; it must not replace it.
  const handleLoadedData = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    setLoaded(true);
    onLoadedData?.(event);
  };

  return (
    <audio
      ref={audioRef}
      src={src}
      muted={muted}
      {...props}
      onLoadedData={handleLoadedData}
    />
  );
};

// Image Component
interface ImgProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
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
  }, [src, shown, delayRender, continueRender, cancelRender]);

  if (!shown) {
    return null;
  }

  return (
    <img
      src={src}
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

// Rect Component
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
  style?: React.CSSProperties;
}

export const Rect: React.FC<RectProps> = ({
  width,
  height,
  x = 0,
  y = 0,
  rx = 0,
  ry = 0,
  fill = 'black',
  stroke,
  strokeWidth,
  style,
}) => {
  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      rx={rx}
      ry={ry}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={style}
    />
  );
};

// Circle Component
interface CircleProps {
  r: number;
  cx?: number;
  cy?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
}

export const Circle: React.FC<CircleProps> = ({
  r,
  cx = 0,
  cy = 0,
  fill = 'black',
  stroke,
  strokeWidth,
  style,
}) => {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      style={style}
    />
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
