/**
 * CSS color parsing for interpolateColors() and interpolateStyles(): a color
 * becomes [r, g, b, a] with sRGB channels in 0..255 and alpha in 0..1.
 */

export type RGBA = [number, number, number, number];

// CSS named colors (CSS Color 4), plus `transparent` and Remotion's
// `burntsienna` (from React Native's list).
const NAMED: Record<string, number> = {
  transparent: 0x00000000,
  aliceblue: 0xf0f8ffff, antiquewhite: 0xfaebd7ff, aqua: 0x00ffffff, aquamarine: 0x7fffd4ff,
  azure: 0xf0ffffff, beige: 0xf5f5dcff, bisque: 0xffe4c4ff, black: 0x000000ff,
  blanchedalmond: 0xffebcdff, blue: 0x0000ffff, blueviolet: 0x8a2be2ff, brown: 0xa52a2aff,
  burlywood: 0xdeb887ff, burntsienna: 0xea7e5dff, cadetblue: 0x5f9ea0ff, chartreuse: 0x7fff00ff,
  chocolate: 0xd2691eff, coral: 0xff7f50ff, cornflowerblue: 0x6495edff, cornsilk: 0xfff8dcff,
  crimson: 0xdc143cff, cyan: 0x00ffffff, darkblue: 0x00008bff, darkcyan: 0x008b8bff,
  darkgoldenrod: 0xb8860bff, darkgray: 0xa9a9a9ff, darkgreen: 0x006400ff, darkgrey: 0xa9a9a9ff,
  darkkhaki: 0xbdb76bff, darkmagenta: 0x8b008bff, darkolivegreen: 0x556b2fff, darkorange: 0xff8c00ff,
  darkorchid: 0x9932ccff, darkred: 0x8b0000ff, darksalmon: 0xe9967aff, darkseagreen: 0x8fbc8fff,
  darkslateblue: 0x483d8bff, darkslategray: 0x2f4f4fff, darkslategrey: 0x2f4f4fff, darkturquoise: 0x00ced1ff,
  darkviolet: 0x9400d3ff, deeppink: 0xff1493ff, deepskyblue: 0x00bfffff, dimgray: 0x696969ff,
  dimgrey: 0x696969ff, dodgerblue: 0x1e90ffff, firebrick: 0xb22222ff, floralwhite: 0xfffaf0ff,
  forestgreen: 0x228b22ff, fuchsia: 0xff00ffff, gainsboro: 0xdcdcdcff, ghostwhite: 0xf8f8ffff,
  gold: 0xffd700ff, goldenrod: 0xdaa520ff, gray: 0x808080ff, green: 0x008000ff,
  greenyellow: 0xadff2fff, grey: 0x808080ff, honeydew: 0xf0fff0ff, hotpink: 0xff69b4ff,
  indianred: 0xcd5c5cff, indigo: 0x4b0082ff, ivory: 0xfffff0ff, khaki: 0xf0e68cff,
  lavender: 0xe6e6faff, lavenderblush: 0xfff0f5ff, lawngreen: 0x7cfc00ff, lemonchiffon: 0xfffacdff,
  lightblue: 0xadd8e6ff, lightcoral: 0xf08080ff, lightcyan: 0xe0ffffff, lightgoldenrodyellow: 0xfafad2ff,
  lightgray: 0xd3d3d3ff, lightgreen: 0x90ee90ff, lightgrey: 0xd3d3d3ff, lightpink: 0xffb6c1ff,
  lightsalmon: 0xffa07aff, lightseagreen: 0x20b2aaff, lightskyblue: 0x87cefaff, lightslategray: 0x778899ff,
  lightslategrey: 0x778899ff, lightsteelblue: 0xb0c4deff, lightyellow: 0xffffe0ff, lime: 0x00ff00ff,
  limegreen: 0x32cd32ff, linen: 0xfaf0e6ff, magenta: 0xff00ffff, maroon: 0x800000ff,
  mediumaquamarine: 0x66cdaaff, mediumblue: 0x0000cdff, mediumorchid: 0xba55d3ff, mediumpurple: 0x9370dbff,
  mediumseagreen: 0x3cb371ff, mediumslateblue: 0x7b68eeff, mediumspringgreen: 0x00fa9aff, mediumturquoise: 0x48d1ccff,
  mediumvioletred: 0xc71585ff, midnightblue: 0x191970ff, mintcream: 0xf5fffaff, mistyrose: 0xffe4e1ff,
  moccasin: 0xffe4b5ff, navajowhite: 0xffdeadff, navy: 0x000080ff, oldlace: 0xfdf5e6ff,
  olive: 0x808000ff, olivedrab: 0x6b8e23ff, orange: 0xffa500ff, orangered: 0xff4500ff,
  orchid: 0xda70d6ff, palegoldenrod: 0xeee8aaff, palegreen: 0x98fb98ff, paleturquoise: 0xafeeeeff,
  palevioletred: 0xdb7093ff, papayawhip: 0xffefd5ff, peachpuff: 0xffdab9ff, peru: 0xcd853fff,
  pink: 0xffc0cbff, plum: 0xdda0ddff, powderblue: 0xb0e0e6ff, purple: 0x800080ff,
  rebeccapurple: 0x663399ff, red: 0xff0000ff, rosybrown: 0xbc8f8fff, royalblue: 0x4169e1ff,
  saddlebrown: 0x8b4513ff, salmon: 0xfa8072ff, sandybrown: 0xf4a460ff, seagreen: 0x2e8b57ff,
  seashell: 0xfff5eeff, sienna: 0xa0522dff, silver: 0xc0c0c0ff, skyblue: 0x87ceebff,
  slateblue: 0x6a5acdff, slategray: 0x708090ff, slategrey: 0x708090ff, snow: 0xfffafaff,
  springgreen: 0x00ff7fff, steelblue: 0x4682b4ff, tan: 0xd2b48cff, teal: 0x008080ff,
  thistle: 0xd8bfd8ff, tomato: 0xff6347ff, turquoise: 0x40e0d0ff, violet: 0xee82eeff,
  wheat: 0xf5deb3ff, white: 0xffffffff, whitesmoke: 0xf5f5f5ff, yellow: 0xffff00ff,
  yellowgreen: 0x9acd32ff,
};

