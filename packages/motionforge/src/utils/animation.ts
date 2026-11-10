// Animation utilities for Remotion-like framework

import { SpringConfig, InterpolateOptions, EasingFunction, ExtrapolateType, Keyframe } from '../core/types';
import { parseColor } from './colors';

// Easing functions. Every easing returns exactly 0 at 0 and 1 at 1.
const pinned = (fn: EasingFunction): EasingFunction => (t: number) => (t === 0 ? 0 : t === 1 ? 1 : fn(t));

// Some curves are only defined on [0, 1]; interpolate() with 'extend' can
// pass values outside it (as in Remotion).
const clampUnit = (t: number) => Math.min(1, Math.max(0, t));

const easeOutBounce = (t: number): number => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};

// Cubic bezier easing, like CSS cubic-bezier(x1, y1, x2, y2). The curve's x
// is solved for t with Newton's method from a sampled guess, falling back to
// bisection where Newton does not converge (steep or flat parts).
const cubicBezier = (x1: number, y1: number, x2: number, y2: number): EasingFunction => {
  if (![x1, y1, x2, y2].every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error(
      `Easing.bezier: control points must be finite and x1, x2 must be in [0, 1], got (${x1}, ${y1}, ${x2}, ${y2})`
    );
  }
  if (x1 === y1 && x2 === y2) return (t: number) => t;

  // Polynomial coefficients of one coordinate: ((a*t + b)*t + c)*t.
  const coefficients = (p1: number, p2: number) => [1 - 3 * p2 + 3 * p1, 3 * p2 - 6 * p1, 3 * p1];
  const [ax, bx, cx] = coefficients(x1, x2);
  const [ay, by, cy] = coefficients(y1, y2);
  const curveX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const curveY = (t: number) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t: number) => (3 * ax * t + 2 * bx) * t + cx;

  const samples = 11;
  const step = 1 / (samples - 1);
  const table = Array.from({ length: samples }, (_, i) => curveX(i * step));

  const solveT = (x: number): number => {
    let i = 0;
    while (i < samples - 2 && table[i + 1] <= x) i++;
    const lo = i * step;
    const hi = lo + step;
    const span = table[i + 1] - table[i];
    let t = span > 0 ? lo + ((x - table[i]) / span) * step : lo;

    for (let k = 0; k < 8; k++) {
      const error = curveX(t) - x;
      if (Math.abs(error) < 1e-12) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-9) break;
      t -= error / slope;
    }
    // Outside [0, 1] (extrapolated input) only Newton applies.
    if (x < 0 || x > 1) return t;
    if (t >= lo && t <= hi && Math.abs(curveX(t) - x) < 1e-12) return t;

    // x(t) is monotonic on [0, 1] when x1, x2 are in [0, 1].
    let a = lo;
    let b = hi;
    for (let k = 0; k < 60; k++) {
      t = (a + b) / 2;
      if (curveX(t) < x) a = t;
      else b = t;
      if (b - a < 1e-12) break;
    }
    return (a + b) / 2;
  };

  return (x: number): number => (x === 0 ? 0 : x === 1 ? 1 : curveY(solveT(x)));
};

const pinAll = <T extends Record<string, EasingFunction>>(fns: T): T =>
  Object.fromEntries(Object.entries(fns).map(([name, fn]) => [name, pinned(fn)])) as T;

// The named curves (easeInQuad, easeOutCubic, ...).
const namedEasings = pinAll({
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => 
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  
  easeInQuart: (t: number): number => t * t * t * t,
  easeOutQuart: (t: number): number => 1 - (--t) * t * t * t,
  easeInOutQuart: (t: number): number => 
    t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  
  easeInQuint: (t: number): number => t * t * t * t * t,
  easeOutQuint: (t: number): number => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t: number): number => 
    t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  
  easeInSine: (t: number): number => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t: number): number => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t: number): number => -(Math.cos(Math.PI * t) - 1) / 2,
  
  easeInExpo: (t: number): number => (t === 0 ? 0 : Math.pow(2, 10 * (t - 1))),
  easeOutExpo: (t: number): number => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  easeInOutExpo: (t: number): number => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  
  easeInCirc: (t: number): number => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t: number): number => Math.sqrt(1 - (--t) * t),
  easeInOutCirc: (t: number): number => 
    t < 0.5
      ? (1 - Math.sqrt(1 - 4 * t * t)) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  
  easeInBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t: number): number => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  
  easeInElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t: number): number => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t: number): number => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
    return (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  
  easeInBounce: (t: number): number => 1 - easeOutBounce(1 - t),
  easeOutBounce,
  easeInOutBounce: (t: number): number => 
    t < 0.5
      ? (1 - easeOutBounce(1 - 2 * t)) / 2
      : (1 + easeOutBounce(2 * t - 1)) / 2,
});

