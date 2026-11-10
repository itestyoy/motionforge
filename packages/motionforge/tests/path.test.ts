import { describe, expect, it } from 'vitest';
import { evolvePath, getLength, getPointAtLength, getTangentAtLength, pathFromPoints } from '../src/utils/path';

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

const expectPoint = (actual: { x: number; y: number }, x: number, y: number, digits = 9) => {
  expect(actual.x).toBeCloseTo(x, digits);
  expect(actual.y).toBeCloseTo(y, digits);
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
      expectPoint(getPointAtLength(d, 100), getPointAtLength(explicitCubic, 100).x, getPointAtLength(explicitCubic, 100).y);
    }
    const explicitQuad = 'M0 0 Q 25 50 50 0 Q 75 -50 100 0';
    for (const d of ['M0 0 Q 25 50 50 0 T 100 0', 'M0 0 q 25 50 50 0 t 50 0']) {
      expect(getLength(d)).toBeCloseTo(getLength(explicitQuad), 12);
      expectPoint(getPointAtLength(d, 90), getPointAtLength(explicitQuad, 90).x, getPointAtLength(explicitQuad, 90).y);
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
      const p = getPointAtLength(circle, s);
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

  it('clamps the length to the path and starts at the first point', () => {
    expect(getPointAtLength('M0 0 L30 40', -5)).toEqual({ x: 0, y: 0 });
    expect(getPointAtLength('M0 0 L30 40', 500)).toEqual({ x: 30, y: 40 });
    expect(getPointAtLength('M 5 5', 0)).toEqual({ x: 5, y: 5 });
  });

  it('gives a direction where the derivative vanishes', () => {
    expectPoint(getTangentAtLength('M0 0 C 0 0 10 0 10 0', 0), 1, 0);
    expectPoint(getTangentAtLength('M0 0 C 0 0 10 0 10 0', 10), 1, 0);
  });

  it('throws on wrong input', () => {
    expect(() => getPointAtLength('M0 0 L30 40', Number.NaN)).toThrow(/length must be a finite number/);
    expect(() => getTangentAtLength('M 5 5', 0)).toThrow(/has no length/);
    expect(() => getLength('')).toThrow(/d is empty/);
    expect(() => getLength('L 10 10')).toThrow(/must start with M/);
    expect(() => getLength('M 0 0 L 10')).toThrow(/expected a number/);
    expect(() => getLength('M 0 0 X 1')).toThrow(/unexpected "X"/);
    expect(() => getLength('M0 0 A 10 10 0 2 1 5 5')).toThrow(/arc flag/);
    expect(() => getLength('M0 0 Z 5')).toThrow(/expected a command after Z/);
    // @ts-expect-error not a string
    expect(() => getLength(42)).toThrow(/d must be a string/);
  });
});

describe('evolvePath', () => {
  it('returns the dash values that draw a part of the path', () => {
    expect(evolvePath(0.25, 'M0 0 L100 0')).toEqual({ strokeDasharray: '100 100', strokeDashoffset: 75 });
    expect(evolvePath(0, 'M0 0 L100 0').strokeDashoffset).toBe(100);
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
