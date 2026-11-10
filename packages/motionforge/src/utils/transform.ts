/**
 * CSS transform builders with the API of @remotion/animation-utils:
 *
 *   makeTransform([translateX(100), rotate(45), scale(1.2)])
 *   // 'translateX(100px) rotate(45deg) scale(1.2, 1.2)'
 *
 * Numbers get a default unit (px for lengths, deg for angles); strings must
 * carry a CSS unit ('50%', '0.5turn'). Wrong arguments throw.
 */

export const lengthUnits = [
  'px', 'em', 'rem', 'pt', 'cap', 'ch', 'ex', 'ic', 'lh', 'rlh', 'vmax', 'vmin', 'vb', 'vi',
  'cqw', 'vh', 'vw', 'cqh', 'cqi', 'cqb', 'cqmin', 'cqmax', 'cm', 'mm', 'Q', 'in', 'pc',
] as const;
export const angleUnits = ['rad', 'deg', 'grad', 'turn'] as const;
export const lengthPercentageUnits = ['%', ...lengthUnits] as const;

export type LengthUnit = (typeof lengthUnits)[number];
export type AngleUnit = (typeof angleUnits)[number];
export type LengthPercentageUnit = (typeof lengthPercentageUnits)[number];
export type LengthUnitString = `${number}${LengthUnit}`;
export type LengthPercentageUnitString = `${number}${LengthPercentageUnit}`;
export type AngleUnitString = `${number}${AngleUnit}`;

const NUMBER_WITH_UNIT = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z%]+)$/;

