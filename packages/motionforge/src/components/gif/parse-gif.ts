import { GifReader } from 'omggif';
import { checkSrc, fetchAsset, resolveSrc, serializeRequestInit } from '../../utils/fetch-asset';

/** A GIF read from its bytes: size and frame delays at once, the frames' pixels on demand. */
export interface LoadedGif {
  width: number;
  height: number;
  /** Delay of each frame in ms. */
  delays: number[];
  /** Full-size RGBA frames, composed with each frame's disposal method (decoded on first use). */
  getFrames(): ImageData[];
}

// Parsed GIFs, shared by <Gif> and getGifDurationInSeconds(); the oldest go first.
const CACHE_SIZE = 30;
const cache = new Map<string, Promise<LoadedGif>>();

const readGif = (bytes: Uint8Array, src: string): LoadedGif => {
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  if (signature !== 'GIF87a' && signature !== 'GIF89a') {
    throw new Error(`<Gif>: ${src} is not a GIF (it does not start with GIF87a or GIF89a)`);
  }
  let reader: GifReader;
  try {
    reader = new GifReader(bytes);
  } catch (error) {
    throw new Error(`<Gif> could not read ${src}: ${error instanceof Error ? error.message : error}`);
  }
  const { width, height } = reader;
  const count = reader.numFrames();
  // A delay of 0 (or none) is shown for 100 ms, as FFmpeg and Remotion do.
  const delays = Array.from({ length: count }, (_, i) => (reader.frameInfo(i).delay || 10) * 10);
  let frames: ImageData[] | null = null;

  const compose = (): ImageData[] => {
    const result: ImageData[] = [];
    let canvas = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < count; i++) {
      const info = reader.frameInfo(i);
      // Disposal 3: back to the canvas from before this frame.
      const previous = info.disposal === 3 ? canvas.slice() : null;
      try {
        reader.decodeAndBlitFrameRGBA(i, canvas);
      } catch (error) {
        throw new Error(`<Gif> could not decode frame ${i} of ${src}: ${error instanceof Error ? error.message : error}`);
      }
      result.push(new ImageData(canvas.slice(), width, height));
      if (info.disposal === 2) {
        // Disposal 2: the frame's area goes back to transparent.
        const right = Math.min(width, info.x + info.width);
        const bottom = Math.min(height, info.y + info.height);
        for (let y = info.y; y < bottom; y++) {
          canvas.fill(0, (y * width + info.x) * 4, (y * width + right) * 4);
        }
      } else if (previous) {
        canvas = previous;
      }
    }
    return result;
  };

  return {
    width,
    height,
    delays,
    getFrames: () => (frames ??= compose()),
  };
};

/** Loads and parses a GIF once per src and requestInit. */
export const loadGif = (src: string, requestInit?: RequestInit): Promise<LoadedGif> => {
  const resolved = resolveSrc(src);
  const key = `${resolved} ${serializeRequestInit(requestInit)}`;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const loading = fetchAsset('<Gif>', resolved, requestInit)
    .then((response) => response.arrayBuffer())
    .then((buffer) => readGif(new Uint8Array(buffer), src));
  cache.set(key, loading);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  // A failed load is not kept: the next call tries again.
  loading.catch(() => {
    if (cache.get(key) === loading) cache.delete(key);
  });
  return loading;
};

/**
 * Remotion's `getGifDurationInSeconds()` (`@remotion/gif`): the length of one
 * loop of the GIF, the sum of its frame delays (a delay of 0 counts as 100 ms).
 * Reads the frame headers only; also works outside the browser with an
 * absolute URL.
 */
export const getGifDurationInSeconds = async (
  src: string,
  options?: { requestInit?: RequestInit },
): Promise<number> => {
  checkSrc('getGifDurationInSeconds()', src);
  const gif = await loadGif(src, options?.requestInit);
  return gif.delays.reduce((sum, delay) => sum + delay, 0) / 1000;
};

export type GifLoopBehavior = 'loop' | 'pause-after-finish' | 'unmount-after-finish';

/**
 * The frame shown at `timeInMs` (Remotion's useCurrentGifIndex): -1 means
 * nothing ('unmount-after-finish' after the end).
 */
export const getGifFrameIndex = (delays: number[], timeInMs: number, loopBehavior: GifLoopBehavior): number => {
  if (delays.length === 0) return 0;
  const duration = delays.reduce((sum, delay) => sum + delay, 0);
  if (loopBehavior === 'pause-after-finish' && timeInMs >= duration) return delays.length - 1;
  if (loopBehavior === 'unmount-after-finish' && timeInMs >= duration) return -1;
  let currentTime = timeInMs % duration;
  for (let i = 0; i < delays.length; i++) {
    if (currentTime < delays[i]) return i;
    currentTime -= delays[i];
  }
  return 0;
};
