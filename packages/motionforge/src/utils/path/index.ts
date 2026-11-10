/**
 * SVG path functions without the DOM, as in `@remotion/paths`. They work in
 * Node (SSR, export) and give the same numbers everywhere.
 *
 * Path data: M L H V C S Q T A Z, absolute and relative, with the SVG rules
 * for implicit repetition (extra pairs after M are lines), S/T reflection, arc
 * radius scaling and zero-radius arcs (straight lines). Data that does not
 * parse throws, naming the position.
 */
export {
  parsePath,
  serializeInstructions,
  normalizePath,
  reduceInstructions,
} from './instructions';
export type {
  Instruction,
  AbsoluteInstruction,
  ReducedInstruction,
  Point,
} from './instructions';
export {
  getLength,
  getPointAtLength,
  getTangentAtLength,
  getInstructionIndexAtLength,
  evolvePath,
} from './geometry';
export {
  getBoundingBox,
  translatePath,
  resetPath,
  centerPath,
  scalePath,
  reversePath,
  getSubpaths,
  cutPath,
  extendViewBox,
  warpPath,
} from './transform';
export type { BoundingBox, CenterPathTarget, WarpPathFn } from './transform';
export { interpolatePath, interpolatePaths } from './interpolate';
export type { InterpolatePathsOptions } from './interpolate';
export { pathFromPoints } from './from-points';
export type { PathFromPointsOptions } from './from-points';
