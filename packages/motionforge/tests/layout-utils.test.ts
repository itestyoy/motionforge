// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fillTextBox, fitText, fitTextOnNLines, measureText } from '../src/layout-utils';

// happy-dom has no text layout: every character is 0.5 em wide, a line 1.2 em
// high, and the font family changes nothing.
const measured: string[] = [];
beforeEach(() => {
  measured.length = 0;
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    const size = parseFloat(this.style.fontSize);
    const text = this.textContent ?? '';
    measured.push(text);
    return { width: text.length * size * 0.5, height: size * 1.2 } as DOMRect;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  delete (document as { fonts?: unknown }).fonts;
});

const fonts = (check: () => boolean) =>
  Object.defineProperty(document, 'fonts', { value: { check: vi.fn(check) }, configurable: true });

describe('measureText', () => {
  it('measures a one-line span with the given styles and removes it again', () => {
    const before = document.body.childElementCount;
    expect(measureText({ text: 'Hello', fontFamily: 'Inter', fontSize: 20 })).toEqual({ width: 50, height: 24 });
    expect(measureText({ text: 'Hi', fontFamily: 'Inter', fontSize: '10px' })).toEqual({ width: 10, height: 12 });
    expect(document.body.childElementCount).toBe(before);
  });

  it('caches a measurement only when the fonts it needs are loaded', () => {
    const word = { text: 'cache me', fontFamily: 'Inter', fontSize: 31 };
    fonts(() => false);
    measureText(word);
    measureText(word);
    expect(measured.filter((t) => t === 'cache me')).toHaveLength(2);
    fonts(() => true);
    measureText(word);
    measureText(word);
    expect(measured.filter((t) => t === 'cache me')).toHaveLength(3);
    // fontVariantNumeric is part of the key
    measureText({ ...word, fontVariantNumeric: 'tabular-nums' });
    expect(measured.filter((t) => t === 'cache me')).toHaveLength(4);
  });

  it('throws when validateFontIsLoaded finds the fallback font', () => {
    expect(() =>
      measureText({ text: 'Hello world', fontFamily: 'NotLoaded', fontSize: 20, validateFontIsLoaded: true }),
    ).toThrow(/"NotLoaded" does not look loaded/);
  });

  it('checks its input', () => {
    // @ts-expect-error missing font size
    expect(() => measureText({ text: 'a', fontFamily: 'Inter' })).toThrow(/"fontSize" must be a positive number/);
    expect(() => measureText({ text: 'a', fontFamily: '', fontSize: 10 })).toThrow(/"fontFamily" must be a non-empty string/);
    // @ts-expect-error not a string
    expect(() => measureText({ text: 3, fontFamily: 'Inter', fontSize: 10 })).toThrow(/"text" must be a string/);
  });
});

describe('fitText', () => {
  it('returns the font size that makes the text as wide as the box', () => {
    // "abcd" at 100px is 200px wide
    expect(fitText({ text: 'abcd', withinWidth: 300, fontFamily: 'Inter' })).toEqual({ fontSize: 150 });
  });

  it('throws for a text without width and a bad width', () => {
    expect(() => fitText({ text: '', withinWidth: 300, fontFamily: 'Inter' })).toThrow(/width of the text "" is 0/);
    expect(() => fitText({ text: 'a', withinWidth: 0, fontFamily: 'Inter' })).toThrow(/"withinWidth" must be a positive number/);
  });
});

describe('fillTextBox', () => {
  it('adds words to lines until the box is full', () => {
    const box = fillTextBox({ maxBoxWidth: 50, maxLines: 2 });
    const word = (text: string) => ({ text, fontFamily: 'Inter', fontSize: 10 });
    // 5px per character
    expect(box.add(word('hello'))).toEqual({ exceedsBox: false, newLine: false }); // 25
    expect(box.add(word(' you'))).toEqual({ exceedsBox: false, newLine: false }); // 45
    expect(box.add(word(' there'))).toEqual({ exceedsBox: false, newLine: true }); // new line, "there" = 25
    expect(box.add(word(' everyone'))).toEqual({ exceedsBox: true, newLine: false }); // 25 + 45 > 50 on the last line
  });

  it('checks its options', () => {
    expect(() => fillTextBox({ maxBoxWidth: 10, maxLines: 0 })).toThrow(/"maxLines" must be a positive integer/);
    expect(() => fillTextBox({ maxBoxWidth: -1, maxLines: 1 })).toThrow(/"maxBoxWidth" must be a positive number/);
  });
});

describe('fitTextOnNLines', () => {
  it('finds the largest font size that fits the lines, and the line breaks', () => {
    const { fontSize, lines } = fitTextOnNLines({ text: 'aaaa bbbb cccc', maxLines: 2, maxBoxWidth: 100, fontFamily: 'Inter' });
    // Two lines: "aaaa bbbb" (9 chars) and "cccc"; 9 * 0.5 * size <= 100 -> 22.22
    expect(lines).toEqual(['aaaa bbbb', 'cccc']);
    expect(fontSize).toBe(22.22);
  });

  it('respects maxFontSize and checks it', () => {
    expect(fitTextOnNLines({ text: 'a', maxLines: 1, maxBoxWidth: 1000, fontFamily: 'Inter', maxFontSize: 40 }).fontSize).toBe(40);
    expect(() => fitTextOnNLines({ text: 'a', maxLines: 1, maxBoxWidth: 100, fontFamily: 'Inter', maxFontSize: 0 })).toThrow(
      /"maxFontSize" must be a finite number of at least 0.1/,
    );
  });
});
