/**
 * Text measurement, as in `@remotion/layout-utils`. It measures with the
 * browser's own layout (an off-screen `<span>`), so it needs a DOM and the
 * fonts must be loaded first: a measurement taken with the fallback font is
 * wrong, and the layout built on it changes once the font arrives.
 */

export type Dimensions = {
  width: number;
  height: number;
};

export type TextTransform =
  | '-moz-initial'
  | 'inherit'
  | 'initial'
  | 'revert'
  | 'revert-layer'
  | 'unset'
  | 'none'
  | 'capitalize'
  | 'full-size-kana'
  | 'full-width'
  | 'lowercase'
  | 'uppercase';

type CSSPropertiesOnWord = {
  /** CSS font-family, e.g. `'Inter'` or `'"Inter", sans-serif'`. */
  fontFamily: string;
  /** px as a number, or any CSS font-size string. */
  fontSize: number | string;
  fontWeight?: number | string;
  letterSpacing?: string;
  fontVariantNumeric?: string;
  textTransform?: TextTransform;
};

/** Further CSS properties (string or number valued) for the measured text. */
export type ModifyableCSSProperties<T = Partial<CSSStyleDeclaration>> = {
  [P in keyof T as P extends 'length'
    ? never
    : P extends keyof CSSPropertiesOnWord
      ? never
      : T[P] extends string | number
        ? P
        : never]: T[P];
};

export type Word = {
  text: string;
  /**
   * Takes a second measurement with the browser's fallback font and throws
   * when both are the same, i.e. the font was not loaded (default false).
   */
  validateFontIsLoaded?: boolean;
  additionalStyles?: ModifyableCSSProperties;
} & CSSPropertiesOnWord;

const describe = (value: unknown) => JSON.stringify(value) ?? String(value);

export const checkWord = (fn: string, word: Word) => {
  if (typeof word !== 'object' || word === null) {
    throw new TypeError(`${fn}: expected an object with text, fontFamily and fontSize, got ${describe(word)}`);
  }
  const { text, fontFamily, fontSize, fontWeight, additionalStyles } = word;
  if (typeof text !== 'string') {
    throw new TypeError(`${fn}: "text" must be a string, got ${describe(text)}`);
  }
  if (typeof fontFamily !== 'string' || fontFamily.trim() === '') {
    throw new TypeError(`${fn}: "fontFamily" must be a non-empty string, got ${describe(fontFamily)}`);
  }
  if (
    !(typeof fontSize === 'number' && Number.isFinite(fontSize) && fontSize > 0) &&
    !(typeof fontSize === 'string' && fontSize.trim() !== '')
  ) {
    throw new TypeError(`${fn}: "fontSize" must be a positive number (px) or a CSS size string, got ${describe(fontSize)}`);
  }
  if (fontWeight !== undefined && typeof fontWeight !== 'number' && typeof fontWeight !== 'string') {
    throw new TypeError(`${fn}: "fontWeight" must be a number or a string, got ${describe(fontWeight)}`);
  }
  if (additionalStyles !== undefined && (typeof additionalStyles !== 'object' || additionalStyles === null)) {
    throw new TypeError(`${fn}: "additionalStyles" must be an object of CSS properties, got ${describe(additionalStyles)}`);
  }
};

// Bounded: a long-lived page (an editor, a preview) measures many words.
const WORD_CACHE_MAX_ENTRIES = 1000;
const wordCache = new Map<string, Dimensions>();

const fontSizeCss = (fontSize: number | string) => (typeof fontSize === 'string' ? fontSize : `${fontSize}px`);

