/**
 * Path geometry without the DOM: length, point and tangent at a length. Arcs
 * and curves are measured exactly (Gauss-Legendre quadrature), so the numbers
 * are the same in Node and in every browser.
 */
import { type AbsoluteInstruction, type Point, normalizeInstructions, parsePath } from './instructions';

export interface Segment {
  length: number;
  point(t: number): Point;
  derivative(t: number): Point;
  /** Parameter t in [0, 1] at arc length `s` along the segment. */
  tAtLength(s: number): number;
}

// Gauss-Legendre nodes and weights on [-1, 1], computed once (Newton on the
// Legendre polynomial), so no hand-copied constants.
const GAUSS_ORDER = 12;
const [GAUSS_X, GAUSS_W] = (() => {
  const xs: number[] = [];
  const ws: number[] = [];
  for (let i = 1; i <= GAUSS_ORDER; i++) {
    let x = Math.cos((Math.PI * (i - 0.25)) / (GAUSS_ORDER + 0.5));
    let derivative = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      let p0 = 1;
      let p1 = x;
      for (let k = 2; k <= GAUSS_ORDER; k++) {
        const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
        p0 = p1;
        p1 = p2;
      }
      derivative = (GAUSS_ORDER * (x * p1 - p0)) / (x * x - 1);
      const step = p1 / derivative;
      x -= step;
      if (Math.abs(step) < 1e-16) break;
    }
    xs.push(x);
    ws.push(2 / ((1 - x * x) * derivative * derivative));
  }
  return [xs, ws];
})();

const integrate = (speed: (t: number) => number, a: number, b: number): number => {
  const half = (b - a) / 2;
  const mid = (a + b) / 2;
  let sum = 0;
  for (let i = 0; i < GAUSS_ORDER; i++) sum += GAUSS_W[i] * speed(mid + half * GAUSS_X[i]);
  return sum * half;
};

const PIECES = 16;

// A smooth parametric segment: its length is integrated piecewise, and the
// parameter at a length is found by Newton steps safeguarded by bisection.
const curveSegment = (point: (t: number) => Point, derivative: (t: number) => Point): Segment => {
  const speed = (t: number) => {
    const d = derivative(t);
    return Math.hypot(d.x, d.y);
  };
  const cumulative = [0];
  for (let k = 0; k < PIECES; k++) {
    cumulative.push(cumulative[k] + integrate(speed, k / PIECES, (k + 1) / PIECES));
  }
  const length = cumulative[PIECES];
  return {
    length,
    point,
    derivative,
    tAtLength(s) {
      if (s <= 0) return 0;
      if (s >= length) return 1;
      let k = 0;
      while (k < PIECES - 1 && cumulative[k + 1] < s) k++;
      const a = k / PIECES;
      const target = s - cumulative[k];
      const pieceLength = cumulative[k + 1] - cumulative[k];
      let lo = a;
      let hi = (k + 1) / PIECES;
      let t = pieceLength > 0 ? a + (target / pieceLength) * (hi - lo) : a;
      for (let iteration = 0; iteration < 60; iteration++) {
        const error = integrate(speed, a, t) - target;
        if (Math.abs(error) <= 1e-12 * Math.max(1, length)) break;
        if (error > 0) hi = t;
        else lo = t;
        const v = speed(t);
        const next = v > 0 ? t - error / v : NaN;
        t = next > lo && next < hi ? next : (lo + hi) / 2;
        if (hi - lo < 1e-15) break;
      }
      return t;
    },
  };
};

export const lineSegment = (p0: Point, p1: Point): Segment => {
  const length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  return {
    length,
    point: (t) => ({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t }),
    derivative: () => ({ x: p1.x - p0.x, y: p1.y - p0.y }),
    tAtLength: (s) => (length === 0 ? 0 : Math.max(0, Math.min(1, s / length))),
  };
};

const quadSegment = (p0: Point, p1: Point, p2: Point): Segment =>
  curveSegment(
    (t) => {
      const u = 1 - t;
      return {
        x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
        y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      };
    },
    (t) => ({
      x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
      y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
    }),
  );

export const cubicSegment = (p0: Point, p1: Point, p2: Point, p3: Point): Segment =>
  curveSegment(
    (t) => {
      const u = 1 - t;
      const a = u * u * u;
      const b = 3 * u * u * t;
      const c = 3 * u * t * t;
      const d = t * t * t;
      return {
        x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
        y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
      };
    },
    (t) => {
      const u = 1 - t;
      return {
        x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
        y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y),
      };
    },
  );

