'use client';

import React from 'react';
import { rejectProps, SEQUENCE_PROPS } from '../../utils/fetch-asset';
import {
  type MakeArrowProps,
  type MakeCalloutProps,
  type MakeCircleProps,
  type MakeEllipseOptions,
  type MakeHeartProps,
  type MakePieProps,
  type MakePolygonProps,
  type MakeRectOptions,
  type MakeSparkProps,
  type MakeStarProps,
  type MakeTriangleProps,
  type ShapeInfo,
  makeArrow,
  makeCallout,
  makeCircle,
  makeEllipse,
  makeHeart,
  makePie,
  makePolygon,
  makeRect,
  makeSpark,
  makeStar,
  makeTriangle,
} from './make-shapes';

/**
 * Props every shape component takes besides its shape options, as in
 * `@remotion/shapes`: `style` goes on the `<svg>`, `pathStyle` and every other
 * SVG attribute (`fill`, `stroke`, `strokeWidth`, ...) on the `<path>`;
 * `debug` draws the control points of the curves.
 */
export type AllShapesProps = Omit<React.SVGProps<SVGPathElement>, 'width' | 'height' | 'd' | 'hidden' | 'name'> & {
  readonly debug?: boolean;
  readonly pathStyle?: React.CSSProperties;
};

// A shape's own options win over SVG attributes of the same name (`points`, `radius`, ...).
type ShapeProps<Options> = Options & Omit<AllShapesProps, keyof Options>;

// Remotion's shapes also take <Sequence> props and effects; here a shape goes
// inside a <Sequence> instead.
const UNSUPPORTED: Record<string, string> = {
  ...SEQUENCE_PROPS,
  playbackRate: 'put it inside <Sequence> instead',
  controls: 'Studio controls are not supported',
  effects: 'effects are not supported',
  effectsOutputSize: 'effects are not supported',
  pixelDensity: 'effects are not supported',
};

// React 19 knows the transformOrigin attribute; React 18 needs it written as is.
const transformOriginAttribute = Number(React.version.split('.')[0]) > 18 ? 'transformOrigin' : 'transform-origin';

const RenderSvg = ({
  component,
  shape,
  props,
}: {
  component: string;
  shape: ShapeInfo;
  props: AllShapesProps;
}) => {
  rejectProps(`<${component}>`, props, UNSUPPORTED);
  const { style, pathStyle, debug, ...pathProps } = props;
  const { width, height, path, instructions, transformOrigin } = shape;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ overflow: 'visible', ...style }}
    >
      <path
        {...{ [transformOriginAttribute]: transformOrigin }}
        d={path}
        style={{ transformBox: 'fill-box', ...pathStyle }}
        {...pathProps}
      />
      {debug
        ? instructions.map((instruction, index) => {
            if (instruction.type !== 'C') return null;
            const previous = index === 0 ? instructions[instructions.length - 1] : instructions[index - 1];
            if (!('x' in previous) || !('y' in previous)) return null;
            return (
              <React.Fragment key={index}>
                <path d={`M ${previous.x} ${previous.y} ${instruction.cp1x} ${instruction.cp1y}`} strokeWidth={2} stroke="rgba(0, 0, 0, 0.4)" />
                <path d={`M ${instruction.x} ${instruction.y} ${instruction.cp2x} ${instruction.cp2y}`} strokeWidth={2} stroke="rgba(0, 0, 0, 0.4)" />
                <circle cx={instruction.cp1x} cy={instruction.cp1y} r={3} fill="white" strokeWidth={2} stroke="black" />
                <circle cx={instruction.cp2x} cy={instruction.cp2y} r={3} strokeWidth={2} fill="white" stroke="black" />
              </React.Fragment>
            );
          })
        : null}
    </svg>
  );
};

export type RectProps = ShapeProps<MakeRectOptions>;
/** An `<svg>` with a rectangle, as Remotion's `<Rect>`. */
export const Rect: React.FC<RectProps> = ({ width, height, edgeRoundness, cornerRadius, ...props }) => (
  <RenderSvg component="Rect" shape={makeRect({ width, height, edgeRoundness, cornerRadius })} props={props} />
);