/** Whether `name` is a CSS named color (case-insensitive), `transparent` included. */
export const isNamedColor = (name: string): boolean => Object.prototype.hasOwnProperty.call(NAMED, name.toLowerCase());

/** The CSS color functions parseColor() reads. */
export const COLOR_FUNCTIONS = ['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch'];

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const CALL = /^([a-z]+)\(\s*([^()]*?)\s*\)$/i;
const TOKEN = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/i;

interface Token {
  value: number;
  unit: '' | '%' | 'deg' | 'rad' | 'grad' | 'turn';
  none: boolean;
}

const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

// sRGB transfer function, extended to negative values by symmetry.
const encode = (c: number): number => {
  const sign = c < 0 ? -1 : 1;
  const abs = Math.abs(c);
  return sign * (abs <= 0.0031308 ? 12.92 * abs : 1.055 * abs ** (1 / 2.4) - 0.055);
};

const fromLinear = (r: number, g: number, b: number): [number, number, number] => [
  clamp(encode(r), 0, 1) * 255,
  clamp(encode(g), 0, 1) * 255,
  clamp(encode(b), 0, 1) * 255,
];

// OKLab -> linear sRGB (Björn Ottosson).
const oklabToRgb = (l: number, a: number, b: number) => {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return fromLinear(
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  );
};

// CIE Lab (D50, as CSS lab()) -> XYZ D50 -> Bradford to D65 -> linear sRGB (CSS Color 4).
const labToRgb = (L: number, a: number, b: number) => {
  const kappa = 24389 / 27;
  const epsilon = 216 / 24389;
  const f1 = (L + 16) / 116;
  const f0 = a / 500 + f1;
  const f2 = f1 - b / 200;
  const x = (f0 ** 3 > epsilon ? f0 ** 3 : (116 * f0 - 16) / kappa) * (0.3457 / 0.3585);
  const y = L > kappa * epsilon ? f1 ** 3 : L / kappa;
  const z = (f2 ** 3 > epsilon ? f2 ** 3 : (116 * f2 - 16) / kappa) * ((1 - 0.3457 - 0.3585) / 0.3585);
  const X = 0.955473421488075 * x - 0.02309845494876471 * y + 0.06325924320057072 * z;
  const Y = -0.0283697093338637 * x + 1.0099953980813041 * y + 0.021041441191917323 * z;
  const Z = 0.012314014864481998 * x - 0.020507649298898964 * y + 1.330365926242124 * z;
  return fromLinear(
    3.2409699419045226 * X - 1.537383177570094 * Y - 0.4986107602930034 * Z,
    -0.9692436362808796 * X + 1.8759675015077202 * Y + 0.04155505740717559 * Z,
    0.05563007969699366 * X - 0.20397695888897652 * Y + 1.0569715142428786 * Z,
  );
};

// HSL with s, l in 0..1 and h in degrees -> sRGB 0..255.
const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return [f(0), f(8), f(4)];
};

const hwbToRgb = (h: number, w: number, bl: number): [number, number, number] => {
  if (w + bl >= 1) {
    const gray = (w / (w + bl)) * 255;
    return [gray, gray, gray];
  }
  return hslToRgb(h, 1, 0.5).map((c) => c * (1 - w - bl) + w * 255) as [number, number, number];
};

/**
 * Parses a CSS color into [r, g, b, a] (channels 0..255, alpha 0..1). Throws
 * on anything it does not read, naming `fn` in the message.
 */
