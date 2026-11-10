'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import { useCurrentFrame, useVideoConfig } from '../core/context';
import { useDelayRender } from '../core/delay-render';

/** Lottie JSON, as in @remotion/lottie: frame rate `fr`, size `w` × `h`, out point `op`. */
export type LottieAnimationData = {
  fr: number;
  w: number;
  h: number;
  op: number;
} & Record<string | number | symbol, unknown>;

type AspectRatioConstraint =
  | 'none'
  | 'xMinYMin'
  | 'xMidYMin'
  | 'xMaxYMin'
  | 'xMinYMid'
  | 'xMidYMid'
  | 'xMaxYMid'
  | 'xMinYMax'
  | 'xMidYMax'
  | 'xMaxYMax';

export interface LottieProps {
  /**
   * The animation JSON as an object (import it, or fetch it and pass the
   * result). It is compared by content: a new object with the same JSON does
   * not reload.
   */
  animationData: LottieAnimationData;
  /** 'forward' (default) or 'backward': plays the frames from the end. */
  direction?: 'forward' | 'backward';
  /** Repeat the animation (default false: it holds its last frame). */
  loop?: boolean;
  /** Speed (> 0, default 1). */
  playbackRate?: number;
  /** lottie-web renderer (default 'svg'). */
  renderer?: 'svg' | 'canvas' | 'html';
  /** For the svg and canvas renderers: SVG preserveAspectRatio, e.g. 'xMidYMid slice'. */
  preserveAspectRatio?: AspectRatioConstraint | `${AspectRatioConstraint} ${'slice' | 'meet'}`;
  /** Base path of the images the animation references. */
  assetsPath?: string;
  /** Called with the lottie-web AnimationItem each time new animation data is loaded. */
  onAnimationLoaded?: (animation: AnimationItem) => void;
  /** The Lottie frame (on the animation's own timeline) to start from (default 0). */
  frameStart?: number;
  /** The Lottie frame to stop at (default: the last frame of the animation). */
  frameEnd?: number;
  /** Width of the container (default 100%). */
  width?: number | string;
  /** Height of the container (default 100%). */
  height?: number | string;
  /** Style of the container. */
  style?: React.CSSProperties;
  /** CSS class of the container. */
  className?: string;
}

// The JSON of animation data, computed once per object.
const jsonOfData = new WeakMap<object, string>();
const jsonOf = (data: object): string => {
  let json = jsonOfData.get(data);
  if (json === undefined) {
    json = JSON.stringify(data);
    jsonOfData.set(data, json);
  }
  return json;
};

const checkAnimationData = (component: string, animationData: unknown) => {
  if (typeof animationData !== 'object' || animationData === null || Array.isArray(animationData)) {
    throw new Error(
      `${component}: animationData must be the animation JSON as an object, got ${JSON.stringify(animationData)}. ` +
        'If you have the URL of the JSON file, fetch it and pass the result as animationData.',
    );
  }
};

/**
 * Basic metadata of a Lottie animation (as in @remotion/lottie): its frame
 * rate, duration and size, or null when the data lacks one of them.
 */
export const getLottieMetadata = (
  animationData: LottieAnimationData,
): { fps: number; durationInSeconds: number; durationInFrames: number; width: number; height: number } | null => {
  checkAnimationData('getLottieMetadata', animationData);
  const { w: width, h: height, fr: fps, op } = animationData;
  if (![width, height, fps, op].every((value) => typeof value === 'number' && Number.isFinite(value) && value > 0)) {
    return null;
  }
  return { durationInFrames: Math.floor(op), durationInSeconds: op / fps, fps, height, width };
};

const RENDERERS = ['svg', 'canvas', 'html'];

/**
 * Lottie animation synced to the frame, with the props of @remotion/lottie.
 *
 * Composition frame `f` shows the Lottie at time f / fps (times
 * `playbackRate`), whatever the Lottie's own frame rate. It holds the render
 * gate (delayRender) until the data is loaded and the frame is set. If the
 * animation cannot be loaded, the error goes to cancelRender() and the
 * component shows it.
 */
