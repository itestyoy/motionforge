/**
 * SVG path data as a list of instructions, with the instruction types of
 * `@remotion/paths`: parse, serialize, make absolute, reduce to M L C Z.
 */

export interface Point {
  x: number;
  y: number;
}

export type MInstruction = { type: 'M'; x: number; y: number };
export type LInstruction = { type: 'L'; x: number; y: number };
export type CInstruction = { type: 'C'; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number };
export type QInstruction = { type: 'Q'; cpx: number; cpy: number; x: number; y: number };
export type ZInstruction = { type: 'Z' };

/** Only M, L, C and Z, all absolute: what reduceInstructions() returns. */
export type ReducedInstruction = MInstruction | LInstruction | CInstruction | ZInstruction;

/** Every instruction with absolute coordinates: what normalizePath() writes. */
export type AbsoluteInstruction =
  | ReducedInstruction
  | QInstruction
  | {
      type: 'A';
      rx: number;
      ry: number;
      xAxisRotation: number;
      largeArcFlag: boolean;
      sweepFlag: boolean;
      x: number;
      y: number;
    }
  | { type: 'S'; cpx: number; cpy: number; x: number; y: number }
  | { type: 'T'; x: number; y: number }
  | { type: 'H'; x: number }
  | { type: 'V'; y: number };

/** One command of SVG path data, as parsePath() returns it (lower case: relative). */
export type Instruction =
  | AbsoluteInstruction
  | { type: 'm'; dx: number; dy: number }
  | { type: 'l'; dx: number; dy: number }
  | { type: 'h'; dx: number }
  | { type: 'v'; dy: number }
  | { type: 'c'; cp1dx: number; cp1dy: number; cp2dx: number; cp2dy: number; dx: number; dy: number }
  | { type: 's'; cpdx: number; cpdy: number; dx: number; dy: number }
  | { type: 'q'; cpdx: number; cpdy: number; dx: number; dy: number }
  | { type: 't'; dx: number; dy: number }
  | {
      type: 'a';
      rx: number;
      ry: number;
      xAxisRotation: number;
      largeArcFlag: boolean;
      sweepFlag: boolean;
      dx: number;
      dy: number;
    };

// The numeric fields of each instruction type, in the order SVG writes them.
// Arc flags are booleans and are written as 0 or 1.
const FIELDS: Record<Instruction['type'], readonly string[]> = {
  M: ['x', 'y'],
  m: ['dx', 'dy'],
  L: ['x', 'y'],
  l: ['dx', 'dy'],
  H: ['x'],
  h: ['dx'],
  V: ['y'],
  v: ['dy'],
  C: ['cp1x', 'cp1y', 'cp2x', 'cp2y', 'x', 'y'],
  c: ['cp1dx', 'cp1dy', 'cp2dx', 'cp2dy', 'dx', 'dy'],
  S: ['cpx', 'cpy', 'x', 'y'],
  s: ['cpdx', 'cpdy', 'dx', 'dy'],
  Q: ['cpx', 'cpy', 'x', 'y'],
  q: ['cpdx', 'cpdy', 'dx', 'dy'],
  T: ['x', 'y'],
  t: ['dx', 'dy'],
  A: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'x', 'y'],
  a: ['rx', 'ry', 'xAxisRotation', 'largeArcFlag', 'sweepFlag', 'dx', 'dy'],
  Z: [],
};

const NUMBER = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
const isSeparator = (char: string) =>
  char === ',' || char === ' ' || char === '\t' || char === '\n' || char === '\r' || char === '\f';

/**
 * Parses SVG path data into instructions, as Remotion's parsePath(): one
 * instruction per command, relative commands stay relative (lower case), a
 * command's repeated arguments become repeated instructions, extra pairs
 * after M / m are L / l, z becomes Z.
 *
 * Throws for anything that is not path data, naming the position. The path
 * must start with M or m.
 */