// Endpoint to center parameterization (SVG 1.1, appendix F.6.5 and F.6.6).
const arcSegment = (
  p0: Point,
  radiusX: number,
  radiusY: number,
  rotationDegrees: number,
  largeArc: boolean,
  sweep: boolean,
  p1: Point,
): Segment => {
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  if ((p0.x === p1.x && p0.y === p1.y) || rx === 0 || ry === 0) return lineSegment(p0, p1);

  const phi = (rotationDegrees * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0.x - p1.x) / 2;
  const dy = (p0.y - p1.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;

  const lambda = (x1 * x1) / (rx * rx) + (y1 * y1) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coefficient = (largeArc !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cxPrime = (coefficient * rx * y1) / ry;
  const cyPrime = (-coefficient * ry * x1) / rx;
  const cx = cos * cxPrime - sin * cyPrime + (p0.x + p1.x) / 2;
  const cy = sin * cxPrime + cos * cyPrime + (p0.y + p1.y) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const ux = (x1 - cxPrime) / rx;
  const uy = (y1 - cyPrime) / ry;
  const vx = (-x1 - cxPrime) / rx;
  const vy = (-y1 - cyPrime) / ry;
  const theta1 = angle(1, 0, ux, uy);
  let delta = angle(ux, uy, vx, vy);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  return curveSegment(
    (t) => {
      if (t === 1) return { x: p1.x, y: p1.y };
      const theta = theta1 + delta * t;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return { x: cx + rx * cos * c - ry * sin * s, y: cy + rx * sin * c + ry * cos * s };
    },
    (t) => {
      const theta = theta1 + delta * t;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return { x: delta * (-rx * cos * s - ry * sin * c), y: delta * (-rx * sin * s + ry * cos * c) };
    },
  );
};

export interface MeasuredPath {
  /** The first point of the path. */
  start: Point;
  /** The parsed instructions, made absolute (one per parsed instruction). */
  instructions: AbsoluteInstruction[];
  /** The drawn segment of each instruction; null for a move. */
  segments: (Segment | null)[];
  /** partialLengths[i] is the length of the path up to the end of instruction i. */
  partialLengths: number[];
  totalLength: number;
}

/** Segments of absolute instructions, with S / T reflection as SVG defines it. */
export const measureInstructions = (instructions: AbsoluteInstruction[], d: string): MeasuredPath => {
  const segments: (Segment | null)[] = [];
  const partialLengths: number[] = [];
  let current: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  let lastCubicControl: Point | null = null;
  let lastQuadControl: Point | null = null;
  let total = 0;

  for (const instruction of instructions) {
    let segment: Segment | null = null;
    let cubicControl: Point | null = null;
    let quadControl: Point | null = null;
    let next: Point = current;
    switch (instruction.type) {
      case 'M':
        next = { x: instruction.x, y: instruction.y };
        subpathStart = next;
        break;
      case 'L':
        next = { x: instruction.x, y: instruction.y };
        segment = lineSegment(current, next);
        break;
      case 'H':
        next = { x: instruction.x, y: current.y };
        segment = lineSegment(current, next);
        break;
      case 'V':
        next = { x: current.x, y: instruction.y };
        segment = lineSegment(current, next);
        break;
      case 'Z':
        next = subpathStart;
        segment = lineSegment(current, next);
        break;
      case 'C':
        next = { x: instruction.x, y: instruction.y };
        cubicControl = { x: instruction.cp2x, y: instruction.cp2y };
        segment = cubicSegment(current, { x: instruction.cp1x, y: instruction.cp1y }, cubicControl, next);
        break;
      case 'S': {
        next = { x: instruction.x, y: instruction.y };
        const c1 = lastCubicControl
          ? { x: 2 * current.x - lastCubicControl.x, y: 2 * current.y - lastCubicControl.y }
          : current;
        cubicControl = { x: instruction.cpx, y: instruction.cpy };
        segment = cubicSegment(current, c1, cubicControl, next);
        break;
      }
      case 'Q':
        next = { x: instruction.x, y: instruction.y };
        quadControl = { x: instruction.cpx, y: instruction.cpy };
        segment = quadSegment(current, quadControl, next);
        break;
      case 'T':
        next = { x: instruction.x, y: instruction.y };
        quadControl = lastQuadControl
          ? { x: 2 * current.x - lastQuadControl.x, y: 2 * current.y - lastQuadControl.y }
          : current;
        segment = quadSegment(current, quadControl, next);
        break;
      case 'A':
        next = { x: instruction.x, y: instruction.y };
        segment = arcSegment(
          current,
          instruction.rx,
          instruction.ry,
          instruction.xAxisRotation,
          instruction.largeArcFlag,
          instruction.sweepFlag,
          next,
        );
        break;
    }
    if (segment && !Number.isFinite(segment.length)) {
      throw new Error(`path: "${d}" has a segment of non-finite length`);
    }
    total += segment ? segment.length : 0;
    segments.push(segment);
    partialLengths.push(total);
    lastCubicControl = cubicControl;
    lastQuadControl = quadControl;
    current = next;
  }
  const first = instructions[0];
  return {
    start: first && first.type === 'M' ? { x: first.x, y: first.y } : { x: 0, y: 0 },
    instructions,
    segments,
    partialLengths,
    totalLength: total,
  };
};

// Scenes ask for the same path on every frame: keep the last measured ones.
const CACHE_SIZE = 64;
const cache = new Map<string, MeasuredPath>();

export const measurePath = (d: string): MeasuredPath => {
  const cached = cache.get(d);
  if (cached) {
    cache.delete(d);
    cache.set(d, cached);
    return cached;
  }
  const measured = measureInstructions(normalizeInstructions(parsePath(d)), d);
  cache.set(d, measured);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  return measured;
};

const checkLength = (fn: string, length: unknown) => {
  if (typeof length !== 'number' || !Number.isFinite(length) || length < 0) {
    throw new Error(`${fn}: length must be a finite number >= 0, got ${length}`);
  }
};

// The segment and its parameter at `length` (0 <= length <= total). At the
// joint of two segments it is the end of the first one.
const locate = (path: MeasuredPath, length: number): { segment: Segment | null; t: number } => {
  let index = -1;
  for (let k = 0; k < path.segments.length; k++) {
    const segment = path.segments[k];
    if (segment && segment.length > 0) {
      index = k;
      if (length <= path.partialLengths[k]) break;
    }
  }
  if (index === -1) return { segment: null, t: 0 };
  const segment = path.segments[index] as Segment;
  return { segment, t: segment.tAtLength(length - (path.partialLengths[index] - segment.length)) };
};

/** Length of the path (moves do not count), like SVGPathElement.getTotalLength(). */
export const getLength = (path: string): number => measurePath(path).totalLength;

/**
 * Point at `length` along the path, as Remotion's getPointAtLength(): `null`
 * when `length` is greater than the length of the path. Throws for a negative
 * or non-finite length.
 */
export const getPointAtLength = (path: string, length: number): Point | null => {
  checkLength('getPointAtLength', length);
  const measured = measurePath(path);
  if (length > measured.totalLength) return null;
  const { segment, t } = locate(measured, length);
  if (!segment) return { x: measured.start.x, y: measured.start.y };
  return segment.point(t);
};

/**
 * Unit vector of the direction of travel at `length`, as Remotion's
 * getTangentAtLength(): `null` when `length` is greater than the length of
 * the path, `{ x: 0, y: 0 }` for a path without length. Rotate something
 * along the path with Math.atan2(y, x).
 */
export const getTangentAtLength = (path: string, length: number): Point | null => {
  checkLength('getTangentAtLength', length);
  const measured = measurePath(path);
  if (length > measured.totalLength) return null;
  const { segment, t } = locate(measured, length);
  if (!segment) return { x: 0, y: 0 };
  let v = segment.derivative(t);
  // Where the derivative vanishes (a control point on an end point, a cusp)
  // the direction is its limit: step a little into the segment.
  for (let step = 1e-9; Math.hypot(v.x, v.y) < 1e-12 && step <= 1e-3; step *= 10) {
    v = segment.derivative(t < 0.5 ? t + step : t - step);
  }
  const norm = Math.hypot(v.x, v.y);
  return { x: v.x / norm, y: v.y / norm };
};

/**
 * Index into parsePath(path) and the length into that part at `length`, as
 * Remotion's getInstructionIndexAtLength(): `index` is the last instruction
 * whose end lies before `length` (0 at the start), and `lengthIntoInstruction`
 * is `length` minus the path length up to its end.
 *
 *   getInstructionIndexAtLength('M 0 0 L 100 0 L 200 0', 105) // { lengthIntoInstruction: 5, index: 1 }
 *
 * Throws for a length below 0 or above the length of the path.
 */
export const getInstructionIndexAtLength = (
  path: string,
  length: number,
): { lengthIntoInstruction: number; index: number } => {
  checkLength('getInstructionIndexAtLength', length);
  const { partialLengths, totalLength } = measurePath(path);
  if (length > totalLength) {
    throw new Error(
      `A length of ${length} was passed to getInstructionIndexAtLength() but the total length of the path is only ${totalLength}`,
    );
  }
  let index = partialLengths.length - 1;
  while (index > 0 && partialLengths[index] >= length) index--;
  return { lengthIntoInstruction: length - partialLengths[index], index };
};

/**
 * Stroke values that draw `progress` (0 to 1) of the path, as in Remotion:
 *
 *   <path d={d} {...evolvePath(progress, d)} />
 *
 * At progress 0 the dash is 1.5 times the length, so rounding in the browser
 * cannot leave a dot of the stroke visible.
 */
export const evolvePath = (progress: number, path: string): { strokeDasharray: string; strokeDashoffset: number } => {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) {
    throw new Error(`evolvePath: progress must be a finite number, got ${progress}`);
  }
  const length = getLength(path);
  if (progress === 0) {
    const extended = length * 1.5;
    return { strokeDasharray: `${extended} ${extended}`, strokeDashoffset: extended };
  }
  return { strokeDasharray: `${length} ${length}`, strokeDashoffset: length - progress * length };
};
