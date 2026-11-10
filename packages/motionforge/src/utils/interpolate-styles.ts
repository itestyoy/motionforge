/**
 * interpolateStyles() with the API of @remotion/animation-utils: maps `input`
 * from `inputRange` to a style between the styles of `outputStylesRange`.
 *
 *   interpolateStyles(frame, [0, 30], [
 *     { opacity: 0, transform: makeTransform([translateY(-50)]) },
 *     { opacity: 1, transform: makeTransform([translateY(0)]) },
 *   ]);
 *
 * Every number in a value is interpolated (units must match, except for a
 * unitless 0), colors are mixed like interpolateColors(), transform and filter
 * functions argument by argument; keywords must be equal. Properties of the
 * start style that the end style lacks keep their start value.
 */
import type { CSSProperties } from 'react';
import type { InterpolateOptions } from '../core/types';
import { checkInterpolateArgs, interpolate, interpolateColors } from './animation';
import { COLOR_FUNCTIONS, isNamedColor, parseColor } from './colors';

type Part =
  | { kind: 'number'; value: number; unit: string }
  | { kind: 'color'; text: string }
  | { kind: 'function'; name: string; args: Part[][] }
  | { kind: 'word'; text: string };

const NUMBER = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z%]*)$/;
const FUNCTION = /^([a-zA-Z-][a-zA-Z0-9-]*)\(([\s\S]*)\)$/;

// Splits at top level (outside parentheses): at whitespace, with each comma
// a token of its own; or, with `commas`, only at commas.
const split = (text: string, commas = false): string[] => {
  const tokens: string[] = [];
  let depth = 0;
  let current = '';
  const flush = () => {
    if (current.trim() !== '') tokens.push(current.trim());
    current = '';
  };
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && ch === ',') {
      flush();
      if (!commas) tokens.push(',');
    } else if (depth === 0 && !commas && /\s/.test(ch)) {
      flush();
    } else {
      current += ch;
    }
  }
  flush();
  return tokens;
};

const parseToken = (token: string): Part => {
  const call = token.match(FUNCTION);
  if (call) {
    if (COLOR_FUNCTIONS.includes(call[1].toLowerCase())) {
      parseColor(token, 'interpolateStyles');
      return { kind: 'color', text: token };
    }
    return { kind: 'function', name: call[1], args: split(call[2], true).map(parseValue) };
  }
  if (token.startsWith('#') || isNamedColor(token)) {
    parseColor(token, 'interpolateStyles');
    return { kind: 'color', text: token };
  }
  const number = token.match(NUMBER);
  if (number) return { kind: 'number', value: parseFloat(number[1]), unit: number[2] };
  return { kind: 'word', text: token };
};

const parseValue = (value: string | number): Part[] =>
  typeof value === 'number' ? [{ kind: 'number', value, unit: '' }] : split(value).map(parseToken);

const serialize = (parts: Array<string | number>): string =>
  parts.reduce<string>((out, part) => (part === ',' ? `${out},` : out === '' ? `${part}` : `${out} ${part}`), '');

interface Segment {
  input: number;
  range: [number, number];
  options: InterpolateOptions;
}

const describe = (value: unknown) => JSON.stringify(value);