const checkEasing = (name: string, easing: unknown): EasingFunction => {
  if (typeof easing !== 'function') {
    throw new Error(`Easing.${name}: expects an easing function, got ${easing}`);
  }
  return easing as EasingFunction;
};

const checkNumber = (name: string, value: unknown, min = -Infinity): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min) {
    throw new Error(`Easing.${name}: expects a finite number${min > -Infinity ? ` >= ${min}` : ''}, got ${value}`);
  }
  return value;
};

const easeCurve = cubicBezier(0.42, 0, 1, 1);

// Easings whose motion continues past t = 1 (Easing.spring({ allowTail: true })):
// interpolate() lets them run on past the end of their segment even when the
// right side is clamped, as in Remotion.
const extendsRight = new WeakSet<EasingFunction>();

/** Options of Easing.spring(): a spring config, as in Remotion. */
export interface EasingSpringConfig {
  damping?: number;
  mass?: number;
  stiffness?: number;
  overshootClamping?: boolean;
  /**
   * Without it (default false) the spring is stretched so that it settles (to
   * within `durationRestThreshold`) at t = 1, and is exactly 1 from t = 1 on.
   * With it, t = 1 is the time the spring settles, and the motion goes on
   * after it: interpolate() continues it past the end of the segment, even
   * with extrapolateRight 'clamp'.
   */
  allowTail?: boolean;
  /** Distance from the target that counts as settled (default 0.005). */
  durationRestThreshold?: number;
}

// The spring easing runs on a 30 fps clock of 30 frames, as in Remotion.
const SPRING_EASING_FPS = 30;

/**
 * Easing functions for interpolate(). Two families:
 *
 * - Remotion's (from React Native): base curves `linear`, `ease`, `quad`,
 *   `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `elastic(bounciness)`,
 *   `back(s)`, `bounce`, `bezier(x1, y1, x2, y2)`, `step0`, `step1`,
 *   `spring(config)`, composed with `Easing.in(f)` (as is), `Easing.out(f)`
 *   (mirrored) and `Easing.inOut(f)` (in for the first half, out for the
 *   second): `Easing.out(Easing.cubic)`.
 * - Named curves: `easeInQuad`, `easeOutCubic`, `easeInOutBack`, ...
 *
 * Every easing returns exactly 0 at 0 and 1 at 1 (a spring with `allowTail`
 * is at its settle threshold at 1, not exactly 1).
 */
