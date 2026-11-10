// Animation utilities for Remotion-like framework

import { SpringConfig, InterpolateOptions, EasingFunction, Keyframe } from '../core/types';

// Easing functions
export const Easing = {
  linear: (t: number): number => t,
  
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
  
  easeInBounce: (t: number): number => 1 - Easing.easeOutBounce(1 - t),
  easeOutBounce: (t: number): number => {
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
  },
  easeInOutBounce: (t: number): number => 
    t < 0.5
      ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2
      : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,
  
  // Cubic bezier easing, like CSS cubic-bezier(x1, y1, x2, y2). The curve's x
  // is solved for t with Newton's method from a sampled guess, falling back to
  // bisection where Newton does not converge (steep or flat parts).
  bezier: (x1: number, y1: number, x2: number, y2: number): EasingFunction => {
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
  },
};

const isPositive = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0;

const resolveSpringConfig = (fn: string, config: SpringConfig['config'] = {}) => {
  const { damping = 10, mass = 1, stiffness = 100, overshootClamping = false } = config;
  if (!isPositive(mass) || !isPositive(stiffness) || !Number.isFinite(damping) || damping < 0) {
    throw new Error(
      `${fn}: config needs mass > 0, stiffness > 0 and damping >= 0, got mass ${mass}, stiffness ${stiffness}, damping ${damping}`
    );
  }
  return {
    omega: Math.sqrt(stiffness / mass),
    zeta: damping / (2 * Math.sqrt(stiffness * mass)),
    overshootClamping,
  };
};

// Position of a spring released at rest from 0 towards 1, after `time` seconds.
const springStep = (time: number, omega: number, zeta: number): number => {
  if (zeta < 1 - 1e-6) {
    // Underdamped
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * time) * (
      Math.cos(omegaD * time) + (zeta * omega / omegaD) * Math.sin(omegaD * time)
    );
  }
  if (zeta <= 1 + 1e-6) {
    // Critically damped
    return 1 - (1 + omega * time) * Math.exp(-omega * time);
  }
  // Overdamped: x = 1 - c1·e^(r1·t) - c2·e^(r2·t) with x(0) = 0 and x'(0) = 0.
  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -omega * (zeta - root);
  const r2 = -omega * (zeta + root);
  const c1 = r2 / (r2 - r1);
  const c2 = -r1 / (r2 - r1);
  return 1 - c1 * Math.exp(r1 * time) - c2 * Math.exp(r2 * time);
};

// First frame from which the spring stays within `threshold` of its target.
const settleFrame = (fps: number, omega: number, zeta: number, threshold: number): number => {
  const off = (n: number) => Math.abs(springStep(n / fps, omega, zeta) - 1);

  if (zeta >= 1 - 1e-6) {
    // Critically damped and overdamped springs approach 1 without overshoot,
    // so the first frame inside the threshold is the answer: search for it.
    let hi = 1;
    while (off(hi) >= threshold) hi *= 2;
    let lo = 0;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (off(mid) >= threshold) lo = mid;
      else hi = mid;
    }
    return hi;
  }

  if (zeta === 0) {
    throw new Error('measureSpring: a spring with damping 0 oscillates forever and never comes to rest');
  }
  // |x - 1| never exceeds the envelope e^(-ζωt) / sqrt(1 - ζ²); past the time
  // the envelope drops below the threshold, the spring has settled for good.
  // Walk back from there to the last frame that is still outside the threshold.
  const envelopeTime = Math.log(1 / (threshold * Math.sqrt(1 - zeta * zeta))) / (zeta * omega);
  for (let n = Math.ceil(envelopeTime * fps); n >= 0; n--) {
    if (off(n) >= threshold) return n + 1;
  }
  return 0;
};

/**
 * Spring from `from` to `to`, released at rest at frame 0.
 *
 * Without `durationInFrames` it follows the physics of `config` and settles
 * when it settles. With `durationInFrames` the motion is stretched in time so
 * that it settles (to within `durationRestThreshold`) at `durationInFrames`,
 * and from that frame on it is exactly `to`.
 */
