'use client';import { byDirection, checkOptions } from '../chunk-WVKK7RVQ.js';
import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import '../chunk-L5HQH5HH.js';
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