export const parseColor = (color: string, fn: string): RGBA => {
  const fail = (detail = ''): never => {
    throw new Error(
      `${fn}: unsupported color ${JSON.stringify(color)}${detail} (use #rgb, #rgba, #rrggbb, #rrggbbaa, a CSS color name, ` +
        'rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), oklab() or oklch())',
    );
  };
  if (typeof color !== 'string') return fail();
  const value = color.trim();

  const hex = value.match(HEX)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? hex.split('').map((d) => d + d) : hex.match(/../g)!;
    const [r, g, b] = digits.map((d) => parseInt(d, 16));
    return [r, g, b, digits.length === 4 ? parseInt(digits[3], 16) / 255 : 1];
  }

  const named = NAMED[value.toLowerCase()];
  if (named !== undefined) {
    return [named >>> 24, (named >>> 16) & 255, (named >>> 8) & 255, (named & 255) / 255];
  }

  const call = value.match(CALL);
  if (!call) return fail();
  const name = call[1].toLowerCase();
  const body = call[2];

  // Comma syntax (legacy, rgb and hsl only): 3 or 4 arguments. Space syntax:
  // 3 arguments, then `/ alpha`.
  let parts: string[];
  let alphaPart: string | undefined;
  if (body.includes(',')) {
    if (!['rgb', 'rgba', 'hsl', 'hsla'].includes(name)) return fail(`: ${name}() takes space-separated values`);
    parts = body.split(',').map((p) => p.trim());
    if (parts.length === 4) alphaPart = parts.pop();
  } else {
    const [main, alpha, ...rest] = body.split('/');
    if (rest.length > 0) return fail();
    parts = main.trim().split(/\s+/);
    alphaPart = alpha?.trim();
    if (alpha !== undefined && alphaPart === '') return fail();
  }
  if (parts.length !== 3) return fail(`: ${name}() needs 3 values and an optional alpha`);

  const parse = (text: string): Token => {
    if (text.toLowerCase() === 'none') return { value: 0, unit: '', none: true };
    const match = text.match(TOKEN);
    if (!match) return fail();
    return { value: parseFloat(match[1]), unit: (match[2] ?? '').toLowerCase() as Token['unit'], none: false };
  };
  const [t0, t1, t2] = parts.map(parse);
  const alphaToken = alphaPart === undefined ? undefined : parse(alphaPart);

  // A number or a percentage of `full`; no other unit.
  const amount = (t: Token, full: number) => {
    if (t.unit === '%') return (t.value / 100) * full;
    if (t.unit !== '') fail();
    return t.value;
  };
  // An angle in degrees: a number, or deg / rad / grad / turn.
  const hue = (t: Token) => {
    const degrees =
      t.unit === 'rad' ? (t.value * 180) / Math.PI
      : t.unit === 'grad' ? t.value * 0.9
      : t.unit === 'turn' ? t.value * 360
      : t.unit === '' || t.unit === 'deg' ? t.value
      : fail();
    return ((degrees % 360) + 360) % 360;
  };
  const alpha = alphaToken === undefined ? 1 : clamp(amount(alphaToken, 1), 0, 1);

  let rgb: [number, number, number];
  switch (name) {
    case 'rgb':
    case 'rgba':
      rgb = [t0, t1, t2].map((t) => clamp(amount(t, 255), 0, 255)) as [number, number, number];
      break;
    case 'hsl':
    case 'hsla':
      rgb = hslToRgb(hue(t0), clamp(amount(t1, 100), 0, 100) / 100, clamp(amount(t2, 100), 0, 100) / 100);
      break;
    case 'hwb':
      rgb = hwbToRgb(hue(t0), clamp(amount(t1, 100), 0, 100) / 100, clamp(amount(t2, 100), 0, 100) / 100);
      break;
    case 'lab':
      rgb = labToRgb(clamp(amount(t0, 100), 0, 100), amount(t1, 125), amount(t2, 125));
      break;
    case 'lch': {
      const h = (hue(t2) * Math.PI) / 180;
      const c = Math.max(0, amount(t1, 150));
      rgb = labToRgb(clamp(amount(t0, 100), 0, 100), c * Math.cos(h), c * Math.sin(h));
      break;
    }
    case 'oklab':
      rgb = oklabToRgb(clamp(amount(t0, 1), 0, 1), amount(t1, 0.4), amount(t2, 0.4));
      break;
    case 'oklch': {
      const h = (hue(t2) * Math.PI) / 180;
      const c = Math.max(0, amount(t1, 0.4));
      rgb = oklabToRgb(clamp(amount(t0, 1), 0, 1), c * Math.cos(h), c * Math.sin(h));
      break;
    }
    default:
      return fail();
  }
  return [rgb[0], rgb[1], rgb[2], alpha];
};
