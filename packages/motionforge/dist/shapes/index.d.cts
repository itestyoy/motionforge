import React from 'react';
import { I as Instruction } from '../instructions-CHagViH-.cjs';

/**
 * SVG shapes as path data, as in `@remotion/shapes`: each make*() function
 * returns `{ path, width, height, transformOrigin, instructions }`. The
 * geometry follows Remotion's, so the same options give the same path.
 */

type ShapeInfo = {
    /** SVG path data. */
    path: string;
    width: number;
    height: number;
    /** The shape's center, `"x y"` in its own coordinates (for CSS transform-origin). */
    transformOrigin: string;
    instructions: Instruction[];
};
type MakeRectOptions = {
    width: number;
    height: number;
    /** Bends the edges into curves (cannot be combined with cornerRadius). Default null. */
    edgeRoundness?: number | null;
    /** Rounds the corners with arcs, like CSS border-radius. Default 0. */
    cornerRadius?: number;
};
/** A rectangle (Remotion's makeRect()). */
declare const makeRect: ({ width, height, edgeRoundness, cornerRadius }: MakeRectOptions) => ShapeInfo;
type MakeCircleProps = {
    radius: number;
};
/** A circle of two arcs (Remotion's makeCircle()). */
declare const makeCircle: ({ radius }: MakeCircleProps) => ShapeInfo;
type MakeEllipseOptions = {
    rx: number;
    ry: number;
};
/** An ellipse (Remotion's makeEllipse()). */
declare const makeEllipse: ({ rx, ry }: MakeEllipseOptions) => ShapeInfo;
type Direction = 'right' | 'left' | 'up' | 'down';
type MakeTriangleProps = {
    /** Length of each side. */
    length: number;
    /** The direction the tip points to. */
    direction: Direction;
    edgeRoundness?: number | null;
    cornerRadius?: number;
};
/** An equilateral triangle (Remotion's makeTriangle()). */
declare const makeTriangle: ({ length, direction, edgeRoundness, cornerRadius, }: MakeTriangleProps) => ShapeInfo;
type MakeStarProps = {
    /** Number of points (an integer >= 3). */
    points: number;
    innerRadius: number;
    outerRadius: number;
    edgeRoundness?: number | null;
    cornerRadius?: number;
};
/** A star (Remotion's makeStar()). */
declare const makeStar: ({ points, innerRadius, outerRadius, cornerRadius, edgeRoundness, }: MakeStarProps) => ShapeInfo;
type MakePolygonProps = {
    /** Number of corners (an integer >= 3). */
    points: number;
    radius: number;
    edgeRoundness?: number | null;
    cornerRadius?: number;
};
/** A regular polygon (Remotion's makePolygon()); like Remotion's, its path is not closed with Z. */
declare const makePolygon: ({ points, radius, cornerRadius, edgeRoundness }: MakePolygonProps) => ShapeInfo;
type MakePieProps = {
    radius: number;
    /** The filled part of the circle, 0 to 1 (clamped). */
    progress: number;
    /** false: an open arc without the lines to the center. Default true. */
    closePath?: boolean;
    /** Fill counterclockwise. Default false. */
    counterClockwise?: boolean;
    /** Rotation in radians (Math.PI * 2 is one clockwise turn). Default 0. */
    rotation?: number;
};
/** A piece of pie, starting at 12 o'clock (Remotion's makePie()). */
declare const makePie: ({ progress, radius, closePath, counterClockwise, rotation, }: MakePieProps) => ShapeInfo;
type MakeHeartProps = {
    height: number;
    /** Width / height. Default 1.1. */
    aspectRatio?: number;
    /** Widens (> 0) or narrows (< 0) the bottom curves. Default 0. */
    bottomRoundnessAdjustment?: number;
    /** Deepens (> 0) or flattens (< 0) the notch at the top. Default 0. */
    depthAdjustment?: number;
};
/** A heart (Remotion's makeHeart()). */
declare const makeHeart: ({ height, aspectRatio, bottomRoundnessAdjustment, depthAdjustment, }: MakeHeartProps) => ShapeInfo;
type MakeArrowProps = {
    /** Total length along the direction. Default 300. */
    length?: number;
    /** Width of the head at its widest. Default 185. */
    headWidth?: number;
    /** Length of the head. Default 120. */
    headLength?: number;
    /** Width of the shaft. Default 80. */
    shaftWidth?: number;
    /** Default 'right'. */
    direction?: Direction;
    /** Rounds the back corners and the head's tips. Default 0. */
    cornerRadius?: number;
};
/** An arrow (Remotion's makeArrow()). */
declare const makeArrow: ({ length, headWidth, headLength, shaftWidth, direction, cornerRadius, }: MakeArrowProps) => ShapeInfo;
type MakeSparkProps = {
    width: number;
    height: number;
    /** Inward curvature between the four points. Default 1. */
    edgeRoundness?: number;
    /** Rounds the four points (clamped to half of width and height). Default 0. */
    cornerRadius?: number;
};
/** A four-pointed spark (Remotion's makeSpark()). */
declare const makeSpark: ({ width, height, edgeRoundness, cornerRadius }: MakeSparkProps) => ShapeInfo;
type PointerDirection = 'up' | 'down' | 'left' | 'right';
type MakeCalloutProps = {
    /** Width of the body. Default 500. */
    width?: number;
    /** Height of the body. Default 200. */
    height?: number;
    /** Default 40. */
    pointerLength?: number;
    /** Width of the pointer where it meets the body. Default 60. */
    pointerBaseWidth?: number;
    /** Position of the pointer along its side, 0 to 1. Default 0.5. */
    pointerPosition?: number;
    /** Default 'down'. */
    pointerDirection?: PointerDirection;
    edgeRoundness?: number | null;
    /** Rounds the body's corners (not the pointer). Default 0. */
    cornerRadius?: number;
};
/** A speech-bubble callout with a pointer (Remotion's makeCallout()). */
declare const makeCallout: ({ width, height, pointerLength, pointerBaseWidth, pointerPosition, pointerDirection, edgeRoundness, cornerRadius, }: MakeCalloutProps) => ShapeInfo;

