'use client';'use strict';

// src/utils/colors.ts
var NAMED = {
  transparent: 0,
  aliceblue: 4042850303,
  antiquewhite: 4209760255,
  aqua: 16777215,
  aquamarine: 2147472639,
  azure: 4043309055,
  beige: 4126530815,
  bisque: 4293182719,
  black: 255,
  blanchedalmond: 4293643775,
  blue: 65535,
  blueviolet: 2318131967,
  brown: 2771004159,
  burlywood: 3736635391,
  burntsienna: 3934150143,
  cadetblue: 1604231423,
  chartreuse: 2147418367,
  chocolate: 3530104575,
  coral: 4286533887,
  cornflowerblue: 1687547391,
  cornsilk: 4294499583,
  crimson: 3692313855,
  cyan: 16777215,
  darkblue: 35839,
  darkcyan: 9145343,
  darkgoldenrod: 3095792639,
  darkgray: 2846468607,
  darkgreen: 6553855,
  darkgrey: 2846468607,
  darkkhaki: 3182914559,
  darkmagenta: 2332068863,
  darkolivegreen: 1433087999,
  darkorange: 4287365375,
  darkorchid: 2570243327,
  darkred: 2332033279,
  darksalmon: 3918953215,
  darkseagreen: 2411499519,
  darkslateblue: 1211993087,
  darkslategray: 793726975,
  darkslategrey: 793726975,
  darkturquoise: 13554175,
  darkviolet: 2483082239,
  deeppink: 4279538687,
  deepskyblue: 12582911,
  dimgray: 1768516095,
  dimgrey: 1768516095,
  dodgerblue: 512819199,
  firebrick: 2988581631,
  floralwhite: 4294635775,
  forestgreen: 579543807,
  fuchsia: 4278255615,
  gainsboro: 3705462015,
  ghostwhite: 4177068031,
  gold: 4292280575,
  goldenrod: 3668254975,
  gray: 2155905279,
  green: 8388863,
  greenyellow: 2919182335,
  grey: 2155905279,
  honeydew: 4043305215,
  hotpink: 4285117695,
  indianred: 3445382399,
  indigo: 1258324735,
  ivory: 4294963455,
  khaki: 4041641215,
  lavender: 3873897215,
  lavenderblush: 4293981695,
  lawngreen: 2096890111,
  lemonchiffon: 4294626815,
  lightblue: 2916673279,
  lightcoral: 4034953471,
  lightcyan: 3774873599,
  lightgoldenrodyellow: 4210742015,
  lightgray: 3553874943,
  lightgreen: 2431553791,
  lightgrey: 3553874943,
  lightpink: 4290167295,
  lightsalmon: 4288707327,
  lightseagreen: 548580095,
  lightskyblue: 2278488831,
  lightslategray: 2005441023,
  lightslategrey: 2005441023,
  lightsteelblue: 2965692159,
  lightyellow: 4294959359,
  lime: 16711935,
  limegreen: 852308735,
  linen: 4210091775,
  magenta: 4278255615,
  maroon: 2147483903,
  mediumaquamarine: 1724754687,
  mediumblue: 52735,
  mediumorchid: 3126187007,
  mediumpurple: 2473647103,
  mediumseagreen: 1018393087,
  mediumslateblue: 2070474495,
  mediumspringgreen: 16423679,
  mediumturquoise: 1221709055,
  mediumvioletred: 3340076543,
  midnightblue: 421097727,
  mintcream: 4127193855,
  mistyrose: 4293190143,
  moccasin: 4293178879,
  navajowhite: 4292783615,
  navy: 33023,
  oldlace: 4260751103,
  olive: 2155872511,
  olivedrab: 1804477439,
  orange: 4289003775,
  orangered: 4282712319,
  orchid: 3664828159,
  palegoldenrod: 4008225535,
  palegreen: 2566625535,
  paleturquoise: 2951671551,
  palevioletred: 3681588223,
  papayawhip: 4293907967,
  peachpuff: 4292524543,
  peru: 3448061951,
  pink: 4290825215,
  plum: 3718307327,
  powderblue: 2967529215,
  purple: 2147516671,
  rebeccapurple: 1714657791,
  red: 4278190335,
  rosybrown: 3163525119,
  royalblue: 1097458175,
  saddlebrown: 2336560127,
  salmon: 4202722047,
  sandybrown: 4104413439,
  seagreen: 780883967,
  seashell: 4294307583,
  sienna: 2689740287,
  silver: 3233857791,
  skyblue: 2278484991,
  slateblue: 1784335871,
  slategray: 1887473919,
  slategrey: 1887473919,
  snow: 4294638335,
  springgreen: 16744447,
  steelblue: 1182971135,
  tan: 3535047935,
  teal: 8421631,
  thistle: 3636451583,
  tomato: 4284696575,
  turquoise: 1088475391,
  violet: 4001558271,
  wheat: 4125012991,
  white: 4294967295,
  whitesmoke: 4126537215,
  yellow: 4294902015,
  yellowgreen: 2597139199
};
var isNamedColor = (name) => Object.prototype.hasOwnProperty.call(NAMED, name.toLowerCase());
var COLOR_FUNCTIONS = ["rgb", "rgba", "hsl", "hsla", "hwb", "lab", "lch", "oklab", "oklch"];
var HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
var CALL = /^([a-z]+)\(\s*([^()]*?)\s*\)$/i;
var TOKEN = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%|deg|rad|grad|turn)?$/i;
var clamp = (x, min, max) => Math.min(max, Math.max(min, x));
var encode = (c) => {
  const sign = c < 0 ? -1 : 1;
  const abs = Math.abs(c);
  return sign * (abs <= 31308e-7 ? 12.92 * abs : 1.055 * abs ** (1 / 2.4) - 0.055);
};
var fromLinear = (r, g, b) => [
  clamp(encode(r), 0, 1) * 255,
  clamp(encode(g), 0, 1) * 255,
  clamp(encode(b), 0, 1) * 255
];
var oklabToRgb = (l, a, b) => {
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return fromLinear(
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_
  );
};
var labToRgb = (L, a, b) => {
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
    0.05563007969699366 * X - 0.20397695888897652 * Y + 1.0569715142428786 * Z
  );
};
var hslToRgb = (h, s, l) => {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255;
  };
  return [f(0), f(8), f(4)];
};
var hwbToRgb = (h, w, bl) => {
  if (w + bl >= 1) {
    const gray = w / (w + bl) * 255;
    return [gray, gray, gray];
  }
  return hslToRgb(h, 1, 0.5).map((c) => c * (1 - w - bl) + w * 255);
};
var parseColor = (color, fn) => {
  const fail = (detail = "") => {
    throw new Error(
      `${fn}: unsupported color ${JSON.stringify(color)}${detail} (use #rgb, #rgba, #rrggbb, #rrggbbaa, a CSS color name, rgb(), rgba(), hsl(), hsla(), hwb(), lab(), lch(), oklab() or oklch())`
    );
  };
  if (typeof color !== "string") return fail();
  const value = color.trim();
  const hex = value.match(HEX)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? hex.split("").map((d) => d + d) : hex.match(/../g);
    const [r, g, b] = digits.map((d) => parseInt(d, 16));
    return [r, g, b, digits.length === 4 ? parseInt(digits[3], 16) / 255 : 1];
  }
  const named = NAMED[value.toLowerCase()];
  if (named !== void 0) {
    return [named >>> 24, named >>> 16 & 255, named >>> 8 & 255, (named & 255) / 255];
  }
  const call = value.match(CALL);
  if (!call) return fail();
  const name = call[1].toLowerCase();
  const body = call[2];
  let parts;
  let alphaPart;
  if (body.includes(",")) {
    if (!["rgb", "rgba", "hsl", "hsla"].includes(name)) return fail(`: ${name}() takes space-separated values`);
    parts = body.split(",").map((p) => p.trim());
    if (parts.length === 4) alphaPart = parts.pop();
  } else {
    const [main, alpha2, ...rest] = body.split("/");
    if (rest.length > 0) return fail();
    parts = main.trim().split(/\s+/);
    alphaPart = alpha2?.trim();
    if (alpha2 !== void 0 && alphaPart === "") return fail();
  }
  if (parts.length !== 3) return fail(`: ${name}() needs 3 values and an optional alpha`);
  const parse = (text) => {
    if (text.toLowerCase() === "none") return { value: 0, unit: "", none: true };
    const match = text.match(TOKEN);
    if (!match) return fail();
    return { value: parseFloat(match[1]), unit: (match[2] ?? "").toLowerCase(), none: false };
  };
  const [t0, t1, t2] = parts.map(parse);
  const alphaToken = alphaPart === void 0 ? void 0 : parse(alphaPart);
  const amount = (t, full) => {
    if (t.unit === "%") return t.value / 100 * full;
    if (t.unit !== "") fail();
    return t.value;
  };
  const hue = (t) => {
    const degrees = t.unit === "rad" ? t.value * 180 / Math.PI : t.unit === "grad" ? t.value * 0.9 : t.unit === "turn" ? t.value * 360 : t.unit === "" || t.unit === "deg" ? t.value : fail();
    return (degrees % 360 + 360) % 360;
  };
  const alpha = alphaToken === void 0 ? 1 : clamp(amount(alphaToken, 1), 0, 1);
  let rgb;
  switch (name) {
    case "rgb":
    case "rgba":
      rgb = [t0, t1, t2].map((t) => clamp(amount(t, 255), 0, 255));
      break;
    case "hsl":
    case "hsla":
      rgb = hslToRgb(hue(t0), clamp(amount(t1, 100), 0, 100) / 100, clamp(amount(t2, 100), 0, 100) / 100);
      break;
    case "hwb":
      rgb = hwbToRgb(hue(t0), clamp(amount(t1, 100), 0, 100) / 100, clamp(amount(t2, 100), 0, 100) / 100);
      break;
    case "lab":
      rgb = labToRgb(clamp(amount(t0, 100), 0, 100), amount(t1, 125), amount(t2, 125));
      break;
    case "lch": {
      const h = hue(t2) * Math.PI / 180;
      const c = Math.max(0, amount(t1, 150));
      rgb = labToRgb(clamp(amount(t0, 100), 0, 100), c * Math.cos(h), c * Math.sin(h));
      break;
    }
    case "oklab":
      rgb = oklabToRgb(clamp(amount(t0, 1), 0, 1), amount(t1, 0.4), amount(t2, 0.4));
      break;
    case "oklch": {
      const h = hue(t2) * Math.PI / 180;
      const c = Math.max(0, amount(t1, 0.4));
      rgb = oklabToRgb(clamp(amount(t0, 1), 0, 1), c * Math.cos(h), c * Math.sin(h));
      break;
    }
    default:
      return fail();
  }
  return [rgb[0], rgb[1], rgb[2], alpha];
};

