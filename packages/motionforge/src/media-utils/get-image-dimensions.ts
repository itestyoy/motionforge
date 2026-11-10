import { checkSrc } from '../utils/fetch-asset';
import { createCache, requireBrowser } from './shared';
import type { ImageDimensions } from './types';

const cached = createCache<ImageDimensions>();

/**
 * Remotion's `getImageDimensions()` (`@remotion/media-utils`): the natural
 * width and height of an image. Browser only.
 */
export const getImageDimensions = (src: string): Promise<ImageDimensions> => {
  checkSrc('getImageDimensions()', src);
  return cached(src, () => {
    requireBrowser('getImageDimensions()', 'an Image element');
    return new Promise<ImageDimensions>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`getImageDimensions() could not load ${src}`));
      image.src = src;
    });
  });
};
