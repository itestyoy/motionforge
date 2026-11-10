'use client';import { makeCircle } from '../chunk-JQIBAW35.js';
import { translatePath } from '../chunk-ADMJBRUM.js';
import { checkOptions, checkPositive, byDirection } from '../chunk-WVKK7RVQ.js';
import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import '../chunk-L5HQH5HH.js';
import { jsx } from 'react/jsx-runtime';

var IrisPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps
}) => {
  const isEntering = presentationDirection === "entering";
  const maxRadius = Math.sqrt(passedProps.width ** 2 + passedProps.height ** 2) / 2;
  const radius = Math.max(0, isEntering ? maxRadius * presentationProgress : maxRadius - maxRadius * presentationProgress);
  const { path } = makeCircle({ radius });
  const clip = translatePath(path, passedProps.width / 2 - radius, passedProps.height / 2 - radius);
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
var iris = (props) => {
  const options = checkOptions("iris", props, true);
  checkPositive("iris", "width", options.width, true);
  checkPositive("iris", "height", options.height, true);
  return { component: IrisPresentation, props: options };
};

export { iris };
//# sourceMappingURL=iris.js.map
//# sourceMappingURL=iris.js.map