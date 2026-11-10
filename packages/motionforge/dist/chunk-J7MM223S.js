'use client';import { checkOptions, checkDirection, byDirection } from './chunk-WVKK7RVQ.js';
import { AbsoluteFill } from './chunk-26M65GZW.js';
import { jsx } from 'react/jsx-runtime';

var DIRECTIONS = ["from-left", "from-top", "from-right", "from-bottom"];
var EPSILON = 0.01;
var translate = (direction, isEntering, progress) => {
  const overlapped = progress === 1 ? progress * 100 : progress * 100 - EPSILON;
  if (!isEntering) {
    switch (direction) {
      case "from-left":
        return `translateX(${overlapped}%)`;
      case "from-right":
        return `translateX(${-progress * 100}%)`;
      case "from-top":
        return `translateY(${overlapped}%)`;
      case "from-bottom":
        return `translateY(${-progress * 100}%)`;
    }
  }
  switch (direction) {
    case "from-left":
      return `translateX(${ -100 + progress * 100}%)`;
    case "from-right":
      return `translateX(${100 - overlapped}%)`;
    case "from-top":
      return `translateY(${ -100 + progress * 100}%)`;
    case "from-bottom":
      return `translateY(${100 - overlapped}%)`;
  }
};
var SlidePresentation = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = "from-left", enterStyle, exitStyle }
}) => {
  const isEntering = presentationDirection === "entering";
  return /* @__PURE__ */ jsx(
    AbsoluteFill,
    {
      style: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        transform: translate(direction, isEntering, presentationProgress),
        ...byDirection(isEntering, enterStyle, exitStyle)
      },
      children
    }
  );
};
var slide = (props) => {
  const options = checkOptions("slide", props);
  checkDirection("slide", options.direction, DIRECTIONS);
  return { component: SlidePresentation, props: options };
};

export { slide };
//# sourceMappingURL=chunk-J7MM223S.js.map
//# sourceMappingURL=chunk-J7MM223S.js.map