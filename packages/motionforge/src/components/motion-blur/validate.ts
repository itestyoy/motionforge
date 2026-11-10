/** Throws unless `value` is a finite number (and an integer >= 0 when `count`). */
export const checkNumber = (component: string, name: string, value: unknown, count = false): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${component}: "${name}" must be a finite number, got ${JSON.stringify(value)}`);
  }
  if (count && (!Number.isInteger(value) || value < 0)) {
    throw new TypeError(`${component}: "${name}" must be a non-negative integer, got ${value}`);
  }
  return value;
};
