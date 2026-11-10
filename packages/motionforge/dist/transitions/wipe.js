'use client';import { checkOptions, checkDirection, byDirection } from '../chunk-WVKK7RVQ.js';
import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import '../chunk-L5HQH5HH.js';
import { jsx } from 'react/jsx-runtime';

var DIRECTIONS = [
  "from-left",
  "from-top-left",
  "from-top",
  "from-top-right",
  "from-right",
  "from-bottom-right",
  "from-bottom",
  "from-bottom-left"
];
var polygonIn = (progress, direction) => {
  const p = progress * 100;
  switch (direction) {
    case "from-left":
      return `polygon(0% 0%, ${p}% 0%, ${p}% 100%, 0% 100%)`;
    case "from-top-left":
      return `polygon(0% 0%, ${p * 2}% 0%, 0% ${p * 2}%)`;
    case "from-top":
      return `polygon(0% 0%, 100% 0%, 100% ${p}%, 0% ${p}%)`;
    case "from-top-right":
      return `polygon(100% 0%, ${100 - p * 2}% 0%, 100% ${p * 2}%)`;
    case "from-right":
      return `polygon(100% 0%, 100% 100%, ${100 - p}% 100%, ${100 - p}% 0%)`;
    case "from-bottom-right":
      return `polygon(100% 100%, ${100 - p * 2}% 100%, 100% ${100 - p * 2}%)`;
    case "from-bottom":
      return `polygon(0% 100%, 100% 100%, 100% ${100 - p}%, 0% ${100 - p}%)`;
    case "from-bottom-left":
      return `polygon(0% 100%, 0% ${100 - p * 2}%, ${p * 2}% 100%)`;
  }
};
var polygonOut = (progress, direction) => {
  const p = progress * 100;
  switch (direction) {
    case "from-left":
      return `polygon(100% 100%, ${100 - p}% 100%, ${100 - p}% 0%, 100% 0%)`;
    case "from-top-left":
      return `polygon(100% 100%, ${100 - p * 2}% 100%, 100% ${100 - p * 2}%)`;
    case "from-top":
      return `polygon(100% 100%, 0% 100%, 0% ${100 - p}%, 100% ${100 - p}%)`;
    case "from-top-right":
      return `polygon(0% 100%, ${p * 2}% 100%, 0% ${100 - p * 2}%)`;
    case "from-right":
      return `polygon(0% 0%, ${p}% 0%, ${p}% 100%, 0% 100%)`;
    case "from-bottom-right":
      return `polygon(0% 0%, ${p * 2}% 0%, 0% ${p * 2}%)`;
    case "from-bottom":
      return `polygon(100% 0%, 0% 0%, 0% ${p}%, 100% ${p}%)`;
    case "from-bottom-left":
      return `polygon(100% 0%, ${100 - p * 2}% 0%, 100% ${p * 2}%)`;
  }
};
var WipePresentation = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = "from-left", innerEnterStyle, innerExitStyle, outerEnterStyle, outerExitStyle }
}) => {
  const isEntering = presentationDirection === "entering";
  const clipPath = isEntering ? polygonIn(presentationProgress, direction) : polygonOut(1 - presentationProgress, direction);
  return /* @__PURE__ */ jsx(AbsoluteFill, { style: byDirection(isEntering, outerEnterStyle, outerExitStyle), children: /* @__PURE__ */ jsx(
    AbsoluteFill,
    {
      style: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        clipPath,
        ...byDirection(isEntering, innerEnterStyle, innerExitStyle)
      },
      children
    }
  ) });
};
var wipe = (props) => {
  const options = checkOptions("wipe", props);
  checkDirection("wipe", options.direction, DIRECTIONS);
  return { component: WipePresentation, props: options };
};

export { wipe };
//# sourceMappingURL=wipe.js.map
//# sourceMappingURL=wipe.js.map