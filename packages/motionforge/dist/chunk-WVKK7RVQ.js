'use client';// src/components/transitions/presentations/validate.ts
var checkOptions = (fn, props, required = false) => {
  if (props === void 0 && !required) return {};
  if (typeof props !== "object" || props === null || Array.isArray(props)) {
    throw new Error(`${fn}(): expected an options object, got ${JSON.stringify(props)}`);
  }
  return props;
};
var checkDirection = (fn, direction, allowed, required = false) => {
  if (direction === void 0 && !required) return;
  if (!allowed.includes(direction)) {
    throw new Error(
      `${fn}(): direction must be one of ${allowed.map((a) => `"${a}"`).join(", ")}, got ${JSON.stringify(direction)}`
    );
  }
};
var checkPositive = (fn, name, value, required = false) => {
  if (value === void 0 && !required) return;
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new Error(`${fn}(): ${name} must be a positive number, got ${JSON.stringify(value)}`);
  }
};
var byDirection = (isEntering, enterStyle, exitStyle) => isEntering ? enterStyle : exitStyle;

export { byDirection, checkDirection, checkOptions, checkPositive };
//# sourceMappingURL=chunk-WVKK7RVQ.js.map
//# sourceMappingURL=chunk-WVKK7RVQ.js.map