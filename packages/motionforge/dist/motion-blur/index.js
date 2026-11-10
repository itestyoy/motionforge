'use client';import { AbsoluteFill } from '../chunk-6ZUQCR5A.js';
import '../chunk-545UZ5CT.js';
import { Freeze } from '../chunk-POVQTMPB.js';
import { useCurrentFrame } from '../chunk-L5HQH5HH.js';
import { jsxs, jsx } from 'react/jsx-runtime';

// src/components/motion-blur/validate.ts
var checkNumber = (component, name, value, count = false) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${component}: "${name}" must be a finite number, got ${JSON.stringify(value)}`);
  }
  if (count && (!Number.isInteger(value) || value < 0)) {
    throw new TypeError(`${component}: "${name}" must be a non-negative integer, got ${value}`);
  }
  return value;
};
var Trail = ({ children, layers, lagInFrames, trailOpacity }) => {
  const frame = useCurrentFrame();
  checkNumber("<Trail>", "layers", layers, true);
  checkNumber("<Trail>", "lagInFrames", lagInFrames);
  checkNumber("<Trail>", "trailOpacity", trailOpacity);
  return /* @__PURE__ */ jsxs(AbsoluteFill, { children: [
    Array.from({ length: layers }, (_, i) => /* @__PURE__ */ jsx(
      AbsoluteFill,
      {
        style: { opacity: trailOpacity - (layers - i) / layers * trailOpacity },
        children: /* @__PURE__ */ jsx(Freeze, { frame: frame - lagInFrames * (layers - i), children })
      },
      `frame-${i}`
    )),
    children
  ] });
};
var getNumberOfSamples = (shutterFraction, samples, currentFrame) => {
  const maxOffset = shutterFraction * samples;
  if (maxOffset === 0) return 1;
  const maxTimeReverse = currentFrame - maxOffset;
  const factor = Math.min(1, Math.max(0, maxTimeReverse / maxOffset + 1));
  return Math.max(1, Math.round(Math.min(factor * samples, samples)));
};
var CameraMotionBlur = ({
  children,
  shutterAngle = 180,
  samples = 10
}) => {
  const currentFrame = useCurrentFrame();
  checkNumber("<CameraMotionBlur>", "samples", samples, true);
  checkNumber("<CameraMotionBlur>", "shutterAngle", shutterAngle);
  if (shutterAngle < 0 || shutterAngle > 360) {
    throw new TypeError(`<CameraMotionBlur>: "shutterAngle" must be between 0 and 360, got ${shutterAngle}`);
  }
  const shutterFraction = shutterAngle / 360;
  const actualSamples = getNumberOfSamples(shutterFraction, samples, currentFrame);
  return /* @__PURE__ */ jsx(AbsoluteFill, { style: { isolation: "isolate" }, children: Array.from({ length: actualSamples }, (_, i) => {
    const sampleFrameOffset = shutterFraction * ((i + 1) / actualSamples);
    return /* @__PURE__ */ jsx(
      AbsoluteFill,
      {
        style: { mixBlendMode: "plus-lighter", filter: `opacity(${1 / actualSamples})` },
        children: /* @__PURE__ */ jsx(Freeze, { frame: currentFrame - sampleFrameOffset + 1, children })
      },
      `frame-${i}`
    );
  }) });
};

export { CameraMotionBlur, Trail };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map