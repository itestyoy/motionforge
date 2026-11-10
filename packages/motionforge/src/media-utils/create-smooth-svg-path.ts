export type Point = { x: number; y: number };

const line = (a: Point, b: Point) => ({
  length: Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2),
  angle: Math.atan2(b.y - a.y, b.x - a.x),
});

// Control point of `current`, along the line from `previous` to `next`.
const controlPoint = ({
  current,
  previous,
  next,
  reverse,
}: {
  current: Point;
  previous: Point | undefined;
  next: Point | undefined;
  reverse: boolean;
}): Point => {
  const smoothing = 0.2;
  const o = line(previous || current, next || current);
  const angle = o.angle + (reverse ? Math.PI : 0);
  const length = o.length * smoothing;
  return { x: current.x + Math.cos(angle) * length, y: current.y + Math.sin(angle) * length };
};

/**
 * Remotion's `createSmoothSvgPath()` (`@remotion/media-utils`): an SVG path
 * `d` through `points`, joined by cubic Bézier curves (smoothing 0.2).
 */
export const createSmoothSvgPath = ({ points }: { points: Point[] }): string => {
  if (!Array.isArray(points)) {
    throw new TypeError(`createSmoothSvgPath(): points must be an array of { x, y }, got ${JSON.stringify(points)}`);
  }
  points.forEach((point, i) => {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new TypeError(`createSmoothSvgPath(): points[${i}] must be { x, y } with finite numbers, got ${JSON.stringify(point)}`);
    }
  });
  return points.reduce((acc, current, i, a) => {
    if (i === 0) return `M ${current.x},${current.y}`;
    const previous = a[i - 1];
    const cp1 = controlPoint({ current: previous, previous: a[i - 2], next: current, reverse: false });
    const cp2 = controlPoint({ current, previous, next: a[i + 1], reverse: true });
    return `${acc} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${current.x},${current.y}`;
  }, '');
};
