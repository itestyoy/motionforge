import { describe, expect, it } from 'vitest';
import { interpolate, interpolateColors, random, spring } from '../src/utils/animation';

describe('spring', () => {
  it('rests at `from` before it starts instead of blowing up', () => {
    for (const frame of [-1, -10, -100]) {
      expect(spring({ frame, fps: 30 })).toBe(0);
      expect(spring({ frame, fps: 30, from: 5, to: 9 })).toBe(5);
    }
  });

  it('still starts at `from` and settles near `to`', () => {
    expect(spring({ frame: 0, fps: 30, from: 2, to: 4 })).toBe(2);
    expect(spring({ frame: 60, fps: 30, config: { damping: 20 } })).toBeCloseTo(1, 2);
  });
});

describe('interpolate', () => {
  it('extends the last segment past the right end', () => {
    expect(interpolate(30, [0, 10, 20], [0, 100, 110], { extrapolateRight: 'extend' })).toBe(120);
  });

  it('extends the first segment past the left end', () => {
    expect(interpolate(-10, [0, 10, 20], [0, 100, 110], { extrapolateLeft: 'extend' })).toBe(-100);
  });

  it('interpolates inside every segment', () => {
    expect(interpolate(5, [0, 10, 20], [0, 100, 110])).toBe(50);
    expect(interpolate(15, [0, 10, 20], [0, 100, 110])).toBe(105);
  });
});

describe('interpolateColors', () => {
  it('holds the end colors outside the range', () => {
    expect(interpolateColors(-5, [0, 10], ['#000000', '#ffffff'])).toBe('#000000');
    expect(interpolateColors(50, [0, 10], ['#000000', '#ffffff'])).toBe('#ffffff');
  });

  it('mixes in the right segment', () => {
    expect(interpolateColors(5, [0, 10], ['#000000', '#ffffff'])).toBe('#808080');
    expect(interpolateColors(15, [0, 10, 20], ['#000000', '#ff0000', '#0000ff'])).toBe('#800080');
  });

  it('keeps alpha from rgba() and #rrggbbaa', () => {
    expect(interpolateColors(5, [0, 10], ['rgba(255, 0, 0, 0)', 'rgba(255, 0, 0, 1)'])).toBe('rgba(255, 0, 0, 0.5)');
    expect(interpolateColors(0, [0, 10], ['#ff000080', '#ff0000'])).toBe('rgba(255, 0, 0, 0.502)');
  });

  it('rejects colors it cannot parse instead of returning black', () => {
    expect(() => interpolateColors(5, [0, 10], ['red', '#fff'])).toThrow(/unsupported color/);
  });
});

describe('random', () => {
  it('is deterministic and inside [min, max)', () => {
    expect(random(42)).toBe(random(42));
    for (let i = 0; i < 1000; i++) {
      const value = random(i, 5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(10);
    }
  });

  it('gives unrelated values for neighbouring seeds', () => {
    const values = Array.from({ length: 1000 }, (_, i) => random(i));
    const meanStep =
      values.slice(1).reduce((sum, v, i) => sum + Math.abs(v - values[i]), 0) / (values.length - 1);
    // Independent uniforms differ by 1/3 on average; the old hash moved by ~0.0001.
    expect(meanStep).toBeGreaterThan(0.25);
    const buckets = new Array(10).fill(0);
    values.forEach((v) => buckets[Math.floor(v * 10)]++);
    buckets.forEach((count) => expect(count).toBeGreaterThan(60));
  });
});