// src/utils/animation.ts
var pinned = (fn) => (t) => t === 0 ? 0 : t === 1 ? 1 : fn(t);
var clampUnit = (t) => Math.min(1, Math.max(0, t));
var easeOutBounce = (t) => {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75;
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375;
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375;
  }
};
var cubicBezier = (x1, y1, x2, y2) => {
  if (![x1, y1, x2, y2].every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
    throw new Error(
      `Easing.bezier: control points must be finite and x1, x2 must be in [0, 1], got (${x1}, ${y1}, ${x2}, ${y2})`
    );
  }
  if (x1 === y1 && x2 === y2) return (t) => t;
  const coefficients = (p1, p2) => [1 - 3 * p2 + 3 * p1, 3 * p2 - 6 * p1, 3 * p1];
  const [ax, bx, cx] = coefficients(x1, x2);
  const [ay, by, cy] = coefficients(y1, y2);
  const curveX = (t) => ((ax * t + bx) * t + cx) * t;
  const curveY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  const samples = 11;
  const step = 1 / (samples - 1);
  const table = Array.from({ length: samples }, (_, i) => curveX(i * step));
  const solveT = (x) => {
    let i = 0;
    while (i < samples - 2 && table[i + 1] <= x) i++;
    const lo = i * step;
    const hi = lo + step;
    const span = table[i + 1] - table[i];
    let t = span > 0 ? lo + (x - table[i]) / span * step : lo;
    for (let k = 0; k < 8; k++) {
      const error = curveX(t) - x;
      if (Math.abs(error) < 1e-12) return t;
      const slope = slopeX(t);
      if (Math.abs(slope) < 1e-9) break;
      t -= error / slope;
    }
    if (x < 0 || x > 1) return t;
    if (t >= lo && t <= hi && Math.abs(curveX(t) - x) < 1e-12) return t;
    let a = lo;
    let b = hi;
    for (let k = 0; k < 60; k++) {
      t = (a + b) / 2;
      if (curveX(t) < x) a = t;
      else b = t;
      if (b - a < 1e-12) break;
    }
    return (a + b) / 2;
  };
  return (x) => x === 0 ? 0 : x === 1 ? 1 : curveY(solveT(x));
};
var pinAll = (fns) => Object.fromEntries(Object.entries(fns).map(([name, fn]) => [name, pinned(fn)]));
var namedEasings = pinAll({
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
  easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - --t * t),
  easeInOutCirc: (t) => t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: (t) => {
    const c4 = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t) => {
    const c4 = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t) => {
    const c5 = 2 * Math.PI / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
    return Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5) / 2 + 1;
  },
  easeInBounce: (t) => 1 - easeOutBounce(1 - t),
  easeOutBounce,
  easeInOutBounce: (t) => t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2
});
var checkEasing = (name, easing) => {
  if (typeof easing !== "function") {
    throw new Error(`Easing.${name}: expects an easing function, got ${easing}`);
  }
  return easing;
};
var checkNumber = (name, value, min = -Infinity) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    throw new Error(`Easing.${name}: expects a finite number${min > -Infinity ? ` >= ${min}` : ""}, got ${value}`);
  }
  return value;
};
var easeCurve = cubicBezier(0.42, 0, 1, 1);
var extendsRight = /* @__PURE__ */ new WeakSet();
var SPRING_EASING_FPS = 30;
var Easing = {
  ...namedEasings,
  /** 1 for any t > 0, else 0. */
  step0: (t) => t > 0 ? 1 : 0,
  /** 1 for any t >= 1, else 0. */
  step1: (t) => t >= 1 ? 1 : 0,
  linear: (t) => t,
  /** Remotion's `ease`: bezier(0.42, 0, 1, 1). */
  ease: easeCurve,
  quad: pinned((t) => t * t),
  cubic: pinned((t) => t * t * t),
  /** t to the power n (n > 0). */
  poly: (n) => {
    const power = checkNumber("poly", n);
    if (power <= 0) throw new Error(`Easing.poly: expects n > 0, got ${n}`);
    return pinned((t) => t ** power);
  },
  sin: pinned((t) => 1 - Math.cos(t * Math.PI / 2)),
  circle: pinned((t) => {
    const u = clampUnit(t);
    return 1 - Math.sqrt(1 - u * u);
  }),
  exp: pinned((t) => 2 ** (10 * (t - 1))),
  /** Springy overshoot; `bounciness` (default 1) sets how many times it goes back and forth. */
  elastic: (bounciness = 1) => {
    const p = checkNumber("elastic", bounciness, 0) * Math.PI;
    return pinned((t) => 1 - Math.cos(t * Math.PI / 2) ** 3 * Math.cos(t * p));
  },
  /** Pulls back before moving; `s` (default 1.70158) sets how far. */
  back: (s = 1.70158) => {
    const overshoot = checkNumber("back", s);
    return pinned((t) => t * t * ((overshoot + 1) * t - overshoot));
  },
  bounce: pinned((t) => easeOutBounce(clampUnit(t))),
  bezier: cubicBezier,
  /**
   * A spring as an easing (Remotion's Easing.spring, same values): the
   * spring() motion from 0 to 1 with this config, on a 30 fps clock. See
   * EasingSpringConfig for `allowTail`.
   */
  spring: (config = {}) => {
    if (typeof config !== "object" || config === null) {
      throw new Error(`Easing.spring: expects a config object, got ${JSON.stringify(config)}`);
    }
    const { allowTail = false, durationRestThreshold, ...springConfig } = config;
    if (typeof allowTail !== "boolean") {
      throw new Error(`Easing.spring: allowTail must be a boolean, got ${JSON.stringify(allowTail)}`);
    }
    resolveSpringConfig("Easing.spring", springConfig);
    const settle = measureSpring({ fps: SPRING_EASING_FPS, config: springConfig, threshold: durationRestThreshold });
    if (settle === Infinity) {
      throw new Error("Easing.spring: durationRestThreshold must be > 0 (with 0 the spring never settles)");
    }
    if (allowTail) {
      const easing = (t) => t <= 0 ? 0 : spring({ fps: SPRING_EASING_FPS, frame: t * settle, config: springConfig });
      extendsRight.add(easing);
      return easing;
    }
    return (t) => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return spring({
        fps: SPRING_EASING_FPS,
        frame: t * SPRING_EASING_FPS,
        config: springConfig,
        durationInFrames: SPRING_EASING_FPS,
        durationRestThreshold
      });
    };
  },
  /** Runs the easing forwards (returns it as is). */
  in: (easing) => {
    const fn = checkEasing("in", easing);
    return extendsRight.has(fn) ? fn : pinned(fn);
  },
  /** Runs the easing backwards: out(f)(t) = 1 - f(1 - t). */
  out: (easing) => {
    const fn = checkEasing("out", easing);
    return pinned((t) => 1 - fn(1 - t));
  },
  /** Symmetric: the easing for the first half, mirrored for the second. */
  inOut: (easing) => {
    const fn = checkEasing("inOut", easing);
    return pinned((t) => t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2);
  }
};
var isPositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var resolveSpringConfig = (fn, config = {}) => {
  const { damping = 10, mass = 1, stiffness = 100, overshootClamping = false } = config;
  if (typeof damping === "number" && damping <= 0) {
    throw new Error(`${fn}: damping must be > 0 (a spring without damping never comes to rest), got ${damping}`);
  }
  if (!isPositive(mass) || !isPositive(stiffness) || !isPositive(damping)) {
    throw new Error(
      `${fn}: config needs mass > 0, stiffness > 0 and damping > 0, got mass ${mass}, stiffness ${stiffness}, damping ${damping}`
    );
  }
  return { damping, mass, stiffness, overshootClamping };
};
var advanceSpring = (node, now, { damping, mass, stiffness }) => {
  const toValue = 1;
  const { lastTimestamp, current, velocity } = node;
  const deltaTime = Math.min(now - lastTimestamp, 64);
  const c = damping;
  const m = mass;
  const k = stiffness;
  const v0 = -velocity;
  const x0 = toValue - current;
  const zeta = c / (2 * Math.sqrt(k * m));
  const omega0 = Math.sqrt(k / m);
  const omega1 = omega0 * Math.sqrt(1 - zeta ** 2);
  const t = deltaTime / 1e3;
  if (zeta < 1) {
    const sin1 = Math.sin(omega1 * t);
    const cos1 = Math.cos(omega1 * t);
    const envelope2 = Math.exp(-zeta * omega0 * t);
    const frag1 = envelope2 * (sin1 * ((v0 + zeta * omega0 * x0) / omega1) + x0 * cos1);
    return {
      current: toValue - frag1,
      // The derivative of the position.
      velocity: zeta * omega0 * frag1 - envelope2 * (cos1 * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin1),
      lastTimestamp: now
    };
  }
  const envelope = Math.exp(-omega0 * t);
  return {
    current: toValue - envelope * (x0 + (v0 + omega0 * x0) * t),
    velocity: envelope * (v0 * (t * omega0 - 1) + t * x0 * omega0 * omega0),
    lastTimestamp: now
  };
};
var SPRING_CACHE_LIMIT = 256;
var simulations = /* @__PURE__ */ new Map();
var simulationOf = (fps, config) => {
  const key = `${fps}-${config.damping}-${config.mass}-${config.stiffness}`;
  let simulation = simulations.get(key);
  if (!simulation) {
    if (simulations.size >= SPRING_CACHE_LIMIT) simulations.clear();
    simulation = { current: [], velocity: [] };
    simulations.set(key, simulation);
  }
  return simulation;
};
var springPosition = (frame, fps, config) => {
  const { current, velocity } = simulationOf(fps, config);
  const frameClamped = Math.max(0, frame);
  const whole = Math.floor(frameClamped);
  for (let f = current.length; f <= whole; f++) {
    const previous = f === 0 ? { current: 0, velocity: 0, lastTimestamp: 0 } : { current: current[f - 1], velocity: velocity[f - 1], lastTimestamp: (f - 1) / fps * 1e3 };
    const node = advanceSpring(previous, f / fps * 1e3, config);
    current.push(node.current);
    velocity.push(node.velocity);
  }
  if (frameClamped % 1 > 0) {
    const node = { current: current[whole], velocity: velocity[whole], lastTimestamp: whole / fps * 1e3 };
    return advanceSpring(node, frameClamped / fps * 1e3, config).current;
  }
  return current[whole];
};
var spring = ({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
  durationInFrames,
  durationRestThreshold,
  delay = 0,
  reverse = false
}) => {
  if (!isPositive(fps)) {
    throw new Error(`spring: fps must be a positive number (use useVideoConfig().fps), got ${fps}`);
  }
  if (typeof frame !== "number" || !Number.isFinite(frame)) {
    throw new Error(`spring: frame must be a finite number, got ${frame}`);
  }
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error(`spring: from and to must be finite numbers, got ${from} and ${to}`);
  }
  if (durationInFrames !== void 0 && !isPositive(durationInFrames)) {
    throw new Error(`spring: durationInFrames must be a positive number, got ${durationInFrames}`);
  }
  if (typeof delay !== "number" || !Number.isFinite(delay)) {
    throw new Error(`spring: delay must be a finite number of frames, got ${delay}`);
  }
  if (typeof reverse !== "boolean") {
    throw new Error(`spring: reverse must be a boolean, got ${reverse}`);
  }
  const resolved = resolveSpringConfig("spring", config);
  let naturalDuration = 0;
  if (reverse || durationInFrames !== void 0) {
    naturalDuration = measureSpring({ fps, config, threshold: durationRestThreshold });
    if (naturalDuration === Infinity) {
      throw new Error("spring: durationRestThreshold must be > 0 with durationInFrames or reverse (with 0 the spring never settles)");
    }
  }
  const reverseProcessed = reverse ? (durationInFrames ?? naturalDuration) - frame : frame;
  const delayProcessed = reverseProcessed + (reverse ? delay : -delay);
  const durationProcessed = durationInFrames === void 0 ? delayProcessed : delayProcessed / (durationInFrames / naturalDuration);
  if (durationInFrames !== void 0 && delayProcessed > durationInFrames) {
    return to;
  }
  const current = springPosition(durationProcessed, fps, resolved);
  const inner = resolved.overshootClamping ? Math.min(current, 1) : current;
  if (from === 0 && to === 1) return inner;
  return from === to ? from : inner * (to - from) + from;
};
var findSegment = (input, inputRange) => {
  for (let i = 1; i < inputRange.length - 1; i++) {
    if (input <= inputRange[i]) return i - 1;
  }
  return inputRange.length - 2;
};
var checkInterpolateArgs = (fn, input, inputRange, outputLength, options) => {
  if (typeof input !== "number" || Number.isNaN(input)) {
    throw new Error(`${fn}: input must be a number, got ${input}`);
  }
  if (!Array.isArray(inputRange)) {
    throw new Error(`${fn}: inputRange must be an array of numbers, got ${JSON.stringify(inputRange)}`);
  }
  if (inputRange.length !== outputLength) {
    throw new Error(
      `${fn}: inputRange (${inputRange.length}) and outputRange (${outputLength}) must have the same length`
    );
  }
  if (inputRange.length < 1) {
    throw new Error(`${fn}: inputRange must have at least 1 element`);
  }
  for (let i = 0; i < inputRange.length; i++) {
    if (typeof inputRange[i] !== "number" || !Number.isFinite(inputRange[i])) {
      throw new Error(`${fn}: inputRange must contain finite numbers, got [${inputRange.join(", ")}]`);
    }
    if (i > 0 && inputRange[i] < inputRange[i - 1]) {
      throw new Error(`${fn}: inputRange must be ascending, got [${inputRange.join(", ")}]`);
    }
  }
  const { easing, posterize } = options;
  const segments = inputRange.length - 1;
  if (Array.isArray(easing)) {
    if (easing.length !== segments) {
      throw new Error(
        `${fn}: an easing array needs one easing per segment (inputRange.length - 1 = ${segments}), got ${easing.length}`
      );
    }
    easing.forEach((f, i) => {
      if (typeof f !== "function") throw new Error(`${fn}: easing[${i}] must be a function, got ${f}`);
    });
  } else if (easing !== void 0 && typeof easing !== "function") {
    throw new Error(`${fn}: easing must be a function or an array of functions, got ${easing}`);
  }
  if (posterize !== void 0 && (typeof posterize !== "number" || !Number.isFinite(posterize) || posterize <= 0)) {
    throw new Error(`${fn}: posterize must be a positive finite number, got ${posterize}`);
  }
};
var EXTRAPOLATE = ["clamp", "extend", "identity", "wrap"];
var identity = (t) => t;
var easingOfSegment = (easing, segment) => easing === void 0 ? identity : typeof easing === "function" ? easing : easing[segment];
var segmentValue = (input, i, inputRange, outputRange, easing, left, right) => {
  const start = inputRange[i];
  const end = inputRange[i + 1];
  const from = outputRange[i];
  const to = outputRange[i + 1];
  let x = input;
  if (x < start) {
    if (left === "identity") return x;
    if (left === "clamp") x = start;
  }
  if (x > end) {
    if (right === "identity") return x;
    if (right === "clamp" && !extendsRight.has(easing)) x = end;
  }
  if (end === start) return x >= end ? to : from;
  return from + easing((x - start) / (end - start)) * (to - from);
};
var interpolate = (input, inputRange, outputRange, options = {}) => {
  const { extrapolateLeft = "extend", extrapolateRight = "extend", easing, posterize } = options;
  checkInterpolateArgs("interpolate", input, inputRange, outputRange.length, options);
  outputRange.forEach((value) => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`interpolate: outputRange must contain finite numbers, got [${outputRange.join(", ")}]`);
    }
  });
  for (const [name, value] of [["extrapolateLeft", extrapolateLeft], ["extrapolateRight", extrapolateRight]]) {
    if (!EXTRAPOLATE.includes(value)) {
      throw new Error(`interpolate: ${name} must be one of ${EXTRAPOLATE.join(", ")}, got ${JSON.stringify(value)}`);
    }
  }
  if (inputRange.length === 1) return outputRange[0];
  let x = posterize === void 0 ? input : Math.floor(input / posterize) * posterize;
  const first = inputRange[0];
  const last = inputRange[inputRange.length - 1];
  if (x < first && extrapolateLeft === "wrap" || x > last && extrapolateRight === "wrap") {
    const span = last - first;
    if (span === 0) {
      throw new Error(`interpolate: extrapolate 'wrap' needs an inputRange that spans more than one value, got [${inputRange.join(", ")}]`);
    }
    x = ((x - first) % span + span) % span + first;
  }
  const segment = findSegment(x, inputRange);
  let result = segmentValue(
    x,
    segment,
    inputRange,
    outputRange,
    easingOfSegment(easing, segment),
    extrapolateLeft,
    extrapolateRight
  );
  for (let j = 0; j < segment; j++) {
    const segmentEasing = easingOfSegment(easing, j);
    if (!extendsRight.has(segmentEasing) || x <= inputRange[j + 1]) continue;
    result += segmentValue(x, j, inputRange, outputRange, segmentEasing, extrapolateLeft, "extend") - outputRange[j + 1];
  }
  return result;
};
var interpolateColors = (input, inputRange, outputRange, options = {}) => {
  checkInterpolateArgs("interpolateColors", input, inputRange, outputRange.length, options);
  const colors = outputRange.map((color) => parseColor(color, "interpolateColors"));
  const channel = (index) => interpolate(
    input,
    inputRange,
    colors.map((c) => c[index]),
    { easing: options.easing, posterize: options.posterize, extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const byte = (x) => Math.round(Math.max(0, Math.min(255, x)));
  const alpha = Math.round(Math.max(0, Math.min(1, channel(3))) * 1e3) / 1e3;
  return `rgba(${byte(channel(0))}, ${byte(channel(1))}, ${byte(channel(2))}, ${alpha})`;
};
var useKeyframes = (keyframes, frame) => {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  let prev = sorted[0];
  let next = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }
  if (frame <= prev.frame) return prev.value;
  if (frame >= next.frame) return next.value;
  let progress = (frame - prev.frame) / (next.frame - prev.frame);
  if (next.easing) {
    progress = next.easing(progress);
  } else if (prev.easing) {
    progress = prev.easing(progress);
  }
  if (typeof prev.value === "number" && typeof next.value === "number") {
    return prev.value + progress * (next.value - prev.value);
  }
  return progress < 0.5 ? prev.value : next.value;
};
var measureCache = /* @__PURE__ */ new Map();
var measureSpring = ({
  fps,
  config = {},
  threshold = 5e-3
}) => {
  if (!isPositive(fps)) {
    throw new Error(`measureSpring: fps must be a positive number, got ${fps}`);
  }
  if (typeof threshold !== "number" || !Number.isFinite(threshold) || threshold < 0) {
    throw new Error(`measureSpring: threshold must be a number >= 0, got ${threshold}`);
  }
  const resolved = resolveSpringConfig("measureSpring", config);
  if (threshold === 0) return Infinity;
  if (threshold === 1) return 0;
  const key = `${fps}-${resolved.damping}-${resolved.mass}-${resolved.stiffness}-${threshold}`;
  const cached = measureCache.get(key);
  if (cached !== void 0) return cached;
  const difference = (n) => Math.abs(springPosition(n, fps, resolved) - 1);
  let frame = 0;
  while (difference(frame) >= threshold) frame++;
  let finishedFrame = frame;
  for (let i = 0; i < 20; i++) {
    frame++;
    if (difference(frame) >= threshold) {
      i = 0;
      finishedFrame = frame + 1;
    }
  }
  if (measureCache.size >= SPRING_CACHE_LIMIT) measureCache.clear();
  measureCache.set(key, finishedFrame);
  return finishedFrame;
};
var getFramesFromSeconds = (seconds, fps) => {
  return Math.round(seconds * fps);
};
var getSecondsFromFrames = (frames, fps) => {
  return frames / fps;
};
var range = (start, end, step = 1) => {
  const result = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
};
var random = (seed, min = 0, max = 1) => {
  const str = typeof seed === "number" ? seed.toString() : seed;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  const normalized = (hash >>> 0) / 4294967296;
  return min + normalized * (max - min);
};

exports.COLOR_FUNCTIONS = COLOR_FUNCTIONS;
exports.Easing = Easing;
exports.checkInterpolateArgs = checkInterpolateArgs;
exports.getFramesFromSeconds = getFramesFromSeconds;
exports.getSecondsFromFrames = getSecondsFromFrames;
exports.interpolate = interpolate;
exports.interpolateColors = interpolateColors;
exports.isNamedColor = isNamedColor;
exports.measureSpring = measureSpring;
exports.parseColor = parseColor;
exports.random = random;
exports.range = range;
exports.spring = spring;
exports.useKeyframes = useKeyframes;
//# sourceMappingURL=chunk-WEQRPTIM.cjs.map
//# sourceMappingURL=chunk-WEQRPTIM.cjs.map