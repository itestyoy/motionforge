/**
 * SVG path data as a list of instructions, with the instruction types of
 * `@remotion/paths`: parse, serialize, make absolute, reduce to M L C Z.
 */
interface Point {
    x: number;
    y: number;
}
type MInstruction = {
    type: 'M';
    x: number;
    y: number;
};
type LInstruction = {
    type: 'L';
    x: number;
    y: number;
};
type CInstruction = {
    type: 'C';
    cp1x: number;
    cp1y: number;
    cp2x: number;
    cp2y: number;
    x: number;
    y: number;
};
type QInstruction = {
    type: 'Q';
    cpx: number;
    cpy: number;
    x: number;
    y: number;
};
type ZInstruction = {
    type: 'Z';
};
/** Only M, L, C and Z, all absolute: what reduceInstructions() returns. */
type ReducedInstruction = MInstruction | LInstruction | CInstruction | ZInstruction;
/** Every instruction with absolute coordinates: what normalizePath() writes. */
type AbsoluteInstruction = ReducedInstruction | QInstruction | {
    type: 'A';
    rx: number;
    ry: number;
    xAxisRotation: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
    x: number;
    y: number;
} | {
    type: 'S';
    cpx: number;
    cpy: number;
    x: number;
    y: number;
} | {
    type: 'T';
    x: number;
    y: number;
} | {
    type: 'H';
    x: number;
} | {
    type: 'V';
    y: number;
};
/** One command of SVG path data, as parsePath() returns it (lower case: relative). */
type Instruction = AbsoluteInstruction | {
    type: 'm';
    dx: number;
    dy: number;
} | {
    type: 'l';
    dx: number;
    dy: number;
} | {
    type: 'h';
    dx: number;
} | {
    type: 'v';
    dy: number;
} | {
    type: 'c';
    cp1dx: number;
    cp1dy: number;
    cp2dx: number;
    cp2dy: number;
    dx: number;
    dy: number;
} | {
    type: 's';
    cpdx: number;
    cpdy: number;
    dx: number;
    dy: number;
} | {
    type: 'q';
    cpdx: number;
    cpdy: number;
    dx: number;
    dy: number;
} | {
    type: 't';
    dx: number;
    dy: number;
} | {
    type: 'a';
    rx: number;
    ry: number;
    xAxisRotation: number;
    largeArcFlag: boolean;
    sweepFlag: boolean;
    dx: number;
    dy: number;
};
/**
 * Parses SVG path data into instructions, as Remotion's parsePath(): one
 * instruction per command, relative commands stay relative (lower case), a
 * command's repeated arguments become repeated instructions, extra pairs
 * after M / m are L / l, z becomes Z.
 *
 * Throws for anything that is not path data, naming the position. The path
 * must start with M or m.
 */
declare const parsePath: (path: string) => Instruction[];
/** Writes instructions as SVG path data (`"M 0 0 L 10 0 Z"`), as Remotion does. */
declare const serializeInstructions: (path: Instruction[]) => string;
/** Makes every coordinate of a path absolute (as Remotion's normalizePath()). */
declare const normalizePath: (path: string) => string;
/**
 * Reduces instructions to M, L, C and Z with absolute coordinates, as
 * Remotion's reduceInstructions(): H / V become L, Q / T become C, S gets its
 * reflected control point, arcs become cubic curves (a degenerate arc a line).
 */
declare const reduceInstructions: (instruction: Instruction[]) => ReducedInstruction[];

export { type AbsoluteInstruction as A, type Instruction as I, type Point as P, type ReducedInstruction as R, normalizePath as n, parsePath as p, reduceInstructions as r, serializeInstructions as s };
