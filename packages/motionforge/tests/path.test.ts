import { describe, expect, it } from 'vitest';
import {
  centerPath,
  cutPath,
  evolvePath,
  extendViewBox,
  getBoundingBox,
  getInstructionIndexAtLength,
  getLength,
  getPointAtLength,
  getSubpaths,
  getTangentAtLength,
  interpolatePath,
  interpolatePaths,
  normalizePath,
  parsePath,
  pathFromPoints,
  reduceInstructions,
  resetPath,
  reversePath,
  scalePath,
  serializeInstructions,
  translatePath,
  warpPath,
} from '../src/utils/path';
import { Easing } from '../src/utils/animation';

// Reference length: a dense polyline through the curve's own formula.
const polylineLength = (point: (t: number) => [number, number], steps = 200000) => {
  let length = 0;
  let [px, py] = point(0);
  for (let k = 1; k <= steps; k++) {
    const [x, y] = point(k / steps);
    length += Math.hypot(x - px, y - py);
    px = x;
    py = y;
  }
  return length;
};

const cubic = (p: number[]) => (t: number): [number, number] => {
  const u = 1 - t;
  return [
    u ** 3 * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t ** 3 * p[6],
    u ** 3 * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t ** 3 * p[7],
  ];
};

const expectPoint = (actual: { x: number; y: number } | null, x: number, y: number, digits = 9) => {
  expect(actual).not.toBeNull();
  expect(actual!.x).toBeCloseTo(x, digits);
  expect(actual!.y).toBeCloseTo(y, digits);
};

// The point, which must exist.
const pointAt = (d: string, length: number) => {
  const point = getPointAtLength(d, length);
  if (!point) throw new Error(`no point at ${length} of ${d}`);
  return point;
};

describe('getLength', () => {
  it('measures lines, H and V, absolute and relative', () => {
    expect(getLength('M0 0 L30 40')).toBe(50);
    expect(getLength('M10 10 h 20 v 30 H 0 V 0')).toBe(120);
    // Extra pairs after M and m are lines; z closes the subpath.
    expect(getLength('M 0 0 10 0 10 10')).toBe(20);
    expect(getLength('m 5 5 10 0 0 10 z')).toBeCloseTo(20 + Math.sqrt(200), 12);
    expect(getLength('M0 0 L 30 0 L 30 40 Z')).toBe(120);
  });

  it('does not count moves, and starts a relative move from the closed subpath', () => {
    expect(getLength('M0 0 L10 0 Z m 5 5 l 10 0')).toBe(30);
    expect(getPointAtLength('M0 0 L10 0 Z m 5 5 l 10 0', 25)).toEqual({ x: 10, y: 5 });
  });

  it('reads compact number syntax', () => {
    expect(getLength('M0,0L10-5l.5.5')).toBeCloseTo(Math.sqrt(125) + Math.sqrt(0.5), 12);
    expect(getLength('M0 0L1e2 0')).toBe(100);
  });

  it('measures arcs: circles, scaled-up radii, ellipses, zero radii', () => {
    expect(getLength('M 0 50 A 50 50 0 0 1 100 50 A 50 50 0 0 1 0 50')).toBeCloseTo(100 * Math.PI, 9);
    // Radius 1 cannot span 100: scaled up to a half circle of radius 50.
    expect(getLength('M0 0 A 1 1 0 0 1 100 0')).toBeCloseTo(50 * Math.PI, 9);
    expect(getLength('M0 0 a 50 50 0 0 1 100 0')).toBeCloseTo(50 * Math.PI, 9);
    expect(getLength('M0 0 A 0 10 0 0 1 30 40')).toBe(50);
    // A quarter of an ellipse with radii 100 and 50.
    const quarter = polylineLength((t) => [100 * Math.cos((t * Math.PI) / 2), 50 * Math.sin((t * Math.PI) / 2)]);
    expect(getLength('M 100 0 A 100 50 0 0 1 0 50')).toBeCloseTo(quarter, 6);
    // Large-arc flag: three quarters of the same circle.
    expect(getLength('M 100 50 A 50 50 0 1 1 50 0')).toBeCloseTo(75 * Math.PI, 9);
  });

  it('measures quadratic and cubic curves', () => {
    const c = [0, 0, 50, 100, 150, -100, 200, 0];
    expect(getLength('M 0 0 C 50 100 150 -100 200 0')).toBeCloseTo(polylineLength(cubic(c)), 6);
    const loop = [0, 0, 300, 200, -100, 200, 200, 0];
    expect(getLength('M0 0 C300 200 -100 200 200 0')).toBeCloseTo(polylineLength(cubic(loop)), 6);
    const quad = (t: number): [number, number] => [2 * (1 - t) * t * 50 + t * t * 100, 2 * (1 - t) * t * 100];
    expect(getLength('M0 0 Q 50 100 100 0')).toBeCloseTo(polylineLength(quad), 6);
    // Evenly spaced collinear control points: a straight line at constant speed.
    expect(getLength('M0 0 C 10 0 20 0 30 0')).toBeCloseTo(30, 12);
    expectPoint(getPointAtLength('M0 0 C 10 0 20 0 30 0', 15), 15, 0);
  });

  it('reflects the control point for S and T, absolute and relative', () => {
    const explicitCubic = 'M0 0 C 0 50 50 50 50 0 C 50 -50 100 -50 100 0';
    for (const d of ['M0 0 C 0 50 50 50 50 0 S 100 -50 100 0', 'M0 0 c 0 50 50 50 50 0 s 50 -50 50 0']) {
      expect(getLength(d)).toBeCloseTo(getLength(explicitCubic), 12);
      expectPoint(getPointAtLength(d, 100), pointAt(explicitCubic, 100).x, pointAt(explicitCubic, 100).y);
    }
    const explicitQuad = 'M0 0 Q 25 50 50 0 Q 75 -50 100 0';
    for (const d of ['M0 0 Q 25 50 50 0 T 100 0', 'M0 0 q 25 50 50 0 t 50 0']) {
      expect(getLength(d)).toBeCloseTo(getLength(explicitQuad), 12);
      expectPoint(getPointAtLength(d, 90), pointAt(explicitQuad, 90).x, pointAt(explicitQuad, 90).y);
    }
    // Without a previous curve the control point is the current point.
    expect(getLength('M0 0 S 50 50 100 0')).toBe(getLength('M0 0 C 0 0 50 50 100 0'));
    expect(getLength('M0 0 L 10 0 T 20 10')).toBe(getLength('M0 0 L 10 0 Q 10 0 20 10'));
  });
});

