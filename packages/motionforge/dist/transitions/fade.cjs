'use client';'use strict';

var chunk6BVXSAAW_cjs = require('../chunk-6BVXSAAW.cjs');
var chunkWQ6AZCZD_cjs = require('../chunk-WQ6AZCZD.cjs');
require('../chunk-SW2AKXWG.cjs');
require('../chunk-NS6WDBHG.cjs');
var jsxRuntime = require('react/jsx-runtime');

var FadePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const opacity = isEntering ? presentationProgress : passedProps.shouldFadeOutExitingScene ? 1 - presentationProgress : 1;
  return /* @__PURE__ */ jsxRuntime.jsx(chunkWQ6AZCZD_cjs.AbsoluteFill, { style: { opacity, ...chunk6BVXSAAW_cjs.byDirection(isEntering, passedProps.enterStyle, passedProps.exitStyle) }, children });
};
var fade = (props) => ({
  component: FadePresentation,
  props: chunk6BVXSAAW_cjs.checkOptions("fade", props)
});

exports.fade = fade;
//# sourceMappingURL=fade.cjs.map
//# sourceMappingURL=fade.cjs.map