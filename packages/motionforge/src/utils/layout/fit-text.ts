import { measureText, type ModifyableCSSProperties, type TextTransform } from './measure-text';

const SAMPLE_SIZE = 100;

/**
 * The font size (px) at which `text` on one line is exactly `withinWidth` px
 * wide: measured at 100px and scaled. Browser only; load the font first.
 */
export const fitText = ({
  text,
  withinWidth,
  fontFamily,
  fontVariantNumeric,
  fontWeight,
  letterSpacing,
  validateFontIsLoaded,
  additionalStyles,
  textTransform,
}: {
  text: string;
  withinWidth: number;
  fontFamily: string;
  fontWeight?: number | string;
  letterSpacing?: string;
  fontVariantNumeric?: string;
  validateFontIsLoaded?: boolean;
  textTransform?: TextTransform;
  additionalStyles?: ModifyableCSSProperties;
}): { fontSize: number } => {
  if (typeof withinWidth !== 'number' || !Number.isFinite(withinWidth) || withinWidth <= 0) {
    throw new TypeError(`fitText(): "withinWidth" must be a positive number (px), got ${JSON.stringify(withinWidth)}`);
  }
  const estimate = measureText({
    text,
    fontFamily,
    fontSize: SAMPLE_SIZE,
    fontWeight,
    fontVariantNumeric,
    letterSpacing,
    validateFontIsLoaded,
    textTransform,
    additionalStyles,
  });
  if (estimate.width === 0) {
    throw new Error(
      `fitText(): the width of the text ${JSON.stringify(text)} is 0, so no font size makes it ${withinWidth}px wide`,
    );
  }
  return { fontSize: (withinWidth / estimate.width) * SAMPLE_SIZE };
};
