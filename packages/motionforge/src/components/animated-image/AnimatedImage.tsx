'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useCurrentFrame, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import {
  CROP_AND_EFFECT_PROPS,
  SEQUENCE_PROPS,
  checkSrc,
  rejectProps,
  resolveSrc,
  serializeRequestInit,
} from '../../utils/fetch-asset';
import { calculateImageFit, checkImageProps, mediaTimeInSeconds, type ImageFit } from '../../utils/image-fit';
import {
  getAnimatedImageFrameIndex,
  openAnimatedImage,
  type AnimatedImageLoopBehavior,
  type AnimatedImageTrack,
} from './decoder';

export type { AnimatedImageLoopBehavior };
export type AnimatedImageFillMode = ImageFit;

export interface AnimatedImageProps
  extends Omit<React.CanvasHTMLAttributes<HTMLCanvasElement>, 'width' | 'height' | 'onError' | 'onLoad'> {
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
  style?: React.CSSProperties;
  /** 'loop' (default), 'pause-after-finish' (last frame) or 'clear-after-finish' (empty canvas). */
  loopBehavior?: AnimatedImageLoopBehavior;
  id?: string;
  className?: string;
  /** Passed to fetch() (credentials, headers). */
  requestInit?: RequestInit;
}

const LOOP_BEHAVIORS: readonly AnimatedImageLoopBehavior[] = ['loop', 'pause-after-finish', 'clear-after-finish'];

/**
 * Remotion's `<AnimatedImage>`: an animated GIF, APNG, AVIF or WebP drawn on
 * a `<canvas>` at the frame's time (`frame / fps × playbackRate`). It decodes
 * with the WebCodecs `ImageDecoder` (Chromium, Firefox; not Safari) and holds
 * the render gate while the image loads and until each frame is drawn. A load
 * or decode error goes to `onError`, or else to `cancelRender()`.
 */
export const AnimatedImage = forwardRef<HTMLCanvasElement, AnimatedImageProps>((props, ref) => {
  rejectProps('<AnimatedImage>', props, { ...SEQUENCE_PROPS, ...CROP_AND_EFFECT_PROPS });
  const {
    src,
    width,
    height,
    onError,
    fit = 'fill',
    playbackRate = 1,
    loopBehavior = 'loop',
    requestInit,
    ...canvasProps
  } = props;
  checkSrc('<AnimatedImage>', src);
  checkImageProps('<AnimatedImage>', { fit, width, height, playbackRate });
  if (!LOOP_BEHAVIORS.includes(loopBehavior)) {
    throw new Error(
      `<AnimatedImage>: loopBehavior must be 'loop', 'pause-after-finish' or 'clear-after-finish', got ${JSON.stringify(loopBehavior)}`,
    );
  }

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = mediaTimeInSeconds(frame, fps, playbackRate);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement, []);

  const requestInitRef = useRef(requestInit);
  requestInitRef.current = requestInit;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const fail = useCallback(
    (error: unknown) => {
      const asError = error instanceof Error ? error : new Error(String(error));
      if (onErrorRef.current) onErrorRef.current(asError);
      else cancelRender(asError);
    },
    [cancelRender],
  );

  const resolvedSrc = resolveSrc(src);
  const key = `${resolvedSrc} ${serializeRequestInit(requestInit)}`;
  const [loaded, setLoaded] = useState<{ key: string; track: AnimatedImageTrack; handle: number } | null>(null);
  const current = loaded !== null && loaded.key === key ? loaded : null;

  useEffect(() => {
    const handle = delayRender(`<AnimatedImage> loading ${src}`);
    const controller = new AbortController();
    let active = true;
    let track: AnimatedImageTrack | null = null;
    openAnimatedImage(resolvedSrc, requestInitRef.current, controller.signal).then(
      (opened) => {
        if (!active) {
          opened.close();
          return;
        }
        track = opened;
        setLoaded({ key, track: opened, handle });
      },
      (error) => {
        if (!active) return;
        fail(error);
        continueRender(handle);
      },
    );
    return () => {
      active = false;
      controller.abort();
      track?.close();
      continueRender(handle);
    };
    // `key` covers src and requestInit.
  }, [key, delayRender, continueRender, fail]);

  useEffect(() => {
    if (!current) return;
    const handle = delayRender(`<AnimatedImage> ${src} at ${time}s`);
    // The load is done once this frame's hold has taken over.
    continueRender(current.handle);
    let active = true;
    const canvas = canvasRef.current;
    const index = getAnimatedImageFrameIndex(current.track, time, loopBehavior);
    if (index === null || !canvas) {
      canvas?.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
      continueRender(handle);
      return;
    }
    current.track.decode(index).then(
      (image) => {
        try {
          if (!active) return;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('<AnimatedImage> could not get a 2D context for its canvas');
          const canvasWidth = width ?? image.displayWidth;
          const canvasHeight = height ?? image.displayHeight;
          if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
          if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
          context.clearRect(0, 0, canvasWidth, canvasHeight);
          context.drawImage(
            image,
            ...calculateImageFit(
              fit,
              { width: image.displayWidth, height: image.displayHeight },
              { width: canvasWidth, height: canvasHeight },
            ),
          );
          continueRender(handle);
        } catch (error) {
          fail(error);
          continueRender(handle);
        } finally {
          image.close();
        }
      },
      (error) => {
        if (!active) return;
        fail(new Error(`<AnimatedImage> could not decode frame ${index} of ${src}: ${error instanceof Error ? error.message : error}`));
        continueRender(handle);
      },
    );
    return () => {
      active = false;
      continueRender(handle);
    };
  }, [current, time, loopBehavior, fit, width, height, src, delayRender, continueRender, fail]);

  return <canvas ref={canvasRef} width={width} height={height} {...canvasProps} />;
});

AnimatedImage.displayName = 'AnimatedImage';