export const Easing = {
  ...namedEasings,
  /** 1 for any t > 0, else 0. */
  step0: (t: number): number => (t > 0 ? 1 : 0),
  /** 1 for any t >= 1, else 0. */
  step1: (t: number): number => (t >= 1 ? 1 : 0),
  linear: (t: number): number => t,
  /** Remotion's `ease`: bezier(0.42, 0, 1, 1). */
  ease: easeCurve,
  quad: pinned((t) => t * t),
  cubic: pinned((t) => t * t * t),
  /** t to the power n (n > 0). */
  poly: (n: number): EasingFunction => {
    const power = checkNumber('poly', n);
    if (power <= 0) throw new Error(`Easing.poly: expects n > 0, got ${n}`);
    return pinned((t) => t ** power);
  },
  sin: pinned((t) => 1 - Math.cos((t * Math.PI) / 2)),
  circle: pinned((t) => {
    const u = clampUnit(t);
    return 1 - Math.sqrt(1 - u * u);
  }),
  exp: pinned((t) => 2 ** (10 * (t - 1))),
  /** Springy overshoot; `bounciness` (default 1) sets how many times it goes back and forth. */
  elastic: (bounciness: number = 1): EasingFunction => {
    const p = checkNumber('elastic', bounciness, 0) * Math.PI;
    return pinned((t) => 1 - Math.cos((t * Math.PI) / 2) ** 3 * Math.cos(t * p));
  },
  /** Pulls back before moving; `s` (default 1.70158) sets how far. */
  back: (s: number = 1.70158): EasingFunction => {
    const overshoot = checkNumber('back', s);
    return pinned((t) => t * t * ((overshoot + 1) * t - overshoot));
  },
  bounce: pinned((t) => easeOutBounce(clampUnit(t))),
  bezier: cubicBezier,
  /**
   * A spring as an easing (Remotion's Easing.spring, same values): the
   * spring() motion from 0 to 1 with this config, on a 30 fps clock. See
   * EasingSpringConfig for `allowTail`.
   */
  spring: (config: EasingSpringConfig = {}): EasingFunction => {
    if (typeof config !== 'object' || config === null) {
      throw new Error(`Easing.spring: expects a config object, got ${JSON.stringify(config)}`);
    }
    const { allowTail = false, durationRestThreshold, ...springConfig } = config;
    if (typeof allowTail !== 'boolean') {
      throw new Error(`Easing.spring: allowTail must be a boolean, got ${JSON.stringify(allowTail)}`);
    }
    resolveSpringConfig('Easing.spring', springConfig);
    // Checks the threshold now rather than on the first call.
    const settle = measureSpring({ fps: SPRING_EASING_FPS, config: springConfig, threshold: durationRestThreshold });
    if (settle === Infinity) {
      throw new Error('Easing.spring: durationRestThreshold must be > 0 (with 0 the spring never settles)');
    }
    if (allowTail) {
      // The natural motion: t = 1 is the frame it settles at.
      const easing: EasingFunction = (t) =>
        t <= 0 ? 0 : spring({ fps: SPRING_EASING_FPS, frame: t * settle, config: springConfig });
      extendsRight.add(easing);
      return easing;
    }
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return spring({
        fps: SPRING_EASING_FPS,
        frame: t * SPRING_EASING_FPS,
        config: springConfig,
        durationInFrames: SPRING_EASING_FPS,
        durationRestThreshold,
      });
    };
  },
  /** Runs the easing forwards (returns it as is). */
  in: (easing: EasingFunction): EasingFunction => {
    const fn = checkEasing('in', easing);
    // A spring with a tail keeps it (Remotion returns the easing itself).
    return extendsRight.has(fn) ? fn : pinned(fn);
  },
  /** Runs the easing backwards: out(f)(t) = 1 - f(1 - t). */
  out: (easing: EasingFunction): EasingFunction => {
    const fn = checkEasing('out', easing);
    return pinned((t) => 1 - fn(1 - t));
  },
  /** Symmetric: the easing for the first half, mirrored for the second. */
  inOut: (easing: EasingFunction): EasingFunction => {
    const fn = checkEasing('inOut', easing);
    return pinned((t) => (t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2));
  },
};

const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

interface ResolvedSpringConfig {
  damping: number;
  mass: number;
  stiffness: number;
  overshootClamping: boolean;
}

const resolveSpringConfig = (fn: string, config: SpringConfig['config'] = {}): ResolvedSpringConfig => {
  const { damping = 10, mass = 1, stiffness = 100, overshootClamping = false } = config;
  if (typeof damping === 'number' && damping <= 0) {
    throw new Error(`${fn}: damping must be > 0 (a spring without damping never comes to rest), got ${damping}`);
  }
  if (!isPositive(mass) || !isPositive(stiffness) || !isPositive(damping)) {
    throw new Error(
      `${fn}: config needs mass > 0, stiffness > 0 and damping > 0, got mass ${mass}, stiffness ${stiffness}, damping ${damping}`
    );
  }
  return { damping, mass, stiffness, overshootClamping };
};

// The spring is Remotion's (packages/core/src/spring): a simulation stepped
// once per frame, each step the exact solution of the damped oscillator over
// that step (at most 64 ms long). A damping ratio of 1 or more is treated as
// critically damped. The arithmetic follows Remotion's operation by operation,
// so the values are the same to the last bit.

interface SpringNode {
  current: number;
  velocity: number;
  lastTimestamp: number;
}

