/**
 * Morphing between paths, as Remotion's interpolatePath() and
 * interpolatePaths(). The algorithm is the one of d3-interpolate-path
 * (Peter Beshai, BSD-3-Clause), which Remotion adapted: both paths are reduced
 * to M, L, C and Z, the shorter one is extended by splitting its segments
 * until both have as many instructions, lines become curves where the other
 * path has a curve, and the coordinates are mixed.
 */
import type { InterpolateOptions } from '../../core/types';
import { interpolate } from '../animation';
import {
  type CInstruction,
  type Point,
  type ReducedInstruction,
  getEndPosition,
  parsePath,
  quadToCubic,
  reduceInstructions,
  serializeInstructions,
} from './instructions';

// Splits a Bézier given by its points into two at t (de Casteljau).
const decasteljau = (points: number[][], t: number): { left: number[][]; right: number[][] } => {
  const left: number[][] = [];
  const right: number[][] = [];
  const recurse = (level: number[][]) => {
    if (level.length === 1) {
      left.push(level[0]);
      right.push(level[0]);
      return;
    }
    const next: number[][] = [];
    for (let i = 0; i < level.length - 1; i++) {
      if (i === 0) left.push(level[0]);
      if (i === level.length - 2) right.push(level[i + 1]);
      next.push([(1 - t) * level[i][0] + t * level[i + 1][0], (1 - t) * level[i][1] + t * level[i + 1][1]]);
    }
    recurse(next);
  };
  if (points.length) recurse(points);
  return { left, right: right.reverse() };
};

// Splits the curve into `count` pieces of equal parameter length.
const splitCurveAsPoints = (points: number[][], count: number): number[][][] => {
  const pieces: number[][][] = [];
  let remaining = points;
  const increment = 1 / count;
  for (let i = 0; i < count - 1; i++) {
    const { left, right } = decasteljau(remaining, increment / (1 - increment * i));
    pieces.push(left);
    remaining = right;
  }
  pieces.push(remaining);
  return pieces;
};

const pointsToInstruction = (points: number[][]): ReducedInstruction => {
  const [x, y] = points[points.length - 1];
  if (points.length === 4) {
    return { type: 'C', cp1x: points[1][0], cp1y: points[1][1], cp2x: points[2][0], cp2y: points[2][1], x, y };
  }
  if (points.length === 3) {
    return quadToCubic({ x: points[0][0], y: points[0][1] }, points[1][0], points[1][1], x, y);
  }
  return { type: 'L', x, y };
};

// Splits the segment from `start` to `end` into `count` instructions.
const splitSegment = (start: ReducedInstruction, end: ReducedInstruction, count: number): ReducedInstruction[] => {
  if (end.type === 'L' || end.type === 'C') {
    if (start.type === 'Z') return [];
    const points = [[start.x, start.y]];
    if (end.type === 'C') points.push([end.cp1x, end.cp1y], [end.cp2x, end.cp2y]);
    points.push([end.x, end.y]);
    return splitCurveAsPoints(points, count).map(pointsToInstruction);
  }
  // Anything else: repeat the start point, then the end.
  const copy: ReducedInstruction = start.type === 'M' ? { type: 'L', x: start.x, y: start.y } : start;
  return [...new Array<ReducedInstruction>(count - 1).fill(copy), end];
};