/**
 * Props every shape component takes besides its shape options, as in
 * `@remotion/shapes`: `style` goes on the `<svg>`, `pathStyle` and every other
 * SVG attribute (`fill`, `stroke`, `strokeWidth`, ...) on the `<path>`;
 * `debug` draws the control points of the curves.
 */
type AllShapesProps = Omit<React.SVGProps<SVGPathElement>, 'width' | 'height' | 'd' | 'hidden' | 'name'> & {
    readonly debug?: boolean;
    readonly pathStyle?: React.CSSProperties;
};
type ShapeProps<Options> = Options & Omit<AllShapesProps, keyof Options>;
type RectProps = ShapeProps<MakeRectOptions>;
/** An `<svg>` with a rectangle, as Remotion's `<Rect>`. */
declare const Rect: React.FC<RectProps>;
type CircleProps = ShapeProps<MakeCircleProps>;
/** An `<svg>` with a circle, as Remotion's `<Circle>`. */
declare const Circle: React.FC<CircleProps>;
type EllipseProps = ShapeProps<MakeEllipseOptions>;
/** An `<svg>` with an ellipse, as Remotion's `<Ellipse>`. */
declare const Ellipse: React.FC<EllipseProps>;
type TriangleProps = ShapeProps<MakeTriangleProps>;
/** An `<svg>` with an equilateral triangle, as Remotion's `<Triangle>`. */
declare const Triangle: React.FC<TriangleProps>;
type StarProps = ShapeProps<MakeStarProps>;
/** An `<svg>` with a star, as Remotion's `<Star>`. */
declare const Star: React.FC<StarProps>;
type PolygonProps = ShapeProps<MakePolygonProps>;
/** An `<svg>` with a regular polygon, as Remotion's `<Polygon>`. */
declare const Polygon: React.FC<PolygonProps>;
type PieProps = ShapeProps<MakePieProps>;
/** An `<svg>` with a piece of pie, as Remotion's `<Pie>`. */
declare const Pie: React.FC<PieProps>;
type HeartProps = ShapeProps<MakeHeartProps>;
/** An `<svg>` with a heart, as Remotion's `<Heart>`. */
declare const Heart: React.FC<HeartProps>;
type ArrowProps = ShapeProps<MakeArrowProps>;
/** An `<svg>` with an arrow, as Remotion's `<Arrow>`. */
declare const Arrow: React.FC<ArrowProps>;
type SparkProps = ShapeProps<MakeSparkProps>;
/** An `<svg>` with a four-pointed spark, as Remotion's `<Spark>`. */
declare const Spark: React.FC<SparkProps>;
type CalloutProps = ShapeProps<MakeCalloutProps>;
/** An `<svg>` with a speech-bubble callout, as Remotion's `<Callout>`. */
declare const Callout: React.FC<CalloutProps>;

export { type AllShapesProps, Arrow, type ArrowProps, Callout, type CalloutProps, Circle, type CircleProps, Ellipse, type EllipseProps, Heart, type HeartProps, Instruction, type MakeArrowProps, type MakeCalloutProps, type MakeCircleProps, type MakeEllipseOptions, type MakeHeartProps, type MakePieProps, type MakePolygonProps, type MakeRectOptions, type MakeSparkProps, type MakeStarProps, type MakeTriangleProps, Pie, type PieProps, Polygon, type PolygonProps, Rect, type RectProps, type ShapeInfo, Spark, type SparkProps, Star, type StarProps, Triangle, type TriangleProps, makeArrow, makeCallout, makeCircle, makeEllipse, makeHeart, makePie, makePolygon, makeRect, makeSpark, makeStar, makeTriangle };
