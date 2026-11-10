'use client';import { makeRect, makeCircle, makeEllipse, makeTriangle, makeStar, makePolygon, makePie, makeHeart, makeArrow, makeSpark, makeCallout } from '../chunk-JQIBAW35.js';
export { makeArrow, makeCallout, makeCircle, makeEllipse, makeHeart, makePie, makePolygon, makeRect, makeSpark, makeStar, makeTriangle } from '../chunk-JQIBAW35.js';
import '../chunk-ADMJBRUM.js';
import { SEQUENCE_PROPS, rejectProps } from '../chunk-WVAVUOFE.js';
import React from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';

var UNSUPPORTED = {
  ...SEQUENCE_PROPS,
  playbackRate: "put it inside <Sequence> instead",
  controls: "Studio controls are not supported",
  effects: "effects are not supported",
  effectsOutputSize: "effects are not supported",
  pixelDensity: "effects are not supported"
};
var transformOriginAttribute = Number(React.version.split(".")[0]) > 18 ? "transformOrigin" : "transform-origin";
var RenderSvg = ({
  component,
  shape,
  props
}) => {
  rejectProps(`<${component}>`, props, UNSUPPORTED);
  const { style, pathStyle, debug, ...pathProps } = props;
  const { width, height, path, instructions, transformOrigin } = shape;
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      xmlns: "http://www.w3.org/2000/svg",
      style: { overflow: "visible", ...style },
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            ...{ [transformOriginAttribute]: transformOrigin },
            d: path,
            style: { transformBox: "fill-box", ...pathStyle },
            ...pathProps
          }
        ),
        debug ? instructions.map((instruction, index) => {
          if (instruction.type !== "C") return null;
          const previous = index === 0 ? instructions[instructions.length - 1] : instructions[index - 1];
          if (!("x" in previous) || !("y" in previous)) return null;
          return /* @__PURE__ */ jsxs(React.Fragment, { children: [
            /* @__PURE__ */ jsx("path", { d: `M ${previous.x} ${previous.y} ${instruction.cp1x} ${instruction.cp1y}`, strokeWidth: 2, stroke: "rgba(0, 0, 0, 0.4)" }),
            /* @__PURE__ */ jsx("path", { d: `M ${instruction.x} ${instruction.y} ${instruction.cp2x} ${instruction.cp2y}`, strokeWidth: 2, stroke: "rgba(0, 0, 0, 0.4)" }),
            /* @__PURE__ */ jsx("circle", { cx: instruction.cp1x, cy: instruction.cp1y, r: 3, fill: "white", strokeWidth: 2, stroke: "black" }),
            /* @__PURE__ */ jsx("circle", { cx: instruction.cp2x, cy: instruction.cp2y, r: 3, strokeWidth: 2, fill: "white", stroke: "black" })
          ] }, index);
        }) : null
      ]
    }
  );
};
var Rect = ({ width, height, edgeRoundness, cornerRadius, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Rect", shape: makeRect({ width, height, edgeRoundness, cornerRadius }), props });
var Circle = ({ radius, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Circle", shape: makeCircle({ radius }), props });
var Ellipse = ({ rx, ry, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Ellipse", shape: makeEllipse({ rx, ry }), props });
var Triangle = ({ length, direction, edgeRoundness, cornerRadius, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Triangle", shape: makeTriangle({ length, direction, edgeRoundness, cornerRadius }), props });
var Star = ({ innerRadius, outerRadius, points, cornerRadius, edgeRoundness, ...props }) => /* @__PURE__ */ jsx(
  RenderSvg,
  {
    component: "Star",
    shape: makeStar({ innerRadius, outerRadius, points, cornerRadius, edgeRoundness }),
    props
  }
);
var Polygon = ({ points, radius, cornerRadius, edgeRoundness, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Polygon", shape: makePolygon({ points, radius, cornerRadius, edgeRoundness }), props });
var Pie = ({ radius, progress, closePath, counterClockwise, rotation, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Pie", shape: makePie({ radius, progress, closePath, counterClockwise, rotation }), props });
var Heart = ({ aspectRatio, height, bottomRoundnessAdjustment, depthAdjustment, ...props }) => /* @__PURE__ */ jsx(
  RenderSvg,
  {
    component: "Heart",
    shape: makeHeart({ aspectRatio, height, bottomRoundnessAdjustment, depthAdjustment }),
    props
  }
);
var Arrow = ({ length, headWidth, headLength, shaftWidth, direction, cornerRadius, ...props }) => /* @__PURE__ */ jsx(
  RenderSvg,
  {
    component: "Arrow",
    shape: makeArrow({ length, headWidth, headLength, shaftWidth, direction, cornerRadius }),
    props
  }
);
var Spark = ({ width, height, edgeRoundness, cornerRadius, ...props }) => /* @__PURE__ */ jsx(RenderSvg, { component: "Spark", shape: makeSpark({ width, height, edgeRoundness, cornerRadius }), props });
var Callout = ({
  width,
  height,
  pointerLength,
  pointerBaseWidth,
  pointerPosition,
  pointerDirection,
  edgeRoundness,
  cornerRadius,
  ...props
}) => /* @__PURE__ */ jsx(
  RenderSvg,
  {
    component: "Callout",
    shape: makeCallout({ width, height, pointerLength, pointerBaseWidth, pointerPosition, pointerDirection, edgeRoundness, cornerRadius }),
    props
  }
);

export { Arrow, Callout, Circle, Ellipse, Heart, Pie, Polygon, Rect, Spark, Star, Triangle };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map