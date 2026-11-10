import { checkWord, measureText, type Word } from './measure-text';

const checkBox = (fn: string, maxBoxWidth: unknown, maxLines: unknown) => {
  if (typeof maxBoxWidth !== 'number' || !Number.isFinite(maxBoxWidth) || maxBoxWidth <= 0) {
    throw new TypeError(`${fn}: "maxBoxWidth" must be a positive number (px), got ${JSON.stringify(maxBoxWidth)}`);
  }
  if (typeof maxLines !== 'number' || !Number.isInteger(maxLines) || maxLines < 1) {
    throw new TypeError(`${fn}: "maxLines" must be a positive integer, got ${JSON.stringify(maxLines)}`);
  }
};

export { checkBox };

/**
 * A box `maxBoxWidth` px wide with room for `maxLines` lines, filled word by
 * word: `add(word)` puts the word on the current line, or on a new line when
 * it does not fit, and returns `{ exceedsBox, newLine }`. A word that does not
 * fit is not added (`exceedsBox: true`). Widths are the sum of the words'
 * measureText() widths (Remotion's algorithm).
 */
export const fillTextBox = ({ maxBoxWidth, maxLines }: { maxBoxWidth: number; maxLines: number }) => {
  checkBox('fillTextBox()', maxBoxWidth, maxLines);
  const lines: Word[][] = Array.from({ length: maxLines }, () => [] as Word[]);

  return {
    add: (word: Word): { exceedsBox: boolean; newLine: boolean } => {
      checkWord('fillTextBox().add()', word);
      const { text } = word;
      const lastLineIndex = lines.reduceRight((acc, curr, index) => (acc === -1 && curr.length > 0 ? index : acc), -1);
      const currentlyAt = lastLineIndex === -1 ? 0 : lastLineIndex;
      const lineToUse = lines[currentlyAt];

      const lineWidthWithWordAdded = [...lineToUse, word]
        .map((w) => measureText(w).width)
        .reduce((a, b) => a + b, 0);

      if (Math.ceil(lineWidthWithWordAdded) <= maxBoxWidth) {
        lines[currentlyAt].push({ ...word, text: lines[currentlyAt].length === 0 ? text.trimStart() : text });
        return { exceedsBox: false, newLine: false };
      }

      if (currentlyAt === maxLines - 1) {
        return { exceedsBox: true, newLine: false };
      }

      const wordForNewLine: Word = { ...word, text: text.trimStart() };
      if (Math.ceil(measureText(wordForNewLine).width) > maxBoxWidth) {
        return { exceedsBox: true, newLine: false };
      }

      lines[currentlyAt + 1] = [wordForNewLine];
      return { exceedsBox: false, newLine: true };
    },
  };
};
