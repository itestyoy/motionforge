'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDelayRender } from '../core/delay-render';
import { checkSrc } from '../utils/fetch-asset';
import { getAudioData } from './get-audio-data';
import type { MediaUtilsAudioData } from './types';

export type UseWindowedAudioDataOptions = {
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

export type UseWindowedAudioDataReturnValue = {
  /** One channel: the window at the frame and its neighbours; null before loading and after the end. */
  audioData: MediaUtilsAudioData | null;
  /** Start of `audioData` in the file, in seconds: pass it to visualizeAudio() / visualizeAudioWaveform(). */
  dataOffsetInSeconds: number;
};

const checkPositive = (name: string, value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`useWindowedAudioData(): ${name} must be a positive number, got ${JSON.stringify(value)}`);
  }
};

/**
 * Remotion's `useWindowedAudioData()`: the samples of one channel around the
 * frame, the window `frame` is in (windows of `windowInSeconds`) and the
 * windows before and after it, with `dataOffsetInSeconds` where they start.
 * The file is fetched and decoded once with getAudioData() (48 kHz) and the
 * windows are cut from it. Holds the render gate while loading.
 */
export const useWindowedAudioData = ({
  src,
  frame,
  fps,
  windowInSeconds,
  channelIndex = 0,
  requestInit,
}: UseWindowedAudioDataOptions): UseWindowedAudioDataReturnValue => {
  checkSrc('useWindowedAudioData()', src);
  checkPositive('fps', fps);
  checkPositive('windowInSeconds', windowInSeconds);
  if (typeof frame !== 'number' || !Number.isFinite(frame)) {
    throw new TypeError(`useWindowedAudioData(): frame must be a finite number, got ${JSON.stringify(frame)}`);
  }
  if (!Number.isInteger(channelIndex) || channelIndex < 0) {
    throw new TypeError(`useWindowedAudioData(): channelIndex must be a non-negative integer, got ${JSON.stringify(channelIndex)}`);
  }

  const [initialRequestInit] = useState(requestInit);
  const [loaded, setLoaded] = useState<{ src: string; data: MediaUtilsAudioData } | null>(null);
  const full = loaded?.src === src ? loaded.data : null;
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const handle = useRef<number | null>(null);

  useEffect(() => {
    const current = delayRender(`useWindowedAudioData() loading ${src}`);
    handle.current = current;
    let active = true;
    Promise.resolve()
      .then(() => getAudioData(src, { requestInit: initialRequestInit }))
      .then(
        (data) => {
          if (active) setLoaded({ src, data });
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
  }, [src, initialRequestInit, delayRender, continueRender, cancelRender]);

  useEffect(() => {
    if (full && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [full, continueRender]);

  if (full && channelIndex >= full.numberOfChannels) {
    throw new Error(
      `useWindowedAudioData(): channelIndex ${channelIndex} does not exist; ${src} has ${full.numberOfChannels} channel(s)`,
    );
  }

  const currentTime = frame / fps;
  const currentWindowIndex = Math.floor(currentTime / windowInSeconds);
  const windows = useMemo(() => {
    if (!full) return [];
    // A duration that is a multiple of the window must not add an empty window.
    const maxWindowIndex = Math.floor(full.durationInSeconds / windowInSeconds - 0.000000000001);
    return [currentWindowIndex - 1, currentWindowIndex, currentWindowIndex + 1].filter(
      (i) => i >= 0 && i <= maxWindowIndex,
    );
  }, [full, currentWindowIndex, windowInSeconds]);

  const audioData = useMemo((): MediaUtilsAudioData | null => {
    if (!full || windows.length === 0) return null;
    const waveform = full.channelWaveforms[channelIndex];
    const start = Math.floor(windows[0] * windowInSeconds * full.sampleRate);
    const end = Math.min(waveform.length, Math.ceil((windows[windows.length - 1] + 1) * windowInSeconds * full.sampleRate));
    return {
      channelWaveforms: [waveform.subarray(start, end)],
      sampleRate: full.sampleRate,
      durationInSeconds: full.durationInSeconds,
      numberOfChannels: 1,
      resultId: `${full.resultId}-channel-${channelIndex}-windows-${windowInSeconds}-${windows.join(',')}`,
      isRemote: full.isRemote,
    };
  }, [full, windows, channelIndex, windowInSeconds]);

  const isBeyondAudioDuration = full ? currentTime >= full.durationInSeconds : false;
  return {
    audioData: isBeyondAudioDuration ? null : audioData,
    dataOffsetInSeconds: windows.length > 0 ? windows[0] * windowInSeconds : 0,
  };
};
