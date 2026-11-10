'use client';

import { useEffect, useRef, useState } from 'react';
import { useDelayRender } from '../core/delay-render';
import { checkSrc } from '../utils/fetch-asset';
import { getAudioData } from './get-audio-data';
import type { MediaUtilsAudioData } from './types';

export type UseAudioDataOptions = {
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
export const useAudioData = (src: string, options?: UseAudioDataOptions): MediaUtilsAudioData | null => {
  checkSrc('useAudioData()', src);
  const sampleRate = options?.sampleRate;
  const [requestInit] = useState(options?.requestInit);
  const key = JSON.stringify([src, sampleRate ?? null]);
  const [result, setResult] = useState<{ key: string; data: MediaUtilsAudioData } | null>(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const handle = useRef<number | null>(null);

  useEffect(() => {
    const current = delayRender(`useAudioData() loading ${src}`);
    handle.current = current;
    let active = true;
    Promise.resolve()
      .then(() => getAudioData(src, { sampleRate, requestInit }))
      .then(
        (data) => {
          if (active) setResult({ key, data });
        },
        (error) => {
          if (!active) return;
          cancelRender(error);
          continueRender(current);
        },
      );
    return () => {
      active = false;
      handle.current = null;
      continueRender(current);
    };
  }, [key, src, sampleRate, requestInit, delayRender, continueRender, cancelRender]);

  // Released once the component has rendered with the data.
  useEffect(() => {
    if (result?.key === key && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [result, key, continueRender]);

  return result?.key === key ? result.data : null;
};
