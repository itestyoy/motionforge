import { describe, expect, it } from 'vitest';
import { Easing, interpolate, interpolateColors, measureSpring, noise2D, random, spring } from '../src/utils/animation';

// Reference: integrate x'' = (-k(x - 1) - c·x') / m from rest at 0 with a small step.
const simulate = (seconds: number, { damping = 10, stiffness = 100, mass = 1 } = {}) => {
  let x = 0;
  let v = 0;
  const dt = 1e-5;
  for (let t = 0; t < seconds; t += dt) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
  }
  return x;
};


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

describe('spring physics', () => {
  it('starts an overdamped spring at rest (coefficients sum to 1)', () => {
    const config = { damping: 30, stiffness: 100, mass: 1 };
    for (const frame of [1, 5, 20]) {
      expect(spring({ frame, fps: 30, config })).toBeCloseTo(simulate(frame / 30, config), 3);
    }
    expect(measureSpring({ fps: 30, config })).toBe(Math.min(...Array.from({ length: 200 }, (_, n) => n).filter(
      (n) => Array.from({ length: 200 }, (_, k) => n + k).every((m) => Math.abs(spring({ frame: m, fps: 30, config }) - 1) < 0.005),
    )));
  });

  it('follows the closed form without a time cutoff', () => {
    const config = { damping: 2 };
    expect(spring({ frame: 61, fps: 30, config })).not.toBe(spring({ frame: 90, fps: 30, config }));
    expect(spring({ frame: 90, fps: 30, config })).toBeCloseTo(simulate(3, { damping: 2 }), 3);
    expect(spring({ frame: 1000, fps: 30, config })).toBeCloseTo(1, 3);
  });

  it('stretches to durationInFrames and ends exactly at `to`', () => {
    for (const durationInFrames of [15, 60]) {
      expect(spring({ frame: durationInFrames, fps: 30, durationInFrames, from: 2, to: 5 })).toBe(5);
      expect(spring({ frame: durationInFrames + 40, fps: 30, durationInFrames, from: 2, to: 5 })).toBe(5);
      // Just before the end it is already close to rest, not mid-overshoot.
      expect(Math.abs(spring({ frame: durationInFrames - 1, fps: 30, durationInFrames }) - 1)).toBeLessThan(0.05);
    }
    // Half way through the stretched spring is the natural spring half way through its settle time.
    const natural = measureSpring({ fps: 30 });
    expect(spring({ frame: 30, fps: 30, durationInFrames: 60 })).toBeCloseTo(
      spring({ frame: natural / 2, fps: 30 }),
      10,
    );
  });

  it('uses durationRestThreshold for the natural duration', () => {
    const loose = spring({ frame: 30, fps: 30, durationInFrames: 60, durationRestThreshold: 0.1 });
    const tight = spring({ frame: 30, fps: 30, durationInFrames: 60, durationRestThreshold: 0.001 });
    expect(loose).not.toBeCloseTo(tight, 3);
  });

  it('throws on a missing fps or a NaN frame', () => {
    // @ts-expect-error fps is required
    expect(() => spring({ frame: 10 })).toThrow(/fps must be a positive number/);
    expect(() => spring({ frame: 10, fps: 0 })).toThrow(/fps must be a positive number/);
    expect(() => spring({ frame: Number.NaN, fps: 30 })).toThrow(/frame must be a number/);
    expect(() => spring({ frame: 10, fps: 30, config: { mass: 0 } })).toThrow(/mass > 0/);
    expect(() => spring({ frame: 10, fps: 30, durationInFrames: 0 })).toThrow(/durationInFrames must be a positive/);
  });
});

describe('measureSpring', () => {
  it('returns a frame after which the spring stays settled', () => {
    const unsettled: string[] = [];
    for (let damping = 1; damping <= 15; damping++) {
      for (let stiffness = 50; stiffness <= 400; stiffness += 25) {
        const config = { damping, stiffness, mass: 1 };
        const settled = measureSpring({ fps: 30, config });
        for (let k = 0; k < 120; k++) {
          if (Math.abs(spring({ frame: settled + k, fps: 30, config }) - 1) >= 0.005) {
            unsettled.push(`damping ${damping} stiffness ${stiffness}: frame ${settled + k}`);
            break;
          }
        }
        // ...and it is the first such frame.
        expect(Math.abs(spring({ frame: settled - 1, fps: 30, config }) - 1)).toBeGreaterThanOrEqual(0.005);
      }
    }
    expect(unsettled).toEqual([]);
  });

  it('throws for a spring that never settles', () => {
    expect(() => measureSpring({ fps: 30, config: { damping: 0 } })).toThrow(/never comes to rest/);
  });
});