export const parsePath = (path: string): Instruction[] => {
  if (typeof path !== 'string') {
    throw new Error(`parsePath: the path must be a string, got ${JSON.stringify(path)}`);
  }
  const d = path;
  let i = 0;
  const fail = (message: string): never => {
    throw new Error(`parsePath: ${message} at position ${i} of "${d.length > 80 ? d.slice(0, 77) + '...' : d}"`);
  };
  const skipSeparators = () => {
    while (i < d.length && isSeparator(d[i])) i++;
  };
  const number = (): number => {
    skipSeparators();
    NUMBER.lastIndex = i;
    const match = NUMBER.exec(d);
    if (!match) return fail('expected a number');
    i = NUMBER.lastIndex;
    return parseFloat(match![0]);
  };
  // Arc flags are a single 0 or 1 and need no separator ("A1 1 0 011 1").
  const flag = (): boolean => {
    skipSeparators();
    if (d[i] === '0' || d[i] === '1') return d[i++] === '1';
    return fail('expected an arc flag (0 or 1)');
  };
  const numberAhead = () => {
    skipSeparators();
    return i < d.length && /[0-9.+-]/.test(d[i]);
  };

  const instructions: Instruction[] = [];
  let command: Instruction['type'] | null = null;

  for (;;) {
    skipSeparators();
    if (i >= d.length) break;
    const char = d[i];
    if (char in FIELDS || char === 'z') {
      command = char === 'z' ? 'Z' : (char as Instruction['type']);
      i++;
    } else if (command === null) {
      fail('a path must start with M or m');
    } else if (command === 'Z') {
      fail(`expected a command after Z, got "${char}"`);
    } else if (!/[0-9.+-]/.test(char)) {
      fail(`unexpected "${char}"`);
    }
    if (instructions.length === 0 && command !== 'M' && command !== 'm') fail('a path must start with M or m');

    const type = command as Instruction['type'];
    const instruction: Record<string, unknown> = { type };
    for (const field of FIELDS[type]) {
      instruction[field] = field === 'largeArcFlag' || field === 'sweepFlag' ? flag() : number();
    }
    instructions.push(instruction as Instruction);
    // Further coordinate pairs after a move are lines.
    if (type === 'M') command = 'L';
    if (type === 'm') command = 'l';

    if (type !== 'Z' && !numberAhead() && i < d.length && !(d[i] in FIELDS) && d[i] !== 'z') {
      fail(`unexpected "${d[i]}"`);
    }
  }

  if (instructions.length === 0) {
    throw new Error('parsePath: the path is empty; it must start with M or m');
  }
  return instructions;
};

const checkInstruction = (fn: string, instruction: unknown, index: number): Instruction => {
  const type = (instruction as { type?: unknown } | null)?.type;
  if (typeof instruction !== 'object' || instruction === null || typeof type !== 'string' || !(type in FIELDS)) {
    throw new Error(`${fn}: instructions[${index}] is not a path instruction, got ${JSON.stringify(instruction)}`);
  }
  for (const field of FIELDS[type as Instruction['type']]) {
    const value = (instruction as Record<string, unknown>)[field];
    const ok =
      field === 'largeArcFlag' || field === 'sweepFlag'
        ? typeof value === 'boolean'
        : typeof value === 'number' && Number.isFinite(value);
    if (!ok) {
      throw new Error(
        `${fn}: instructions[${index}] (${type}) needs ${field} as a ${
          field.endsWith('Flag') ? 'boolean' : 'finite number'
        }, got ${JSON.stringify(value)}`,
      );
    }
  }
  return instruction as Instruction;
};

/** Checks an array of instructions; throws naming the first bad one. */
export const checkInstructions = (fn: string, instructions: unknown): Instruction[] => {
  if (!Array.isArray(instructions)) {
    throw new Error(`${fn}: expected an array of instructions, got ${JSON.stringify(instructions)}`);
  }
  instructions.forEach((instruction, index) => checkInstruction(fn, instruction, index));
  return instructions as Instruction[];
};

const serializeInstruction = (instruction: Instruction): string => {
  const values = FIELDS[instruction.type].map((field) => {
    const value = (instruction as unknown as Record<string, number | boolean>)[field];
    return typeof value === 'boolean' ? Number(value) : value;
  });
  return [instruction.type, ...values].join(' ');
};

/** Writes instructions as SVG path data (`"M 0 0 L 10 0 Z"`), as Remotion does. */
export const serializeInstructions = (path: Instruction[]): string =>
  checkInstructions('serializeInstructions', path).map(serializeInstruction).join(' ');