describe('getPointAtLength / getTangentAtLength', () => {
  it('walks a line', () => {
    expect(getPointAtLength('M0 0 L30 40', 25)).toEqual({ x: 15, y: 20 });
    expect(getTangentAtLength('M0 0 L30 40', 25)).toEqual({ x: 0.6, y: 0.8 });
  });

  it('walks a circle', () => {
    const circle = 'M 0 50 A 50 50 0 0 1 100 50 A 50 50 0 0 1 0 50';
    // Sweep 1 runs clockwise on screen (y down): over the top first.
    expectPoint(getPointAtLength(circle, 25 * Math.PI), 50, 0);
    expectPoint(getTangentAtLength(circle, 25 * Math.PI), 1, 0);
    expectPoint(getPointAtLength(circle, 75 * Math.PI), 50, 100);
    expectPoint(getTangentAtLength(circle, 75 * Math.PI), -1, 0);
    // Points are at the length asked for: the arc between them is that long.
    for (const s of [10, 77, 200, 300]) {
      const p = pointAt(circle, s);
      expect(Math.hypot(p.x - 50, p.y - 50)).toBeCloseTo(50, 9);
      const angle = Math.atan2(p.y - 50, p.x - 50);
      expect(((angle - Math.PI + 4 * Math.PI) % (2 * Math.PI)) * 50).toBeCloseTo(s, 7);
    }
  });

  it('finds the point at a length on a cubic', () => {
    const c = [0, 0, 50, 100, 150, -100, 200, 0];
    const target = getLength('M 0 0 C 50 100 150 -100 200 0') * 0.3;
    const p = getPointAtLength('M 0 0 C 50 100 150 -100 200 0', target);
    // The reference walks the polyline to the same length.
    let walked = 0;
    let [px, py] = cubic(c)(0);
    let reference: [number, number] = [px, py];
    for (let k = 1; k <= 200000; k++) {
      const [x, y] = cubic(c)(k / 200000);
      walked += Math.hypot(x - px, y - py);
      [px, py] = [x, y];
      if (walked >= target) {
        reference = [x, y];
        break;
      }
    }
    expectPoint(p, reference[0], reference[1], 2);
  });

  it('returns null past the end of the path and the first point of a path without length, as Remotion', () => {
    expect(getPointAtLength('M0 0 L30 40', 50)).toEqual({ x: 30, y: 40 });
    expect(getPointAtLength('M0 0 L30 40', 50.000001)).toBeNull();
    expect(getTangentAtLength('M0 0 L30 40', 500)).toBeNull();
    expect(getPointAtLength('M0 0 L30 40', 0)).toEqual({ x: 0, y: 0 });
    expect(getPointAtLength('M 5 5', 0)).toEqual({ x: 5, y: 5 });
    expect(getTangentAtLength('M 5 5', 0)).toEqual({ x: 0, y: 0 });
  });

  it('gives a direction where the derivative vanishes', () => {
    expectPoint(getTangentAtLength('M0 0 C 0 0 10 0 10 0', 0), 1, 0);
    expectPoint(getTangentAtLength('M0 0 C 0 0 10 0 10 0', 10), 1, 0);
  });

  it('throws on wrong input', () => {
    expect(() => getPointAtLength('M0 0 L30 40', Number.NaN)).toThrow(/length must be a finite number >= 0/);
    expect(() => getPointAtLength('M0 0 L30 40', -5)).toThrow(/length must be a finite number >= 0/);
    expect(() => getTangentAtLength('M0 0 L30 40', -1)).toThrow(/length must be a finite number >= 0/);
    expect(() => getLength('')).toThrow(/the path is empty/);
    expect(() => getLength('L 10 10')).toThrow(/must start with M/);
    expect(() => getLength('M 0 0 L 10')).toThrow(/expected a number/);
    expect(() => getLength('M 0 0 X 1')).toThrow(/unexpected "X"/);
    expect(() => getLength('M0 0 A 10 10 0 2 1 5 5')).toThrow(/arc flag/);
    expect(() => getLength('M0 0 Z 5')).toThrow(/expected a command after Z/);
    // @ts-expect-error not a string
    expect(() => getLength(42)).toThrow(/the path must be a string/);
  });
});