const checkNumber = (api: string, param: string, value: unknown): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${api}: ${param} must be a finite number, got ${JSON.stringify(value)}`);
  }
  return value;
};

const checkUnit = (api: string, param: string, unit: unknown, units: readonly string[]): string => {
  if (typeof unit !== 'string' || !units.includes(unit)) {
    throw new TypeError(`${api}: ${param} unit must be one of ${units.join(', ')}, got ${JSON.stringify(unit)}`);
  }
  return unit;
};

// A number with the default unit, a number with an explicit unit, or a string like '50%'.
const withUnit = (api: string, param: string, value: unknown, units: readonly string[], unit?: unknown): string => {
  if (typeof value === 'string') {
    const match = value.match(NUMBER_WITH_UNIT);
    if (!match || !units.includes(match[2])) {
      throw new TypeError(
        `${api}: ${param} ${JSON.stringify(value)} must be a number or a string ending in one of ${units.join(', ')}`,
      );
    }
    if (unit !== undefined) {
      throw new TypeError(`${api}: ${param} ${JSON.stringify(value)} already has a unit; pass a number to give one`);
    }
    return value;
  }
  return `${checkNumber(api, param, value)}${checkUnit(api, param, unit, units)}`;
};

const length = (api: string, param: string, value: unknown, unit: unknown = 'px') =>
  withUnit(api, param, value, lengthPercentageUnits, typeof value === 'string' ? undefined : unit);
const angle = (api: string, param: string, value: unknown, unit: unknown = 'deg') =>
  withUnit(api, param, value, angleUnits, typeof value === 'string' ? undefined : unit);

const signatures = (api: string, list: string[]) =>
  new TypeError([`${api}() supports only the following signatures:`, ...list.map((s) => `${api}(${s})`)].join('\n'));

/** Joins transform functions into one CSS `transform` value. */
export const makeTransform = (transforms: readonly string[]): string => {
  if (!Array.isArray(transforms) || transforms.some((t) => typeof t !== 'string')) {
    throw new TypeError(`makeTransform: expects an array of transform strings, got ${JSON.stringify(transforms)}`);
  }
  return transforms.join(' ');
};

export function matrix(a: number, b: number, c: number, d: number, tx: number, ty: number): string {
  const values = { a, b, c, d, tx, ty };
  Object.entries(values).forEach(([name, value]) => checkNumber('matrix', name, value));
  return `matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`;
}

export function matrix3d(...values: number[]): string {
  if (values.length !== 16) throw new TypeError(`matrix3d: expects 16 numbers, got ${values.length}`);
  values.forEach((value, i) => checkNumber('matrix3d', `argument ${i + 1}`, value));
  return `matrix3d(${values.join(', ')})`;
}

export function perspective(length: LengthUnitString): string;
export function perspective(length: number, unit?: LengthUnit): string;
export function perspective(value: unknown, unit: unknown = 'px'): string {
  if (typeof value === 'string') return `perspective(${withUnit('perspective', 'length', value, lengthUnits)})`;
  return `perspective(${withUnit('perspective', 'length', value, lengthUnits, unit)})`;
}

export function rotate(angle: AngleUnitString): string;
export function rotate(angle: number, unit?: AngleUnit): string;
export function rotate(value: unknown, unit?: unknown): string {
  return `rotate(${angle('rotate', 'angle', value, unit)})`;
}

export function rotate3d(x: number, y: number, z: number, angle: AngleUnitString): string;
export function rotate3d(x: number, y: number, z: number, angle: number, unit?: AngleUnit): string;
export function rotate3d(x: unknown, y: unknown, z: unknown, value: unknown, unit?: unknown): string {
  checkNumber('rotate3d', 'x', x);
  checkNumber('rotate3d', 'y', y);
  checkNumber('rotate3d', 'z', z);
  return `rotate3d(${x}, ${y}, ${z}, ${angle('rotate3d', 'angle', value, unit)})`;
}

export function rotateX(angle: AngleUnitString): string;
export function rotateX(angle: number, unit?: AngleUnit): string;
export function rotateX(value: unknown, unit?: unknown): string {
  return `rotateX(${angle('rotateX', 'angle', value, unit)})`;
}

export function rotateY(angle: AngleUnitString): string;
export function rotateY(angle: number, unit?: AngleUnit): string;
export function rotateY(value: unknown, unit?: unknown): string {
  return `rotateY(${angle('rotateY', 'angle', value, unit)})`;
}

export function rotateZ(angle: AngleUnitString): string;
export function rotateZ(angle: number, unit?: AngleUnit): string;
export function rotateZ(value: unknown, unit?: unknown): string {
  return `rotateZ(${angle('rotateZ', 'angle', value, unit)})`;
}

/** scale(x) scales both axes; scale(x, y) each. */
export function scale(x: number, y: number = x): string {
  checkNumber('scale', 'x', x);
  checkNumber('scale', 'y', y);
  return `scale(${x}, ${y})`;
}

export function scale3d(x: number, y: number, z: number): string {
  checkNumber('scale3d', 'x', x);
  checkNumber('scale3d', 'y', y);
  checkNumber('scale3d', 'z', z);
  return `scale3d(${x}, ${y}, ${z})`;
}

export function scaleX(x: number): string {
  return `scaleX(${checkNumber('scaleX', 'x', x)})`;
}

export function scaleY(y: number): string {
  return `scaleY(${checkNumber('scaleY', 'y', y)})`;
}

export function scaleZ(z: number): string {
  return `scaleZ(${checkNumber('scaleZ', 'z', z)})`;
}

/** skew(a) skews both axes by `a`; skew(x, y) each (numbers in deg). */
export function skew(angle: number | AngleUnitString): string;
export function skew(angle: AngleUnitString, angle2: AngleUnitString): string;
export function skew(angle: number, unit: AngleUnit): string;
export function skew(angleX: number, angleY: number): string;
export function skew(angleX: number, unitX: AngleUnit, angleY: number, unitY: AngleUnit): string;
export function skew(...args: unknown[]): string {
  const [a, b, c, d] = args;
  if (args.length === 1) {
    const value = angle('skew', 'angle', a);
    return `skew(${value}, ${value})`;
  }
  if (args.length === 2) {
    if (typeof a === 'string' && typeof b === 'string') {
      return `skew(${angle('skew', 'angleX', a)}, ${angle('skew', 'angleY', b)})`;
    }
    if (typeof a === 'number' && typeof b === 'number') {
      return `skew(${angle('skew', 'angleX', a)}, ${angle('skew', 'angleY', b)})`;
    }
    if (typeof a === 'number' && typeof b === 'string') {
      const value = angle('skew', 'angle', a, b);
      return `skew(${value}, ${value})`;
    }
  }
  if (args.length === 4 && typeof a === 'number' && typeof c === 'number') {
    return `skew(${angle('skew', 'angleX', a, b)}, ${angle('skew', 'angleY', c, d)})`;
  }
  throw signatures('skew', [
    'angle: number | AngleUnitString',
    'angle: AngleUnitString, angle2: AngleUnitString',
    'angle: number, unit: AngleUnit',
    'angleX: number, angleY: number',
    'angleX: number, unitX: AngleUnit, angleY: number, unitY: AngleUnit',
  ]);
}

export function skewX(angle: AngleUnitString): string;
export function skewX(angle: number, unit?: AngleUnit): string;
export function skewX(value: unknown, unit?: unknown): string {
  return `skewX(${angle('skewX', 'angle', value, unit)})`;
}

export function skewY(angle: AngleUnitString): string;
export function skewY(angle: number, unit?: AngleUnit): string;
export function skewY(value: unknown, unit?: unknown): string {
  return `skewY(${angle('skewY', 'angle', value, unit)})`;
}

/** translate(x), translate(x, y), with numbers in px or strings with units. */
export function translate(x: number | LengthPercentageUnitString): string;
export function translate(x: number, y: number): string;
export function translate(x: LengthPercentageUnitString, y: LengthPercentageUnitString): string;
export function translate(translation: number, unit: LengthPercentageUnit): string;
export function translate(x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit): string;
export function translate(...args: unknown[]): string {
  const [a, b, c, d] = args;
  if (args.length === 1) return `translate(${length('translate', 'x', a)})`;
  if (args.length === 2) {
    if ((typeof a === 'number' && typeof b === 'number') || (typeof a === 'string' && typeof b === 'string')) {
      return `translate(${length('translate', 'x', a)}, ${length('translate', 'y', b)})`;
    }
    if (typeof a === 'number' && typeof b === 'string') return `translate(${length('translate', 'x', a, b)})`;
  }
  if (args.length === 4 && typeof a === 'number' && typeof c === 'number') {
    return `translate(${length('translate', 'x', a, b)}, ${length('translate', 'y', c, d)})`;
  }
  throw signatures('translate', [
    'x: number | LengthPercentageUnitString',
    'x: number, y: number',
    'x: LengthPercentageUnitString, y: LengthPercentageUnitString',
    'translation: number, unit: LengthPercentageUnit',
    'x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit',
  ]);
}

export function translate3d(
  x: number | LengthPercentageUnitString,
  y: number | LengthPercentageUnitString,
  z: number | LengthUnitString,
): string;
export function translate3d(
  x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit, z: number, unitZ: LengthUnit,
): string;
export function translate3d(...args: unknown[]): string {
  if (args.length === 3) {
    const [x, y, z] = args;
    const zValue =
      typeof z === 'string' ? withUnit('translate3d', 'z', z, lengthUnits) : withUnit('translate3d', 'z', z, lengthUnits, 'px');
    return `translate3d(${length('translate3d', 'x', x)}, ${length('translate3d', 'y', y)}, ${zValue})`;
  }
  if (args.length === 6) {
    const [x, unitX, y, unitY, z, unitZ] = args;
    if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number') {
      return `translate3d(${length('translate3d', 'x', x, unitX)}, ${length('translate3d', 'y', y, unitY)}, ${withUnit('translate3d', 'z', z, lengthUnits, unitZ)})`;
    }
  }
  throw signatures('translate3d', [
    'x: number | LengthPercentageUnitString, y: number | LengthPercentageUnitString, z: number | LengthUnitString',
    'x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit, z: number, unitZ: LengthUnit',
  ]);
}

export function translateX(x: LengthPercentageUnitString): string;
export function translateX(x: number, unit?: LengthPercentageUnit): string;
export function translateX(value: unknown, unit?: unknown): string {
  return `translateX(${length('translateX', 'x', value, unit)})`;
}

export function translateY(y: LengthPercentageUnitString): string;
export function translateY(y: number, unit?: LengthPercentageUnit): string;
export function translateY(value: unknown, unit?: unknown): string {
  return `translateY(${length('translateY', 'y', value, unit)})`;
}

export function translateZ(z: LengthUnitString): string;
export function translateZ(z: number, unit?: LengthUnit): string;
export function translateZ(value: unknown, unit: unknown = 'px'): string {
  if (typeof value === 'string') return `translateZ(${withUnit('translateZ', 'z', value, lengthUnits)})`;
  return `translateZ(${withUnit('translateZ', 'z', value, lengthUnits, unit)})`;
}
