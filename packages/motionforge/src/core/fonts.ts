import { holdAllGates } from './render-gate';

/** Options of loadFont(), as in @remotion/fonts. */
export interface LoadFontOptions {
  /** The name to use in CSS `font-family`. */
  family: string;
  /** URL of the font file. */
  url: string;
  /** Format of the file; by default the browser detects it. */
  format?: 'woff2' | 'woff' | 'opentype' | 'truetype';
  ascentOverride?: string;
  descentOverride?: string;
  display?: 'auto' | 'block' | 'fallback' | 'optional' | 'swap';
  featureSettings?: string;
  lineGapOverride?: string;
  stretch?: string;
  style?: string;
  unicodeRange?: string;
  variant?: string;
  weight?: string;
}

const FORMATS = ['woff2', 'woff', 'opentype', 'truetype'];
const DESCRIPTORS = [
  'ascentOverride', 'descentOverride', 'display', 'featureSettings', 'lineGapOverride',
  'stretch', 'style', 'unicodeRange', 'variant', 'weight',
] as const;

// One load per set of options: calling loadFont() again (e.g. from a module
// that is imported twice) does not load the font again.
const loads = new Map<string, Promise<void>>();

// A rejected promise that does not report an unhandled rejection: loadFont()
// is usually called without awaiting it, and its failure reaches the host
// through the render gates.
const handled = (promise: Promise<void>): Promise<void> => {
  promise.catch(() => undefined);
  return promise;
};

/**
 * Loads a font file and adds it to `document.fonts` under `family`, like
 * @remotion/fonts' loadFont(). Until the font is loaded every render gate on
 * the page waits for it (fonts belong to the document, not to one
 * FrameProvider); if it fails, every gate fails with the error. Call it
 * anywhere, e.g. at the top of a module:
 *
 *   loadFont({ family: 'Bangers', url: '/fonts/bangers.woff2' });
 *
 * The whole file is loaded whatever its unicode-range, so every script it
 * covers is ready. Without a DOM (server rendering) the promise rejects.
 */
export const loadFont = (options: LoadFontOptions): Promise<void> => {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(`loadFont: expects an options object { family, url, ... }, got ${JSON.stringify(options)}`);
  }
  const { family, url, format } = options;
  if (typeof family !== 'string' || family.trim() === '') {
    throw new TypeError(`loadFont: family must be a non-empty string, got ${JSON.stringify(family)}`);
  }
  if (typeof url !== 'string' || url === '') {
    throw new TypeError(`loadFont: url must be a non-empty string, got ${JSON.stringify(url)}`);
  }
  if (format !== undefined && !FORMATS.includes(format)) {
    throw new TypeError(`loadFont: format must be one of ${FORMATS.join(', ')}, got ${JSON.stringify(format)}`);
  }
  for (const key of DESCRIPTORS) {
    if (options[key] !== undefined && typeof options[key] !== 'string') {
      throw new TypeError(`loadFont: ${key} must be a string (a CSS @font-face value), got ${JSON.stringify(options[key])}`);
    }
  }

  if (typeof document === 'undefined' || !document.fonts || typeof FontFace === 'undefined') {
    return handled(Promise.reject(new Error('loadFont needs a browser DOM with the CSS Font Loading API (document.fonts)')));
  }

  const key = JSON.stringify([family, url, format, ...DESCRIPTORS.map((d) => options[d])]);
  const existing = loads.get(key);
  if (existing) return existing;

  const descriptors: FontFaceDescriptors = {};
  for (const name of DESCRIPTORS) {
    if (options[name] !== undefined) (descriptors as Record<string, string>)[name] = options[name] as string;
  }
  const source = `url(${JSON.stringify(url)})${format ? ` format(${JSON.stringify(format)})` : ''}`;
  const hold = holdAllGates(`loadFont() ${family} from ${url}`);

  const load = Promise.resolve()
    .then(() => new FontFace(family, source, descriptors).load())
    .then(
      (face) => {
        document.fonts.add(face);
        hold.release();
      },
      (cause) => {
        const error = new Error(
          `loadFont: could not load ${family} from ${url}${cause instanceof Error && cause.message ? `: ${cause.message}` : ''}`,
        );
        hold.fail(error);
        throw error;
      },
    );
  loads.set(key, load);
  return handled(load);
};
