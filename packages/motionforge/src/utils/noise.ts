/**
 * Simplex noise with the signatures of @remotion/noise: noise2D(seed, x, y),
 * noise3D(seed, x, y, z), noise4D(seed, x, y, z, w). Values are in [-1, 1],
 * change smoothly with the coordinates and depend only on the seed and the
 * coordinates. The noise is simplex-noise's; its permutation table is drawn
 * from random() seeded with `seed` (the values differ from Remotion's).
 */
import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';
import { random } from './animation';

type Noise2D = (x: number, y: number) => number;
type Noise3D = (x: number, y: number, z: number) => number;
type Noise4D = (x: number, y: number, z: number, w: number) => number;

// A deterministic stream of numbers in [0, 1) for one seed.
const streamOf = (seed: string | number, dimensions: number) => {
  let i = 0;
  return () => random(`noise${dimensions}D:${seed}:${i++}`);
};

// Noise functions per seed; the oldest are dropped past this many seeds.
const CACHE_SIZE = 64;

const cached = <T>(create: (random: () => number) => T, dimensions: number) => {
  const cache = new Map<string, T>();
  return (seed: string | number): T => {
    // A number seed and its string are the same seed, as in random().
    const key = String(seed);
    let noise = cache.get(key);
    if (noise === undefined) {
      if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value as string);
      noise = create(streamOf(key, dimensions));
      cache.set(key, noise);
    }
    return noise;
  };
};

const noise2DOf = cached<Noise2D>(createNoise2D, 2);
const noise3DOf = cached<Noise3D>(createNoise3D, 3);
const noise4DOf = cached<Noise4D>(createNoise4D, 4);

const check = (fn: string, seed: unknown, coordinates: Record<string, unknown>) => {
  if (!(typeof seed === 'string' || (typeof seed === 'number' && Number.isFinite(seed)))) {
    throw new Error(`${fn}: seed must be a string or a finite number, got ${JSON.stringify(seed)}`);
  }
  for (const [name, value] of Object.entries(coordinates)) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`${fn}: ${name} must be a finite number, got ${value}`);
    }
  }
};

/** 2D simplex noise in [-1, 1] at (x, y) for `seed`. */
export const noise2D = (seed: string | number, x: number, y: number): number => {
  check('noise2D', seed, { x, y });
  return noise2DOf(seed)(x, y);
};

/** 3D simplex noise in [-1, 1] at (x, y, z) for `seed`. */
export const noise3D = (seed: string | number, x: number, y: number, z: number): number => {
  check('noise3D', seed, { x, y, z });
  return noise3DOf(seed)(x, y, z);
};

/** 4D simplex noise in [-1, 1] at (x, y, z, w) for `seed`. */
export const noise4D = (seed: string | number, x: number, y: number, z: number, w: number): number => {
  check('noise4D', seed, { x, y, z, w });
  return noise4DOf(seed)(x, y, z, w);
};