const advanceSpring = (node: SpringNode, now: number, { damping, mass, stiffness }: ResolvedSpringConfig): SpringNode => {
  const toValue = 1;
  const { lastTimestamp, current, velocity } = node;
  const deltaTime = Math.min(now - lastTimestamp, 64);

  const c = damping;
  const m = mass;
  const k = stiffness;
  const v0 = -velocity;
  const x0 = toValue - current;

  const zeta = c / (2 * Math.sqrt(k * m)); // damping ratio
  const omega0 = Math.sqrt(k / m); // undamped angular frequency
  const omega1 = omega0 * Math.sqrt(1 - zeta ** 2); // damped angular frequency

  const t = deltaTime / 1000;

  if (zeta < 1) {
    const sin1 = Math.sin(omega1 * t);
    const cos1 = Math.cos(omega1 * t);
    const envelope = Math.exp(-zeta * omega0 * t);
    const frag1 = envelope * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
    return {
      current: toValue - frag1,
      // The derivative of the position.
      velocity: zeta * omega0 * frag1 - envelope * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1),
      lastTimestamp: now,
    };
  }
  const envelope = Math.exp(-omega0 * t);
  return {
    current: toValue - envelope * (x0 + (v0 + omega0 * x0) * t),
    velocity: envelope * (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0),
    lastTimestamp: now,
  };
};

// Simulated positions and velocities at whole frames, per fps and config, so
// that rendering frame after frame steps the simulation once per frame. The
// values do not depend on what is cached: dropping a cache only costs time.
interface SpringSimulation {
  current: number[];
  velocity: number[];
}
const SPRING_CACHE_LIMIT = 256;
const simulations = new Map<string, SpringSimulation>();

const simulationOf = (fps: number, config: ResolvedSpringConfig): SpringSimulation => {
  const key = `${fps}-${config.damping}-${config.mass}-${config.stiffness}`;
  let simulation = simulations.get(key);
  if (!simulation) {
    if (simulations.size >= SPRING_CACHE_LIMIT) simulations.clear();
    simulation = { current: [], velocity: [] };
    simulations.set(key, simulation);
  }
  return simulation;
};

// Position of a spring released at rest from 0 towards 1, at `frame` (frames
// before 0 are frame 0). A fractional frame is one more, shorter step from the
// whole frame before it.
const springPosition = (frame: number, fps: number, config: ResolvedSpringConfig): number => {
  const { current, velocity } = simulationOf(fps, config);
  const frameClamped = Math.max(0, frame);
  const whole = Math.floor(frameClamped);
  for (let f = current.length; f <= whole; f++) {
    const previous: SpringNode =
      f === 0
        ? { current: 0, velocity: 0, lastTimestamp: 0 }
        : { current: current[f - 1], velocity: velocity[f - 1], lastTimestamp: ((f - 1) / fps) * 1000 };
    const node = advanceSpring(previous, (f / fps) * 1000, config);
    current.push(node.current);
    velocity.push(node.velocity);
  }
  if (frameClamped % 1 > 0) {
    const node: SpringNode = { current: current[whole], velocity: velocity[whole], lastTimestamp: (whole / fps) * 1000 };
    return advanceSpring(node, (frameClamped / fps) * 1000, config).current;
  }
  return current[whole];
};

/**
 * Spring from `from` to `to`, as Remotion's spring(): the same values for the
 * same input.
 *
 * The spring is released at rest at frame `delay` (default 0) and before that
 * is at `from`. A damping ratio `damping / (2·√(stiffness·mass))` of 1 or
 * more is critically damped (as in Remotion, so `damping: 200` is a fast
 * spring without bounce, not a slow overdamped one). `overshootClamping`
 * keeps the motion from passing `to`.
 *
 * With `durationInFrames` the motion is stretched in time so that its natural
 * settle time (`measureSpring({ fps, config, threshold:
 * durationRestThreshold })`) becomes `durationInFrames`: at that frame it is
 * within the threshold of `to` (not exactly `to`), and after it it is exactly
 * `to`.
 *
 * `reverse` plays the motion backwards in time: it starts near `to` and comes
 * to rest at `from` after its length (`durationInFrames`, or the natural
 * settle time); `delay` then holds it at its start for `delay` frames.
 */
