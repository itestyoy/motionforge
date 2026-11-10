'use client';'use strict';

var chunkJQCZMZZG_cjs = require('../chunk-JQCZMZZG.cjs');
var chunk37ZW67WK_cjs = require('../chunk-37ZW67WK.cjs');
var chunk6BVXSAAW_cjs = require('../chunk-6BVXSAAW.cjs');
var chunkZDGERDNT_cjs = require('../chunk-ZDGERDNT.cjs');
require('../chunk-M5DYJOS5.cjs');
require('../chunk-VLRD4ANM.cjs');
var jsxRuntime = require('react/jsx-runtime');

var ClockWipePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const radius = Math.sqrt(passedProps.width ** 2 + passedProps.height ** 2) / 2;
  const { path } = chunkJQCZMZZG_cjs.makePie({ radius, progress: presentationProgress });
  const clip = chunk37ZW67WK_cjs.translatePath(path, -(radius * 2 - passedProps.width) / 2, -(radius * 2 - passedProps.height) / 2);
  return /* @__PURE__ */ jsxRuntime.jsx(chunkZDGERDNT_cjs.AbsoluteFill, { style: chunk6BVXSAAW_cjs.byDirection(isEntering, passedProps.outerEnterStyle, passedProps.outerExitStyle), children: /* @__PURE__ */ jsxRuntime.jsx(
    chunkZDGERDNT_cjs.AbsoluteFill,
    {
      style: {
        width: "100%",
        height: "100%",
        clipPath: isEntering ? `path("${clip}")` : void 0,
        ...chunk6BVXSAAW_cjs.byDirection(isEntering, passedProps.innerEnterStyle, passedProps.innerExitStyle)
      },
      children
    }
  ) });
};
var clockWipe = (props) => {
  const options = chunk6BVXSAAW_cjs.checkOptions("clockWipe", props, true);
  chunk6BVXSAAW_cjs.checkPositive("clockWipe", "width", options.width, true);
  chunk6BVXSAAW_cjs.checkPositive("clockWipe", "height", options.height, true);
  return { component: ClockWipePresentation, props: options };
};

exports.clockWipe = clockWipe;
//# sourceMappingURL=clock-wipe.cjs.map
//# sourceMappingURL=clock-wipe.cjs.map