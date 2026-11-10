import { checkBox, fillTextBox } from './fill-text-box';
import type { ModifyableCSSProperties, TextTransform } from './measure-text';

const PRECISION = 100;
const MIN_FONT_SIZE = 0.1;

/**
 * The largest font size (px, in steps of 0.01, up to `maxFontSize`, default
 * 2000) at which `text` fits in `maxLines` lines of `maxBoxWidth` px, and the
 * lines it breaks into (words split on spaces, Remotion's binary search).
 * Browser only; load the font first.
 */
export const fitTextOnNLines = ({
  text,
  maxLines,
  maxBoxWidth,
  fontFamily,
  fontWeight,
  letterSpacing,
  fontVariantNumeric,
  validateFontIsLoaded,
  textTransform,
  additionalStyles,
  maxFontSize,
}: {
  text: string;
  maxLines: number;
  maxBoxWidth: number;
  fontFamily: string;
  fontWeight?: number | string;
  letterSpacing?: string;
  fontVariantNumeric?: string;
  validateFontIsLoaded?: boolean;
  textTransform?: TextTransform;
  additionalStyles?: ModifyableCSSProperties;
  maxFontSize?: number;
}): { fontSize: number; lines: string[] } => {
  if (typeof text !== 'string') {
    throw new TypeError(`fitTextOnNLines(): "text" must be a string, got ${JSON.stringify(text)}`);
  }
  checkBox('fitTextOnNLines()', maxBoxWidth, maxLines);
  if (maxFontSize !== undefined && (!Number.isFinite(maxFontSize) || maxFontSize < MIN_FONT_SIZE)) {
    throw new Error(`fitTextOnNLines(): "maxFontSize" must be a finite number of at least ${MIN_FONT_SIZE}, got ${maxFontSize}`);
  }

  let left = Math.floor(MIN_FONT_SIZE * PRECISION);
  let right = Math.floor((maxFontSize ?? 2000) * PRECISION);
  let optimalFontSize = MIN_FONT_SIZE;
  let optimalLines: string[] = [];
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const fontSize = mid / PRECISION;
    const textBox = fillTextBox({ maxBoxWidth, maxLines });
    let exceedsBox = false;
    let currentLine = 0;
    const lines: string[] = [''];

    for (const word of text.split(' ')) {
      const result = textBox.add({
        text: lines[currentLine].length === 0 ? word : ' ' + word,
        fontFamily,
        fontWeight,
        fontSize,
        letterSpacing,
        fontVariantNumeric,
        validateFontIsLoaded,
        textTransform,
        additionalStyles,
      });
      if (result.exceedsBox) {
        exceedsBox = true;
        break;
      }
      if (result.newLine) {
        lines.push('');
        currentLine++;
      }
      lines[currentLine] += word + ' ';
    }

    if (!exceedsBox && currentLine < maxLines) {
      optimalFontSize = fontSize;
      optimalLines = lines;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return { fontSize: optimalFontSize, lines: optimalLines.map((line) => line.trimEnd()) };
};