describe('interpolate input checks', () => {
  it('treats a zero-length segment as a step at its end', () => {
    expect(interpolate(10, [10, 10], [0, 1])).toBe(1);
    expect(interpolate(9, [10, 10], [0, 1])).toBe(0);
    expect(interpolate(10, [0, 10, 10, 20], [0, 1, 5, 6])).toBe(1);
    expect(interpolate(12, [0, 10, 10, 20], [0, 1, 5, 6])).toBe(5.2);
    expect(interpolateColors(10, [10, 10], ['#000000', '#ffffff'])).toBe('#ffffff');
  });

  it('throws on a descending inputRange', () => {
    expect(() => interpolate(5, [10, 0], [0, 1])).toThrow(/inputRange must be ascending/);
    expect(() => interpolateColors(5, [10, 0], ['#000', '#fff'])).toThrow(/inputRange must be ascending/);
  });

  it('throws on NaN', () => {
    expect(() => interpolate(Number.NaN, [0, 10], [0, 1])).toThrow(/input must be a number/);
    expect(() => interpolate(5, [0, Number.NaN], [0, 1])).toThrow(/inputRange must contain numbers/);
    expect(() => interpolate(5, [0, 10], [0, Number.NaN])).toThrow(/outputRange must contain numbers/);
  });
});

describe('interpolateColors parsing', () => {
  it('throws on malformed hex', () => {
    for (const color of ['#abcde', '#zzzzzz', '#12', '#1234567']) {
      expect(() => interpolateColors(0, [0, 1], [color, '#000'])).toThrow(/unsupported color/);
    }
  });

  it('reads #rgba', () => {
    expect(interpolateColors(0, [0, 1], ['#f008', '#000'])).toBe('rgba(255, 0, 0, 0.533)');
  });

  it('reads the space/slash syntax and percentages', () => {
    expect(interpolateColors(0, [0, 1], ['rgb(255 0 0 / 50%)', '#000'])).toBe('rgba(255, 0, 0, 0.5)');
    expect(interpolateColors(0, [0, 1], ['rgb(255 0 0 / 0.25)', '#000'])).toBe('rgba(255, 0, 0, 0.25)');
    expect(interpolateColors(0, [0, 1], ['rgba(255, 0, 0, 50%)', '#000'])).toBe('rgba(255, 0, 0, 0.5)');
    expect(interpolateColors(0, [0, 1], ['rgb(100% 0% 50%)', '#000'])).toBe('#ff0080');
  });

  it('throws on other rgb() shapes', () => {
    for (const color of ['rgb(255 0)', 'rgb(1, 2, 3, 4, 5)', 'rgb(a, b, c)', 'rgb(255, 0, 0']) {
      expect(() => interpolateColors(0, [0, 1], [color, '#000'])).toThrow(/unsupported color/);
    }
  });
});

describe('noise2D', () => {
  it('depends on both coordinates', () => {
    const same = [0.3, 1.7, 5.2, 10.9].every((x) => noise2D(x, 0) === noise2D(x, 7) && noise2D(x, 3) === noise2D(x, 200));
    expect(same).toBe(false);
  });

  it('is continuous across lattice lines', () => {
    expect(Math.abs(noise2D(0.5, 0.9999) - noise2D(0.5, 1))).toBeLessThan(0.01);
    expect(Math.abs(noise2D(0.9999, 0.5) - noise2D(1, 0.5))).toBeLessThan(0.01);
    expect(Math.abs(noise2D(-1.0001, 3.5) - noise2D(-1, 3.5))).toBeLessThan(0.01);
  });

  it('stays in [0, 1) and is deterministic', () => {
    for (let i = 0; i < 2000; i++) {
      const value = noise2D(i * 0.37 - 300, i * 0.11 - 100);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
    expect(noise2D(3.3, 4.4)).toBe(noise2D(3.3, 4.4));
  });
});

describe('Easing.bezier', () => {
  // Reference: bisection on x(t), then y(t).
  const reference = (x1: number, y1: number, x2: number, y2: number, x: number) => {
    const curve = (p1: number, p2: number, t: number) => 3 * p1 * t * (1 - t) ** 2 + 3 * p2 * t * t * (1 - t) + t ** 3;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 100; i++) {
      const t = (lo + hi) / 2;
      if (curve(x1, x2, t) < x) lo = t;
      else hi = t;
    }
    return curve(y1, y2, (lo + hi) / 2);
  };

  it('matches the curve for steep and overshooting control points', () => {
    const curves = [[0.9, 0, 0.1, 1], [0.95, 0.05, 0.05, 0.95], [0, 0, 0.58, 1], [0.42, 0, 1, 1], [0.68, -0.6, 0.32, 1.6]] as const;
    let worst = 0;
    for (const c of curves) {
      const ease = Easing.bezier(...c);
      for (let i = 0; i <= 200; i++) {
        const x = i / 200;
        worst = Math.max(worst, Math.abs(ease(x) - reference(...c, x)));
      }
    }
    expect(worst).toBeLessThan(1e-6);
  });

  it('solves where the curve is vertical', () => {
    // x'(0.5) = 0 here; by symmetry y(0.5) = 0.5 (bisection on x alone is ill-conditioned at this point).
    const ease = Easing.bezier(1, 0, 0, 1);
    expect(ease(0.5)).toBeCloseTo(0.5, 9);
    expect(ease(0.25) + ease(0.75)).toBeCloseTo(1, 9);
  });

  it('throws when x1 or x2 is outside [0, 1]', () => {
    expect(() => Easing.bezier(1.5, 0, 0.5, 1)).toThrow(/x1, x2 must be in \[0, 1\]/);
  });
});
