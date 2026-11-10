import { checkSrc } from '../utils/fetch-asset';
import { createCache, mediaError, requireBrowser } from './shared';

const cached = createCache<number>();

/**
 * Remotion's `getAudioDurationInSeconds()` (`@remotion/media-utils`): the
 * duration of an audio (or video) file, read by an invisible `<audio>`
 * element. Browser only.
 */
export const getAudioDurationInSeconds = (src: string): Promise<number> => {
  checkSrc('getAudioDurationInSeconds()', src);
  return cached(src, () => {
    requireBrowser('getAudioDurationInSeconds()', 'an <audio> element');
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    return new Promise<number>((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
        audio.removeAttribute('src');
        audio.load();
      };
      const onError = () => {
        const error = mediaError('getAudioDurationInSeconds()', src, audio.error);
        cleanup();
        reject(error);
      };
      const onLoadedMetadata = () => {
        const { duration } = audio;
        cleanup();
        if (Number.isFinite(duration)) resolve(duration);
        else reject(new Error(`getAudioDurationInSeconds(): the duration of ${src} is ${duration}; re-encoding the file may fix it`));
      };
      audio.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      audio.addEventListener('error', onError, { once: true });
      audio.src = src;
    });
  });
};
