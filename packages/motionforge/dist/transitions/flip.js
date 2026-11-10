'use client';import { checkOptions, checkDirection, checkPositive, byDirection } from '../chunk-WVKK7RVQ.js';
import { interpolate } from '../chunk-ZPHXLDRN.js';
import { AbsoluteFill } from '../chunk-26M65GZW.js';
import '../chunk-ZIJRMQAM.js';
import '../chunk-3P73E4TK.js';
import { jsx } from 'react/jsx-runtime';

var DIRECTIONS = ["from-left", "from-right", "from-top", "from-bottom"];
var FlipPresentation = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps: { direction = "from-left", perspective = 1e3, innerEnterStyle, innerExitStyle, outerEnterStyle, outerExitStyle }
}) => {
  const isEntering = presentationDirection === "entering";
  const forwards = direction === "from-right" || direction === "from-top";
  const rotation = isEntering ? interpolate(presentationProgress, [0, 1], [forwards ? 180 : -180, 0]) : interpolate(presentationProgress, [0, 1], [0, forwards ? -180 : 180]);
  const rotateProperty = direction === "from-top" || direction === "from-bottom" ? "rotateX" : "rotateY";
  return /* @__PURE__ */ jsx(
    AbsoluteFill,
    {
      style: {
        perspective,
        // The children's back faces stay hidden too.
        transformStyle: "preserve-3d",
        ...byDirection(isEntering, outerEnterStyle, outerExitStyle)
      },
      children: /* @__PURE__ */ jsx(
        AbsoluteFill,
        {
          style: {
            width: "100%",
            height: "100%",
            transform: `${rotateProperty}(${rotation}deg)`,
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            ...byDirection(isEntering, innerEnterStyle, innerExitStyle)
          },
          children
        }
      )
    }
  );
};
var flip = (props) => {
  const options = checkOptions("flip", props);
  checkDirection("flip", options.direction, DIRECTIONS);
  checkPositive("flip", "perspective", options.perspective);
  return { component: FlipPresentation, props: options };
};

export { flip };
//# sourceMappingURL=flip.js.map
//# sourceMappingURL=flip.js.map