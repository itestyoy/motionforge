import type React from 'react';

/** Checks the options object of a presentation function and returns it ({} when left out). */
export const checkOptions = <T extends object>(fn: string, props: T | undefined, required = false): T => {
  if (props === undefined && !required) return {} as T;
  if (typeof props !== 'object' || props === null || Array.isArray(props)) {
    throw new Error(`${fn}(): expected an options object, got ${JSON.stringify(props)}`);
  }
  return props;
};

export const checkDirection = (fn: string, direction: unknown, allowed: readonly string[], required = false) => {
  if (direction === undefined && !required) return;
  if (!allowed.includes(direction as string)) {
    throw new Error(
      `${fn}(): direction must be one of ${allowed.map((a) => `"${a}"`).join(', ')}, got ${JSON.stringify(direction)}`,
    );
  }
};

export const checkPositive = (fn: string, name: string, value: unknown, required = false) => {
  if (value === undefined && !required) return;
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fn}(): ${name} must be a positive number, got ${JSON.stringify(value)}`);
  }
};

/** The style for the scene's direction. */
export const byDirection = (
  isEntering: boolean,
  enterStyle: React.CSSProperties | undefined,
  exitStyle: React.CSSProperties | undefined,
) => (isEntering ? enterStyle : exitStyle);
