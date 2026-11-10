/**
 * Seeded randomness for generated audio: ZzFX and Tone.js draw from
 * Math.random(), which would make every render of the same sound different.
 */

/** A generator of numbers in [0, 1) (mulberry32): the same seed gives the same sequence. */
export const seededRandom = (seed: number): (() => number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Runs `fn` with Math.random replaced by `random`, synchronously, and puts
 * the previous Math.random back afterwards (also when `fn` throws), unless
 * `fn` replaced it itself. Only synchronous code sees `random`: other code
 * of the page that runs between two such calls keeps the real Math.random
 * and does not consume the seeded sequence.
 */
export const withRandom = <T>(random: () => number, fn: () => T): T => {
  const previous = Math.random;
  Math.random = random;
  try {
    return fn();
  } finally {
    if (Math.random === random) Math.random = previous;
  }
};

export const checkSeed = (component: string, seed: unknown): number => {
  if (!Number.isInteger(seed)) {
    throw new Error(`${component}: seed must be an integer, got ${JSON.stringify(seed)}`);
  }
  return seed as number;
};
