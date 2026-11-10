'use client';import { makePie } from '../chunk-JQIBAW35.js';
import { translatePath } from '../chunk-ADMJBRUM.js';
import { checkOptions, checkPositive, byDirection } from '../chunk-WVKK7RVQ.js';
import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import '../chunk-L5HQH5HH.js';
import { jsx } from 'react/jsx-runtime';

var ClockWipePresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const radius = Math.sqrt(passedProps.width ** 2 + passedProps.height ** 2) / 2;
  const { path } = makePie({ radius, progress: presentationProgress });
  const clip = translatePath(path, -(radius * 2 - passedProps.width) / 2, -(radius * 2 - passedProps.height) / 2);
  return /* @__PURE__ */ jsx(AbsoluteFill, { style: byDirection(isEntering, passedProps.outerEnterStyle, passedProps.outerExitStyle), children: /* @__PURE__ */ jsx(
    AbsoluteFill,
    {
      style: {
        width: "100%",
        height: "100%",
        clipPath: isEntering ? `path("${clip}")` : void 0,
        ...byDirection(isEntering, passedProps.innerEnterStyle, passedProps.innerExitStyle)
      },
      children
    }
  ) });
};
var clockWipe = (props) => {
  const options = checkOptions("clockWipe", props, true);
  checkPositive("clockWipe", "width", options.width, true);
  checkPositive("clockWipe", "height", options.height, true);
  return { component: ClockWipePresentation, props: options };
};

export { clockWipe };
//# sourceMappingURL=clock-wipe.js.map
//# sourceMappingURL=clock-wipe.js.map