export const spring = ({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
  durationInFrames,
  durationRestThreshold,
  delay = 0,
  reverse = false,
}: SpringConfig): number => {
  if (!isPositive(fps)) {
    throw new Error(`spring: fps must be a positive number (use useVideoConfig().fps), got ${fps}`);
  }
  if (typeof frame !== 'number' || !Number.isFinite(frame)) {
    throw new Error(`spring: frame must be a finite number, got ${frame}`);
  }
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error(`spring: from and to must be finite numbers, got ${from} and ${to}`);
  }
  if (durationInFrames !== undefined && !isPositive(durationInFrames)) {
    throw new Error(`spring: durationInFrames must be a positive number, got ${durationInFrames}`);
  }
  if (typeof delay !== 'number' || !Number.isFinite(delay)) {
    throw new Error(`spring: delay must be a finite number of frames, got ${delay}`);
  }
  if (typeof reverse !== 'boolean') {
    throw new Error(`spring: reverse must be a boolean, got ${reverse}`);
  }
  const resolved = resolveSpringConfig('spring', config);

  let naturalDuration = 0;
  if (reverse || durationInFrames !== undefined) {
    naturalDuration = measureSpring({ fps, config, threshold: durationRestThreshold });
    if (naturalDuration === Infinity) {
      throw new Error('spring: durationRestThreshold must be > 0 with durationInFrames or reverse (with 0 the spring never settles)');
    }
  }

  // Remotion's order of operations, so that the frame (and the value) is the same to the last bit.
  const reverseProcessed = reverse ? (durationInFrames ?? naturalDuration) - frame : frame;
  const delayProcessed = reverseProcessed + (reverse ? delay : -delay);
  const durationProcessed =
    durationInFrames === undefined ? delayProcessed : delayProcessed / (durationInFrames / naturalDuration);

  if (durationInFrames !== undefined && delayProcessed > durationInFrames) {
    return to;
  }

  const current = springPosition(durationProcessed, fps, resolved);
  const inner = resolved.overshootClamping ? Math.min(current, 1) : current;
  if (from === 0 && to === 1) return inner;
  // interpolate(inner, [0, 1], [from, to]) as Remotion computes it.
  return from === to ? from : inner * (to - from) + from;
};

// Index of the segment [inputRange[i], inputRange[i + 1]] that `input` falls in;
// inputs past either end belong to the first or last segment (so extrapolation
// continues the outermost segment).
const findSegment = (input: number, inputRange: readonly number[]): number => {
  for (let i = 1; i < inputRange.length - 1; i++) {
    if (input <= inputRange[i]) return i - 1;
  }
  return inputRange.length - 2;
};

// Shared argument checks of interpolate(), interpolateColors() and interpolateStyles().
export const checkInterpolateArgs = (
  fn: string,
  input: number,
  inputRange: readonly number[],
  outputLength: number,
  options: { easing?: unknown; posterize?: unknown },
) => {
  if (typeof input !== 'number' || Number.isNaN(input)) {
    throw new Error(`${fn}: input must be a number, got ${input}`);
  }
  if (!Array.isArray(inputRange)) {
    throw new Error(`${fn}: inputRange must be an array of numbers, got ${JSON.stringify(inputRange)}`);
  }
  if (inputRange.length !== outputLength) {
    throw new Error(
      `${fn}: inputRange (${inputRange.length}) and outputRange (${outputLength}) must have the same length`,
    );
  }
  if (inputRange.length < 1) {
    throw new Error(`${fn}: inputRange must have at least 1 element`);
  }
  for (let i = 0; i < inputRange.length; i++) {
    if (typeof inputRange[i] !== 'number' || !Number.isFinite(inputRange[i])) {
      throw new Error(`${fn}: inputRange must contain finite numbers, got [${inputRange.join(', ')}]`);
    }
    if (i > 0 && inputRange[i] < inputRange[i - 1]) {
      throw new Error(`${fn}: inputRange must be ascending, got [${inputRange.join(', ')}]`);
    }
  }
  const { easing, posterize } = options;
  const segments = inputRange.length - 1;
  if (Array.isArray(easing)) {
    if (easing.length !== segments) {
      throw new Error(
        `${fn}: an easing array needs one easing per segment (inputRange.length - 1 = ${segments}), got ${easing.length}`,
      );
    }
    easing.forEach((f, i) => {
      if (typeof f !== 'function') throw new Error(`${fn}: easing[${i}] must be a function, got ${f}`);
    });
  } else if (easing !== undefined && typeof easing !== 'function') {
    throw new Error(`${fn}: easing must be a function or an array of functions, got ${easing}`);
  }
  if (posterize !== undefined && (typeof posterize !== 'number' || !Number.isFinite(posterize) || posterize <= 0)) {
    throw new Error(`${fn}: posterize must be a positive finite number, got ${posterize}`);
  }
};

const EXTRAPOLATE = ['clamp', 'extend', 'identity', 'wrap'];

const identity: EasingFunction = (t) => t;

const easingOfSegment = (easing: InterpolateOptions['easing'], segment: number): EasingFunction =>
  easing === undefined ? identity : typeof easing === 'function' ? easing : easing[segment];

