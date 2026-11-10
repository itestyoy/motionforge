'use client';'use strict';

var chunkJQCZMZZG_cjs = require('../chunk-JQCZMZZG.cjs');
require('../chunk-37ZW67WK.cjs');
var chunk5SQGQMYR_cjs = require('../chunk-5SQGQMYR.cjs');
var React = require('react');
var jsxRuntime = require('react/jsx-runtime');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React__default = /*#__PURE__*/_interopDefault(React);

var UNSUPPORTED = {
  ...chunk5SQGQMYR_cjs.SEQUENCE_PROPS,
  playbackRate: "put it inside <Sequence> instead",
  controls: "Studio controls are not supported",
  effects: "effects are not supported",
  effectsOutputSize: "effects are not supported",
  pixelDensity: "effects are not supported"
};
var transformOriginAttribute = Number(React__default.default.version.split(".")[0]) > 18 ? "transformOrigin" : "transform-origin";
var RenderSvg = ({
  component,
  shape,
  props
}) => {
  chunk5SQGQMYR_cjs.rejectProps(`<${component}>`, props, UNSUPPORTED);
  const { style, pathStyle, debug, ...pathProps } = props;
  const { width, height, path, instructions, transformOrigin } = shape;
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      xmlns: "http://www.w3.org/2000/svg",
      style: { overflow: "visible", ...style },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
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
          return /* @__PURE__ */ jsxRuntime.jsxs(React__default.default.Fragment, { children: [
            /* @__PURE__ */ jsxRuntime.jsx("path", { d: `M ${previous.x} ${previous.y} ${instruction.cp1x} ${instruction.cp1y}`, strokeWidth: 2, stroke: "rgba(0, 0, 0, 0.4)" }),
            /* @__PURE__ */ jsxRuntime.jsx("path", { d: `M ${instruction.x} ${instruction.y} ${instruction.cp2x} ${instruction.cp2y}`, strokeWidth: 2, stroke: "rgba(0, 0, 0, 0.4)" }),
            /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: instruction.cp1x, cy: instruction.cp1y, r: 3, fill: "white", strokeWidth: 2, stroke: "black" }),
            /* @__PURE__ */ jsxRuntime.jsx("circle", { cx: instruction.cp2x, cy: instruction.cp2y, r: 3, strokeWidth: 2, fill: "white", stroke: "black" })
          ] }, index);
        }) : null
      ]
    }
  );
};
var Rect = ({ width, height, edgeRoundness, cornerRadius, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Rect", shape: chunkJQCZMZZG_cjs.makeRect({ width, height, edgeRoundness, cornerRadius }), props });
var Circle = ({ radius, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Circle", shape: chunkJQCZMZZG_cjs.makeCircle({ radius }), props });
var Ellipse = ({ rx, ry, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Ellipse", shape: chunkJQCZMZZG_cjs.makeEllipse({ rx, ry }), props });
var Triangle = ({ length, direction, edgeRoundness, cornerRadius, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Triangle", shape: chunkJQCZMZZG_cjs.makeTriangle({ length, direction, edgeRoundness, cornerRadius }), props });
var Star = ({ innerRadius, outerRadius, points, cornerRadius, edgeRoundness, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(
  RenderSvg,
  {
    component: "Star",
    shape: chunkJQCZMZZG_cjs.makeStar({ innerRadius, outerRadius, points, cornerRadius, edgeRoundness }),
    props
  }
);
var Polygon = ({ points, radius, cornerRadius, edgeRoundness, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Polygon", shape: chunkJQCZMZZG_cjs.makePolygon({ points, radius, cornerRadius, edgeRoundness }), props });
var Pie = ({ radius, progress, closePath, counterClockwise, rotation, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Pie", shape: chunkJQCZMZZG_cjs.makePie({ radius, progress, closePath, counterClockwise, rotation }), props });
var Heart = ({ aspectRatio, height, bottomRoundnessAdjustment, depthAdjustment, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(
  RenderSvg,
  {
    component: "Heart",
    shape: chunkJQCZMZZG_cjs.makeHeart({ aspectRatio, height, bottomRoundnessAdjustment, depthAdjustment }),
    props
  }
);
var Arrow = ({ length, headWidth, headLength, shaftWidth, direction, cornerRadius, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(
  RenderSvg,
  {
    component: "Arrow",
    shape: chunkJQCZMZZG_cjs.makeArrow({ length, headWidth, headLength, shaftWidth, direction, cornerRadius }),
    props
  }
);
var Spark = ({ width, height, edgeRoundness, cornerRadius, ...props }) => /* @__PURE__ */ jsxRuntime.jsx(RenderSvg, { component: "Spark", shape: chunkJQCZMZZG_cjs.makeSpark({ width, height, edgeRoundness, cornerRadius }), props });
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
}) => /* @__PURE__ */ jsxRuntime.jsx(
  RenderSvg,
  {
    component: "Callout",
    shape: chunkJQCZMZZG_cjs.makeCallout({ width, height, pointerLength, pointerBaseWidth, pointerPosition, pointerDirection, edgeRoundness, cornerRadius }),
    props
  }
);

Object.defineProperty(exports, "makeArrow", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeArrow; }
});
Object.defineProperty(exports, "makeCallout", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeCallout; }
});
Object.defineProperty(exports, "makeCircle", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeCircle; }
});
Object.defineProperty(exports, "makeEllipse", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeEllipse; }
});
Object.defineProperty(exports, "makeHeart", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeHeart; }
});
Object.defineProperty(exports, "makePie", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makePie; }
});
Object.defineProperty(exports, "makePolygon", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makePolygon; }
});
Object.defineProperty(exports, "makeRect", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeRect; }
});
Object.defineProperty(exports, "makeSpark", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeSpark; }
});
Object.defineProperty(exports, "makeStar", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeStar; }
});
Object.defineProperty(exports, "makeTriangle", {
  enumerable: true,
  get: function () { return chunkJQCZMZZG_cjs.makeTriangle; }
});
exports.Arrow = Arrow;
exports.Callout = Callout;
exports.Circle = Circle;
exports.Ellipse = Ellipse;
exports.Heart = Heart;
exports.Pie = Pie;
exports.Polygon = Polygon;
exports.Rect = Rect;
exports.Spark = Spark;
exports.Star = Star;
exports.Triangle = Triangle;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map