export const Lottie: React.FC<LottieProps> = ({
  animationData,
  direction = 'forward',
  loop = false,
  playbackRate = 1,
  renderer = 'svg',
  preserveAspectRatio,
  assetsPath,
  onAnimationLoaded,
  frameStart = 0,
  frameEnd,
  width,
  height,
  style,
  className,
}) => {
  checkAnimationData('Lottie', animationData);
  if (direction !== 'forward' && direction !== 'backward') {
    throw new Error(`Lottie: direction must be 'forward' or 'backward', got ${JSON.stringify(direction)}`);
  }
  if (typeof loop !== 'boolean') {
    throw new Error(`Lottie: loop must be a boolean, got ${JSON.stringify(loop)}`);
  }
  if (typeof playbackRate !== 'number' || !Number.isFinite(playbackRate) || playbackRate <= 0) {
    throw new Error(`Lottie: playbackRate must be a finite number above 0, got ${playbackRate}`);
  }
  if (!RENDERERS.includes(renderer)) {
    throw new Error(`Lottie: renderer must be one of ${RENDERERS.join(', ')}, got ${JSON.stringify(renderer)}`);
  }
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const dataKey = jsonOf(animationData);
  const onLoadedRef = useRef(onAnimationLoaded);
  onLoadedRef.current = onAnimationLoaded;
  // Held from loading until the frame is set on the loaded animation.
  const loadHandle = useRef<number | null>(null);

  // Inside a Sequence this is already the frame relative to the sequence start.
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Load the animation.
  useEffect(() => {
    // New data starts unloaded, without the previous data's error.
    setIsLoaded(false);
    setError(null);
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isCancelled = false;
    const handle = delayRender('<Lottie> animation data');
    loadHandle.current = handle;
    const release = () => {
      continueRender(handle);
      if (loadHandle.current === handle) loadHandle.current = null;
    };
    const fail = (message: string) => {
      setError(message);
      cancelRender(new Error(`<Lottie> ${message}`));
      release();
    };

    try {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer: renderer as 'svg',
        loop: false,
        autoplay: false,
        animationData: JSON.parse(dataKey),
        assetsPath,
        rendererSettings: {
          progressiveLoad: false,
          hideOnTransparent: true,
          ...(preserveAspectRatio !== undefined ? { preserveAspectRatio } : null),
        },
      });
      animationRef.current = anim;

      const onLoaded = () => {
        if (!isCancelled) setIsLoaded(true);
      };
      // Both events can be useful depending on how Lottie is loaded
      anim.addEventListener('DOMLoaded', onLoaded);
      anim.addEventListener('data_ready', onLoaded);
      anim.addEventListener('data_failed', () => {
        if (!isCancelled) fail('failed to load animation data');
      });
      onLoadedRef.current?.(anim);

      return () => {
        isCancelled = true;
        release();
        anim.destroy();
        animationRef.current = null;
      };
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
      return () => {};
    }
    // Keyed by the JSON of the data: a new object with the same data does not reload.
  }, [dataKey, renderer, preserveAspectRatio, assetsPath, delayRender, continueRender, cancelRender]);

  // Set the frame.
  useEffect(() => {
    if (!animationRef.current || !isLoaded) return;

    const anim = animationRef.current;
    const start = frameStart;
    const end = frameEnd ?? anim.totalFrames;
    const duration = end - start;

    if (duration <= 0) {
      cancelRender(
        new Error(`<Lottie> frameEnd (${end}) must be greater than frameStart (${start}); the animation has ${anim.totalFrames} frames`),
      );
      if (loadHandle.current !== null) {
        continueRender(loadHandle.current);
        loadHandle.current = null;
      }
      return;
    }

    // Map the composition frame to the Lottie timeline by time: the Lottie
    // has its own frame rate, and playbackRate speeds it up or slows it down.
    let targetFrame = (currentFrame / fps) * anim.frameRate * playbackRate;
    if (loop) {
      targetFrame = ((targetFrame % duration) + duration) % duration;
    } else {
      targetFrame = Math.max(0, Math.min(targetFrame, duration - 0.01));
    }
    // Backward plays the range from its end.
    const finalFrame = direction === 'backward' ? start + (duration - targetFrame) : start + targetFrame;

    // goToAndStop(value, isFrame): the second argument says it is a frame, not a time.
    anim.goToAndStop(finalFrame, true);

    // The first frame is drawn: the animation is ready.
    if (loadHandle.current !== null) {
      continueRender(loadHandle.current);
      loadHandle.current = null;
    }
  }, [currentFrame, fps, isLoaded, frameStart, frameEnd, playbackRate, loop, direction, continueRender, cancelRender]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    width: width ?? '100%',
    height: height ?? '100%',
    ...style,
  }), [width, height, style]);

  // lottie-web owns the inner container; it stays mounted while an error is
  // shown, so new data can load into it.
  return (
    <div style={containerStyle} className={className} data-lottie-loaded={isLoaded}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', display: error ? 'none' : undefined }}
      />
      {error && (
        <div role="alert" style={{ color: 'red', border: '1px solid red', padding: '10px' }}>
          <strong>Lottie Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