/** Same instructions with absolute coordinates (Remotion's normalizeInstructions). */
export const normalizeInstructions = (instructions: Instruction[]): AbsoluteInstruction[] => {
  const normalized: AbsoluteInstruction[] = [];
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  for (const instruction of instructions) {
    switch (instruction.type) {
      case 'M':
      case 'L':
      case 'C':
      case 'S':
      case 'Q':
      case 'T':
      case 'A':
        normalized.push(instruction);
        x = instruction.x;
        y = instruction.y;
        if (instruction.type === 'M') {
          moveX = x;
          moveY = y;
        }
        break;
      case 'H':
        normalized.push(instruction);
        x = instruction.x;
        break;
      case 'V':
        normalized.push(instruction);
        y = instruction.y;
        break;
      case 'Z':
        normalized.push(instruction);
        x = moveX;
        y = moveY;
        break;
      case 'h':
        x += instruction.dx;
        normalized.push({ type: 'H', x });
        break;
      case 'v':
        y += instruction.dy;
        normalized.push({ type: 'V', y });
        break;
      default: {
        const startX = x;
        const startY = y;
        x += instruction.dx;
        y += instruction.dy;
        switch (instruction.type) {
          case 'm':
            moveX = x;
            moveY = y;
            normalized.push({ type: 'M', x, y });
            break;
          case 'l':
            normalized.push({ type: 'L', x, y });
            break;
          case 't':
            normalized.push({ type: 'T', x, y });
            break;
          case 'c':
            normalized.push({
              type: 'C',
              cp1x: startX + instruction.cp1dx,
              cp1y: startY + instruction.cp1dy,
              cp2x: startX + instruction.cp2dx,
              cp2y: startY + instruction.cp2dy,
              x,
              y,
            });
            break;
          case 's':
            normalized.push({ type: 'S', cpx: startX + instruction.cpdx, cpy: startY + instruction.cpdy, x, y });
            break;
          case 'q':
            normalized.push({ type: 'Q', cpx: startX + instruction.cpdx, cpy: startY + instruction.cpdy, x, y });
            break;
          case 'a':
            normalized.push({
              type: 'A',
              rx: instruction.rx,
              ry: instruction.ry,
              xAxisRotation: instruction.xAxisRotation,
              largeArcFlag: instruction.largeArcFlag,
              sweepFlag: instruction.sweepFlag,
              x,
              y,
            });
            break;
        }
      }
    }
  }
  return normalized;
};

/** Makes every coordinate of a path absolute (as Remotion's normalizePath()). */
export const normalizePath = (path: string): string =>
  serializeInstructions(normalizeInstructions(parsePath(path)));

/** The end point of each instruction, and where the path stands after all of them. */
export const getEndPosition = (instructions: Instruction[]): Point => {
  const normalized = normalizeInstructions(instructions);
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  for (const instruction of normalized) {
    if (instruction.type === 'Z') {
      x = moveX;
      y = moveY;
    } else if (instruction.type === 'H') {
      x = instruction.x;
    } else if (instruction.type === 'V') {
      y = instruction.y;
    } else {
      x = instruction.x;
      y = instruction.y;
      if (instruction.type === 'M') {
        moveX = x;
        moveY = y;
      }
    }
  }
  return { x, y };
};

export const quadToCubic = (start: Point, cpx: number, cpy: number, x: number, y: number): CInstruction => ({
  type: 'C',
  cp1x: start.x + (2 / 3) * (cpx - start.x),
  cp1y: start.y + (2 / 3) * (cpy - start.y),
  cp2x: x + (2 / 3) * (cpx - x),
  cp2y: y + (2 / 3) * (cpy - y),
  x,
  y,
});

// An elliptical arc as cubic Béziers, one per quarter turn or less (the
// endpoint-to-center conversion of SVG 1.1, appendix F.6.5, with the radii
// scaled up when they cannot span the endpoints). A degenerate arc (same
// endpoints or a zero radius) is an empty list.
const arcToCubics = (
  x1: number,
  y1: number,
  radiusX: number,
  radiusY: number,
  rotationDegrees: number,
  largeArc: boolean,
  sweep: boolean,
  x2: number,
  y2: number,
): CInstruction[] => {
  // The arithmetic follows Remotion's step by step, so reduced paths match theirs.
  const phi = (rotationDegrees * (Math.PI * 2)) / 360;
  const sin = Math.sin(phi);
  const cos = Math.cos(phi);
  const x1p = (cos * (x1 - x2)) / 2 + (sin * (y1 - y2)) / 2;
  const y1p = (-sin * (x1 - x2)) / 2 + (cos * (y1 - y2)) / 2;
  if ((x1p === 0 && y1p === 0) || radiusX === 0 || radiusY === 0) return [];

  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const rxSq = rx * rx;
  const rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  const radicand = Math.max(0, rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq);
  const coefficient = Math.sqrt(radicand) * (largeArc === sweep ? -1 : 1);
  const cxp = ((coefficient * rx) / ry) * y1p;
  const cyp = ((coefficient * -ry) / rx) * x1p;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    return sign * Math.acos(Math.max(-1, Math.min(1, ux * vx + uy * vy)));
  };
  const v1x = (x1p - cxp) / rx;
  const v1y = (y1p - cyp) / ry;
  const v2x = (-x1p - cxp) / rx;
  const v2y = (-y1p - cyp) / ry;
  let theta = angle(1, 0, v1x, v1y);
  let delta = angle(v1x, v1y, v2x, v2y);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;

  const count = Math.max(Math.ceil(Math.abs(delta) / (Math.PI / 2)), 1);
  delta /= count;
  // The standard cubic for an arc of `delta` on the unit circle, mapped onto the ellipse.
  const alpha = (4 / 3) * Math.tan(delta / 4);
  const map = (ux: number, uy: number): [number, number] => {
    const px = ux * rx;
    const py = uy * ry;
    return [cos * px - sin * py + cx, sin * px + cos * py + cy];
  };
  const curves: CInstruction[] = [];
  for (let k = 0; k < count; k++) {
    const ax = Math.cos(theta);
    const ay = Math.sin(theta);
    const bx = Math.cos(theta + delta);
    const by = Math.sin(theta + delta);
    const [cp1x, cp1y] = map(ax - ay * alpha, ay + ax * alpha);
    const [cp2x, cp2y] = map(bx + by * alpha, by - bx * alpha);
    const [x, y] = map(bx, by);
    curves.push({ type: 'C', cp1x, cp1y, cp2x, cp2y, x, y });
    theta += delta;
  }
  return curves;
};

