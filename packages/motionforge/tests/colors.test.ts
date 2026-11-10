import { describe, expect, it } from 'vitest';
import { Easing, interpolateColors } from '../src/utils/animation';

// The color a single-element range returns: the parsed color, formatted.
const color = (css: string) => interpolateColors(0, [0], [css]);

// Channels of an rgba() string.
const channels = (rgba: string) => rgba.match(/[\d.]+/g)!.map(Number);

const expectRgb = (css: string, expected: [number, number, number, number?]) => {
  const [r, g, b, a] = channels(color(css));
  expect([r, g, b], css).toEqual(expected.slice(0, 3));
  expect(a, css).toBe(expected[3] ?? 1);
};

describe('interpolateColors color syntaxes', () => {
  it('reads CSS named colors, case-insensitively, and transparent', () => {
    expectRgb('red', [255, 0, 0]);
    expectRgb('rebeccapurple', [102, 51, 153]);
    expectRgb('CornflowerBlue', [100, 149, 237]);
    expectRgb('transparent', [0, 0, 0, 0]);
    expect(interpolateColors(5, [0, 10], ['red', 'blue'])).toBe('rgba(128, 0, 128, 1)');
  });

  it('reads hsl() and hsla() in the comma and the space syntax, with hue units', () => {
    expectRgb('hsl(120, 100%, 50%)', [0, 255, 0]);
    expectRgb('hsla(240, 100%, 50%, 0.5)', [0, 0, 255, 0.5]);
    expectRgb('hsl(0 100% 50% / 25%)', [255, 0, 0, 0.25]);
    expectRgb('hsl(0.5turn 100% 50%)', [0, 255, 255]);
    expectRgb('hsl(-120deg 100% 50%)', [0, 0, 255]);
    expectRgb('hsl(0 0% 50%)', [128, 128, 128]);
  });

  it('reads hwb(), lab(), lch(), oklab() and oklch()', () => {
    expectRgb('hwb(0 0% 0%)', [255, 0, 0]);
    expectRgb('hwb(120 100% 0%)', [255, 255, 255]);
    expectRgb('hwb(0 50% 50%)', [128, 128, 128]);
    expectRgb('lab(54.29 80.81 69.89)', [255, 0, 0]);
    expectRgb('lab(50% 0 0)', [119, 119, 119]);
    expectRgb('lch(54.29 106.84 40.85)', [255, 0, 0]);
    expectRgb('oklab(1 0 0)', [255, 255, 255]);
    expectRgb('oklch(62.7955% 0.257683 29.2339 / 0.5)', [255, 0, 0, 0.5]);
    expectRgb('oklch(0.452014 0.313214 264.052)', [0, 0, 255]);
    expectRgb('oklch(0.5 none none)', channels(color('oklab(0.5 0 0)')).slice(0, 3) as [number, number, number]);
  });

  it('formats as rgba(r, g, b, a), as in Remotion', () => {
    expect(interpolateColors(0, [0, 1], ['#ff0000', '#0000ff'])).toBe('rgba(255, 0, 0, 1)');
    expect(interpolateColors(0.5, [0, 1], ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)'])).toBe('rgba(0, 0, 0, 0.5)');
  });

  it('takes easing and posterize options', () => {
    expect(interpolateColors(5, [0, 10], ['#000', '#fff'], { easing: Easing.step1 })).toBe('rgba(0, 0, 0, 1)');
    expect(interpolateColors(5, [0, 10], ['#000', '#fff'], { easing: Easing.quad })).toBe('rgba(64, 64, 64, 1)');
    expect(interpolateColors(7, [0, 10], ['#000', '#fff'], { posterize: 5 })).toBe('rgba(128, 128, 128, 1)');
    expect(() => interpolateColors(7, [0, 10], ['#000', '#fff'], { posterize: 0 })).toThrow(/posterize/);
  });

  it('throws on colors it does not read', () => {
    for (const css of ['notacolor', 'hsl(120, 100%)', 'lab(1, 2, 3)', 'oklch(0.5 0.1)', 'rgb(1 2 3 / )', 'hsl(1kg 2% 3%)', 'color(srgb 1 0 0)']) {
      expect(() => color(css), css).toThrow(/interpolateColors: unsupported color/);
    }
  });
});
