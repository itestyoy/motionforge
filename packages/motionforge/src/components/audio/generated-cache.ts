/**
 * Generated sounds by key, most recently used last. Rendering the same sound
 * again (a sequence mounting again, another FrameProvider) reuses it; the
 * oldest are dropped beyond the limit (a component keeps its own buffer).
 */
const LIMIT = 64;

const entries = new Map<string, unknown>();

export const getGenerated = <T>(key: string): T | undefined => {
  if (!entries.has(key)) return undefined;
  const value = entries.get(key) as T;
  entries.delete(key);
  entries.set(key, value);
  return value;
};

export const setGenerated = <T>(key: string, value: T): T => {
  entries.delete(key);
  entries.set(key, value);
  while (entries.size > LIMIT) entries.delete(entries.keys().next().value as string);
  return value;
};

export const deleteGenerated = (key: string, value: unknown): void => {
  if (entries.get(key) === value) entries.delete(key);
};

const describe = (value: unknown) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/** Throws unless `value` is plain JSON data (it becomes part of a cache key). */
export const checkJson = (component: string, name: string, value: unknown, seen = new Set<unknown>()): void => {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`${component}: ${name} must be JSON data, got ${value}`);
    return;
  }
  const isPlain =
    typeof value === 'object' && (Array.isArray(value) || Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  if (!isPlain || seen.has(value)) {
    throw new Error(
      `${component}: ${name} must be JSON data (strings, numbers, booleans, null, arrays, plain objects), got ${typeof value === 'function' ? 'a function' : describe(value)}`,
    );
  }
  seen.add(value);
  for (const [key, item] of Object.entries(value as object)) checkJson(component, `${name}.${key}`, item, seen);
  seen.delete(value);
};

/** An AudioBuffer holding `channels` (Web Audio's AudioBuffer constructor). */
export const toAudioBuffer = (component: string, channels: Float32Array[], sampleRate: number): AudioBuffer => {
  if (typeof AudioBuffer === 'undefined') {
    throw new Error(`${component} needs the Web Audio API (AudioBuffer) to hand its samples to the host`);
  }
  const buffer = new AudioBuffer({ length: channels[0].length, numberOfChannels: channels.length, sampleRate });
  channels.forEach((samples, index) => buffer.getChannelData(index).set(samples));
  return buffer;
};
