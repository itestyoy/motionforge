'use client';import { byDirection, checkOptions } from '../chunk-WVKK7RVQ.js';
import { AbsoluteFill } from '../chunk-26M65GZW.js';
import '../chunk-ZIJRMQAM.js';
import '../chunk-3P73E4TK.js';
import { jsx } from 'react/jsx-runtime';

var FadePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const opacity = isEntering ? presentationProgress : passedProps.shouldFadeOutExitingScene ? 1 - presentationProgress : 1;
  return /* @__PURE__ */ jsx(AbsoluteFill, { style: { opacity, ...byDirection(isEntering, passedProps.enterStyle, passedProps.exitStyle) }, children });
};
var fade = (props) => ({
  component: FadePresentation,
  props: checkOptions("fade", props)
});

export { fade };
//# sourceMappingURL=fade.js.map
//# sourceMappingURL=fade.js.map