'use client';import { byDirection, checkOptions } from '../chunk-WVKK7RVQ.js';
import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import '../chunk-L5HQH5HH.js';
import { jsx } from 'react/jsx-runtime';

var NonePresentation = ({
  children,
  presentationDirection,
  passedProps
}) => /* @__PURE__ */ jsx(AbsoluteFill, { style: { ...byDirection(presentationDirection === "entering", passedProps.enterStyle, passedProps.exitStyle) }, children });
var none = (props) => ({
  component: NonePresentation,
  props: checkOptions("none", props)
});

export { none };
//# sourceMappingURL=none.js.map
//# sourceMappingURL=none.js.map