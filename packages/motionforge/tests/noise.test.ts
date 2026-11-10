import { describe, expect, it } from 'vitest';
import { noise2D, noise3D, noise4D } from '../src/utils/noise';

describe('noise2D / noise3D / noise4D (@remotion/noise signatures)', () => {
  const samples = (fn: (i: number) => number) => Array.from({ length: 3000 }, (_, i) => fn(i));

  it('stays in [-1, 1], uses the whole range and is deterministic per seed', () => {
    const all = [
      ...samples((i) => noise2D('a', i * 0.137, i * 0.071)),
      ...samples((i) => noise3D(7, i * 0.137, i * 0.071, i * 0.05)),
      ...samples((i) => noise4D('b', i * 0.137, i * 0.071, i * 0.05, i * 0.03)),
    ];
    expect(Math.min(...all)).toBeGreaterThanOrEqual(-1);
    expect(Math.max(...all)).toBeLessThanOrEqual(1);
    expect(Math.min(...all)).toBeLessThan(-0.6);
    expect(Math.max(...all)).toBeGreaterThan(0.6);
    expect(noise2D('seed', 1.5, 2.5)).toBe(noise2D('seed', 1.5, 2.5));
    expect(noise3D('seed', 1.5, 2.5, 3.5)).toBe(noise3D('seed', 1.5, 2.5, 3.5));
    expect(noise4D('seed', 1.5, 2.5, 3.5, 4.5)).toBe(noise4D('seed', 1.5, 2.5, 3.5, 4.5));
    // A number seed is the same seed as its string.
    expect(noise2D(3, 0.3, 0.7)).toBe(noise2D('3', 0.3, 0.7));
  });

  it('depends on the seed and changes smoothly with the coordinates', () => {
    const differs = samples((i) => noise2D('x', i * 0.31, 0.5) - noise2D('y', i * 0.31, 0.5)).some((d) => Math.abs(d) > 0.1);
    expect(differs).toBe(true);
    for (let i = 0; i < 200; i++) {
      const x = i * 0.173;
      expect(Math.abs(noise2D('s', x, 1) - noise2D('s', x + 1e-4, 1))).toBeLessThan(0.01);
      expect(Math.abs(noise3D('s', x, 1, 2) - noise3D('s', x, 1, 2 + 1e-4))).toBeLessThan(0.01);
      expect(Math.abs(noise4D('s', x, 1, 2, 3) - noise4D('s', x, 1, 2, 3 + 1e-4))).toBeLessThan(0.01);
    }
  });

  it('throws on a bad seed or coordinate', () => {
    // @ts-expect-error not a seed
    expect(() => noise2D(null, 1, 2)).toThrow(/noise2D: seed must be a string or a finite number/);
    expect(() => noise3D('s', 1, Number.NaN, 2)).toThrow(/noise3D: y must be a finite number/);
    expect(() => noise4D('s', 1, 2, 3, Infinity)).toThrow(/noise4D: w must be a finite number/);
  });
});
