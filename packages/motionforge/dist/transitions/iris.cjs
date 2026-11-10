'use client';'use strict';

var chunkJQCZMZZG_cjs = require('../chunk-JQCZMZZG.cjs');
var chunk37ZW67WK_cjs = require('../chunk-37ZW67WK.cjs');
var chunk6BVXSAAW_cjs = require('../chunk-6BVXSAAW.cjs');
var chunkZDGERDNT_cjs = require('../chunk-ZDGERDNT.cjs');
require('../chunk-M5DYJOS5.cjs');
require('../chunk-VLRD4ANM.cjs');
var jsxRuntime = require('react/jsx-runtime');

var IrisPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const maxRadius = Math.sqrt(passedProps.width ** 2 + passedProps.height ** 2) / 2;
  const radius = Math.max(0, isEntering ? maxRadius * presentationProgress : maxRadius - maxRadius * presentationProgress);
  const { path } = chunkJQCZMZZG_cjs.makeCircle({ radius });
  const clip = chunk37ZW67WK_cjs.translatePath(path, passedProps.width / 2 - radius, passedProps.height / 2 - radius);
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
var iris = (props) => {
  const options = chunk6BVXSAAW_cjs.checkOptions("iris", props, true);
  chunk6BVXSAAW_cjs.checkPositive("iris", "width", options.width, true);
  chunk6BVXSAAW_cjs.checkPositive("iris", "height", options.height, true);
  return { component: IrisPresentation, props: options };
};

exports.iris = iris;
//# sourceMappingURL=iris.cjs.map
//# sourceMappingURL=iris.cjs.map