export const spring = ({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
  durationInFrames,
  durationRestThreshold = 0.005,
}: SpringConfig): number => {
  if (!isPositive(fps)) {
    throw new Error(`spring: fps must be a positive number (use useVideoConfig().fps), got ${fps}`);
  }
  if (typeof frame !== 'number' || Number.isNaN(frame)) {
    throw new Error(`spring: frame must be a number, got ${frame}`);
  }
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error(`spring: from and to must be finite numbers, got ${from} and ${to}`);
  }
  if (durationInFrames !== undefined && !isPositive(durationInFrames)) {
    throw new Error(`spring: durationInFrames must be a positive number, got ${durationInFrames}`);
  }
  const { omega, zeta, overshootClamping } = resolveSpringConfig('spring', config);

  // Before the spring starts it rests at `from` (the closed form grows without
  // bound for negative time).
  if (frame <= 0) return from;

  let time = frame / fps;
  if (durationInFrames !== undefined) {
    if (frame >= durationInFrames) return to;
    const naturalDuration = measureSpring({ fps, config, threshold: durationRestThreshold });
    time = (frame * naturalDuration) / durationInFrames / fps;
  }

  let value = springStep(time, omega, zeta);

  // Clamp overshoot if needed
  if (overshootClamping) {
    value = Math.max(0, Math.min(1, value));
  }

  return from + (to - from) * value;
};

// Index of the segment [inputRange[i], inputRange[i + 1]] that `input` falls in;
// inputs past either end belong to the first or last segment (so extrapolation
// continues the outermost segment).
const findSegment = (input: number, inputRange: number[]): number => {
  for (let i = 1; i < inputRange.length - 1; i++) {
    if (input <= inputRange[i]) return i - 1;
  }
  return inputRange.length - 2;
};

// Shared argument checks of interpolate() and interpolateColors().
const checkRanges = (fn: string, input: number, inputRange: number[], outputLength: number) => {
  if (typeof input !== 'number' || Number.isNaN(input)) {
    throw new Error(`${fn}: input must be a number, got ${input}`);
  }
  if (inputRange.length !== outputLength) {
    throw new Error(`${fn}: inputRange and outputRange must have the same length`);
  }
  if (inputRange.length < 2) {
    throw new Error(`${fn}: inputRange must have at least 2 elements`);
  }
  for (let i = 0; i < inputRange.length; i++) {
    if (typeof inputRange[i] !== 'number' || Number.isNaN(inputRange[i])) {
      throw new Error(`${fn}: inputRange must contain numbers, got [${inputRange.join(', ')}]`);
    }
    if (i > 0 && inputRange[i] < inputRange[i - 1]) {
      throw new Error(`${fn}: inputRange must be ascending, got [${inputRange.join(', ')}]`);
    }
  }
};

// Progress through [start, end]; a zero-length segment is a step at `end`.
const segmentProgress = (input: number, start: number, end: number): number =>
  end === start ? (input >= end ? 1 : 0) : (input - start) / (end - start);

// Interpolate function
export const interpolate = (
  input: number,
  inputRange: number[],
  outputRange: number[],
  options: InterpolateOptions = {}
): number => {
  const {
    extrapolateLeft = 'clamp',
    extrapolateRight = 'clamp',
    easing,
  } = options;

  checkRanges('interpolate', input, inputRange, outputRange.length);
  outputRange.forEach((value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new Error(`interpolate: outputRange must contain numbers, got [${outputRange.join(', ')}]`);
    }
  });

  // Check if input is outside the range
  if (input < inputRange[0]) {
    if (extrapolateLeft === 'clamp') {
      return outputRange[0];
    } else if (extrapolateLeft === 'identity') {
      return input;
    }
    // extend - continue the linear extrapolation
  }

  if (input > inputRange[inputRange.length - 1]) {
    if (extrapolateRight === 'clamp') {
      return outputRange[outputRange.length - 1];
    } else if (extrapolateRight === 'identity') {
      return input;
    }
    // extend - continue the linear extrapolation
  }

  const segmentIndex = findSegment(input, inputRange);

  const inputStart = inputRange[segmentIndex];
  const inputEnd = inputRange[segmentIndex + 1];
  const outputStart = outputRange[segmentIndex];
  const outputEnd = outputRange[segmentIndex + 1];

  if (inputEnd === inputStart) {
    return segmentProgress(input, inputStart, inputEnd) === 1 ? outputEnd : outputStart;
  }

  // Calculate progress
  let progress = segmentProgress(input, inputStart, inputEnd);
  
  // Apply easing
  if (easing) {
    progress = easing(progress);
  }

  return outputStart + progress * (outputEnd - outputStart);
};