// Value of segment `i` at `input`: inside the segment, or past its ends as
// the extrapolation says ('wrap' is resolved before).
const segmentValue = (
  input: number,
  i: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  easing: EasingFunction,
  left: ExtrapolateType,
  right: ExtrapolateType,
): number => {
  const start = inputRange[i];
  const end = inputRange[i + 1];
  const from = outputRange[i];
  const to = outputRange[i + 1];
  let x = input;
  if (x < start) {
    if (left === 'identity') return x;
    if (left === 'clamp') x = start;
  }
  if (x > end) {
    if (right === 'identity') return x;
    if (right === 'clamp' && !extendsRight.has(easing)) x = end;
  }
  // A zero-length segment is a step at its end.
  if (end === start) return x >= end ? to : from;
  return from + easing((x - start) / (end - start)) * (to - from);
};

/**
 * Maps `input` from `inputRange` to `outputRange` (Remotion's interpolate()).
 *
 * - `inputRange` is ascending; a zero-length segment is a step at its end.
 *   With one element the output is `outputRange[0]`.
 * - `extrapolateLeft` / `extrapolateRight`: 'extend' (default) continues the
 *   outermost segment, 'clamp' holds the end value, 'identity' returns the
 *   input, 'wrap' repeats the whole range.
 * - `easing`: one function, or one per segment.
 * - `posterize`: the input is first rounded down to a multiple of it.
 */
export const interpolate = (
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options: InterpolateOptions = {},
): number => {
  const { extrapolateLeft = 'extend', extrapolateRight = 'extend', easing, posterize } = options;

  checkInterpolateArgs('interpolate', input, inputRange, outputRange.length, options);
  outputRange.forEach((value) => {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`interpolate: outputRange must contain finite numbers, got [${outputRange.join(', ')}]`);
    }
  });
  for (const [name, value] of [['extrapolateLeft', extrapolateLeft], ['extrapolateRight', extrapolateRight]]) {
    if (!EXTRAPOLATE.includes(value)) {
      throw new Error(`interpolate: ${name} must be one of ${EXTRAPOLATE.join(', ')}, got ${JSON.stringify(value)}`);
    }
  }

  if (inputRange.length === 1) return outputRange[0];

  let x = posterize === undefined ? input : Math.floor(input / posterize) * posterize;

  const first = inputRange[0];
  const last = inputRange[inputRange.length - 1];

  // 'wrap' repeats the whole input range (before a segment is chosen).
  if ((x < first && extrapolateLeft === 'wrap') || (x > last && extrapolateRight === 'wrap')) {
    const span = last - first;
    if (span === 0) {
      throw new Error(`interpolate: extrapolate 'wrap' needs an inputRange that spans more than one value, got [${inputRange.join(', ')}]`);
    }
    x = ((((x - first) % span) + span) % span) + first;
  }

  const segment = findSegment(x, inputRange);
  let result = segmentValue(
    x, segment, inputRange, outputRange, easingOfSegment(easing, segment), extrapolateLeft, extrapolateRight,
  );

  // A spring easing with a tail in an earlier segment is still moving: its
  // overshoot past the end of its segment is added on top.
  for (let j = 0; j < segment; j++) {
    const segmentEasing = easingOfSegment(easing, j);
    if (!extendsRight.has(segmentEasing) || x <= inputRange[j + 1]) continue;
    result +=
      segmentValue(x, j, inputRange, outputRange, segmentEasing, extrapolateLeft, 'extend') - outputRange[j + 1];
  }
  return result;
};

/** Options of interpolateColors(), as in Remotion. */
export interface InterpolateColorsOptions {
  easing?: InterpolateOptions['easing'];
  posterize?: number;
}

/**
 * Maps `input` to a color between the colors of `outputRange` (Remotion's
 * interpolateColors()). Outside the input range the end colors hold. The
 * channels are mixed in sRGB; the result is `rgba(r, g, b, a)` with integer
 * channels and alpha rounded to 3 decimals.
 *
 * Colors: #rgb, #rgba, #rrggbb, #rrggbbaa, CSS named colors (and
 * `transparent`), rgb()/rgba(), hsl()/hsla(), hwb(), lab(), lch(), oklab(),
 * oklch() in the comma or the space syntax (`rgb(255 0 0 / 50%)`).
 */
