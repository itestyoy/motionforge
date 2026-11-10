import { checkSrc } from '../utils/fetch-asset';
import { createCache, isRemoteAsset, mediaError, requireBrowser } from './shared';
import type { VideoMetadata } from './types';

const cached = createCache<VideoMetadata>();

/**
 * Remotion's `getVideoMetadata()` (`@remotion/media-utils`): duration, size,
 * aspect ratio of a video, read by an invisible `<video>` element. Browser only.
 */
export const getVideoMetadata = (src: string): Promise<VideoMetadata> => {
  checkSrc('getVideoMetadata()', src);
  return cached(src, () => {
    requireBrowser('getVideoMetadata()', 'a <video> element');
    const video = document.createElement('video');
    video.preload = 'metadata';
    return new Promise<VideoMetadata>((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
        video.removeAttribute('src');
        video.load();
      };
      const onError = () => {
        const error = mediaError('getVideoMetadata()', src, video.error);
        cleanup();
        reject(error);
      };
      const onLoadedMetadata = () => {
        const { videoWidth: width, videoHeight: height, duration } = video;
        cleanup();
        if (width * height === 0) {
          reject(new Error(`getVideoMetadata(): ${src} has no video picture (width or height is 0)`));
        } else if (!Number.isFinite(duration)) {
          reject(new Error(`getVideoMetadata(): the duration of ${src} is ${duration}; re-encoding the video may fix it`));
        } else {
          resolve({ durationInSeconds: duration, width, height, aspectRatio: width / height, isRemote: isRemoteAsset(src) });
        }
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true });
      video.addEventListener('error', onError, { once: true });
      video.src = src;
    });
  });
};
