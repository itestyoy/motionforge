import { useSyncExternalStore } from 'react';

/** Progress of a prefetch(): bytes loaded and the total, if the response has a Content-Length. */
export type PrefetchOnProgress = (progress: { loadedBytes: number; totalBytes: number | null }) => void;

/** Options of prefetch(), as in Remotion. */
export interface PrefetchOptions {
  /** 'blob-url' (default): a blob: URL; 'base64': a data: URL. */
  method?: 'blob-url' | 'base64';
  /** Content type of the blob (default: the response's Content-Type). */
  contentType?: string;
  credentials?: RequestCredentials;
  onProgress?: PrefetchOnProgress;
}

export interface Prefetch {
  /** Aborts the download if it is still running and frees the memory. */
  free: () => void;
  /** Resolves with the blob: or data: URL once the asset is downloaded. */
  waitUntilDone: () => Promise<string>;
}

// The URLs of downloaded assets by source (without #fragment), each source
// with the prefetches that hold it, newest last.
const prefetched = new Map<string, Array<{ id: symbol; url: string }>>();
let snapshot: ReadonlyMap<string, string> = new Map();
const listeners = new Set<() => void>();

const publish = () => {
  snapshot = new Map([...prefetched].map(([src, list]) => [src, list[list.length - 1].url]));
  listeners.forEach((listener) => listener());
};

const withoutHash = (src: string) => {
  const index = src.indexOf('#');
  return index === -1 ? src : src.slice(0, index);
};

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('prefetch: could not read the downloaded data'));
    reader.readAsDataURL(blob);
  });

/**
 * Downloads an asset into memory, like Remotion's prefetch(). Once it is
 * done, Img, Video and Audio with the same `src` show it from memory (a blob:
 * or data: URL), so seeking never waits for the network. It does not hold the
 * render gate: await waitUntilDone() where you need it.
 *
 *   const { free, waitUntilDone } = prefetch('/clip.mp4');
 *   await waitUntilDone();
 *   // ... later
 *   free();
 */
export const prefetch = (src: string, options: PrefetchOptions = {}): Prefetch => {
  if (typeof src !== 'string' || src === '') {
    throw new TypeError(`prefetch: src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
  const { method = 'blob-url', contentType, credentials, onProgress } = options;
  if (method !== 'blob-url' && method !== 'base64') {
    throw new TypeError(`prefetch: method must be 'blob-url' or 'base64', got ${JSON.stringify(method)}`);
  }
  if (typeof fetch !== 'function' || typeof URL.createObjectURL !== 'function') {
    throw new Error('prefetch needs a browser (fetch and URL.createObjectURL)');
  }
  const source = withoutHash(src);
  const id = Symbol('prefetch');
  const controller = new AbortController();
  let freed = false;
  let url: string | null = null;

  const done = (async () => {
    const response = await fetch(source, { signal: controller.signal, credentials });
    if (!response.ok) throw new Error(`prefetch: ${source} returned HTTP ${response.status}`);
    const total = Number(response.headers.get('Content-Length'));
    const totalBytes = Number.isFinite(total) && total > 0 ? total : null;
    const chunks: Uint8Array[] = [];
    let loadedBytes = 0;
    if (response.body) {
      const reader = response.body.getReader();
      for (;;) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        chunks.push(value);
        loadedBytes += value.length;
        onProgress?.({ loadedBytes, totalBytes });
      }
    }
    const blob = new Blob(chunks as BlobPart[], { type: contentType ?? response.headers.get('Content-Type') ?? '' });
    const result = method === 'base64' ? await toDataUrl(blob) : URL.createObjectURL(blob);
    if (freed) {
      if (method === 'blob-url') URL.revokeObjectURL(result);
      throw new Error(`prefetch: free() was called before ${source} was downloaded`);
    }
    url = result;
    prefetched.set(source, [...(prefetched.get(source) ?? []), { id, url: result }]);
    publish();
    return result;
  })().catch((error: unknown) => {
    throw freed
      ? new Error(`prefetch: free() was called before ${source} was downloaded`)
      : error instanceof Error && error.message.startsWith('prefetch')
        ? error
        : new Error(`prefetch: could not download ${source}: ${error instanceof Error ? error.message : String(error)}`);
  });
  // Nobody may wait for it; the error is still there for waitUntilDone().
  done.catch(() => undefined);

  return {
    free: () => {
      if (freed) return;
      freed = true;
      if (url === null) {
        controller.abort();
        return;
      }
      if (method === 'blob-url') URL.revokeObjectURL(url);
      const rest = (prefetched.get(source) ?? []).filter((entry) => entry.id !== id);
      if (rest.length === 0) prefetched.delete(source);
      else prefetched.set(source, rest);
      publish();
    },
    waitUntilDone: () => done,
  };
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const getSnapshot = () => snapshot;
const NOTHING: ReadonlyMap<string, string> = new Map();
const getServerSnapshot = () => NOTHING;

/** The in-memory URL of `src` once prefetch() has downloaded it (keeping its #fragment), else `src`. */
export const usePrefetchedSrc = (src: string): string => {
  const urls = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const source = withoutHash(src);
  const url = urls.get(source);
  return url === undefined ? src : url + src.slice(source.length);
};
