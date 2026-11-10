/**
 * SVG path geometry without the DOM: length, point and tangent at a length,
 * stroke-drawing values, and paths built from points. Works in Node (SSR,
 * export) and gives the same numbers everywhere.
 *
 * Supported commands: M L H V C S Q T A Z, absolute and relative, with the
 * SVG rules for implicit repetition (extra pairs after M are lines), S/T
 * reflection, arc radius scaling and zero-radius arcs (straight lines).
 */

export interface Point {
  x: number;
  y: number;
}

interface Segment {
  length: number;
  point(t: number): Point;
  derivative(t: number): Point;
  /** Parameter t in [0, 1] at arc length `s` along the segment. */
  tAtLength(s: number): number;
}

interface ParsedPath {
  start: Point;
  segments: Segment[];
  /** cumulative[i] is the length before segments[i]; the last entry is the total. */
  cumulative: number[];
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

const lineSegment = (p0: Point, p1: Point): Segment => {
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

const cubicSegment = (p0: Point, p1: Point, p2: Point, p3: Point): Segment =>
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
): Segment | null => {
  if (p0.x === p1.x && p0.y === p1.y) return null;
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  if (rx === 0 || ry === 0) return lineSegment(p0, p1);

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

const COMMANDS = 'MmLlHhVvCcSsQqTtAaZz';
const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;

const parsePath = (d: string): ParsedPath => {
  if (typeof d !== 'string') {
    throw new Error(`path: d must be a string, got ${JSON.stringify(d)}`);
  }
  let i = 0;
  const fail = (message: string): never => {
    throw new Error(`path: ${message} at position ${i} of "${d.length > 80 ? d.slice(0, 77) + '...' : d}"`);
  };
  const skipSeparators = () => {
    while (i < d.length && (d[i] === ',' || d[i] === ' ' || d[i] === '\t' || d[i] === '\n' || d[i] === '\r' || d[i] === '\f')) i++;
  };
  const number = (): number => {
    skipSeparators();
    NUMBER.lastIndex = i;
    const match = NUMBER.exec(d);
    if (!match) return fail('expected a number');
    i = NUMBER.lastIndex;
    return parseFloat(match![0]);
  };
  const flag = (): boolean => {
    skipSeparators();
    if (d[i] === '0' || d[i] === '1') return d[i++] === '1';
    return fail('expected an arc flag (0 or 1)');
  };
  const numberAhead = () => {
    skipSeparators();
    return i < d.length && /[0-9.+-]/.test(d[i]);
  };

  const segments: Segment[] = [];
  let start: Point | null = null;
  let current: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  // Second control point of the previous C/S, or control point of the previous Q/T.
  let lastCubicControl: Point | null = null;
  let lastQuadControl: Point | null = null;
  let command: string | null = null;

  const add = (segment: Segment | null) => {
    if (segment) segments.push(segment);
  };

  for (;;) {
    skipSeparators();
    if (i >= d.length) break;
    const char = d[i];
    if (COMMANDS.includes(char)) {
      command = char;
      i++;
    } else if (command === null) {
      fail('a path must start with M or m');
    } else if (command === 'Z' || command === 'z') {
      fail('expected a command after Z');
    } else if (!/[0-9.+-]/.test(char)) {
      fail(`unexpected "${char}"`);
    }
    if (start === null && command !== 'M' && command !== 'm') fail('a path must start with M or m');

    const relative: boolean = command === command!.toLowerCase();
    const base = relative ? current : { x: 0, y: 0 };
    const at = (x: number, y: number): Point => ({ x: base.x + x, y: base.y + y });
    let cubicControl: Point | null = null;
    let quadControl: Point | null = null;

    switch (command!.toUpperCase()) {
      case 'M': {
        const p = at(number(), number());
        current = p;
        subpathStart = p;
        if (start === null) start = p;
        // Further coordinate pairs are lines.
        command = relative ? 'l' : 'L';
        break;
      }
      case 'L': {
        const p = at(number(), number());
        add(lineSegment(current, p));
        current = p;
        break;
      }
      case 'H': {
        const p = { x: base.x + number(), y: current.y };
        add(lineSegment(current, p));
        current = p;
        break;
      }
      case 'V': {
        const p = { x: current.x, y: base.y + number() };
        add(lineSegment(current, p));
        current = p;
        break;
      }
      case 'C': {
        const c1 = at(number(), number());
        const c2 = at(number(), number());
        const p = at(number(), number());
        add(cubicSegment(current, c1, c2, p));
        cubicControl = c2;
        current = p;
        break;
      }
      case 'S': {
        const c1: Point = lastCubicControl
          ? { x: 2 * current.x - lastCubicControl.x, y: 2 * current.y - lastCubicControl.y }
          : current;
        const c2 = at(number(), number());
        const p = at(number(), number());
        add(cubicSegment(current, c1, c2, p));
        cubicControl = c2;
        current = p;
        break;
      }
      case 'Q': {
        const c = at(number(), number());
        const p = at(number(), number());
        add(quadSegment(current, c, p));
        quadControl = c;
        current = p;
        break;
      }
      case 'T': {
        const c: Point = lastQuadControl
          ? { x: 2 * current.x - lastQuadControl.x, y: 2 * current.y - lastQuadControl.y }
          : current;
        const p = at(number(), number());
        add(quadSegment(current, c, p));
        quadControl = c;
        current = p;
        break;
      }
      case 'A': {
        const rx = number();
        const ry = number();
        const rotation = number();
        const largeArc = flag();
        const sweep = flag();
        const p = at(number(), number());
        add(arcSegment(current, rx, ry, rotation, largeArc, sweep, p));
        current = p;
        break;
      }
      case 'Z': {
        add(lineSegment(current, subpathStart));
        current = subpathStart;
        break;
      }
    }
    lastCubicControl = cubicControl;
    lastQuadControl = quadControl;

    // After a command letter at least one set of arguments was read; more
    // numbers repeat the command.
    if (command !== 'Z' && command !== 'z' && !numberAhead() && i < d.length && !COMMANDS.includes(d[i])) {
      fail(`unexpected "${d[i]}"`);
    }
  }

  if (start === null) {
    throw new Error('path: d is empty; a path must start with M or m');
  }
  const cumulative = [0];
  for (const segment of segments) {
    if (!Number.isFinite(segment.length)) {
      throw new Error(`path: "${d}" has a segment of non-finite length`);
    }
    cumulative.push(cumulative[cumulative.length - 1] + segment.length);
  }
  return { start, segments, cumulative };
};

// Scenes ask for the same path on every frame: keep the last parsed ones.
const CACHE_SIZE = 64;
const cache = new Map<string, ParsedPath>();

const getParsed = (d: string): ParsedPath => {
  const cached = cache.get(d);
  if (cached) {
    cache.delete(d);
    cache.set(d, cached);
    return cached;
  }
  const parsed = parsePath(d);
  cache.set(d, parsed);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value as string);
  return parsed;
};

const totalLength = (path: ParsedPath) => path.cumulative[path.cumulative.length - 1];

// The segment and its parameter at `length` (clamped to the path). At the
// joint of two segments it is the end of the first one.
const locate = (fn: string, d: string, length: number): { path: ParsedPath; segment: Segment | null; t: number } => {
  if (typeof length !== 'number' || !Number.isFinite(length)) {
    throw new Error(`${fn}: length must be a finite number, got ${length}`);
  }
  const path = getParsed(d);
  const total = totalLength(path);
  const s = Math.max(0, Math.min(total, length));
  let index = -1;
  for (let k = 0; k < path.segments.length; k++) {
    if (path.segments[k].length > 0) {
      index = k;
      if (s <= path.cumulative[k + 1]) break;
    }
  }
  if (index === -1) return { path, segment: null, t: 0 };
  const segment = path.segments[index];
  return { path, segment, t: segment.tAtLength(s - path.cumulative[index]) };
};

/** Length of the path (moves do not count), like SVGPathElement.getTotalLength(). */
export const getLength = (d: string): number => totalLength(getParsed(d));

/**
 * Point at `length` along the path, like SVGPathElement.getPointAtLength().
 * `length` is clamped to [0, getLength(d)].
 */
export const getPointAtLength = (d: string, length: number): Point => {
  const { path, segment, t } = locate('getPointAtLength', d, length);
  if (!segment) return { x: path.start.x, y: path.start.y };
  return segment.point(t);
};

/**
 * Unit vector of the direction of travel at `length` (clamped to the path).
 * Rotate something along the path with Math.atan2(y, x). Throws for a path
 * without length.
 */
export const getTangentAtLength = (d: string, length: number): Point => {
  const { segment, t } = locate('getTangentAtLength', d, length);
  if (!segment) {
    throw new Error(`getTangentAtLength: the path "${d}" has no length, so it has no direction`);
  }
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
 * Stroke values that draw `progress` (0 to 1) of the path, as in Remotion:
 *
 *   <path d={d} {...evolvePath(progress, d)} />
 */
export const evolvePath = (progress: number, d: string): { strokeDasharray: string; strokeDashoffset: number } => {
  if (typeof progress !== 'number' || !Number.isFinite(progress)) {
    throw new Error(`evolvePath: progress must be a finite number, got ${progress}`);
  }
  const length = getLength(d);
  return {
    strokeDasharray: `${length} ${length}`,
    strokeDashoffset: length - progress * length,
  };
};

export interface PathFromPointsOptions {
  /**
   * Radius of the circular arcs that round the corners (default 0: sharp).
   * Where two edges are too short for it, the corner gets the largest radius
   * that fits in half of each edge.
   */
  cornerRadius?: number;
  /** Close the polygon (Z); its first point gets a rounded corner too. */
  closed?: boolean;
}

const format = (n: number) => String(Math.abs(n) < 1e-12 ? 0 : n);
const pair = (p: Point) => `${format(p.x)} ${format(p.y)}`;

/**
 * Path through `points`: a polyline (or a polygon with `closed`) whose
 * corners can be rounded with circular arcs.
 *
 *   pathFromPoints([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 80 }], { cornerRadius: 12 })
 */
export const pathFromPoints = (points: readonly Point[], options: PathFromPointsOptions = {}): string => {
  const { cornerRadius = 0, closed = false } = options;
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error(`pathFromPoints: needs at least 2 points, got ${Array.isArray(points) ? points.length : points}`);
  }
  points.forEach((p, k) => {
    if (typeof p !== 'object' || p === null || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      throw new Error(`pathFromPoints: points[${k}] must be { x, y } with finite numbers, got ${JSON.stringify(p)}`);
    }
  });
  if (typeof cornerRadius !== 'number' || !Number.isFinite(cornerRadius) || cornerRadius < 0) {
    throw new Error(`pathFromPoints: cornerRadius must be a finite number >= 0, got ${cornerRadius}`);
  }

  const n = points.length;
  // The rounded corner at vertex k: where the arc leaves the incoming edge,
  // where it joins the outgoing one, its radius and turning direction.
  const corner = (k: number) => {
    const prev = points[(k - 1 + n) % n];
    const vertex = points[k];
    const next = points[(k + 1) % n];
    const inLength = Math.hypot(vertex.x - prev.x, vertex.y - prev.y);
    const outLength = Math.hypot(next.x - vertex.x, next.y - vertex.y);
    if (cornerRadius === 0 || inLength === 0 || outLength === 0) return null;
    const u = { x: (prev.x - vertex.x) / inLength, y: (prev.y - vertex.y) / inLength };
    const v = { x: (next.x - vertex.x) / outLength, y: (next.y - vertex.y) / outLength };
    const cosine = Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y));
    const angle = Math.acos(cosine);
    // Straight on (angle π) or turning back (angle 0): nothing to round.
    if (angle < 1e-9 || Math.PI - angle < 1e-9) return null;
    const tanHalf = Math.tan(angle / 2);
    const cut = Math.min(cornerRadius / tanHalf, inLength / 2, outLength / 2);
    const cross = (vertex.x - prev.x) * (next.y - vertex.y) - (vertex.y - prev.y) * (next.x - vertex.x);
    return {
      enter: { x: vertex.x + u.x * cut, y: vertex.y + u.y * cut },
      leave: { x: vertex.x + v.x * cut, y: vertex.y + v.y * cut },
      radius: cut * tanHalf,
      // With y pointing down, a positive cross product is a clockwise turn.
      sweep: cross > 0 ? 1 : 0,
    };
  };

  const parts: string[] = [];
  const visit = (k: number) => {
    const c = corner(k);
    if (!c) {
      parts.push(`L ${pair(points[k])}`);
      return;
    }
    parts.push(`L ${pair(c.enter)}`, `A ${format(c.radius)} ${format(c.radius)} 0 0 ${c.sweep} ${pair(c.leave)}`);
  };

  if (!closed) {
    parts.push(`M ${pair(points[0])}`);
    for (let k = 1; k < n - 1; k++) visit(k);
    parts.push(`L ${pair(points[n - 1])}`);
    return parts.join(' ');
  }

  // Closed: start where the corner at the first point ends.
  const first = corner(0);
  parts.push(`M ${pair(first ? first.leave : points[0])}`);
  for (let k = 1; k < n; k++) visit(k);
  if (first) {
    parts.push(`L ${pair(first.enter)}`, `A ${format(first.radius)} ${format(first.radius)} 0 0 ${first.sweep} ${pair(first.leave)}`);
  }
  parts.push('Z');
  return parts.join(' ');
};
