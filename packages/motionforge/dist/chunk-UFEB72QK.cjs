'use client';'use strict';

var chunk6BVXSAAW_cjs = require('./chunk-6BVXSAAW.cjs');
var chunkZDGERDNT_cjs = require('./chunk-ZDGERDNT.cjs');
var jsxRuntime = require('react/jsx-runtime');

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
  return /* @__PURE__ */ jsxRuntime.jsx(
    chunkZDGERDNT_cjs.AbsoluteFill,
    {
      style: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        transform: translate(direction, isEntering, presentationProgress),
        ...chunk6BVXSAAW_cjs.byDirection(isEntering, enterStyle, exitStyle)
      },
      children
    }
  );
};
var slide = (props) => {
  const options = chunk6BVXSAAW_cjs.checkOptions("slide", props);
  chunk6BVXSAAW_cjs.checkDirection("slide", options.direction, DIRECTIONS);
  return { component: SlidePresentation, props: options };
};

exports.slide = slide;
//# sourceMappingURL=chunk-UFEB72QK.cjs.map
//# sourceMappingURL=chunk-UFEB72QK.cjs.map