describe('evolvePath', () => {
  it('returns the dash values that draw a part of the path', () => {
    expect(evolvePath(0.25, 'M0 0 L100 0')).toEqual({ strokeDasharray: '100 100', strokeDashoffset: 75 });
    // At 0 the dash is 1.5 times the length, so no dot of the stroke shows (as Remotion).
    expect(evolvePath(0, 'M0 0 L100 0')).toEqual({ strokeDasharray: '150 150', strokeDashoffset: 150 });
    expect(evolvePath(1, 'M0 0 L100 0').strokeDashoffset).toBe(0);
    expect(() => evolvePath(Number.NaN, 'M0 0 L100 0')).toThrow(/progress must be a finite number/);
  });
});

describe('pathFromPoints', () => {
  const corner = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }];

  it('builds a polyline', () => {
    expect(pathFromPoints(corner)).toBe('M 0 0 L 100 0 L 100 100');
    expect(pathFromPoints(corner, { closed: true })).toBe('M 0 0 L 100 0 L 100 100 Z');
  });

  it('rounds corners with circular arcs on the inside of the turn', () => {
    const d = pathFromPoints(corner, { cornerRadius: 10 });
    expect(getLength(d)).toBeCloseTo(90 + 90 + 5 * Math.PI, 9);
    // The middle of the arc is inside the corner (sweep matches the turn).
    expectPoint(getPointAtLength(d, 90 + 2.5 * Math.PI), 90 + 10 * Math.SQRT1_2, 10 - 10 * Math.SQRT1_2);
    // Turning the other way.
    const left = pathFromPoints([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: -100 }], { cornerRadius: 10 });
    expectPoint(getPointAtLength(left, 90 + 2.5 * Math.PI), 90 + 10 * Math.SQRT1_2, -10 + 10 * Math.SQRT1_2);
    // The direction is continuous where the arc meets the edges.
    expectPoint(getTangentAtLength(d, 90 - 1e-6), 1, 0, 6);
    expectPoint(getTangentAtLength(d, 90 + 1e-6), 1, 0, 4);
  });

  it('rounds every corner of a closed polygon', () => {
    const square = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];
    expect(getLength(pathFromPoints(square, { cornerRadius: 10, closed: true }))).toBeCloseTo(320 + 20 * Math.PI, 9);
  });

  it('shrinks a radius that does not fit into half of each edge', () => {
    expect(getLength(pathFromPoints(corner, { cornerRadius: 1000 }))).toBeCloseTo(50 + 50 + 25 * Math.PI, 9);
  });

  it('keeps straight and doubled points sharp', () => {
    expect(pathFromPoints([{ x: 0, y: 0 }, { x: 50, y: 0 }, { x: 100, y: 0 }], { cornerRadius: 10 })).toBe(
      'M 0 0 L 50 0 L 100 0',
    );
    expect(getLength(pathFromPoints([{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 100, y: 0 }], { cornerRadius: 10 }))).toBe(100);
  });

  it('throws on wrong input', () => {
    expect(() => pathFromPoints([{ x: 0, y: 0 }])).toThrow(/at least 2 points/);
    expect(() => pathFromPoints([{ x: 0, y: 0 }, { x: Number.NaN, y: 0 }])).toThrow(/points\[1\] must be/);
    expect(() => pathFromPoints(corner, { cornerRadius: -1 })).toThrow(/cornerRadius must be/);
  });
});