export type CircleProps = ShapeProps<MakeCircleProps>;
/** An `<svg>` with a circle, as Remotion's `<Circle>`. */
export const Circle: React.FC<CircleProps> = ({ radius, ...props }) => (
  <RenderSvg component="Circle" shape={makeCircle({ radius })} props={props} />
);

export type EllipseProps = ShapeProps<MakeEllipseOptions>;
/** An `<svg>` with an ellipse, as Remotion's `<Ellipse>`. */
export const Ellipse: React.FC<EllipseProps> = ({ rx, ry, ...props }) => (
  <RenderSvg component="Ellipse" shape={makeEllipse({ rx, ry })} props={props} />
);

export type TriangleProps = ShapeProps<MakeTriangleProps>;
/** An `<svg>` with an equilateral triangle, as Remotion's `<Triangle>`. */
export const Triangle: React.FC<TriangleProps> = ({ length, direction, edgeRoundness, cornerRadius, ...props }) => (
  <RenderSvg component="Triangle" shape={makeTriangle({ length, direction, edgeRoundness, cornerRadius })} props={props} />
);

export type StarProps = ShapeProps<MakeStarProps>;
/** An `<svg>` with a star, as Remotion's `<Star>`. */
export const Star: React.FC<StarProps> = ({ innerRadius, outerRadius, points, cornerRadius, edgeRoundness, ...props }) => (
  <RenderSvg
    component="Star"
    shape={makeStar({ innerRadius, outerRadius, points, cornerRadius, edgeRoundness })}
    props={props}
  />
);

export type PolygonProps = ShapeProps<MakePolygonProps>;
/** An `<svg>` with a regular polygon, as Remotion's `<Polygon>`. */
export const Polygon: React.FC<PolygonProps> = ({ points, radius, cornerRadius, edgeRoundness, ...props }) => (
  <RenderSvg component="Polygon" shape={makePolygon({ points, radius, cornerRadius, edgeRoundness })} props={props} />
);

export type PieProps = ShapeProps<MakePieProps>;
/** An `<svg>` with a piece of pie, as Remotion's `<Pie>`. */
export const Pie: React.FC<PieProps> = ({ radius, progress, closePath, counterClockwise, rotation, ...props }) => (
  <RenderSvg component="Pie" shape={makePie({ radius, progress, closePath, counterClockwise, rotation })} props={props} />
);

export type HeartProps = ShapeProps<MakeHeartProps>;
/** An `<svg>` with a heart, as Remotion's `<Heart>`. */
export const Heart: React.FC<HeartProps> = ({ aspectRatio, height, bottomRoundnessAdjustment, depthAdjustment, ...props }) => (
  <RenderSvg
    component="Heart"
    shape={makeHeart({ aspectRatio, height, bottomRoundnessAdjustment, depthAdjustment })}
    props={props}
  />
);

export type ArrowProps = ShapeProps<MakeArrowProps>;
/** An `<svg>` with an arrow, as Remotion's `<Arrow>`. */
export const Arrow: React.FC<ArrowProps> = ({ length, headWidth, headLength, shaftWidth, direction, cornerRadius, ...props }) => (
  <RenderSvg
    component="Arrow"
    shape={makeArrow({ length, headWidth, headLength, shaftWidth, direction, cornerRadius })}
    props={props}
  />
);

export type SparkProps = ShapeProps<MakeSparkProps>;
/** An `<svg>` with a four-pointed spark, as Remotion's `<Spark>`. */
export const Spark: React.FC<SparkProps> = ({ width, height, edgeRoundness, cornerRadius, ...props }) => (
  <RenderSvg component="Spark" shape={makeSpark({ width, height, edgeRoundness, cornerRadius })} props={props} />
);

export type CalloutProps = ShapeProps<MakeCalloutProps>;
/** An `<svg>` with a speech-bubble callout, as Remotion's `<Callout>`. */
export const Callout: React.FC<CalloutProps> = ({
  width,
  height,
  pointerLength,
  pointerBaseWidth,
  pointerPosition,
  pointerDirection,
  edgeRoundness,
  cornerRadius,
  ...props
}) => (
  <RenderSvg
    component="Callout"
    shape={makeCallout({ width, height, pointerLength, pointerBaseWidth, pointerPosition, pointerDirection, edgeRoundness, cornerRadius })}
    props={props}
  />
);