// Interpolate colors
// Parses #rgb, #rgba, #rrggbb, #rrggbbaa, and rgb()/rgba() in both the comma
// syntax `rgb(255, 0, 0, 0.5)` and the space syntax `rgb(255 0 0 / 50%)`;
// channels may be numbers (0–255) or percentages, alpha a number (0–1) or a
// percentage. Anything else throws.
const NUMBER = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?%?';
const COMMA_RGB = new RegExp(
  `^rgba?\\(\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*(?:,\\s*(${NUMBER})\\s*)?\\)$`,
  'i'
);
const SPACE_RGB = new RegExp(
  `^rgba?\\(\\s*(${NUMBER})\\s+(${NUMBER})\\s+(${NUMBER})\\s*(?:\\/\\s*(${NUMBER})\\s*)?\\)$`,
  'i'
);
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const parseColor = (color: string): [number, number, number, number] => {
  const value = typeof color === 'string' ? color.trim() : '';

  const hex = value.match(HEX)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? hex.split('').map((d) => d + d) : hex.match(/../g)!;
    const [r, g, b] = digits.map((d) => parseInt(d, 16));
    return [r, g, b, digits.length === 4 ? parseInt(digits[3], 16) / 255 : 1];
  }

  const rgb = value.match(COMMA_RGB) ?? value.match(SPACE_RGB);
  if (rgb) {
    const channel = (part: string) =>
      part.endsWith('%') ? (parseFloat(part) / 100) * 255 : parseFloat(part);
    const alpha = (part: string | undefined) =>
      part === undefined ? 1 : part.endsWith('%') ? parseFloat(part) / 100 : parseFloat(part);
    return [
      channel(rgb[1]),
      channel(rgb[2]),
      channel(rgb[3]),
      Math.max(0, Math.min(1, alpha(rgb[4]))),
    ];
  }

  throw new Error(
    `interpolateColors: unsupported color "${color}" (use #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() or rgba())`
  );
};

const formatColor = ([r, g, b, a]: [number, number, number, number]): string => {
  const channel = (x: number) => Math.round(Math.max(0, Math.min(255, x)));
  if (a >= 1) {
    return '#' + [r, g, b].map((x) => channel(x).toString(16).padStart(2, '0')).join('');
  }
  const alpha = Math.round(Math.max(0, a) * 1000) / 1000;
  return `rgba(${channel(r)}, ${channel(g)}, ${channel(b)}, ${alpha})`;
};

export const interpolateColors = (
  input: number,
  inputRange: number[],
  outputRange: string[]
): string => {
  checkRanges('interpolateColors', input, inputRange, outputRange.length);

  // Colors do not extrapolate: outside the range the end color holds.
  const clamped = Math.max(inputRange[0], Math.min(inputRange[inputRange.length - 1], input));
  const segmentIndex = findSegment(clamped, inputRange);

  const inputStart = inputRange[segmentIndex];
  const inputEnd = inputRange[segmentIndex + 1];
  const colorStart = parseColor(outputRange[segmentIndex]);
  const colorEnd = parseColor(outputRange[segmentIndex + 1]);

  const progress = segmentProgress(clamped, inputStart, inputEnd);
  const mix = (i: number) => colorStart[i] + progress * (colorEnd[i] - colorStart[i]);

  return formatColor([mix(0), mix(1), mix(2), mix(3)]);
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

/**
 * Number of frames until a spring released at frame 0 has settled: from the
 * returned frame on, it stays within `threshold` (a fraction of the distance
 * from `from` to `to`) of its target.
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
  if (!isPositive(threshold) || threshold >= 1) {
    throw new Error(`measureSpring: threshold must be between 0 and 1, got ${threshold}`);
  }
  const { omega, zeta } = resolveSpringConfig('measureSpring', config);
  return settleFrame(fps, omega, zeta, threshold);
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

/**
 * 2D value noise: smooth (continuous) in x and y, deterministic, in [0, 1).
 * Each integer lattice point gets a value from random(); between them the
 * values are mixed bilinearly with smoothstep weights.
 */
export const noise2D = (x: number, y: number): number => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`noise2D: x and y must be finite numbers, got ${x}, ${y}`);
  }
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const fx = x - X;
  const fy = y - Y;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);

  const lattice = (i: number, j: number) => random(`noise2D:${i}:${j}`);
  const a = lattice(X, Y);
  const b = lattice(X + 1, Y);
  const c = lattice(X, Y + 1);
  const d = lattice(X + 1, Y + 1);

  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return top + (bottom - top) * v;
};

export { Easing as easing };
