'use client';'use strict';

var chunk6BVXSAAW_cjs = require('../chunk-6BVXSAAW.cjs');
var chunkZDGERDNT_cjs = require('../chunk-ZDGERDNT.cjs');
require('../chunk-M5DYJOS5.cjs');
require('../chunk-VLRD4ANM.cjs');
var jsxRuntime = require('react/jsx-runtime');

var FadePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const opacity = isEntering ? presentationProgress : passedProps.shouldFadeOutExitingScene ? 1 - presentationProgress : 1;
  return /* @__PURE__ */ jsxRuntime.jsx(chunkZDGERDNT_cjs.AbsoluteFill, { style: { opacity, ...chunk6BVXSAAW_cjs.byDirection(isEntering, passedProps.enterStyle, passedProps.exitStyle) }, children });
};
var fade = (props) => ({
  component: FadePresentation,
  props: chunk6BVXSAAW_cjs.checkOptions("fade", props)
});

exports.fade = fade;
//# sourceMappingURL=fade.cjs.map
//# sourceMappingURL=fade.cjs.map