// Extends `commands` to as many instructions as `reference` by splitting its
// segments; every point of `commands` stays in the result.
const extendInstructions = (commands: ReducedInstruction[], reference: ReducedInstruction[]): ReducedInstruction[] => {
  const segments = commands.length - 1;
  const referenceSegments = reference.length - 1;
  const ratio = segments / referenceSegments;
  // How many pieces each segment of `commands` becomes.
  const counts: number[] = [];
  for (let i = 0; i < referenceSegments; i++) {
    const index = Math.floor(ratio * i);
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const extended: ReducedInstruction[] = [commands[0]];
  counts.forEach((count, i) => {
    if (count === undefined) return;
    if (i === commands.length - 1) {
      // The last command: repeated (a move as a line).
      const last = commands[commands.length - 1];
      const copy: ReducedInstruction = last.type === 'M' ? { type: 'L', x: last.x, y: last.y } : { ...last };
      for (let k = 0; k < count; k++) extended.push(copy);
      return;
    }
    extended.push(...splitSegment(commands[i], commands[i + 1], count));
  });
  return extended;
};

// `command` as the type of `target` (a line becomes a straight cubic curve).
const toSameType = (command: ReducedInstruction, target: ReducedInstruction, current: Point): ReducedInstruction => {
  if (command.type === 'M' || target.type === 'M' || command.type === target.type) return { ...command };
  if (target.type === 'C' && command.type === 'L') {
    return { type: 'C', cp1x: current.x, cp1y: current.y, cp2x: command.x, cp2y: command.y, x: command.x, y: command.y };
  }
  if (target.type === 'L' && command.type === 'C') return { type: 'L', x: command.x, y: command.y };
  if (target.type === 'Z') return { type: 'Z' };
  throw new Error(`interpolatePath: cannot turn a ${command.type} instruction into a ${target.type} instruction`);
};

const mismatch = (fn: string): never => {
  throw new Error(`${fn}: the paths have different subpath structures (a move or a close where the other path draws)`);
};

const mix = (t: number, a: ReducedInstruction, b: ReducedInstruction): ReducedInstruction => {
  if (a.type !== b.type) mismatch('interpolatePath');
  const lerp = (p: number, q: number) => (1 - t) * p + t * q;
  switch (a.type) {
    case 'Z':
      return a;
    case 'C': {
      const c = b as CInstruction;
      return {
        type: 'C',
        cp1x: lerp(a.cp1x, c.cp1x),
        cp2x: lerp(a.cp2x, c.cp2x),
        cp1y: lerp(a.cp1y, c.cp1y),
        cp2y: lerp(a.cp2y, c.cp2y),
        x: lerp(a.x, c.x),
        y: lerp(a.y, c.y),
      };
    }
    default: {
      const p = b as { x: number; y: number };
      return { type: a.type, x: lerp(a.x, p.x), y: lerp(a.y, p.y) };
    }
  }
};

const reducedOf = (fn: string, path: string): ReducedInstruction[] => {
  if (typeof path !== 'string') {
    throw new Error(`${fn}: paths must be strings, got ${JSON.stringify(path)}`);
  }
  return reduceInstructions(parsePath(path));
};

const checkFinite = (fn: string, name: string, value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${fn}: ${name} must be a finite number, got ${value}`);
  }
};

/**
 * The path between `firstPath` (at 0) and `secondPath` (at 1), as Remotion's
 * interpolatePath(). At exactly 0 and 1 the paths come back unchanged;
 * values outside 0..1 extrapolate. A closing Z is kept only if both paths
 * end with one.
 */
export const interpolatePath = (value: number, firstPath: string, secondPath: string): string => {
  checkFinite('interpolatePath', 'value', value);
  const a = reducedOf('interpolatePath', firstPath);
  const b = reducedOf('interpolatePath', secondPath);
  if (value === 1) return secondPath;
  if (value === 0) return firstPath;

  let aCommands = a.slice();
  let bCommands = b.slice();
  const addZ = aCommands[aCommands.length - 1].type === 'Z' && bCommands[bCommands.length - 1].type === 'Z';
  if (aCommands[aCommands.length - 1].type === 'Z') aCommands.pop();
  if (bCommands[bCommands.length - 1].type === 'Z') bCommands.pop();
  if (aCommands.length === 0) aCommands.push(bCommands[0]);
  else if (bCommands.length === 0) bCommands.push(aCommands[0]);

  if (bCommands.length > aCommands.length) aCommands = extendInstructions(aCommands, bCommands);
  else if (aCommands.length > bCommands.length) bCommands = extendInstructions(bCommands, aCommands);

  const aSameType = aCommands.map((command, i) =>
    toSameType(command, bCommands[i], getEndPosition(aCommands.slice(0, i))),
  );
  if (addZ) {
    aSameType.push({ type: 'Z' });
    bCommands.push({ type: 'Z' });
  }
  return serializeInstructions(aSameType.map((command, i) => mix(value, command, bCommands[i])));
};

export type InterpolatePathsOptions = Pick<InterpolateOptions, 'easing' | 'posterize'> & {
  extrapolateLeft?: 'extend' | 'clamp' | 'wrap';
  extrapolateRight?: 'extend' | 'clamp' | 'wrap';
};

// Writes floating-point artifacts (0.30000000000000004) as the short number
// they stand for, without rounding small coordinates to zero.
const tidyNumbers = (path: string): string =>
  path.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, (value) => {
    const number = Number(value);
    return Number.isInteger(number) ? value : String(Number(number.toPrecision(15)));
  });

/**
 * Interpolates between several paths with keyframes, as Remotion's
 * interpolatePaths(): `inputRange` and the options work as in
 * interpolate() (`extrapolateLeft` / `extrapolateRight`: 'extend' (default),
 * 'clamp' or 'wrap'). At a keyframe the path comes back unchanged.
 *
 *   interpolatePaths(frame, [0, 30, 60], [circle, star, heart], { easing: Easing.inOut(Easing.cubic) })
 */
export const interpolatePaths = (
  input: number,
  inputRange: readonly number[],
  outputRange: readonly string[],
  options?: InterpolatePathsOptions,
): string => {
  const fn = 'interpolatePaths';
  if (!Array.isArray(outputRange)) {
    throw new Error(`${fn}: outputRange must be an array of SVG path strings, got ${JSON.stringify(outputRange)}`);
  }
  for (const path of outputRange) {
    if (typeof path !== 'string') {
      throw new Error(`${fn}: outputRange must contain only SVG path strings, got ${JSON.stringify(path)}`);
    }
  }
  for (const side of ['extrapolateLeft', 'extrapolateRight'] as const) {
    const extrapolation = options?.[side];
    if (extrapolation !== undefined && extrapolation !== 'extend' && extrapolation !== 'clamp' && extrapolation !== 'wrap') {
      throw new Error(`${fn}: ${side} must be "extend", "clamp" or "wrap", got ${JSON.stringify(extrapolation)}`);
    }
  }
  // The weight of each path: interpolate() over the basis vectors, so segment
  // selection, easing overshoot and spring tails work as in interpolate().
  const weights = outputRange.map((_, pathIndex) =>
    interpolate(
      input,
      inputRange,
      outputRange.map((__, index) => (index === pathIndex ? 1 : 0)),
      options,
    ),
  );
  const exact = weights.findIndex(
    (weight, index) => weight === 1 && weights.every((other, otherIndex) => otherIndex === index || other === 0),
  );
  if (exact !== -1) return outputRange[exact];

  const contributing = outputRange
    .map((path, index) => ({ path, weight: weights[index] }))
    .filter(({ weight }) => weight !== 0);
  const paths = contributing.map(({ path }) => reducedOf(fn, path));
  const closed = paths.every((commands) => commands[commands.length - 1].type === 'Z');
  const open = paths.map((commands) => (commands[commands.length - 1].type === 'Z' ? commands.slice(0, -1) : commands));
  const reference = open.reduce((longest, commands) => (commands.length > longest.length ? commands : longest));
  const extended = open.map((commands) =>
    commands.length < reference.length ? extendInstructions(commands, reference) : commands,
  );

  const result: ReducedInstruction[] = reference.map((_, index) => {
    const commands = extended.map((path) => path[index]);
    if (commands.some((command) => command.type === 'Z')) {
      if (commands.every((command) => command.type === 'Z')) return { type: 'Z' };
      return mismatch(fn);
    }
    // A common cubic keeps every curve while lines and curves mix.
    const target = commands.find((command) => command.type === 'C') ?? commands[0];
    const coordinates = commands.map((command, pathIndex) => {
      if ((command.type === 'M') !== (target.type === 'M')) mismatch(fn);
      const same = toSameType(command, target, getEndPosition(extended[pathIndex].slice(0, index)));
      if (same.type === 'Z') return [];
      return same.type === 'C' ? [same.x, same.y, same.cp1x, same.cp1y, same.cp2x, same.cp2y] : [same.x, same.y];
    });
    const values = coordinates[0].map((base, k) => {
      const mixed = coordinates.reduce((sum, path, pathIndex) => sum + (path[k] - base) * contributing[pathIndex].weight, base);
      if (Number.isFinite(mixed)) return mixed;
      // Opposite large coordinates can overflow when subtracting the base.
      return coordinates.reduce((sum, path, pathIndex) => sum + path[k] * contributing[pathIndex].weight, 0);
    });
    if (target.type === 'C') {
      return { type: 'C', x: values[0], y: values[1], cp1x: values[2], cp1y: values[3], cp2x: values[4], cp2y: values[5] };
    }
    return { type: target.type as 'M' | 'L', x: values[0], y: values[1] };
  });
  if (closed) result.push({ type: 'Z' });
  return tidyNumbers(serializeInstructions(result));
};
