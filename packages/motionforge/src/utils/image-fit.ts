export type ImageFit = 'contain' | 'cover' | 'fill';

export const IMAGE_FITS: readonly ImageFit[] = ['fill', 'contain', 'cover'];

/** drawImage() arguments that place an image of `imageSize` on a canvas of `canvasSize` (Remotion's calculateImageFit). */
export const calculateImageFit = (
  fit: ImageFit,
  imageSize: { width: number; height: number },
  canvasSize: { width: number; height: number },
): [number, number, number, number, number, number, number, number] => {
  if (fit === 'fill') {
    return [0, 0, imageSize.width, imageSize.height, 0, 0, canvasSize.width, canvasSize.height];
  }
  const ratio = (fit === 'contain' ? Math.min : Math.max)(
    canvasSize.width / imageSize.width,
    canvasSize.height / imageSize.height,
  );
  return [
    0,
    0,
    imageSize.width,
    imageSize.height,
    (canvasSize.width - imageSize.width * ratio) / 2,
    (canvasSize.height - imageSize.height * ratio) / 2,
    imageSize.width * ratio,
    imageSize.height * ratio,
  ];
};

export const checkImageProps = (
  component: string,
  { fit, width, height, playbackRate }: { fit: unknown; width: unknown; height: unknown; playbackRate: unknown },
) => {
  if (!IMAGE_FITS.includes(fit as ImageFit)) {
    throw new Error(`${component}: fit must be 'fill', 'contain' or 'cover', got ${JSON.stringify(fit)}`);
  }
  for (const [name, value] of [['width', width], ['height', height]] as const) {
    if (value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0)) {
      throw new Error(`${component}: ${name} must be a positive number (px), got ${JSON.stringify(value)}`);
    }
  }
  if (typeof playbackRate !== 'number' || !Number.isFinite(playbackRate) || playbackRate <= 0) {
    throw new Error(`${component}: playbackRate must be a positive number, got ${JSON.stringify(playbackRate)}`);
  }
};

/**
 * Media time at a composition frame, rounded to 1e-9 s so that a frame that
 * lands exactly on an image frame boundary is not shifted by floating-point
 * error.
 */
export const mediaTimeInSeconds = (frame: number, fps: number, playbackRate: number): number =>
  Math.round(((frame * playbackRate) / fps) * 1e9) / 1e9;