/**
 * Reduces instructions to M, L, C and Z with absolute coordinates, as
 * Remotion's reduceInstructions(): H / V become L, Q / T become C, S gets its
 * reflected control point, arcs become cubic curves (a degenerate arc a line).
 */
export const reduceInstructions = (instruction: Instruction[]): ReducedInstruction[] => {
  const normalized = normalizeInstructions(checkInstructions('reduceInstructions', instruction));
  const reduced: ReducedInstruction[] = [];
  let x = 0;
  let y = 0;
  let moveX = 0;
  let moveY = 0;
  // The control point the next S (cubic) or T (quadratic) reflects.
  let cubicControl: Point | null = null;
  let quadControl: Point | null = null;

  for (const segment of normalized) {
    let nextCubic: Point | null = null;
    let nextQuad: Point | null = null;
    switch (segment.type) {
      case 'M':
        reduced.push(segment);
        moveX = segment.x;
        moveY = segment.y;
        break;
      case 'L':
        reduced.push(segment);
        break;
      case 'Z':
        reduced.push(segment);
        break;
      case 'H':
        reduced.push({ type: 'L', x: segment.x, y });
        break;
      case 'V':
        reduced.push({ type: 'L', x, y: segment.y });
        break;
      case 'C':
        reduced.push(segment);
        nextCubic = { x: segment.cp2x, y: segment.cp2y };
        break;
      case 'S': {
        const cp1 = cubicControl ? { x: 2 * x - cubicControl.x, y: 2 * y - cubicControl.y } : { x, y };
        reduced.push({ type: 'C', cp1x: cp1.x, cp1y: cp1.y, cp2x: segment.cpx, cp2y: segment.cpy, x: segment.x, y: segment.y });
        nextCubic = { x: segment.cpx, y: segment.cpy };
        break;
      }
      case 'Q':
        reduced.push(quadToCubic({ x, y }, segment.cpx, segment.cpy, segment.x, segment.y));
        nextQuad = { x: segment.cpx, y: segment.cpy };
        break;
      case 'T': {
        const control: Point = quadControl ? { x: 2 * x - quadControl.x, y: 2 * y - quadControl.y } : { x, y };
        reduced.push(quadToCubic({ x, y }, control.x, control.y, segment.x, segment.y));
        nextQuad = control;
        break;
      }
      case 'A': {
        const curves = arcToCubics(
          x,
          y,
          segment.rx,
          segment.ry,
          segment.xAxisRotation,
          segment.largeArcFlag,
          segment.sweepFlag,
          segment.x,
          segment.y,
        );
        // A degenerate arc is kept as a line so the instruction count stays meaningful.
        reduced.push(...(curves.length === 0 ? [{ type: 'L' as const, x: segment.x, y: segment.y }] : curves));
        break;
      }
    }
    cubicControl = nextCubic;
    quadControl = nextQuad;
    if (segment.type === 'Z') {
      x = moveX;
      y = moveY;
    } else if (segment.type === 'H') {
      x = segment.x;
    } else if (segment.type === 'V') {
      y = segment.y;
    } else {
      x = segment.x;
      y = segment.y;
    }
  }
  return reduced;
};
