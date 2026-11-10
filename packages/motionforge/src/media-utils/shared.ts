export const requireBrowser = (fn: string, what: string) => {
  if (typeof document === 'undefined') {
    throw new Error(`${fn} needs a browser (${what}); call it in the browser, not on the server`);
  }
};

/** Whether `src` is on another origin than the page (data: and blob: URLs are local). */
export const isRemoteAsset = (src: string): boolean => {
  if (/^(data|blob):/i.test(src)) return false;
  if (typeof document === 'undefined') return true;
  try {
    return new URL(src, document.baseURI).origin !== new URL(document.baseURI).origin;
  } catch {
    return true;
  }
};

const MEDIA_ERROR_NAMES: Record<number, string> = {
  1: 'MEDIA_ERR_ABORTED',
  2: 'MEDIA_ERR_NETWORK',
  3: 'MEDIA_ERR_DECODE',
  4: 'MEDIA_ERR_SRC_NOT_SUPPORTED: the file is missing or its format is not supported',
};

export const mediaError = (fn: string, src: string, error: MediaError | null): Error => {
  const detail = error
    ? `${MEDIA_ERROR_NAMES[error.code] ?? `media error code ${error.code}`}${error.message ? ` (${error.message})` : ''}`
    : 'unknown media error';
  return new Error(`${fn} could not load ${src}: ${detail}`);
};

/**
 * Promise cache per key: concurrent calls share one load, a result is kept,
 * a failure is not.
 */
export const createCache = <T>() => {
  const entries = new Map<string, Promise<T>>();
  return (key: string, load: () => Promise<T>): Promise<T> => {
    const cached = entries.get(key);
    if (cached) return cached;
    const loading = Promise.resolve().then(load);
    entries.set(key, loading);
    loading.catch(() => {
      if (entries.get(key) === loading) entries.delete(key);
    });
    return loading;
  };
};