// The expected strings are what @remotion/paths 4.0.542 returns for the same input.
describe('instructions, as in @remotion/paths', () => {
  it('parsePath: one instruction per command, relative ones kept, flags as booleans', () => {
    expect(parsePath('M 10 10 l 5 5 5 0 A 5 5 0 0120 20 z')).toEqual([
      { type: 'M', x: 10, y: 10 },
      { type: 'l', dx: 5, dy: 5 },
      { type: 'l', dx: 5, dy: 0 },
      { type: 'A', rx: 5, ry: 5, xAxisRotation: 0, largeArcFlag: false, sweepFlag: true, x: 20, y: 20 },
      { type: 'Z' },
    ]);
    expect(parsePath('M 0 0 10 0 m 5 5 1 1')).toEqual([
      { type: 'M', x: 0, y: 0 },
      { type: 'L', x: 10, y: 0 },
      { type: 'm', dx: 5, dy: 5 },
      { type: 'l', dx: 1, dy: 1 },
    ]);
  });

  it('serializeInstructions writes them back', () => {
    const d = 'M 10 10 l 5 5 A 5 5 0 0 1 20 20 c 1 2 3 4 5 6 Z';
    expect(serializeInstructions(parsePath(d))).toBe(d);
    expect(() => serializeInstructions([{ type: 'L', x: 1 } as never])).toThrow(/instructions\[0\] \(L\) needs y as a finite number/);
    expect(() => serializeInstructions([{ type: 'X' } as never])).toThrow(/instructions\[0\] is not a path instruction/);
  });

  it('normalizePath makes every command absolute', () => {
    expect(normalizePath('m 5 5 l 10 0 h 5 v 5 c 1 1 2 2 3 3 s 1 1 2 2 q 1 1 2 2 t 3 3 a 1 1 0 0 1 2 2 z')).toBe(
      'M 5 5 L 15 5 H 20 V 10 C 21 11 22 12 23 13 S 24 14 25 15 Q 26 16 27 17 T 30 20 A 1 1 0 0 1 32 22 Z',
    );
  });

  it('reduceInstructions leaves only M, L, C and Z', () => {
    expect(serializeInstructions(reduceInstructions(parsePath('M 0 0 H 10 V 10 Q 20 20 30 10 T 50 10 S 70 0 80 10 A 10 10 0 0 1 100 10')))).toBe(
      'M 0 0 L 10 0 L 10 10 C 16.666666666666664 16.666666666666664 23.333333333333336 16.666666666666664 30 10 C 36.666666666666664 3.333333333333334 43.333333333333336 3.333333333333334 50 10 C 50 10 70 0 80 10 C 80 4.477152501692068 84.47715250169206 1.7763568394002505e-15 90 0 C 95.52284749830793 0 100 4.477152501692064 100 9.999999999999998',
    );
  });

  it('getInstructionIndexAtLength: the instruction before the length and the length into the next', () => {
    expect(getInstructionIndexAtLength('M 0 0 L 100 0 L 200 0', 105)).toEqual({ lengthIntoInstruction: 5, index: 1 });
    expect(getInstructionIndexAtLength('M 0 0 L 100 0 L 200 0', 0)).toEqual({ lengthIntoInstruction: 0, index: 0 });
    expect(() => getInstructionIndexAtLength('M 0 0 L 100 0', 105)).toThrow(
      /A length of 105 was passed to getInstructionIndexAtLength\(\) but the total length of the path is only 100/,
    );
  });
});

