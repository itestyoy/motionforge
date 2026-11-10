'use client';

import { useEffect, useRef, useState } from 'react';
import { useDelayRender } from './delay-render';

/**
 * Asset preloading. The functions warm the browser cache and resolve when the
 * asset can be shown; they reject with an error naming the asset when it
 * cannot be loaded. They need a browser DOM and throw without one.
 */

const requireDom = (fn: string) => {
  if (typeof document === 'undefined') {
    throw new Error(`${fn} needs a browser DOM (document is not defined)`);
  }
};

const checkSrc = (fn: string, src: unknown) => {
  if (typeof src !== 'string' || src === '') {
    throw new Error(`${fn}: src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
};

/** Resolves with the image once it is loaded and decoded. */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  checkSrc('preloadImage', src);
  requireDom('preloadImage');
  const image = new Image();
  image.src = src;
  return image.decode().then(
    () => image,
    () => {
      throw new Error(`preloadImage: could not load or decode ${src}`);
    },
  );
};

// Media is ready once its first frame (video) or first samples (audio) are
// loaded: `loadeddata`.
const preloadMedia = <T extends HTMLMediaElement>(fn: string, element: T, src: string): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const cleanup = () => {
      element.removeEventListener('loadeddata', onLoaded);
      element.removeEventListener('error', onError);
    };
    const onLoaded = () => {
      cleanup();
      resolve(element);
    };
    const onError = () => {
      cleanup();
      const detail = element.error ? `: ${element.error.message || `media error code ${element.error.code}`}` : '';
      reject(new Error(`${fn}: could not load ${src}${detail}`));
    };
    element.addEventListener('loadeddata', onLoaded);
    element.addEventListener('error', onError);
    element.preload = 'auto';
    element.src = src;
    element.load();
  });
};

/** Resolves with the video element once its first frame is loaded. */
export const preloadVideo = (src: string): Promise<HTMLVideoElement> => {
  checkSrc('preloadVideo', src);
  requireDom('preloadVideo');
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  return preloadMedia('preloadVideo', video, src);
};

/** Resolves with the audio element once its first samples are loaded. */
export const preloadAudio = (src: string): Promise<HTMLAudioElement> => {
  checkSrc('preloadAudio', src);
  requireDom('preloadAudio');
  return preloadMedia('preloadAudio', document.createElement('audio'), src);
};

export interface PreloadFontOptions {
  /** CSS font-weight, e.g. 400 or 'bold' (default 400). */
  weight?: string | number;
  /** CSS font-style, e.g. 'italic' (default 'normal'). */
  style?: string;
  /**
   * URL of the font file. When given, the face is created and added to
   * document.fonts; without it the family must be declared in CSS (@font-face).
   */
  source?: string;
}

/**
 * Loads a font face with the CSS Font Loading API. Rejects when the face
 * cannot be loaded or no declared face matches the family, weight and style.
 */
export const preloadFont = (family: string, options: PreloadFontOptions = {}): Promise<void> => {
  if (typeof family !== 'string' || family.trim() === '') {
    throw new Error(`preloadFont: family must be a non-empty string, got ${JSON.stringify(family)}`);
  }
  requireDom('preloadFont');
  if (!document.fonts) {
    throw new Error('preloadFont needs the CSS Font Loading API (document.fonts)');
  }
  const weight = String(options.weight ?? 400);
  const style = options.style ?? 'normal';
  const describe = `${family} ${weight} ${style}`;

  if (options.source !== undefined) {
    checkSrc('preloadFont', options.source);
    const face = new FontFace(family, `url(${JSON.stringify(options.source)})`, { weight, style });
    return face.load().then(
      (loaded) => {
        document.fonts.add(loaded);
      },
      () => {
        throw new Error(`preloadFont: could not load ${describe} from ${options.source}`);
      },
    );
  }

  return document.fonts.load(`${style} ${weight} 16px ${JSON.stringify(family)}`).then(
    (faces) => {
      if (faces.length === 0) {
        throw new Error(`preloadFont: no font face matches ${describe}; declare it with @font-face or pass source`);
      }
    },
    () => {
      throw new Error(`preloadFont: could not load ${describe}`);
    },
  );
};

export type PreloadAsset =
  | { type: 'image' | 'video' | 'audio'; src: string }
  | ({ type: 'font'; family: string } & PreloadFontOptions);

const preloadAsset = (asset: PreloadAsset): Promise<unknown> => {
  switch (asset.type) {
    case 'image':
      return preloadImage(asset.src);
    case 'video':
      return preloadVideo(asset.src);
    case 'audio':
      return preloadAudio(asset.src);
    case 'font': {
      const { family, ...options } = asset;
      return preloadFont(family, options);
    }
  }
};

const ASSET_TYPES = ['image', 'video', 'audio', 'font'];

const checkAssets = (assets: readonly PreloadAsset[]) => {
  if (!Array.isArray(assets)) {
    throw new Error('usePreloadAssets: assets must be an array');
  }
  assets.forEach((asset, i) => {
    if (typeof asset !== 'object' || asset === null || !ASSET_TYPES.includes(asset.type)) {
      throw new Error(
        `usePreloadAssets: assets[${i}] must be { type: 'image' | 'video' | 'audio' | 'font', ... }, got ${JSON.stringify(asset)}`,
      );
    }
  });
};

/**
 * Holds the frame (delayRender) until all `assets` are loaded and returns
 * whether they are. A failure goes to cancelRender(). The list is compared
 * by value, so an inline array does not restart the loading.
 *
 *   const ready = usePreloadAssets([
 *     { type: 'image', src: '/hero.png' },
 *     { type: 'font', family: 'Inter', weight: 700 },
 *   ]);
 */
export const usePreloadAssets = (assets: readonly PreloadAsset[]): boolean => {
  checkAssets(assets);
  const key = JSON.stringify(assets);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const handle = useRef<number | null>(null);

  useEffect(() => {
    const list = JSON.parse(key) as PreloadAsset[];
    const current = delayRender(`usePreloadAssets ${list.map((a) => (a.type === 'font' ? a.family : a.src)).join(', ')}`);
    handle.current = current;
    let active = true;
    // Started inside the promise chain so that a synchronous throw (no DOM, a
    // bad src) is reported like a load error.
    Promise.resolve()
      .then(() => Promise.all(list.map(preloadAsset)))
      .then(
        () => {
          if (active) setLoadedKey(key);
        },
        (error) => {
          if (!active) return;
          cancelRender(error);
          continueRender(current);
        },
      );
    return () => {
      active = false;
      continueRender(current);
      handle.current = null;
    };
  }, [key, delayRender, continueRender, cancelRender]);

  // Released once the component has rendered with the assets loaded, so the
  // host never captures the frame from before.
  useEffect(() => {
    if (loadedKey === key && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [loadedKey, key, continueRender]);

  return loadedKey === key;
};