const takeMeasurement = (
  { text, fontFamily, fontSize, fontWeight, letterSpacing, fontVariantNumeric, additionalStyles, textTransform }: Omit<Word, 'fontFamily'> & {
    fontFamily: string | null;
  },
): { boundingBox: DOMRect; computedFontFamily: string } => {
  if (typeof document === 'undefined') {
    throw new Error('measureText() needs a browser DOM (document is not defined); call it in the browser, not on the server');
  }
  const node = document.createElement('span');
  if (fontFamily) node.style.fontFamily = fontFamily;
  node.style.display = 'inline-block';
  node.style.position = 'absolute';
  node.style.top = '-10000px';
  node.style.whiteSpace = 'pre';
  node.style.fontSize = fontSizeCss(fontSize);
  if (additionalStyles) {
    for (const key of Object.keys(additionalStyles) as (keyof typeof additionalStyles)[]) {
      (node.style as unknown as Record<string, unknown>)[key] = additionalStyles[key];
    }
  }
  if (fontWeight) node.style.fontWeight = fontWeight.toString();
  if (letterSpacing) node.style.letterSpacing = letterSpacing;
  if (fontVariantNumeric) node.style.fontVariantNumeric = fontVariantNumeric;
  if (textTransform) node.style.textTransform = textTransform;
  node.textContent = text;

  document.body.appendChild(node);
  const computedFontFamily = window.getComputedStyle(node).fontFamily;
  const boundingBox = node.getBoundingClientRect();
  document.body.removeChild(node);
  return { boundingBox, computedFontFamily };
};

// A result is cached only when every face the text needs is loaded: a
// measurement taken while a font is still loading would otherwise be served
// after it has loaded.
const fontsReady = ({ text, fontFamily, fontSize, fontWeight }: Word): boolean => {
  const fonts = typeof document !== 'undefined' ? document.fonts : undefined;
  if (!fonts || typeof fonts.check !== 'function') return false;
  try {
    return fonts.check(`${fontWeight ?? 'normal'} ${fontSizeCss(fontSize)} ${fontFamily}`, text || ' ');
  } catch {
    return false;
  }
};

/**
 * Width and height in px of `text` rendered on one line with the given font
 * (the browser's layout of an off-screen `<span>` with `white-space: pre`).
 * Browser only. Load the font first, e.g. with `usePreloadAssets()`.
 */
export const measureText = (word: Word): Dimensions => {
  checkWord('measureText()', word);
  const {
    text,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    fontVariantNumeric,
    validateFontIsLoaded,
    additionalStyles,
    textTransform,
  } = word;
  const key = JSON.stringify([
    text,
    fontFamily,
    fontSize,
    fontWeight ?? null,
    letterSpacing ?? null,
    fontVariantNumeric ?? null,
    textTransform ?? null,
    additionalStyles ?? null,
  ]);
  const cached = wordCache.get(key);
  if (cached) return cached;

  const { boundingBox, computedFontFamily } = takeMeasurement({
    fontFamily,
    fontSize,
    text,
    fontVariantNumeric,
    fontWeight,
    letterSpacing,
    additionalStyles,
    textTransform,
  });

  if (validateFontIsLoaded && text.trim().length > 0) {
    const { boundingBox: fallbackBox, computedFontFamily: computedFallback } = takeMeasurement({
      fontFamily: null,
      fontSize,
      text,
      fontVariantNumeric,
      fontWeight,
      letterSpacing,
      additionalStyles,
      textTransform,
    });
    const sameAsFallbackFont = boundingBox.height === fallbackBox.height && boundingBox.width === fallbackBox.width;
    // With only a few distinct characters a real font may match the fallback by chance.
    if (sameAsFallbackFont && computedFallback !== computedFontFamily && new Set(text).size > 4) {
      throw new Error(
        [
          `measureText(): "fontFamily" ${JSON.stringify(fontFamily)} does not look loaded:`,
          `a measurement with the fallback font ${computedFallback} had the same dimensions.`,
          'Load the font before measuring, e.g. with usePreloadAssets([{ type: "font", family, weight }]).',
        ].join(' '),
      );
    }
  }

  const result: Dimensions = { width: boundingBox.width, height: boundingBox.height };
  if (fontsReady(word)) {
    if (wordCache.size >= WORD_CACHE_MAX_ENTRIES) {
      const oldest = wordCache.keys().next().value;
      if (oldest !== undefined) wordCache.delete(oldest);
    }
    wordCache.set(key, result);
  }
  return result;
};
