/**
 * Functions that change a path, as in `@remotion/paths`: bounding box,
 * translate, scale, reset, center, reverse, split into subpaths, cut, warp.
 */
import { cubicSegment } from './geometry';
import {
  type CInstruction,
  type Instruction,
  type LInstruction,
  type Point,
  type ReducedInstruction,
  normalizeInstructions,
  parsePath,
  reduceInstructions,
  serializeInstructions,
} from './instructions';

export type BoundingBox = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  viewBox: string;
  width: number;
  height: number;
};

const checkNumber = (fn: string, name: string, value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fn}: ${name} must be a finite number, got ${value}`);
  }
};

// Range of a quadratic Bézier coordinate with control values a, b, c: the
// ends, and the extremum when b lies strictly above or below both ends.
const quadraticRange = (a: number, b: number, c: number): [number, number] => {
  const min = Math.min(a, c);
  const max = Math.max(a, c);
  if ((b - a) * (c - b) >= 0) return [min, max];
  const extremum = (a * c - b * b) / (a - 2 * b + c);
  return extremum < min ? [extremum, max] : [min, extremum];
};

// Range of a cubic Bézier coordinate with control values a, b, c, d over
// t in [0, 1]: the ends and the roots of the derivative (the same closed form
// as Remotion, so the numbers match theirs).
const cubicRange = (a: number, b: number, c: number, d: number): [number, number] => {
  const k = a - 3 * b + 3 * c - d;
  if (Math.abs(k) < 1e-8) {
    // (Almost) no cubic term: the same curve as a quadratic one.
    if (a === d && a === b) return [a, d];
    return quadraticRange(a, -0.5 * a + 1.5 * b, a - 3 * b + 3 * c);
  }
  // The reduced discriminant of the derivative.
  const discriminant = -a * c + a * d - b * c - b * d + b * b + c * c;
  if (discriminant <= 0) return [Math.min(a, d), Math.max(a, d)];
  const root = Math.sqrt(discriminant);
  let min = Math.min(a, d);
  let max = Math.max(a, d);
  const l = a - 2 * b + c;
  for (const t of [(l + root) / k, (l - root) / k]) {
    if (t > 0 && t < 1) {
      const value = a * (1 - t) * (1 - t) * (1 - t) + b * 3 * (1 - t) * (1 - t) * t + c * 3 * (1 - t) * t * t + d * t * t * t;
      if (value < min) min = value;
      if (value > max) max = value;
    }
  }
  return [min, max];
};

/** Bounding box of reduced instructions; moves count, as in Remotion. */
export const getBoundingBoxFromInstructions = (instructions: ReducedInstruction[]): BoundingBox => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  const add = (px: number, py: number) => {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
  };
  for (const instruction of instructions) {
    switch (instruction.type) {
      case 'M':
        moveX = instruction.x;
        moveY = instruction.y;
        add(instruction.x, instruction.y);
        x = instruction.x;
        y = instruction.y;
        break;
      case 'L':
        add(instruction.x, instruction.y);
        x = instruction.x;
        y = instruction.y;
        break;
      case 'C': {
        const [x1, x2] = cubicRange(x, instruction.cp1x, instruction.cp2x, instruction.x);
        const [y1, y2] = cubicRange(y, instruction.cp1y, instruction.cp2y, instruction.y);
        add(x1, y1);
        add(x2, y2);
        x = instruction.x;
        y = instruction.y;
        break;
      }
      case 'Z':
        x = moveX;
        y = moveY;
        break;
    }
  }
  return {
    x1: minX,
    y1: minY,
    x2: maxX,
    y2: maxY,
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
    width: maxX - minX,
    height: maxY - minY,
  };
};

/**
 * Bounding box of the drawn path `{ x1, y1, x2, y2, width, height, viewBox }`,
 * as Remotion's getBoundingBox(): curves are measured to their extrema,
 * control points do not count.
 */
export const getBoundingBox = (d: string): BoundingBox =>
  getBoundingBoxFromInstructions(reduceInstructions(parsePath(d)));

const translateInstructions = (instructions: Instruction[], x: number, y: number): Instruction[] =>
  instructions.map((instruction, index): Instruction => {
    switch (instruction.type) {
      case 'm':
        // An initial relative move is relative to the origin.
        return index === 0 ? { type: 'm', dx: instruction.dx + x, dy: instruction.dy + y } : instruction;
      case 'M':
      case 'L':
      case 'T':
        return { ...instruction, x: instruction.x + x, y: instruction.y + y };
      case 'H':
        return { type: 'H', x: instruction.x + x };
      case 'V':
        return { type: 'V', y: instruction.y + y };
      case 'A':
        return { ...instruction, x: instruction.x + x, y: instruction.y + y };
      case 'C':
        return {
          type: 'C',
          cp1x: instruction.cp1x + x,
          cp1y: instruction.cp1y + y,
          cp2x: instruction.cp2x + x,
          cp2y: instruction.cp2y + y,
          x: instruction.x + x,
          y: instruction.y + y,
        };
      case 'S':
      case 'Q':
        return { ...instruction, cpx: instruction.cpx + x, cpy: instruction.cpy + y, x: instruction.x + x, y: instruction.y + y };
      default:
        // Relative commands and Z move with the point they start from.
        return instruction;
    }
  });

/** Moves the path by `x` and `y`; relative commands stay relative (as in Remotion). */
export const translatePath = (path: string, x: number, y: number): string => {
  checkNumber('translatePath', 'x', x);
  checkNumber('translatePath', 'y', y);
  return serializeInstructions(translateInstructions(parsePath(path), x, y));
};

/** Moves the path so that the top left corner of its bounding box is at 0, 0. */
export const resetPath = (d: string): string => {
  const box = getBoundingBox(d);
  return translatePath(d, -box.x1, -box.y1);
};

export type CenterPathTarget = { x: number; y: number };

/** Moves the path so that the center of its bounding box is at `target` (default 0, 0). */
export const centerPath = (d: string, target: CenterPathTarget = { x: 0, y: 0 }): string => {
  if (typeof target !== 'object' || target === null) {
    throw new Error(`centerPath: target must be { x, y }, got ${JSON.stringify(target)}`);
  }
  checkNumber('centerPath', 'target.x', target.x);
  checkNumber('centerPath', 'target.y', target.y);
  const box = getBoundingBox(d);
  return translatePath(d, target.x - (box.x1 + box.x2) / 2, target.y - (box.y1 + box.y2) / 2);
};

/**
 * Scales the path by `scaleX` and `scaleY` around the top left corner of its
 * bounding box, as Remotion's scalePath(). The result has only M, L, C and Z.
 */
export const scalePath = (d: string, scaleX: number, scaleY: number): string => {
  checkNumber('scalePath', 'scaleX', scaleX);
  checkNumber('scalePath', 'scaleY', scaleY);
  const reduced = reduceInstructions(parsePath(d));
  const box = getBoundingBoxFromInstructions(reduced);
  const sx = (value: number) => (value - box.x1) * scaleX + box.x1;
  const sy = (value: number) => (value - box.y1) * scaleY + box.y1;
  return serializeInstructions(
    reduced.map((instruction): ReducedInstruction => {
      switch (instruction.type) {
        case 'M':
        case 'L':
          return { type: instruction.type, x: sx(instruction.x), y: sy(instruction.y) };
        case 'C':
          return {
            type: 'C',
            cp1x: sx(instruction.cp1x),
            cp1y: sy(instruction.cp1y),
            cp2x: sx(instruction.cp2x),
            cp2y: sy(instruction.cp2y),
            x: sx(instruction.x),
            y: sy(instruction.y),
          };
        case 'Z':
          return instruction;
      }
    }),
  );
};

/** Splits reduced or parsed instructions at each move into subpaths (the first instruction of each is M). */
const splitSubpaths = (instructions: Instruction[]): Instruction[][] => {
  const absolute = normalizeInstructions(instructions);
  const subpaths: Instruction[][] = [];
  instructions.forEach((instruction, index) => {
    if (instruction.type === 'M' || instruction.type === 'm') {
      const move = absolute[index] as { x: number; y: number };
      subpaths.push([{ type: 'M', x: move.x, y: move.y }]);
    } else {
      subpaths[subpaths.length - 1].push(instruction);
    }
  });
  return subpaths;
};

/**
 * Splits the path at each M or m into subpaths, as Remotion's getSubpaths().
 * Each starts with an absolute M; the other commands are kept as they are.
 */
export const getSubpaths = (path: string): string[] => splitSubpaths(parsePath(path)).map(serializeInstructions);

// Reverses one subpath of M, L, C and Z (after Pomax's svg-path-reverse).
const reverseSubpath = (instructions: ReducedInstruction[]): string => {
  // Commands after a Z start from the beginning of the closed subpath:
  // reverse them as a subpath of their own.
  const closeIndex = instructions.findIndex((instruction) => instruction.type === 'Z');
  const start = instructions[0];
  if (closeIndex !== -1 && closeIndex < instructions.length - 1 && start.type === 'M') {
    return [
      reverseSubpath(instructions.slice(0, closeIndex + 1)),
      reverseSubpath([{ type: 'M', x: start.x, y: start.y }, ...instructions.slice(closeIndex + 1)]),
    ].join(' ');
  }
  const reversed: ReducedInstruction[] = [];
  let x = 0;
  let y = 0;
  for (const instruction of instructions) {
    if (instruction.type === 'C') {
      reversed.unshift({
        type: 'C',
        cp1x: instruction.cp2x,
        cp1y: instruction.cp2y,
        cp2x: instruction.cp1x,
        cp2y: instruction.cp1y,
        x,
        y,
      });
    } else if (instruction.type === 'L') {
      reversed.unshift({ type: 'L', x, y });
    }
    if (instruction.type !== 'Z') {
      x = instruction.x;
      y = instruction.y;
    }
  }
  reversed.unshift({ type: 'M', x, y });
  let result = serializeInstructions(reversed);
  if (instructions[instructions.length - 1].type === 'Z') result += 'Z';
  return result.replace(/M M/g, 'Z M');
};

/** Reverses the direction of the path (end becomes start), as Remotion's reversePath(). */
export const reversePath = (path: string): string =>
  (splitSubpaths(reduceInstructions(parsePath(path))) as ReducedInstruction[][])
    .map(reverseSubpath)
    .join(' ')
    .replace(/ +/g, ' ')
    .trim();

const lerp = (a: Point, b: Point, t: number): Point => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });

/**
 * The first `length` of the path, as Remotion's cutPath(): the path is
 * reduced to M, L, C and Z and the instruction at `length` is cut there (a
 * curve split at the point at that length, a closing Z cut as a line).
 */
export const cutPath = (d: string, length: number): string => {
  if (typeof length !== 'number' || !Number.isFinite(length) || length < 0) {
    throw new Error(`cutPath: length must be a finite number >= 0, got ${length}`);
  }
  const reduced = reduceInstructions(parsePath(d));
  const result: ReducedInstruction[] = [];
  let current: Point = { x: 0, y: 0 };
  let subpathStart: Point = { x: 0, y: 0 };
  let sum = 0;
  for (const instruction of reduced) {
    let partLength = 0;
    let cut: (() => ReducedInstruction) | null = null;
    const from = current;
    if (instruction.type === 'M') {
      subpathStart = { x: instruction.x, y: instruction.y };
      current = subpathStart;
    } else if (instruction.type === 'L' || instruction.type === 'Z') {
      const to = instruction.type === 'L' ? { x: instruction.x, y: instruction.y } : subpathStart;
      partLength = Math.hypot(to.x - from.x, to.y - from.y);
      cut = (): LInstruction => ({ type: 'L', ...lerp(from, to, (length - sum) / partLength) });
      current = to;
    } else {
      const p1 = { x: instruction.cp1x, y: instruction.cp1y };
      const p2 = { x: instruction.cp2x, y: instruction.cp2y };
      const p3 = { x: instruction.x, y: instruction.y };
      const segment = cubicSegment(from, p1, p2, p3);
      partLength = segment.length;
      cut = (): CInstruction => {
        // de Casteljau at the parameter of the cut length.
        const t = segment.tAtLength(length - sum);
        const p01 = lerp(from, p1, t);
        const p12 = lerp(p1, p2, t);
        const p23 = lerp(p2, p3, t);
        const p012 = lerp(p01, p12, t);
        const end = lerp(p012, lerp(p12, p23, t), t);
        return { type: 'C', cp1x: p01.x, cp1y: p01.y, cp2x: p012.x, cp2y: p012.y, x: end.x, y: end.y };
      };
      current = p3;
    }
    if (sum + partLength > length) {
      result.push(cut ? cut() : instruction);
      return serializeInstructions(result);
    }
    sum += partLength;
    result.push(instruction);
    if (sum === length) return serializeInstructions(result);
  }
  return serializeInstructions(result);
};

/**
 * Widens a viewBox (`"x y width height"`) in all directions by `scale`
 * around its center, as Remotion's extendViewBox(): 2 doubles width and height.
 */
export const extendViewBox = (currentViewBox: string, scale: number): string => {
  checkNumber('extendViewBox', 'scale', scale);
  const parts =
    typeof currentViewBox === 'string'
      ? currentViewBox
          .trim()
          .split(/\s*,\s*|\s+/)
          .map((part) => (part === '' ? NaN : Number(part)))
      : [];
  if (parts.length !== 4 || parts.some((part) => !Number.isFinite(part))) {
    throw new Error(`extendViewBox: currentViewBox must be 4 valid numbers, but got "${currentViewBox}"`);
  }
  const [x, y, width, height] = parts;
  if (width <= 0 || height <= 0) {
    throw new Error(`extendViewBox: currentViewBox must have a positive width and height, but got "${currentViewBox}"`);
  }
  const relative = scale - 1;
  return [x - (relative * width) / 2, y - (relative * height) / 2, width + relative * width, height + relative * height].join(
    ' ',
  );
};

export type WarpPathFn = (point: { x: number; y: number }) => { x: number; y: number };

// Splits a Bézier given by its points (2: line, 4: cubic) at t = 0.5.
const splitHalf = (points: [number, number][]): [[number, number][], [number, number][]] => {
  const left: [number, number][] = [];
  const right: [number, number][] = [];
  let level = points;
  while (level.length > 0) {
    left.push(level[0]);
    right.unshift(level[level.length - 1]);
    const next: [number, number][] = [];
    for (let i = 1; i < level.length; i++) {
      const [x0, y0] = level[i - 1];
      const [x1, y1] = level[i];
      next.push([x0 + (x1 - x0) * 0.5, y0 + (y1 - y0) * 0.5]);
    }
    level = next;
  }
  return [left, right];
};

/**
 * Remaps every point of the path with `transformer`, as Remotion's
 * warpPath(): the path is reduced to M, L, C and Z, a closing Z gets an
 * explicit line, and each line and curve is halved until its chord is at most
 * `interpolationThreshold` long (default 1% of the larger side of the
 * bounding box), so the warp bends straight lines too.
 */
export const warpPath = (
  path: string,
  transformer: WarpPathFn,
  options?: { interpolationThreshold?: number },
): string => {
  if (typeof transformer !== 'function') {
    throw new Error(`warpPath: transformer must be a function ({ x, y }) => { x, y }, got ${transformer}`);
  }
  const reduced = reduceInstructions(parsePath(path));
  // An explicit line to the start before each Z, so the warp moves the closing edge too.
  const withLines: ReducedInstruction[] = [];
  let subpathStart: Point = { x: 0, y: 0 };
  for (const instruction of reduced) {
    if (instruction.type === 'M') subpathStart = { x: instruction.x, y: instruction.y };
    if (instruction.type === 'Z') withLines.push({ type: 'L', x: subpathStart.x, y: subpathStart.y });
    withLines.push(instruction);
  }
  let threshold = options?.interpolationThreshold;
  if (threshold === undefined) {
    const box = getBoundingBoxFromInstructions(withLines);
    threshold = Math.max(box.x2 - box.x1, box.y2 - box.y1) * 0.01;
  } else if (typeof threshold !== 'number' || !Number.isFinite(threshold) || threshold <= 0) {
    throw new Error(`warpPath: interpolationThreshold must be a positive number, got ${threshold}`);
  }

  const split: ReducedInstruction[] = [];
  let x = 0;
  let y = 0;
  for (const instruction of withLines) {
    if (instruction.type !== 'L' && instruction.type !== 'C') {
      split.push(instruction);
      if (instruction.type === 'M') {
        x = instruction.x;
        y = instruction.y;
      }
      continue;
    }
    const points: [number, number][] =
      instruction.type === 'L'
        ? [[x, y], [instruction.x, instruction.y]]
        : [[x, y], [instruction.cp1x, instruction.cp1y], [instruction.cp2x, instruction.cp2y], [instruction.x, instruction.y]];
    const stack = [points];
    while (stack.length > 0) {
      const part = stack.pop() as [number, number][];
      const first = part[0];
      const last = part[part.length - 1];
      if (Math.hypot(last[0] - first[0], last[1] - first[1]) > threshold) {
        const [left, right] = splitHalf(part);
        stack.push(right, left);
      } else if (part.length === 2) {
        split.push({ type: 'L', x: last[0], y: last[1] });
      } else {
        split.push({ type: 'C', cp1x: part[1][0], cp1y: part[1][1], cp2x: part[2][0], cp2y: part[2][1], x: last[0], y: last[1] });
      }
    }
    x = instruction.x;
    y = instruction.y;
  }

  const warp = (px: number, py: number): Point => {
    const point = transformer({ x: px, y: py });
    if (typeof point !== 'object' || point === null || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new Error(`warpPath: transformer must return { x, y } with finite numbers, got ${JSON.stringify(point)} for (${px}, ${py})`);
    }
    return point;
  };
  return serializeInstructions(
    split.map((instruction): ReducedInstruction => {
      if (instruction.type === 'Z') return instruction;
      const end = warp(instruction.x, instruction.y);
      if (instruction.type !== 'C') return { type: instruction.type, x: end.x, y: end.y };
      const cp1 = warp(instruction.cp1x, instruction.cp1y);
      const cp2 = warp(instruction.cp2x, instruction.cp2y);
      return { type: 'C', x: end.x, y: end.y, cp1x: cp1.x, cp1y: cp1.y, cp2x: cp2.x, cp2y: cp2.y };
    }),
  );
};
