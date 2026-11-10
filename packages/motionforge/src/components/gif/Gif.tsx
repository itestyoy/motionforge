'use client';

import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useCurrentFrame, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import { CROP_AND_EFFECT_PROPS, SEQUENCE_PROPS, checkSrc, rejectProps, resolveSrc, serializeRequestInit } from '../../utils/fetch-asset';
import { calculateImageFit, checkImageProps, mediaTimeInSeconds, type ImageFit } from '../../utils/image-fit';
import { getGifFrameIndex, loadGif, type GifLoopBehavior, type LoadedGif } from './parse-gif';

export type { GifLoopBehavior };
export type GifFillMode = ImageFit;

export interface GifProps {
  /** URL of the GIF; a remote one must allow CORS. */
  src: string;
  /** Canvas width in px (default: the GIF's width). */
  width?: number;
  /** Canvas height in px (default: the GIF's height). */
  height?: number;
  /** Called once the GIF is decoded, with its size, frame delays (ms) and full-size frames. */
  onLoad?: (info: { width: number; height: number; delays: number[]; frames: ImageData[] }) => void;
  /** Called with a load or decode error instead of failing the render. */
  onError?: (error: Error) => void;
  /** 'fill' (default, stretched), 'contain' or 'cover'. */
  fit?: GifFillMode;
  /** Speed of the animation (default 1). */
  playbackRate?: number;
  style?: React.CSSProperties;
  /** 'loop' (default), 'pause-after-finish' (last frame) or 'unmount-after-finish' (renders nothing). */
  loopBehavior?: GifLoopBehavior;
  id?: string;
  /** Passed to fetch() (credentials, headers). */
  requestInit?: RequestInit;
}

const LOOP_BEHAVIORS: readonly GifLoopBehavior[] = ['loop', 'pause-after-finish', 'unmount-after-finish'];

const UNSUPPORTED: Record<string, string> = {
  ...SEQUENCE_PROPS,
  ...CROP_AND_EFFECT_PROPS,
  delayRenderTimeoutInMilliseconds: 'the host sets the timeout with gate.waitUntilReady({ timeoutMs })',
};

/**
 * Remotion's `<Gif>` (`@remotion/gif`): a GIF drawn on a `<canvas>` at the
 * frame's time (`frame / fps × playbackRate`), frame-exact by the delays in
 * the file. It decodes in JavaScript (omggif), so it works in every browser
 * and gives the same pixels everywhere. Holds the render gate until the GIF is
 * decoded and the frame drawn; an error goes to `onError`, or else to
 * `cancelRender()`.
 */
export const Gif = forwardRef<HTMLCanvasElement, GifProps>((props, ref) => {
  rejectProps('<Gif>', props, UNSUPPORTED);
  const {
    src,
    width,
    height,
    onLoad,
    onError,
    fit = 'fill',
    playbackRate = 1,
    style,
    loopBehavior = 'loop',
    id,
    requestInit,
  } = props;
  checkSrc('<Gif>', src);
  checkImageProps('<Gif>', { fit, width, height, playbackRate });
  if (!LOOP_BEHAVIORS.includes(loopBehavior)) {
    throw new Error(
      `<Gif>: loopBehavior must be 'loop', 'pause-after-finish' or 'unmount-after-finish', got ${JSON.stringify(loopBehavior)}`,
    );
  }

  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement, []);

  const requestInitRef = useRef(requestInit);
  requestInitRef.current = requestInit;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
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

  const key = `${resolveSrc(src)} ${serializeRequestInit(requestInit)}`;
  const [loaded, setLoaded] = useState<{ key: string; gif: LoadedGif; frames: ImageData[]; handle: number } | null>(
    null,
  );
  const current = loaded !== null && loaded.key === key ? loaded : null;

  useEffect(() => {
    const handle = delayRender(`<Gif> loading ${src}`);
    let active = true;
    loadGif(src, requestInitRef.current)
      .then((gif) => {
        if (!active) return;
        const frames = gif.getFrames();
        onLoadRef.current?.({ width: gif.width, height: gif.height, delays: gif.delays, frames });
        setLoaded({ key, gif, frames, handle });
      })
      .catch((error) => {
        if (!active) return;
        fail(error);
        continueRender(handle);
      });
    return () => {
      active = false;
      continueRender(handle);
    };
    // `key` covers src and requestInit.
  }, [key, delayRender, continueRender, fail]);

  const index = current
    ? getGifFrameIndex(current.gif.delays, mediaTimeInSeconds(frame, fps, playbackRate) * 1000, loopBehavior)
    : 0;

  // Drawn synchronously after the commit; the load hold ends with the first frame drawn.
  const [scratch] = useState(() => (typeof document === 'undefined' ? null : document.createElement('canvas')));
  useEffect(() => {
    if (!current || index === -1) {
      if (current) continueRender(current.handle);
      return;
    }
    try {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      const scratchContext = scratch?.getContext('2d');
      if (!canvas || !context || !scratch || !scratchContext) {
        throw new Error('<Gif> could not get a 2D context for its canvas');
      }
      const { gif } = current;
      const canvasWidth = width ?? gif.width;
      const canvasHeight = height ?? gif.height;
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
      if (scratch.width !== gif.width) scratch.width = gif.width;
      if (scratch.height !== gif.height) scratch.height = gif.height;
      scratchContext.putImageData(current.frames[index], 0, 0);
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(
        scratch,
        ...calculateImageFit(fit, { width: gif.width, height: gif.height }, { width: canvasWidth, height: canvasHeight }),
      );
    } catch (error) {
      fail(error);
    }
    continueRender(current.handle);
  }, [current, index, fit, width, height, scratch, continueRender, fail]);

  if (index === -1) return null;

  return (
    <canvas
      ref={canvasRef}
      id={id}
      style={style}
      width={width ?? current?.gif.width}
      height={height ?? current?.gif.height}
    />
  );
});

Gif.displayName = 'Gif';
