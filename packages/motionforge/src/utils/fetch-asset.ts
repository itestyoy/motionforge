/**
 * Shared loading helpers of the asset components (AnimatedImage, Gif) and
 * the media utilities.
 */

/** A stable key for `requestInit` (its signal is ignored), or null. */
export const serializeRequestInit = (requestInit: RequestInit | undefined): string | null => {
  if (!requestInit) return null;
  const { signal: _signal, headers, ...rest } = requestInit;
  return JSON.stringify({
    ...rest,
    headers: headers && typeof Headers !== 'undefined' ? Array.from(new Headers(headers).entries()) : headers ?? null,
  });
};

/** `src` resolved against the document in a browser, as given elsewhere. */
export const resolveSrc = (src: string): string =>
  typeof document === 'undefined' ? src : new URL(src, document.baseURI).href;

export const checkSrc = (fn: string, src: unknown) => {
  if (typeof src !== 'string' || src === '') {
    throw new TypeError(`${fn}: src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
};

/** fetch() that rejects with an error naming `src` on a network error or a non-2xx status. */
export const fetchAsset = async (
  fn: string,
  src: string,
  requestInit?: RequestInit,
  signal?: AbortSignal,
): Promise<Response> => {
  let response: Response;
  try {
    response = await fetch(src, { ...requestInit, ...(signal ? { signal } : null) });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${fn} could not load ${src}: ${message} (a remote file must allow CORS)`);
  }
  if (!response.ok) {
    throw new Error(`${fn} could not load ${src}: HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`);
  }
  return response;
};

/**
 * Props of Remotion's components that come from <Sequence> or features
 * MotionForge does not have: passing one throws with `hint`.
 */
export const rejectProps = (component: string, props: object, names: Record<string, string>) => {
  for (const name of Object.keys(names)) {
    if (name in props && (props as Record<string, unknown>)[name] !== undefined) {
      throw new Error(`${component} does not take "${name}": ${names[name]}`);
    }
  }
};

const sequenceHint = (name: string) => `put it inside <Sequence ${name}={...}> instead`;

/** The <Sequence> props Remotion's media components inherit. */
export const SEQUENCE_PROPS: Record<string, string> = Object.fromEntries(
  [
    'from',
    'durationInFrames',
    'trimBefore',
    'premountFor',
    'postmountFor',
    'styleWhilePremounted',
    'styleWhilePostmounted',
    'name',
    'showInTimeline',
    'hidden',
    'loop',
    'freeze',
  ].map((name) => [name, sequenceHint(name)]),
);

export const CROP_AND_EFFECT_PROPS: Record<string, string> = {
  cropLeft: 'crop with style={{ clipPath: "inset(...)" }}',
  cropRight: 'crop with style={{ clipPath: "inset(...)" }}',
  cropTop: 'crop with style={{ clipPath: "inset(...)" }}',
  cropBottom: 'crop with style={{ clipPath: "inset(...)" }}',
  effects: 'effects are not supported',
  effectsOutputSize: 'effects are not supported',
};