describe('path transforms, as in @remotion/paths', () => {
  it('getBoundingBox measures curves to their extrema', () => {
    expect(getBoundingBox('M 0 0 C 50 100 150 -100 200 0')).toEqual({
      x1: 0,
      y1: -28.867513459481287,
      x2: 200,
      y2: 28.867513459481287,
      viewBox: '0 -28.867513459481287 200 57.735026918962575',
      width: 200,
      height: 57.735026918962575,
    });
  });

  it('translatePath, resetPath, centerPath, scalePath', () => {
    expect(translatePath('m 5 5 l 10 0 H 30 V 40 Z', 10, -5)).toBe('m 15 0 l 10 0 H 40 V 35 Z');
    expect(resetPath('M 10 20 L 30 20 L 30 40 Z')).toBe('M 0 0 L 20 0 L 20 20 Z');
    expect(centerPath('M 10 20 L 30 20 L 30 40 Z')).toBe('M -10 -10 L 10 -10 L 10 10 Z');
    expect(centerPath('M 10 20 L 30 20 L 30 40 Z', { x: 100, y: 100 })).toBe('M 90 90 L 110 90 L 110 110 Z');
    expect(scalePath('M 10 10 L 30 10 L 30 30 Z', 2, 3)).toBe('M 10 10 L 50 10 L 50 70 Z');
    expect(() => translatePath('M 0 0', Number.NaN, 0)).toThrow(/translatePath: x must be a finite number/);
  });

  it('reversePath, getSubpaths, cutPath, extendViewBox', () => {
    expect(reversePath('M 0 0 L 10 0 C 20 0 20 10 10 10 Z M 50 50 L 60 60')).toBe('M 10 10 C 20 10 20 0 10 0 L 0 0Z M 60 60 L 50 50');
    expect(getSubpaths('M 0 0 L 10 0 m 5 5 l 10 0 M 100 100 L 0 0')).toEqual(['M 0 0 L 10 0', 'M 15 5 l 10 0', 'M 100 100 L 0 0']);
    expect(cutPath('M 0 0 L 100 0 L 100 100 Z', 150)).toBe('M 0 0 L 100 0 L 100 50');
    // A closing Z is cut as a line.
    expect(cutPath('M 0 0 L 30 0 L 30 40 Z', 95)).toBe('M 0 0 L 30 0 L 30 40 L 15 20');
    // A curve is split at the point at that length.
    const cut = cutPath('M 0 0 C 50 100 150 -100 200 0', 100);
    expect(getLength(cut)).toBeCloseTo(100, 6);
    expect(extendViewBox('0 0 100 50', 2)).toBe('-50 -25 200 100');
    expect(() => extendViewBox('0 0 100', 2)).toThrow(/currentViewBox must be 4 valid numbers/);
    expect(() => cutPath('M 0 0 L 10 0', -1)).toThrow(/cutPath: length must be a finite number >= 0/);
  });

  it('warpPath remaps the points of a path split into short pieces', () => {
    expect(warpPath('M 0 0 L 100 0', ({ x, y }) => ({ x, y: y + x / 10 }), { interpolationThreshold: 30 })).toBe(
      'M 0 0 L 25 2.5 L 50 5 L 75 7.5 L 100 10',
    );
    expect(() => warpPath('M 0 0 L 1 0', ({ x }) => ({ x, y: Number.NaN }))).toThrow(/transformer must return \{ x, y \} with finite numbers/);
    expect(() => warpPath('M 0 0 L 1 0', (p) => p, { interpolationThreshold: 0 })).toThrow(/interpolationThreshold must be a positive number/);
  });
});

describe('interpolatePath / interpolatePaths, as in @remotion/paths', () => {
  it('morphs between paths with different numbers of points', () => {
    expect(interpolatePath(0.5, 'M 0 0 L 100 0', 'M 0 0 L 50 50 L 100 0 Z')).toBe('M 0 0 L 50 25 L 100 0');
    // At 0 and 1 the paths come back unchanged.
    expect(interpolatePath(0, 'M 0 0 L 100 0', 'M0 0 L 1 1')).toBe('M 0 0 L 100 0');
    expect(interpolatePath(1, 'M 0 0 L 100 0', 'M0 0 L 1 1')).toBe('M0 0 L 1 1');
  });

  it('interpolates between keyframes like interpolate()', () => {
    const keyframes = ['M 0 0 L 100 0', 'M 0 0 L 100 100', 'M 0 0 C 0 50 50 50 100 100'];
    expect(interpolatePaths(15, [0, 10, 20], keyframes)).toBe('M 0 0 C 0 25 75 75 100 100');
    expect(interpolatePaths(10, [0, 10, 20], keyframes)).toBe(keyframes[1]);
    expect(interpolatePaths(30, [0, 10, 20], keyframes, { extrapolateRight: 'clamp' })).toBe(keyframes[2]);
    expect(interpolatePaths(5, [0, 10], keyframes.slice(0, 2), { easing: Easing.in(Easing.quad) })).toBe('M 0 0 L 100 25');
    // @ts-expect-error identity is not allowed for paths
    expect(() => interpolatePaths(5, [0, 10], keyframes.slice(0, 2), { extrapolateLeft: 'identity' })).toThrow(
      /extrapolateLeft must be "extend", "clamp" or "wrap"/,
    );
  });
});
