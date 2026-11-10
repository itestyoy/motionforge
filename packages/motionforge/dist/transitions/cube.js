'use client';import { checkOptions, checkDirection, checkPositive } from '../chunk-WVKK7RVQ.js';
import { interpolate } from '../chunk-ZPHXLDRN.js';
import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import '../chunk-L5HQH5HH.js';
import { jsx } from 'react/jsx-runtime';

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
  const rotation = isEntering ? interpolate(presentationProgress, [0, 1], [turnsForward ? 90 : -90, 0]) : interpolate(presentationProgress, [0, 1], [0, turnsForward ? -90 : 90]);
  const position = isEntering ? interpolate(presentationProgress, [0, 1], [startsAfter ? 100 : -100, 0]) : interpolate(presentationProgress, [0, 1], [0, startsAfter ? -100 : 100]);
  const transformOrigin = isEntering ? { "from-left": "right", "from-bottom": "top", "from-top": "bottom", "from-right": "left" }[direction] : { "from-left": "left", "from-bottom": "bottom", "from-top": "top", "from-right": "right" }[direction];
  return /* @__PURE__ */ jsx(AbsoluteFill, { style: { perspective, transformStyle: "preserve-3d" }, children: /* @__PURE__ */ jsx(
    AbsoluteFill,
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
  const options = checkOptions("cube", props, true);
  checkDirection("cube", options.direction, DIRECTIONS, true);
  checkPositive("cube", "perspective", options.perspective);
  return { component: CubePresentation, props: options };
};

export { cube };
//# sourceMappingURL=cube.js.map
//# sourceMappingURL=cube.js.map