'use client';// src/utils/image-fit.ts
var IMAGE_FITS = ["fill", "contain", "cover"];
var calculateImageFit = (fit, imageSize, canvasSize) => {
  if (fit === "fill") {
    return [0, 0, imageSize.width, imageSize.height, 0, 0, canvasSize.width, canvasSize.height];
  }
  const ratio = (fit === "contain" ? Math.min : Math.max)(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height
  );
  return [
    0,
    0,
    imageSize.width,
    imageSize.height,
    (canvasSize.width - imageSize.width * ratio) / 2,
    (canvasSize.height - imageSize.height * ratio) / 2,
    imageSize.width * ratio,
    imageSize.height * ratio
  ];
};
var checkImageProps = (component, { fit, width, height, playbackRate }) => {
  if (!IMAGE_FITS.includes(fit)) {
    throw new Error(`${component}: fit must be 'fill', 'contain' or 'cover', got ${JSON.stringify(fit)}`);
  }
  for (const [name, value] of [["width", width], ["height", height]]) {
    if (value !== void 0 && (typeof value !== "number" || !Number.isFinite(value) || value <= 0)) {
      throw new Error(`${component}: ${name} must be a positive number (px), got ${JSON.stringify(value)}`);
    }
  }
  if (typeof playbackRate !== "number" || !Number.isFinite(playbackRate) || playbackRate <= 0) {
    throw new Error(`${component}: playbackRate must be a positive number, got ${JSON.stringify(playbackRate)}`);
  }
};
var mediaTimeInSeconds = (frame, fps, playbackRate) => Math.round(frame * playbackRate / fps * 1e9) / 1e9;

export { calculateImageFit, checkImageProps, mediaTimeInSeconds };
//# sourceMappingURL=chunk-ZVSY5ZVR.js.map
//# sourceMappingURL=chunk-ZVSY5ZVR.js.map