export const interpolateColors = (
  input: number,
  inputRange: readonly number[],
  outputRange: readonly string[],
  options: InterpolateColorsOptions = {},
): string => {
  checkInterpolateArgs('interpolateColors', input, inputRange, outputRange.length, options);
  const colors = outputRange.map((color) => parseColor(color, 'interpolateColors'));
  const channel = (index: number) =>
    interpolate(
      input,
      inputRange,
      colors.map((c) => c[index]),
      { easing: options.easing, posterize: options.posterize, extrapolateLeft: 'clamp', extrapolateRight: 'clamp' },
    );
  const byte = (x: number) => Math.round(Math.max(0, Math.min(255, x)));
  const alpha = Math.round(Math.max(0, Math.min(1, channel(3))) * 1000) / 1000;
  return `rgba(${byte(channel(0))}, ${byte(channel(1))}, ${byte(channel(2))}, ${alpha})`;
};

// Keyframe animation
export const useKeyframes = (
  keyframes: Keyframe[],
  frame: number
): number | string => {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;

  // Sort keyframes by frame
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);

  // Find surrounding keyframes
  let prev = sorted[0];
  let next = sorted[sorted.length - 1];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }

  if (frame <= prev.frame) return prev.value;
  if (frame >= next.frame) return next.value;

  // Calculate progress
  let progress = (frame - prev.frame) / (next.frame - prev.frame);

  // Apply easing
  if (next.easing) {
    progress = next.easing(progress);
  } else if (prev.easing) {
    progress = prev.easing(progress);
  }

  // Interpolate values
  if (typeof prev.value === 'number' && typeof next.value === 'number') {
    return prev.value + progress * (next.value - prev.value);
  }

  // For strings, just return the previous or next based on progress
  return progress < 0.5 ? prev.value : next.value;
};

const measureCache = new Map<string, number>();

/**
 * Number of frames until a spring released at frame 0 has settled, as
 * Remotion's measureSpring() (same values): the first frame within
 * `threshold` (a fraction of the distance from `from` to `to`, default 0.005)
 * of its target, moved past any frame within the next 20 that is outside it
 * again. A threshold of 0 gives Infinity, of 1 or more 0.
 */
export const measureSpring = ({
  fps,
  config = {},
  threshold = 0.005,
}: {
  fps: number;
  config?: SpringConfig['config'];
  threshold?: number;
}): number => {
  if (!isPositive(fps)) {
    throw new Error(`measureSpring: fps must be a positive number, got ${fps}`);
  }
  if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold < 0) {
    throw new Error(`measureSpring: threshold must be a number >= 0, got ${threshold}`);
  }
  const resolved = resolveSpringConfig('measureSpring', config);
  if (threshold === 0) return Infinity;
  if (threshold === 1) return 0;

  const key = `${fps}-${resolved.damping}-${resolved.mass}-${resolved.stiffness}-${threshold}`;
  const cached = measureCache.get(key);
  if (cached !== undefined) return cached;

  const difference = (n: number) => Math.abs(springPosition(n, fps, resolved) - 1);
  let frame = 0;
  while (difference(frame) >= threshold) frame++;

  // A bouncy spring can leave the threshold again: it has settled once it
  // stays inside for 20 frames (Remotion's loop, counted the same way).
  let finishedFrame = frame;
  for (let i = 0; i < 20; i++) {
    frame++;
    if (difference(frame) >= threshold) {
      i = 0;
      finishedFrame = frame + 1;
    }
  }

  if (measureCache.size >= SPRING_CACHE_LIMIT) measureCache.clear();
  measureCache.set(key, finishedFrame);
  return finishedFrame;
};

// Calculate frames from seconds
export const getFramesFromSeconds = (seconds: number, fps: number): number => {
  return Math.round(seconds * fps);
};

// Calculate seconds from frames
export const getSecondsFromFrames = (frames: number, fps: number): number => {
  return frames / fps;
};

// Range utility
export const range = (start: number, end: number, step: number = 1): number[] => {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
};

// Random with seed (for reproducibility).
// FNV-1a over the seed string, then an avalanche finalizer so that neighbouring
// seeds (1, 2, 3 or "a1", "a2") give unrelated values.
export const random = (seed: string | number, min: number = 0, max: number = 1): number => {
  const str = typeof seed === 'number' ? seed.toString() : seed;
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x85ebca6b);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 0xc2b2ae35);
  hash ^= hash >>> 16;
  const normalized = (hash >>> 0) / 4294967296;
  return min + normalized * (max - min);
};

export { Easing as easing };