const interpolateParts = (
  property: string,
  start: Part[],
  end: Part[],
  segment: Segment,
  values: [unknown, unknown],
): Array<string | number> => {
  const mismatch = () =>
    new TypeError(
      `interpolateStyles: ${property} cannot be interpolated from ${describe(values[0])} to ${describe(values[1])}: the values must have the same structure`,
    );
  if (start.length !== end.length) throw mismatch();
  return start.map((a, i) => {
    const b = end[i];
    if (a.kind === 'number' && b.kind === 'number') {
      if (a.unit !== b.unit && a.value !== 0 && b.value !== 0) {
        throw new TypeError(
          `interpolateStyles: ${property} cannot be interpolated from ${describe(values[0])} to ${describe(values[1])}: the units must match`,
        );
      }
      const n = interpolate(segment.input, segment.range, [a.value, b.value], segment.options);
      const unit = a.unit || b.unit;
      return unit ? `${n}${unit}` : n;
    }
    if (a.kind === 'color' && b.kind === 'color') {
      return interpolateColors(segment.input, segment.range, [a.text, b.text], { easing: segment.options.easing });
    }
    if (a.kind === 'function' && b.kind === 'function') {
      if (a.name !== b.name || a.args.length !== b.args.length) throw mismatch();
      const args = a.args.map((arg, j) => serialize(interpolateParts(property, arg, b.args[j], segment, values)));
      return `${a.name}(${args.join(', ')})`;
    }
    if (a.kind === 'word' && b.kind === 'word' && a.text === b.text) return a.text;
    throw mismatch();
  });
};

const checkStyles = (outputStylesRange: readonly CSSProperties[], length: number) => {
  if (!Array.isArray(outputStylesRange)) {
    throw new Error('interpolateStyles: outputStylesRange must be an array of style objects');
  }
  if (outputStylesRange.length !== length) {
    throw new Error(
      `interpolateStyles: inputRange (${length}) and outputStylesRange (${outputStylesRange.length}) must have the same length`,
    );
  }
  outputStylesRange.forEach((style, i) => {
    if (typeof style !== 'object' || style === null || Array.isArray(style)) {
      throw new Error(`interpolateStyles: outputStylesRange[${i}] must be a style object, got ${describe(style)}`);
    }
  });
};

export const interpolateStyles = (
  input: number,
  inputRange: readonly number[],
  outputStylesRange: readonly CSSProperties[],
  options: InterpolateOptions = {},
): CSSProperties => {
  checkStyles(outputStylesRange, inputRange.length);
  checkInterpolateArgs('interpolateStyles', input, inputRange, outputStylesRange.length, options);
  if (inputRange.length < 2) {
    throw new Error('interpolateStyles: inputRange must have at least 2 elements');
  }
  for (let i = 1; i < inputRange.length; i++) {
    if (!(inputRange[i] > inputRange[i - 1])) {
      throw new Error(`interpolateStyles: inputRange must be strictly increasing, got [${inputRange.join(', ')}]`);
    }
  }

  const { posterize, easing, extrapolateLeft = 'extend', extrapolateRight = 'extend' } = options;
  const x = posterize === undefined ? input : Math.floor(input / posterize) * posterize;
  // The segment the input is in; past the ends, the first or the last.
  let index = inputRange.findIndex((step) => x < step) - 1;
  if (index === -1) index = 0;
  if (index === -2) index = inputRange.length - 2;

  const segment: Segment = {
    input: x,
    range: [inputRange[index], inputRange[index + 1]],
    options: {
      easing: Array.isArray(easing) ? easing[index] : (easing as InterpolateOptions['easing']),
      extrapolateLeft,
      extrapolateRight,
    },
  };
  const startStyle = outputStylesRange[index] as Record<string, unknown>;
  const endStyle = outputStylesRange[index + 1] as Record<string, unknown>;

  const result: Record<string, unknown> = {};
  for (const property of Object.keys(startStyle)) {
    const from = startStyle[property];
    const to = endStyle[property];
    if (to === undefined || to === null) {
      result[property] = from;
      continue;
    }
    if ((typeof from !== 'string' && typeof from !== 'number') || (typeof to !== 'string' && typeof to !== 'number')) {
      throw new TypeError(
        `interpolateStyles: ${property} must be a number or a string in both styles, got ${describe(from)} and ${describe(to)}`,
      );
    }
    const value = serialize(interpolateParts(property, parseValue(from), parseValue(to), segment, [from, to]));
    // A plain number stays a number (opacity: 0.5, not '0.5').
    result[property] = value !== '' && !Number.isNaN(Number(value)) ? Number(value) : value;
  }
  return result as CSSProperties;
};
