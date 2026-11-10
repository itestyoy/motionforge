'use client';'use strict';

var chunk6BVXSAAW_cjs = require('../chunk-6BVXSAAW.cjs');
var chunkWEQRPTIM_cjs = require('../chunk-WEQRPTIM.cjs');
var chunkZDGERDNT_cjs = require('../chunk-ZDGERDNT.cjs');
require('../chunk-M5DYJOS5.cjs');
require('../chunk-VLRD4ANM.cjs');
var jsxRuntime = require('react/jsx-runtime');

var DIRECTIONS = ["from-left", "from-right", "from-top", "from-bottom"];
var CubePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps: { direction, perspective = 1e3 }
}) => {
  const isEntering = presentationDirection === "entering";
  const turnsForward = direction === "from-right" || direction === "from-top";
  const startsAfter = direction === "from-right" || direction === "from-bottom";
  const vertical = direction === "from-top" || direction === "from-bottom";
  const rotation = isEntering ? chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, 1], [turnsForward ? 90 : -90, 0]) : chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, 1], [0, turnsForward ? -90 : 90]);
  const position = isEntering ? chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, 1], [startsAfter ? 100 : -100, 0]) : chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, 1], [0, startsAfter ? -100 : 100]);
  const transformOrigin = isEntering ? { "from-left": "right", "from-bottom": "top", "from-top": "bottom", "from-right": "left" }[direction] : { "from-left": "left", "from-bottom": "bottom", "from-top": "top", "from-right": "right" }[direction];
  return /* @__PURE__ */ jsxRuntime.jsx(chunkZDGERDNT_cjs.AbsoluteFill, { style: { perspective, transformStyle: "preserve-3d" }, children: /* @__PURE__ */ jsxRuntime.jsx(
    chunkZDGERDNT_cjs.AbsoluteFill,
    {
      style: {
        width: "100%",
        height: "100%",
        transformOrigin,
        transform: `${vertical ? "translateY" : "translateX"}(${position}%) ${vertical ? "rotateX" : "rotateY"}(${rotation}deg)`,
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden"
      },
      children
    }
  ) });
};
var cube = (props) => {
  const options = chunk6BVXSAAW_cjs.checkOptions("cube", props, true);
  chunk6BVXSAAW_cjs.checkDirection("cube", options.direction, DIRECTIONS, true);
  chunk6BVXSAAW_cjs.checkPositive("cube", "perspective", options.perspective);
  return { component: CubePresentation, props: options };
};

exports.cube = cube;
//# sourceMappingURL=cube.cjs.map
//# sourceMappingURL=cube.cjs.map