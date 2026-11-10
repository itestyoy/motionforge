import { checkSrc, fetchAsset, serializeRequestInit } from '../utils/fetch-asset';
import { createCache, isRemoteAsset, requireBrowser } from './shared';
import type { MediaUtilsAudioData } from './types';

const cached = createCache<MediaUtilsAudioData>();

export type GetAudioDataOptions = {
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
export const getAudioData = (src: string, options?: GetAudioDataOptions): Promise<MediaUtilsAudioData> => {
  checkSrc('getAudioData()', src);
  const sampleRate = options?.sampleRate ?? 48000;
  if (typeof sampleRate !== 'number' || !Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new TypeError(`getAudioData(): sampleRate must be a positive integer, got ${JSON.stringify(sampleRate)}`);
  }
  const resultId = JSON.stringify([src, sampleRate, serializeRequestInit(options?.requestInit)]);
  return cached(resultId, async () => {
    requireBrowser('getAudioData()', 'the Web Audio API');
    if (typeof AudioContext === 'undefined') {
      throw new Error('getAudioData() needs the Web Audio API (AudioContext), which this environment does not have');
    }
    const response = await fetchAsset('getAudioData()', src, options?.requestInit);
    const encoded = await response.arrayBuffer();
    const context = new AudioContext({ sampleRate });
    let wave: AudioBuffer;
    try {
      wave = await context.decodeAudioData(encoded);
    } catch (error) {
      throw new Error(`getAudioData() could not decode ${src}: ${error instanceof Error ? error.message : error}`);
    } finally {
      context.close().catch(() => {});
    }
    return {
      channelWaveforms: Array.from({ length: wave.numberOfChannels }, (_, channel) => wave.getChannelData(channel)),
      sampleRate: wave.sampleRate,
      durationInSeconds: wave.duration,
      numberOfChannels: wave.numberOfChannels,
      resultId,
      isRemote: isRemoteAsset(src),
    };
  });
};
