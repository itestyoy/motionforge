'use client';'use strict';

// src/utils/layout/measure-text.ts
var describe = (value) => JSON.stringify(value) ?? String(value);
var checkWord = (fn, word) => {
  if (typeof word !== "object" || word === null) {
    throw new TypeError(`${fn}: expected an object with text, fontFamily and fontSize, got ${describe(word)}`);
  }
  const { text, fontFamily, fontSize, fontWeight, additionalStyles } = word;
  if (typeof text !== "string") {
    throw new TypeError(`${fn}: "text" must be a string, got ${describe(text)}`);
  }
  if (typeof fontFamily !== "string" || fontFamily.trim() === "") {
    throw new TypeError(`${fn}: "fontFamily" must be a non-empty string, got ${describe(fontFamily)}`);
  }
  if (!(typeof fontSize === "number" && Number.isFinite(fontSize) && fontSize > 0) && !(typeof fontSize === "string" && fontSize.trim() !== "")) {
    throw new TypeError(`${fn}: "fontSize" must be a positive number (px) or a CSS size string, got ${describe(fontSize)}`);
  }
  if (fontWeight !== void 0 && typeof fontWeight !== "number" && typeof fontWeight !== "string") {
    throw new TypeError(`${fn}: "fontWeight" must be a number or a string, got ${describe(fontWeight)}`);
  }
  if (additionalStyles !== void 0 && (typeof additionalStyles !== "object" || additionalStyles === null)) {
    throw new TypeError(`${fn}: "additionalStyles" must be an object of CSS properties, got ${describe(additionalStyles)}`);
  }
};
var WORD_CACHE_MAX_ENTRIES = 1e3;
var wordCache = /* @__PURE__ */ new Map();
var fontSizeCss = (fontSize) => typeof fontSize === "string" ? fontSize : `${fontSize}px`;
var takeMeasurement = ({ text, fontFamily, fontSize, fontWeight, letterSpacing, fontVariantNumeric, additionalStyles, textTransform }) => {
  if (typeof document === "undefined") {
    throw new Error("measureText() needs a browser DOM (document is not defined); call it in the browser, not on the server");
  }
  const node = document.createElement("span");
  if (fontFamily) node.style.fontFamily = fontFamily;
  node.style.display = "inline-block";
  node.style.position = "absolute";
  node.style.top = "-10000px";
  node.style.whiteSpace = "pre";
  node.style.fontSize = fontSizeCss(fontSize);
  if (additionalStyles) {
    for (const key of Object.keys(additionalStyles)) {
      node.style[key] = additionalStyles[key];
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
var fontsReady = ({ text, fontFamily, fontSize, fontWeight }) => {
  const fonts = typeof document !== "undefined" ? document.fonts : void 0;
  if (!fonts || typeof fonts.check !== "function") return false;
  try {
    return fonts.check(`${fontWeight ?? "normal"} ${fontSizeCss(fontSize)} ${fontFamily}`, text || " ");
  } catch {
    return false;
  }
};
var measureText = (word) => {
  checkWord("measureText()", word);
  const {
    text,
    fontFamily,
    fontSize,
    fontWeight,
    letterSpacing,
    fontVariantNumeric,
    validateFontIsLoaded,
    additionalStyles,
    textTransform
  } = word;
  const key = JSON.stringify([
    text,
    fontFamily,
    fontSize,
    fontWeight ?? null,
    letterSpacing ?? null,
    fontVariantNumeric ?? null,
    textTransform ?? null,
    additionalStyles ?? null
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
    textTransform
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
      textTransform
    });
    const sameAsFallbackFont = boundingBox.height === fallbackBox.height && boundingBox.width === fallbackBox.width;
    if (sameAsFallbackFont && computedFallback !== computedFontFamily && new Set(text).size > 4) {
      throw new Error(
        [
          `measureText(): "fontFamily" ${JSON.stringify(fontFamily)} does not look loaded:`,
          `a measurement with the fallback font ${computedFallback} had the same dimensions.`,
          'Load the font before measuring, e.g. with usePreloadAssets([{ type: "font", family, weight }]).'
        ].join(" ")
      );
    }
  }
  const result = { width: boundingBox.width, height: boundingBox.height };
  if (fontsReady(word)) {
    if (wordCache.size >= WORD_CACHE_MAX_ENTRIES) {
      const oldest = wordCache.keys().next().value;
      if (oldest !== void 0) wordCache.delete(oldest);
    }
    wordCache.set(key, result);
  }
  return result;
};

// src/utils/layout/fit-text.ts
var SAMPLE_SIZE = 100;
var fitText = ({
  text,
  withinWidth,
  fontFamily,
  fontVariantNumeric,
  fontWeight,
  letterSpacing,
  validateFontIsLoaded,
  additionalStyles,
  textTransform
}) => {
  if (typeof withinWidth !== "number" || !Number.isFinite(withinWidth) || withinWidth <= 0) {
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
    additionalStyles
  });
  if (estimate.width === 0) {
    throw new Error(
      `fitText(): the width of the text ${JSON.stringify(text)} is 0, so no font size makes it ${withinWidth}px wide`
    );
  }
  return { fontSize: withinWidth / estimate.width * SAMPLE_SIZE };
};

// src/utils/layout/fill-text-box.ts
var checkBox = (fn, maxBoxWidth, maxLines) => {
  if (typeof maxBoxWidth !== "number" || !Number.isFinite(maxBoxWidth) || maxBoxWidth <= 0) {
    throw new TypeError(`${fn}: "maxBoxWidth" must be a positive number (px), got ${JSON.stringify(maxBoxWidth)}`);
  }
  if (typeof maxLines !== "number" || !Number.isInteger(maxLines) || maxLines < 1) {
    throw new TypeError(`${fn}: "maxLines" must be a positive integer, got ${JSON.stringify(maxLines)}`);
  }
};
var fillTextBox = ({ maxBoxWidth, maxLines }) => {
  checkBox("fillTextBox()", maxBoxWidth, maxLines);
  const lines = Array.from({ length: maxLines }, () => []);
  return {
    add: (word) => {
      checkWord("fillTextBox().add()", word);
      const { text } = word;
      const lastLineIndex = lines.reduceRight((acc, curr, index) => acc === -1 && curr.length > 0 ? index : acc, -1);
      const currentlyAt = lastLineIndex === -1 ? 0 : lastLineIndex;
      const lineToUse = lines[currentlyAt];
      const lineWidthWithWordAdded = [...lineToUse, word].map((w) => measureText(w).width).reduce((a, b) => a + b, 0);
      if (Math.ceil(lineWidthWithWordAdded) <= maxBoxWidth) {
        lines[currentlyAt].push({ ...word, text: lines[currentlyAt].length === 0 ? text.trimStart() : text });
        return { exceedsBox: false, newLine: false };
      }
      if (currentlyAt === maxLines - 1) {
        return { exceedsBox: true, newLine: false };
      }
      const wordForNewLine = { ...word, text: text.trimStart() };
      if (Math.ceil(measureText(wordForNewLine).width) > maxBoxWidth) {
        return { exceedsBox: true, newLine: false };
      }
      lines[currentlyAt + 1] = [wordForNewLine];
      return { exceedsBox: false, newLine: true };
    }
  };
};

// src/utils/layout/fit-text-on-n-lines.ts
var PRECISION = 100;
var MIN_FONT_SIZE = 0.1;
var fitTextOnNLines = ({
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
  maxFontSize
}) => {
  if (typeof text !== "string") {
    throw new TypeError(`fitTextOnNLines(): "text" must be a string, got ${JSON.stringify(text)}`);
  }
  checkBox("fitTextOnNLines()", maxBoxWidth, maxLines);
  if (maxFontSize !== void 0 && (!Number.isFinite(maxFontSize) || maxFontSize < MIN_FONT_SIZE)) {
    throw new Error(`fitTextOnNLines(): "maxFontSize" must be a finite number of at least ${MIN_FONT_SIZE}, got ${maxFontSize}`);
  }
  let left = Math.floor(MIN_FONT_SIZE * PRECISION);
  let right = Math.floor((maxFontSize ?? 2e3) * PRECISION);
  let optimalFontSize = MIN_FONT_SIZE;
  let optimalLines = [];
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    const fontSize = mid / PRECISION;
    const textBox = fillTextBox({ maxBoxWidth, maxLines });
    let exceedsBox = false;
    let currentLine = 0;
    const lines = [""];
    for (const word of text.split(" ")) {
      const result = textBox.add({
        text: lines[currentLine].length === 0 ? word : " " + word,
        fontFamily,
        fontWeight,
        fontSize,
        letterSpacing,
        fontVariantNumeric,
        validateFontIsLoaded,
        textTransform,
        additionalStyles
      });
      if (result.exceedsBox) {
        exceedsBox = true;
        break;
      }
      if (result.newLine) {
        lines.push("");
        currentLine++;
      }
      lines[currentLine] += word + " ";
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

exports.fillTextBox = fillTextBox;
exports.fitText = fitText;
exports.fitTextOnNLines = fitTextOnNLines;
exports.measureText = measureText;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map