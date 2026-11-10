/** Checks and conversions shared by the generated sounds (the cache is core/generated-audio). */

/** A value as an error message shows it. */
export const describe = (value: unknown): string => {
  if (typeof value === 'function') return 'a function';
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * The props (or keys) a component takes, for the error on one it does not:
 * scenes are often written by a model, which reads the error and tries again,
 * so the error names what to write instead.
 */
export interface KnownProps {
  /** `<Sfx>`, `usePrepareAudio: sounds[0]`, ... */
  component: string;
  /** What the list of accepted names is about (default `component`): `A sfx sound`. */
  subject?: string;
  /** 'prop' for a component, 'key' for an object. */
  noun: 'prop' | 'key';
  /** Every accepted name, in the order the error lists them. */
  accepted: readonly string[];
  required: readonly string[];
  /** Names that mean an accepted one, lower case: `params` → `zzfx`. */
  aliases: Readonly<Record<string, string>>;
  /** Names that need an explanation instead, lower case: `src` → "a sound file is <Audio src>". */
  notes?: Readonly<Record<string, string>>;
  /** A complete, valid example. */
  example: string;
}

const editDistance = (a: string, b: string): number => {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    previous = current;
  }
  return previous[b.length];
};

/** The accepted name `name` most likely means: an alias, or a close spelling (case, a typo). */
export const closestProp = (name: string, spec: Pick<KnownProps, 'accepted' | 'aliases'>): string | null => {
  const lower = name.toLowerCase().replace(/[-_\s]/g, '');
  if (Object.prototype.hasOwnProperty.call(spec.aliases, lower)) return spec.aliases[lower];
  let best: string | null = null;
  let bestDistance = Infinity;
  for (const accepted of spec.accepted) {
    const distance = editDistance(lower, accepted.toLowerCase());
    const limit = accepted.length >= 6 ? 2 : 1;
    if (distance <= limit && distance < bestDistance) {
      best = accepted;
      bestDistance = distance;
    }
  }
  return best;
};

/**
 * Throws on a prop (key) `spec` does not accept, naming the one it most
 * likely means and listing every accepted one with an example:
 *
 *   <Sfx>: unknown prop `params` (did you mean `zzfx`?). <Sfx> takes zzfx (required), at, ...: <Sfx at={12} zzfx={[...]} />
 */
export const checkKnownProps = (spec: KnownProps, props: object): void => {
  const unknown = Object.keys(props).filter((name) => !spec.accepted.includes(name));
  if (unknown.length === 0) return;
  const notes = spec.notes ?? {};
  const explained = unknown.map((name) => {
    const lower = name.toLowerCase().replace(/[-_\s]/g, '');
    if (Object.prototype.hasOwnProperty.call(notes, lower)) return `\`${name}\` (${notes[lower]})`;
    const meant = closestProp(name, spec);
    return meant ? `\`${name}\` (did you mean \`${meant}\`?)` : `\`${name}\``;
  });
  const takes = spec.accepted.map((name) => (spec.required.includes(name) ? `${name} (required)` : name)).join(', ');
  throw new Error(
    `${spec.component}: unknown ${spec.noun}${unknown.length > 1 ? 's' : ''} ${explained.join(', ')}. ` +
      `${spec.subject ?? spec.component} takes ${takes}, e.g. ${spec.example}`,
  );
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
