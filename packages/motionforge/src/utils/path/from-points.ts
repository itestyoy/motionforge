import type { Point } from './instructions';

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
