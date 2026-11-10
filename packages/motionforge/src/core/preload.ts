'use client';

import { useEffect, useRef, useState } from 'react';
import { useDelayRender } from './delay-render';

/**
 * usePreloadAssets(): holds the frame until images, video, audio and fonts
 * are ready. The loaders need a browser DOM and fail with an error naming the
 * asset.
 */

const requireDom = () => {
  if (typeof document === 'undefined') {
    throw new Error('usePreloadAssets needs a browser DOM (document is not defined)');
  }
};

const checkSrc = (src: unknown, index: number) => {
  if (typeof src !== 'string' || src === '') {
    throw new Error(`usePreloadAssets: assets[${index}].src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
};

// Resolves once the image is loaded and decoded.
const loadImage = (src: string): Promise<void> => {
  const image = new Image();
  image.src = src;
  return image.decode().then(
    () => undefined,
    () => {
      throw new Error(`usePreloadAssets: could not load or decode ${src}`);
    },
  );
};

// Media is ready once its first frame (video) or first samples (audio) are
// loaded: `loadeddata`.
const loadMedia = (element: HTMLMediaElement, src: string): Promise<void> =>
  new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      element.removeEventListener('loadeddata', onLoaded);
      element.removeEventListener('error', onError);
    };
    const onLoaded = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      const detail = element.error ? `: ${element.error.message || `media error code ${element.error.code}`}` : '';
      reject(new Error(`usePreloadAssets: could not load ${src}${detail}`));
    };
    element.addEventListener('loadeddata', onLoaded);
    element.addEventListener('error', onError);
    element.preload = 'auto';
    element.src = src;
    element.load();
  });

const loadVideo = (src: string) => {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  return loadMedia(video, src);
};

const WEIGHTS: Record<string, number> = { normal: 400, bold: 700 };

const toWeight = (weight: string | number): number => {
  const value = typeof weight === 'number' ? weight : WEIGHTS[weight.trim().toLowerCase()] ?? Number(weight);
  if (!Number.isFinite(value)) throw new Error(`usePreloadAssets: font weight must be a number, 'normal' or 'bold', got ${JSON.stringify(weight)}`);
  return value;
};

// Whether a face's weight descriptor ('400', 'bold', or a range '100 900') covers `weight`.
const coversWeight = (descriptor: string, weight: number) => {
  const [low, high = low] = descriptor.trim().split(/\s+/).map(toWeight);
  return weight >= low && weight <= high;
};

const unquote = (family: string) => family.trim().replace(/^(['"])(.*)\1$/, '$2').toLowerCase();

/**
 * Loads every declared face of `family` (all weights and styles, unless
 * `weight` / `style` narrow it down). A family from Google Fonts or
 * @fontsource is split by unicode-range into several faces (latin, cyrillic,
 * greek, ...); document.fonts.load('900 16px Family') would load only the
 * subset of its sample text (latin), so other scripts could still be missing
 * when the frame is captured. Loading every face loads every subset.
 */
const loadFontFaces = (family: string, weight: string | number | undefined, style: string | undefined): Promise<void> => {
  if (!document.fonts || typeof document.fonts.forEach !== 'function') {
    throw new Error('usePreloadAssets: fonts need the CSS Font Loading API (document.fonts)');
  }
  const wanted = unquote(family);
  const wantedWeight = weight === undefined ? undefined : toWeight(weight);
  const wantedStyle = style?.trim().toLowerCase();
  const faces: FontFace[] = [];
  document.fonts.forEach((face) => {
    if (unquote(face.family) !== wanted) return;
    if (wantedWeight !== undefined && !coversWeight(face.weight, wantedWeight)) return;
    if (wantedStyle !== undefined && face.style.trim().toLowerCase().split(/\s+/)[0] !== wantedStyle) return;
    faces.push(face);
  });
  const describe = [family, weight, style].filter((part) => part !== undefined).join(' ');
  if (faces.length === 0) {
    return Promise.reject(
      new Error(`usePreloadAssets: no font face matches ${describe}; declare it with @font-face or load it with loadFont()`),
    );
  }
  return Promise.all(faces.map((face) => face.load())).then(
    () => undefined,
    () => {
      throw new Error(`usePreloadAssets: could not load the font ${describe}`);
    },
  );
};

export type PreloadAsset =
  | { type: 'image' | 'video' | 'audio'; src: string }
  | {
      type: 'font';
      /** A family declared with @font-face (a stylesheet, e.g. Google Fonts) or loaded with loadFont(). */
      family: string;
      /** Only the faces covering this weight (default: all). */
      weight?: string | number;
      /** Only the faces of this style, e.g. 'italic' (default: all). */
      style?: string;
    };

const loadAsset = (asset: PreloadAsset): Promise<void> => {
  requireDom();
  switch (asset.type) {
    case 'image':
      return loadImage(asset.src);
    case 'video':
      return loadVideo(asset.src);
    case 'audio':
      return loadMedia(document.createElement('audio'), asset.src);
    case 'font':
      return loadFontFaces(asset.family, asset.weight, asset.style);
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
    if (asset.type === 'font') {
      if (typeof asset.family !== 'string' || asset.family.trim() === '') {
        throw new Error(`usePreloadAssets: assets[${i}].family must be a non-empty string, got ${JSON.stringify(asset.family)}`);
      }
    } else {
      checkSrc(asset.src, i);
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
    // Started inside the promise chain so that a synchronous throw (no DOM)
    // is reported like a load error.
    Promise.resolve()
      .then(() => Promise.all(list.map(loadAsset)))
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
