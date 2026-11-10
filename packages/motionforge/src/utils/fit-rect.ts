/**
 * fitRect(): CSS object-fit arithmetic without the DOM, to place a picture in
 * a box and to cut or align pieces of it (a piece at (px, py) of the picture
 * is at x + px × scaleX, y + py × scaleY).
 */

/** CSS object-fit values. */
export type ObjectFit = 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';

/** The box the content is fitted into; `x`, `y` (default 0) offset the result. */
export interface FitRectContainer {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

/** The natural size of the content (e.g. an image's pixels). */
export interface FitRectSize {
  width: number;
  height: number;
}

/**
 * Where the content sits in the box where it does not fill it, as CSS
 * object-position percentages / 100: 0 left (top), 0.5 centred, 1 right
 * (bottom); values outside 0..1 push it further.
 */
export interface FitRectAnchor {
  x: number;
  y: number;
}

/** The content's rectangle in the container's coordinates and its scale from natural size. */
export interface FittedRect {
  x: number;
  y: number;
  width: number;
  height: number;
  /** width / content width. */
  scaleX: number;
  /** height / content height; equal to scaleX except with 'fill'. */
  scaleY: number;
}

const FITS: readonly ObjectFit[] = ['contain', 'cover', 'fill', 'none', 'scale-down'];

const describe = (value: unknown) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

const checkSize = (name: string, size: unknown) => {
  const { width, height } = (size ?? {}) as { width?: unknown; height?: unknown };
  for (const [key, value] of [['width', width], ['height', height]] as const) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new Error(`fitRect: ${name}.${key} must be a positive number, got ${describe(value)}`);
    }
  }
};

const checkFinite = (name: string, value: unknown) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`fitRect: ${name} must be a finite number, got ${describe(value)}`);
  }
};

/**
 * Places `content` in `container` as CSS `object-fit: fit` with
 * `object-position: anchor` would (default: centred).
 *
 *   const r = fitRect({ width: 1080, height: 1920 }, { width: 2000, height: 1500 }, 'cover');
 *   // { x: -740, y: 0, width: 2560, height: 1920, scaleX: 1.28, scaleY: 1.28 }
 */
export const fitRect = (
  container: FitRectContainer,
  content: FitRectSize,
  fit: ObjectFit,
  anchor: FitRectAnchor = { x: 0.5, y: 0.5 },
): FittedRect => {
  checkSize('container', container);
  checkSize('content', content);
  if (!FITS.includes(fit)) {
    throw new Error(`fitRect: fit must be one of ${FITS.map((f) => `'${f}'`).join(', ')}, got ${describe(fit)}`);
  }
  const { x: left = 0, y: top = 0 } = container;
  checkFinite('container.x', left);
  checkFinite('container.y', top);
  if (typeof anchor !== 'object' || anchor === null) {
    throw new Error(`fitRect: anchor must be { x, y } (0 left/top, 0.5 centre, 1 right/bottom), got ${describe(anchor)}`);
  }
  checkFinite('anchor.x', anchor.x);
  checkFinite('anchor.y', anchor.y);

  let scaleX: number;
  let scaleY: number;
  if (fit === 'fill') {
    scaleX = container.width / content.width;
    scaleY = container.height / content.height;
  } else {
    const contain = Math.min(container.width / content.width, container.height / content.height);
    const scale =
      fit === 'contain'
        ? contain
        : fit === 'cover'
          ? Math.max(container.width / content.width, container.height / content.height)
          : fit === 'none'
            ? 1
            : Math.min(1, contain);
    scaleX = scale;
    scaleY = scale;
  }
  // The side that fits the box exactly is the box's side (no rounding error at the edge).
  const width = scaleX === container.width / content.width ? container.width : content.width * scaleX;
  const height = scaleY === container.height / content.height ? container.height : content.height * scaleY;
  return {
    x: left + (container.width - width) * anchor.x,
    y: top + (container.height - height) * anchor.y,
    width,
    height,
    scaleX,
    scaleY,
  };
};
