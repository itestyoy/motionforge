/**
 * Text measurement, as in `@remotion/layout-utils`. It measures with the
 * browser's own layout (an off-screen `<span>`), so it needs a DOM and the
 * fonts must be loaded first: a measurement taken with the fallback font is
 * wrong, and the layout built on it changes once the font arrives.
 */
type Dimensions = {
    width: number;
    height: number;
};
type TextTransform = '-moz-initial' | 'inherit' | 'initial' | 'revert' | 'revert-layer' | 'unset' | 'none' | 'capitalize' | 'full-size-kana' | 'full-width' | 'lowercase' | 'uppercase';
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
type ModifyableCSSProperties<T = Partial<CSSStyleDeclaration>> = {
    [P in keyof T as P extends 'length' ? never : P extends keyof CSSPropertiesOnWord ? never : T[P] extends string | number ? P : never]: T[P];
};
type Word = {
    text: string;
    /**
     * Takes a second measurement with the browser's fallback font and throws
     * when both are the same, i.e. the font was not loaded (default false).
     */
    validateFontIsLoaded?: boolean;
    additionalStyles?: ModifyableCSSProperties;
} & CSSPropertiesOnWord;
/**
 * Width and height in px of `text` rendered on one line with the given font
 * (the browser's layout of an off-screen `<span>` with `white-space: pre`).
 * Browser only. Load the font first, e.g. with `usePreloadAssets()`.
 */
declare const measureText: (word: Word) => Dimensions;

/**
 * The font size (px) at which `text` on one line is exactly `withinWidth` px
 * wide: measured at 100px and scaled. Browser only; load the font first.
 */
declare const fitText: ({ text, withinWidth, fontFamily, fontVariantNumeric, fontWeight, letterSpacing, validateFontIsLoaded, additionalStyles, textTransform, }: {
    text: string;
    withinWidth: number;
    fontFamily: string;
    fontWeight?: number | string;
    letterSpacing?: string;
    fontVariantNumeric?: string;
    validateFontIsLoaded?: boolean;
    textTransform?: TextTransform;
    additionalStyles?: ModifyableCSSProperties;
}) => {
    fontSize: number;
};

/**
 * The largest font size (px, in steps of 0.01, up to `maxFontSize`, default
 * 2000) at which `text` fits in `maxLines` lines of `maxBoxWidth` px, and the
 * lines it breaks into (words split on spaces, Remotion's binary search).
 * Browser only; load the font first.
 */
declare const fitTextOnNLines: ({ text, maxLines, maxBoxWidth, fontFamily, fontWeight, letterSpacing, fontVariantNumeric, validateFontIsLoaded, textTransform, additionalStyles, maxFontSize, }: {
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
}) => {
    fontSize: number;
    lines: string[];
};

/**
 * A box `maxBoxWidth` px wide with room for `maxLines` lines, filled word by
 * word: `add(word)` puts the word on the current line, or on a new line when
 * it does not fit, and returns `{ exceedsBox, newLine }`. A word that does not
 * fit is not added (`exceedsBox: true`). Widths are the sum of the words'
 * measureText() widths (Remotion's algorithm).
 */
declare const fillTextBox: ({ maxBoxWidth, maxLines }: {
    maxBoxWidth: number;
    maxLines: number;
}) => {
    add: (word: Word) => {
        exceedsBox: boolean;
        newLine: boolean;
    };
};

export { type Dimensions, type ModifyableCSSProperties, type TextTransform, type Word, fillTextBox, fitText, fitTextOnNLines, measureText };
