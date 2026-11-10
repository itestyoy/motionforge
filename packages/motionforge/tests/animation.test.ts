import { describe, expect, it } from 'vitest';
import { Easing, interpolate, interpolateColors, measureSpring, random, spring } from '../src/utils/animation';

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
    expect(interpolateColors(-5, [0, 10], ['#000000', '#ffffff'])).toBe('rgba(0, 0, 0, 1)');
    expect(interpolateColors(50, [0, 10], ['#000000', '#ffffff'])).toBe('rgba(255, 255, 255, 1)');
  });

  it('mixes in the right segment', () => {
    expect(interpolateColors(5, [0, 10], ['#000000', '#ffffff'])).toBe('rgba(128, 128, 128, 1)');
    expect(interpolateColors(15, [0, 10, 20], ['#000000', '#ff0000', '#0000ff'])).toBe('rgba(128, 0, 128, 1)');
  });

  it('keeps alpha from rgba() and #rrggbbaa', () => {
    expect(interpolateColors(5, [0, 10], ['rgba(255, 0, 0, 0)', 'rgba(255, 0, 0, 1)'])).toBe('rgba(255, 0, 0, 0.5)');
    expect(interpolateColors(0, [0, 10], ['#ff000080', '#ff0000'])).toBe('rgba(255, 0, 0, 0.502)');
  });

  it('rejects colors it cannot parse instead of returning black', () => {
    expect(() => interpolateColors(5, [0, 10], ['reddish', '#fff'])).toThrow(/unsupported color "reddish"/);
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

describe('spring physics (Remotion 4.0.542 values)', () => {
  // Values printed by remotion@4.0.542's spring() / measureSpring() for the same input.
  it('gives the same values as Remotion', () => {
    expect(spring({ fps: 30, frame: 10 })).toBe(1.1552855913778497);
    expect(spring({ fps: 30, frame: 7.5 })).toBe(1.0233595799066921);
    expect(spring({ fps: 30, frame: 6, config: { damping: 8 } })).toBe(0.9270843838555523);
    expect(spring({ fps: 30, frame: 12, delay: 5, from: -50, to: 250 })).toBe(242.06025515862785);
    // Below 15.625 fps a step is capped at 64 ms, as in Remotion.
    expect(spring({ fps: 10, frame: 7 })).toBe(1.1201078722089377);
    expect(measureSpring({ fps: 30 })).toBe(28);
    expect(measureSpring({ fps: 30, config: { damping: 8 } })).toBe(36);
    expect(measureSpring({ fps: 30, threshold: 0.1 })).toBe(15);
    expect(measureSpring({ fps: 60, config: { damping: 3, stiffness: 50, mass: 2 } })).toBe(394);
  });

  it('treats a damping ratio of 1 or more as critically damped (damping: 200 is fast, without bounce)', () => {
    // damping 20 with stiffness 100 and mass 1 is a damping ratio of exactly 1.
    for (const frame of [0, 1, 5, 12.5, 30]) {
      expect(spring({ fps: 30, frame, config: { damping: 200 } })).toBe(spring({ fps: 30, frame, config: { damping: 20 } }));
      expect(spring({ fps: 30, frame, config: { damping: 300 } })).toBe(spring({ fps: 30, frame, config: { damping: 20 } }));
    }
    expect(spring({ fps: 30, frame: 5, config: { damping: 200 } })).toBe(0.49633172576650186);
    expect(measureSpring({ fps: 30, config: { damping: 200 } })).toBe(23);
    expect(measureSpring({ fps: 30, config: { damping: 20 } })).toBe(23);
  });

  it('follows the physics of an underdamped spring', () => {
    const config = { damping: 2 };
    expect(spring({ frame: 61, fps: 30, config })).not.toBe(spring({ frame: 90, fps: 30, config }));
    expect(spring({ frame: 90, fps: 30, config })).toBeCloseTo(simulate(3, { damping: 2 }), 3);
    expect(spring({ frame: 1000, fps: 30, config })).toBeCloseTo(1, 3);
  });

  it('gives the same value whatever was computed before (the cache does not change it)', () => {
    const config = { damping: 7, stiffness: 140, mass: 1.3 };
    const fresh = spring({ fps: 30, frame: 40.6, config });
    for (let frame = 0; frame <= 45; frame++) spring({ fps: 30, frame, config });
    expect(spring({ fps: 30, frame: 40.6, config })).toBe(fresh);
  });

  it('stretches to durationInFrames: within the threshold at the last frame, exactly `to` after it', () => {
    expect(spring({ fps: 30, frame: 30, durationInFrames: 30 })).toBe(0.9968464194727024);
    expect(spring({ fps: 30, frame: 29, durationInFrames: 30 })).toBe(0.9932173819030287);
    expect(spring({ fps: 30, frame: 15, durationInFrames: 15, from: 2, to: 5 })).toBe(4.9905392584181065);
    for (const durationInFrames of [15, 60]) {
      expect(spring({ frame: durationInFrames + 0.01, fps: 30, durationInFrames, from: 2, to: 5 })).toBe(5);
      expect(spring({ frame: durationInFrames + 40, fps: 30, durationInFrames, from: 2, to: 5 })).toBe(5);
    }
    // Half way through the stretched spring is the natural spring half way through its settle time.
    const natural = measureSpring({ fps: 30 });
    expect(spring({ frame: 30, fps: 30, durationInFrames: 60 })).toBeCloseTo(spring({ frame: natural / 2, fps: 30 }), 10);
  });

  it('uses durationRestThreshold for the natural duration', () => {
    const loose = spring({ frame: 30, fps: 30, durationInFrames: 60, durationRestThreshold: 0.1 });
    const tight = spring({ frame: 30, fps: 30, durationInFrames: 60, durationRestThreshold: 0.001 });
    expect(loose).not.toBeCloseTo(tight, 3);
  });

  it('clamps the overshoot past `to` with overshootClamping', () => {
    expect(spring({ fps: 30, frame: 10 })).toBeGreaterThan(1);
    expect(spring({ fps: 30, frame: 10, config: { overshootClamping: true } })).toBe(1);
    expect(spring({ fps: 30, frame: 10, from: 2, to: 4, config: { overshootClamping: true } })).toBe(4);
    expect(spring({ fps: 30, frame: 6, config: { damping: 8, overshootClamping: true } })).toBe(0.9270843838555523);
  });

  it('throws on a missing fps, a non-finite frame or a bad config', () => {
    // @ts-expect-error fps is required
    expect(() => spring({ frame: 10 })).toThrow(/fps must be a positive number/);
    expect(() => spring({ frame: 10, fps: 0 })).toThrow(/fps must be a positive number/);
    expect(() => spring({ frame: Number.NaN, fps: 30 })).toThrow(/frame must be a finite number/);
    expect(() => spring({ frame: Infinity, fps: 30 })).toThrow(/frame must be a finite number/);
    expect(() => spring({ frame: 10, fps: 30, config: { mass: 0 } })).toThrow(/mass > 0/);
    expect(() => spring({ frame: 10, fps: 30, config: { damping: 0 } })).toThrow(/never comes to rest/);
    expect(() => spring({ frame: 10, fps: 30, config: { damping: Number.NaN } })).toThrow(/damping > 0/);
    expect(() => spring({ frame: 10, fps: 30, durationInFrames: 0 })).toThrow(/durationInFrames must be a positive/);
    expect(() => spring({ frame: 10, fps: 30, durationInFrames: 20, durationRestThreshold: 0 })).toThrow(
      /durationRestThreshold must be > 0/,
    );
  });
});

describe('measureSpring', () => {
  it('is a frame inside the threshold from which the spring stays inside for the next frames checked', () => {
    for (const damping of [1, 4, 10, 15]) {
      for (const stiffness of [50, 200, 400]) {
        const config = { damping, stiffness, mass: 1 };
        const settled = measureSpring({ fps: 30, config });
        // Remotion checks 20 frames past the first frame inside, 19 past a frame that left it again.
        for (let k = 0; k < 19; k++) {
          expect(Math.abs(spring({ frame: settled + k, fps: 30, config }) - 1)).toBeLessThan(0.005);
        }
        expect(Math.abs(spring({ frame: settled - 1, fps: 30, config }) - 1)).toBeGreaterThanOrEqual(0.005);
      }
    }
  });

  it('returns Infinity for a threshold of 0 and 0 for a threshold of 1 or more, as Remotion', () => {
    expect(measureSpring({ fps: 30, threshold: 0 })).toBe(Infinity);
    expect(measureSpring({ fps: 30, threshold: 1 })).toBe(0);
    expect(measureSpring({ fps: 30, threshold: 1.5 })).toBe(0);
    expect(() => measureSpring({ fps: 30, threshold: -0.1 })).toThrow(/threshold must be a number >= 0/);
    expect(() => measureSpring({ fps: 30, threshold: Number.NaN })).toThrow(/threshold must be a number >= 0/);
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
    expect(interpolateColors(10, [10, 10], ['#000000', '#ffffff'])).toBe('rgba(255, 255, 255, 1)');
  });

  it('throws on a descending inputRange', () => {
    expect(() => interpolate(5, [10, 0], [0, 1])).toThrow(/inputRange must be ascending/);
    expect(() => interpolateColors(5, [10, 0], ['#000', '#fff'])).toThrow(/inputRange must be ascending/);
  });

  it('throws on NaN', () => {
    expect(() => interpolate(Number.NaN, [0, 10], [0, 1])).toThrow(/input must be a number/);
    expect(() => interpolate(5, [0, Number.NaN], [0, 1])).toThrow(/inputRange must contain finite numbers/);
    expect(() => interpolate(5, [0, 10], [0, Number.NaN])).toThrow(/outputRange must contain finite numbers/);
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
    expect(interpolateColors(0, [0, 1], ['rgb(100% 0% 50%)', '#000'])).toBe('rgba(255, 0, 128, 1)');
  });

  it('throws on other rgb() shapes', () => {
    for (const color of ['rgb(255 0)', 'rgb(1, 2, 3, 4, 5)', 'rgb(a, b, c)', 'rgb(255, 0, 0']) {
      expect(() => interpolateColors(0, [0, 1], [color, '#000'])).toThrow(/unsupported color/);
    }
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
    const curves: Array<[number, number, number, number]> = [[0.9, 0, 0.1, 1], [0.95, 0.05, 0.05, 0.95], [0, 0, 0.58, 1], [0.42, 0, 1, 1], [0.68, -0.6, 0.32, 1.6]];
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

describe('Easing composition (Remotion)', () => {
  const bases = {
    linear: Easing.linear,
    ease: Easing.ease,
    quad: Easing.quad,
    cubic: Easing.cubic,
    'poly(4)': Easing.poly(4),
    'poly(0.5)': Easing.poly(0.5),
    sin: Easing.sin,
    circle: Easing.circle,
    exp: Easing.exp,
    'elastic()': Easing.elastic(),
    'elastic(3)': Easing.elastic(3),
    'back()': Easing.back(),
    'back(3)': Easing.back(3),
    bounce: Easing.bounce,
    'bezier(0.25, 0.1, 0.25, 1)': Easing.bezier(0.25, 0.1, 0.25, 1),
    'bezier(0.68, -0.6, 0.32, 1.6)': Easing.bezier(0.68, -0.6, 0.32, 1.6),
  };
  const named = Object.fromEntries(
    Object.entries(Easing).filter(([name]) => name.startsWith('ease') && name !== 'ease'),
  ) as Record<string, (t: number) => number>;

  it('returns exactly 0 at 0 and 1 at 1 for every easing', () => {
    const all: Record<string, (t: number) => number> = { ...named };
    for (const [name, fn] of Object.entries(bases)) {
      all[name] = fn;
      all[`in(${name})`] = Easing.in(fn);
      all[`out(${name})`] = Easing.out(fn);
      all[`inOut(${name})`] = Easing.inOut(fn);
    }
    expect(Object.keys(named)).toHaveLength(30);
    const wrong = Object.entries(all)
      .filter(([, fn]) => !Object.is(fn(0), 0) || !Object.is(fn(1), 1))
      .map(([name, fn]) => `${name}: ${fn(0)}, ${fn(1)}`);
    expect(wrong).toEqual([]);
  });

  it('matches Remotion inside the range', () => {
    const t = 0.3;
    expect(Easing.quad(t)).toBeCloseTo(t * t, 15);
    expect(Easing.cubic(t)).toBeCloseTo(t ** 3, 15);
    expect(Easing.poly(4)(t)).toBeCloseTo(t ** 4, 15);
    expect(Easing.sin(t)).toBeCloseTo(1 - Math.cos((t * Math.PI) / 2), 15);
    expect(Easing.circle(t)).toBeCloseTo(1 - Math.sqrt(1 - t * t), 15);
    expect(Easing.exp(t)).toBeCloseTo(2 ** (10 * (t - 1)), 15);
    expect(Easing.elastic(2)(t)).toBeCloseTo(1 - Math.cos((t * Math.PI) / 2) ** 3 * Math.cos(t * 2 * Math.PI), 15);
    expect(Easing.back()(t)).toBeCloseTo(t * t * (2.70158 * t - 1.70158), 15);
    expect(Easing.bounce(0.5)).toBeCloseTo(7.5625 * (0.5 - 1.5 / 2.75) ** 2 + 0.75, 15);
    expect(Easing.ease(0.5)).toBe(Easing.bezier(0.42, 0, 1, 1)(0.5));
    expect(Easing.in(Easing.quad)(t)).toBe(Easing.quad(t));
    expect(Easing.out(Easing.quad)(0.5)).toBe(0.75);
    expect(Easing.inOut(Easing.cubic)(0.25)).toBe(0.0625);
    expect(Easing.inOut(Easing.cubic)(0.75)).toBe(0.9375);
  });

  it('works with interpolate', () => {
    expect(interpolate(5, [0, 10], [0, 100], { easing: Easing.out(Easing.quad) })).toBe(75);
  });

  it('throws on wrong arguments', () => {
    // @ts-expect-error not a function
    expect(() => Easing.out(2)).toThrow(/Easing.out: expects an easing function/);
    expect(() => Easing.poly(0)).toThrow(/Easing.poly: expects n > 0/);
    expect(() => Easing.poly(Number.NaN)).toThrow(/Easing.poly: expects a finite number/);
    expect(() => Easing.elastic(-1)).toThrow(/Easing.elastic: expects a finite number >= 0/);
    expect(() => Easing.back(Infinity)).toThrow(/Easing.back: expects a finite number/);
  });
});

describe('spring delay and reverse', () => {
  it('delays the release by `delay` frames', () => {
    expect(spring({ frame: 5, fps: 30, delay: 10, from: 2, to: 4 })).toBe(2);
    expect(spring({ frame: 10, fps: 30, delay: 10, from: 2, to: 4 })).toBe(2);
    for (const k of [1, 7, 20]) {
      expect(spring({ frame: 10 + k, fps: 30, delay: 10 })).toBe(spring({ frame: k, fps: 30 }));
      expect(spring({ frame: 10 + k, fps: 30, delay: 10, durationInFrames: 20 })).toBe(
        spring({ frame: k, fps: 30, durationInFrames: 20 }),
      );
    }
  });

  it('plays a stretched spring backwards in time', () => {
    for (let f = -3; f <= 25; f++) {
      expect(spring({ frame: f, fps: 30, durationInFrames: 20, reverse: true, from: 2, to: 4 })).toBe(
        spring({ frame: 20 - f, fps: 30, durationInFrames: 20, from: 2, to: 4 }),
      );
    }
    // It starts where the stretched spring ends (within the threshold), as in Remotion.
    expect(spring({ frame: 0, fps: 30, durationInFrames: 20, reverse: true })).toBe(0.9968464194727024);
    expect(spring({ frame: 20, fps: 30, durationInFrames: 20, reverse: true, from: 2, to: 4 })).toBe(2);
  });

  it('plays a natural spring backwards over its settle time', () => {
    const config = { damping: 8 };
    const natural = measureSpring({ fps: 30, config });
    expect(spring({ frame: 0, fps: 30, config, reverse: true })).toBe(1.0035702858110171);
    for (const f of [-5, 1, 10, natural - 1]) {
      expect(spring({ frame: f, fps: 30, config, reverse: true })).toBe(spring({ frame: natural - f, fps: 30, config }));
    }
    expect(spring({ frame: natural, fps: 30, config, reverse: true })).toBe(0);
    // A delay holds the start for `delay` frames.
    expect(spring({ frame: 5 + 10, fps: 30, config, reverse: true, delay: 5 })).toBe(
      spring({ frame: natural - 10, fps: 30, config }),
    );
    // With durationInFrames it is exactly `to` before the delay is over.
    expect(spring({ frame: 4, fps: 30, durationInFrames: 20, reverse: true, delay: 5, from: 2, to: 4 })).toBe(4);
  });

  it('is the motion reversed in time, not from and to swapped', () => {
    const config = { damping: 5 };
    const frames = Array.from({ length: 60 }, (_, f) => f);
    const reversed = frames.map((frame) => spring({ frame, fps: 30, config, reverse: true }));
    const swapped = frames.map((frame) => spring({ frame, fps: 30, config, from: 1, to: 0 }));
    // Reversed, the bounce happens at the start, above `to`, and it arrives at `from` without overshoot.
    expect(Math.max(...reversed)).toBeGreaterThan(1.05);
    expect(Math.min(...reversed)).toBeGreaterThanOrEqual(0);
    // Swapped, it leaves `to` smoothly and overshoots past `from`.
    expect(Math.min(...swapped)).toBeLessThan(-0.05);
  });

  it('checks delay and reverse', () => {
    expect(() => spring({ frame: 1, fps: 30, delay: Number.NaN })).toThrow(/delay must be a finite number/);
    // @ts-expect-error not a boolean
    expect(() => spring({ frame: 1, fps: 30, reverse: 'yes' })).toThrow(/reverse must be a boolean/);
  });
});

describe('interpolate wrap and per-segment easing', () => {
  it('wraps the whole input range on either side', () => {
    expect(interpolate(15, [0, 10], [0, 100], { extrapolateRight: 'wrap' })).toBe(50);
    expect(interpolate(-5, [0, 10], [0, 100], { extrapolateLeft: 'wrap' })).toBe(50);
    expect(interpolate(25, [0, 10, 20], [0, 100, 0], { extrapolateRight: 'wrap' })).toBe(50);
    expect(interpolate(34, [10, 20], [0, 1], { extrapolateRight: 'wrap' })).toBe(0.4);
    // Only the side that wraps; the left side extends (the default).
    expect(interpolate(-5, [0, 10], [0, 100], { extrapolateRight: 'wrap' })).toBe(-50);
    expect(() => interpolate(15, [10, 10], [0, 1], { extrapolateRight: 'wrap' })).toThrow(/wrap' needs an inputRange/);
  });

  it('applies one easing per segment', () => {
    const options = { easing: [Easing.quad, Easing.linear] };
    expect(interpolate(5, [0, 10, 20], [0, 100, 200], options)).toBe(25);
    expect(interpolate(15, [0, 10, 20], [0, 100, 200], options)).toBe(150);
  });

  it('throws on an easing array of the wrong length or with non-functions', () => {
    expect(() => interpolate(5, [0, 10, 20], [0, 1, 2], { easing: [Easing.quad] })).toThrow(
      /one easing per segment \(inputRange.length - 1 = 2\), got 1/,
    );
    // @ts-expect-error not a function
    expect(() => interpolate(5, [0, 10], [0, 1], { easing: [1] })).toThrow(/easing\[0\] must be a function/);
    // @ts-expect-error not a function
    expect(() => interpolate(5, [0, 10], [0, 1], { easing: 'ease' })).toThrow(/easing must be a function/);
  });

  it('throws on an unknown extrapolation', () => {
    // @ts-expect-error unknown
    expect(() => interpolate(5, [0, 10], [0, 1], { extrapolateLeft: 'mirror' })).toThrow(
      /extrapolateLeft must be one of clamp, extend, identity, wrap/,
    );
  });
});

describe('interpolate (Remotion defaults and options)', () => {
  it("extends on both sides by default, as in Remotion", () => {
    expect(interpolate(-5, [0, 10], [0, 100])).toBe(-50);
    expect(interpolate(15, [0, 10], [0, 100])).toBe(150);
    expect(interpolate(15, [0, 10], [0, 100], { extrapolateRight: 'clamp' })).toBe(100);
    expect(interpolate(-5, [0, 10], [0, 100], { extrapolateLeft: 'identity' })).toBe(-5);
  });

  it('returns the only output for a one-element range', () => {
    expect(interpolate(-100, [3], [7])).toBe(7);
    expect(interpolate(100, [3], [7], { extrapolateRight: 'wrap' })).toBe(7);
    expect(() => interpolate(1, [], [])).toThrow(/at least 1 element/);
    expect(() => interpolate(1, [0, 1], [0])).toThrow(/inputRange \(2\) and outputRange \(1\) must have the same length/);
  });

  it('posterizes the input to multiples of `posterize`', () => {
    expect(interpolate(7, [0, 10], [0, 100], { posterize: 5 })).toBe(50);
    expect(interpolate(9.99, [0, 10], [0, 100], { posterize: 5 })).toBe(50);
    expect(interpolate(10, [0, 10], [0, 100], { posterize: 5 })).toBe(100);
    expect(interpolate(-1, [0, 10], [0, 100], { posterize: 5 })).toBe(-50);
    for (const posterize of [0, -1, Number.NaN, Infinity]) {
      expect(() => interpolate(1, [0, 10], [0, 1], { posterize })).toThrow(/posterize must be a positive finite number/);
    }
  });

  it('rejects infinite ranges', () => {
    expect(() => interpolate(1, [0, Infinity], [0, 1])).toThrow(/inputRange must contain finite numbers/);
    expect(() => interpolate(1, [0, 1], [0, -Infinity])).toThrow(/outputRange must contain finite numbers/);
  });
});

describe('Easing.step0 / step1 / spring', () => {
  it('steps at 0 and at 1', () => {
    expect([-1, 0, 0.001, 0.5, 1].map(Easing.step0)).toEqual([0, 0, 1, 1, 1]);
    expect([0, 0.5, 0.999, 1, 2].map(Easing.step1)).toEqual([0, 0, 0, 1, 1]);
    expect(interpolate(4, [0, 10], [0, 100], { easing: Easing.step1 })).toBe(0);
    expect(interpolate(10, [0, 10], [0, 100], { easing: Easing.step1 })).toBe(100);
  });

  it('is the spring stretched over 30 frames at 30 fps, exactly 0 and 1 at the ends', () => {
    const config = { damping: 12, stiffness: 120 };
    const ease = Easing.spring(config);
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBe(1);
    expect(ease(2)).toBe(1);
    expect(ease(-1)).toBe(0);
    expect(ease(0.4)).toBe(spring({ fps: 30, frame: 0.4 * 30, config, durationInFrames: 30 }));
    // remotion@4.0.542's Easing.spring gives the same values.
    expect(ease(0.4)).toBe(1.127766645954996);
    expect(ease(0.999)).toBe(0.9968315171044551);
    expect(Easing.spring({ damping: 3, allowTail: true })(1)).toBe(1.0049209114861484);
    // Without a tail, a clamped interpolate stops at the end value.
    expect(interpolate(15, [0, 10], [0, 100], { easing: ease, extrapolateRight: 'clamp' })).toBe(100);
  });

  it('with allowTail keeps moving past the segment, even when clamped', () => {
    const config = { damping: 3 };
    const ease = Easing.spring({ ...config, allowTail: true });
    const settle = measureSpring({ fps: 30, config });
    expect(ease(0.5)).toBe(spring({ fps: 30, frame: 0.5 * settle, config }));
    expect(ease(1.5)).toBe(spring({ fps: 30, frame: 1.5 * settle, config }));
    // Past the end of the first segment its tail goes on top of the second segment.
    const options = { easing: [ease, Easing.linear], extrapolateRight: 'clamp' as const };
    expect(interpolate(12, [0, 10, 20], [0, 100, 100], options)).toBeCloseTo(100 + (ease(1.2) - 1) * 100, 10);
    expect(interpolate(25, [0, 10], [0, 100], { easing: ease, extrapolateRight: 'clamp' })).toBeCloseTo(ease(2.5) * 100, 10);
    // Easing.in keeps the tail (it returns the easing itself).
    expect(Easing.in(ease)).toBe(ease);
  });

  it('checks the config', () => {
    expect(() => Easing.spring({ mass: 0 })).toThrow(/mass > 0/);
    expect(() => Easing.spring({ damping: 0 })).toThrow(/never comes to rest/);
    expect(() => Easing.spring({ durationRestThreshold: 0 })).toThrow(/durationRestThreshold must be > 0/);
    // @ts-expect-error not a boolean
    expect(() => Easing.spring({ allowTail: 'yes' })).toThrow(/allowTail must be a boolean/);
  });
});
