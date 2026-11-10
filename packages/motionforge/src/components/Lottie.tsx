'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import lottie, { AnimationItem } from 'lottie-web';
import { useCurrentFrame, useVideoConfig } from '../core/context';
import { useDelayRender } from '../core/delay-render';

export interface LottieProps {
  /**
   * Source of the Lottie animation. Can be a URL to a JSON file or an imported JSON object.
   */
  src: string | object;
  /**
   * The Lottie frame (on the animation's own timeline) to start from.
   * Default is 0.
   */
  frameStart?: number;
  /**
   * The Lottie frame (on the animation's own timeline) to stop at.
   * Default is the last frame of the Lottie animation.
   */
  frameEnd?: number;
  /**
   * Playback rate of the Lottie animation.
   * Default is 1.
   */
  playbackRate?: number;
  /**
   * Whether the Lottie animation should loop.
   * Default is false.
   */
  loop?: boolean;
  /**
   * Width of the Lottie container.
   */
  width?: number | string;
  /**
   * Height of the Lottie container.
   */
  height?: number | string;
  /**
   * Style overrides for the Lottie container.
   */
  style?: React.CSSProperties;
  /**
   * CSS class name for the Lottie container.
   */
  className?: string;
}

/**
 * Lottie Component for MotionForge.
 *
 * Provides production-grade Lottie support with deterministic frame synchronization.
 * Synchronizes with the MotionForge frame system instead of using time-based playback:
 * composition frame `f` shows the Lottie at time f / fps (times `playbackRate`),
 * whatever the Lottie's own frame rate. It holds the render gate
 * (delayRender) until the data is loaded and the first frame is set. If the
 * animation data cannot be loaded, the error goes to cancelRender() and the
 * component shows it instead of rendering nothing.
 */
export const Lottie: React.FC<LottieProps> = ({
  src,
  frameStart = 0,
  frameEnd,
  playbackRate = 1,
  loop = false,
  width,
  height,
  style,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  // Held from loading until the frame is set on the loaded animation.
  const loadHandle = useRef<number | null>(null);

  // Inside a Sequence this is already the frame relative to the sequence start.
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Handle initialization
  useEffect(() => {
    // A new source starts unloaded, without the previous source's error.
    setIsLoaded(false);
    setError(null);
    if (typeof window === 'undefined' || !containerRef.current) return;

    let isCancelled = false;
    const handle = delayRender(`<Lottie> ${typeof src === 'string' ? src : 'animation data'}`);
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

    const params: any = {
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      rendererSettings: {
        progressiveLoad: false,
        hideOnTransparent: true,
      }
    };

    if (typeof src === 'string') {
      params.path = src;
    } else {
      params.animationData = src;
    }

    try {
      const anim = lottie.loadAnimation(params);
      animationRef.current = anim;

      const onLoaded = () => {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      };

      // Both events can be useful depending on how Lottie is loaded
      anim.addEventListener('DOMLoaded', onLoaded);
      anim.addEventListener('data_ready', onLoaded);
      anim.addEventListener('data_failed', () => {
        if (!isCancelled) {
          fail(
            typeof src === 'string'
              ? `failed to load animation data from ${src}`
              : 'failed to load animation data'
          );
        }
      });

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
  }, [src, delayRender, continueRender, cancelRender]);

  // Handle frame synchronization
  useEffect(() => {
    if (!animationRef.current || !isLoaded) return;

    const anim = animationRef.current;

    // totalFrames is available once loaded
    const totalLottieFrames = anim.totalFrames;

    // Determine the range of frames to play
    const start = frameStart;
    const end = frameEnd ?? totalLottieFrames;
    const duration = end - start;

    if (duration <= 0) {
      cancelRender(
        new Error(`<Lottie> frameEnd (${end}) must be greater than frameStart (${start}); the animation has ${totalLottieFrames} frames`),
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

    // finalFrame is relative to the Lottie's original timeline
    const finalFrame = start + targetFrame;

    // goToAndStop(value, isFrame) - second arg true means it's a frame number, not time
    anim.goToAndStop(finalFrame, true);

    // The first frame is drawn: the animation is ready.
    if (loadHandle.current !== null) {
      continueRender(loadHandle.current);
      loadHandle.current = null;
    }
  }, [currentFrame, fps, isLoaded, frameStart, frameEnd, playbackRate, loop, continueRender, cancelRender]);

  const containerStyle: React.CSSProperties = useMemo(() => ({
    width: width ?? '100%',
    height: height ?? '100%',
    ...style,
  }), [width, height, style]);

  // lottie-web owns the inner container; it stays mounted while an error is
  // shown, so a new `src` can load into it.
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
