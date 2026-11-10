'use client';'use strict';

var chunk6BVXSAAW_cjs = require('../chunk-6BVXSAAW.cjs');
var chunkWEQRPTIM_cjs = require('../chunk-WEQRPTIM.cjs');
var chunkZDGERDNT_cjs = require('../chunk-ZDGERDNT.cjs');
require('../chunk-M5DYJOS5.cjs');
require('../chunk-VLRD4ANM.cjs');
var jsxRuntime = require('react/jsx-runtime');

var DIRECTIONS = ["from-left", "from-right", "from-top", "from-bottom"];
var FlipPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps: { direction = "from-left", perspective = 1e3, innerEnterStyle, innerExitStyle, outerEnterStyle, outerExitStyle }
}) => {
  const isEntering = presentationDirection === "entering";
  const forwards = direction === "from-right" || direction === "from-top";
  const rotation = isEntering ? chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, 1], [forwards ? 180 : -180, 0]) : chunkWEQRPTIM_cjs.interpolate(presentationProgress, [0, 1], [0, forwards ? -180 : 180]);
  const rotateProperty = direction === "from-top" || direction === "from-bottom" ? "rotateX" : "rotateY";
  return /* @__PURE__ */ jsxRuntime.jsx(
    chunkZDGERDNT_cjs.AbsoluteFill,
    {
      style: {
        perspective,
        // The children's back faces stay hidden too.
        transformStyle: "preserve-3d",
        ...chunk6BVXSAAW_cjs.byDirection(isEntering, outerEnterStyle, outerExitStyle)
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        chunkZDGERDNT_cjs.AbsoluteFill,
        {
          style: {
            width: "100%",
            height: "100%",
            transform: `${rotateProperty}(${rotation}deg)`,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            ...chunk6BVXSAAW_cjs.byDirection(isEntering, innerEnterStyle, innerExitStyle)
          },
          children
        }
      )
    }
  );
};
var flip = (props) => {
  const options = chunk6BVXSAAW_cjs.checkOptions("flip", props);
  chunk6BVXSAAW_cjs.checkDirection("flip", options.direction, DIRECTIONS);
  chunk6BVXSAAW_cjs.checkPositive("flip", "perspective", options.perspective);
  return { component: FlipPresentation, props: options };
};

exports.flip = flip;
//# sourceMappingURL=flip.cjs.map
//# sourceMappingURL=flip.cjs.map