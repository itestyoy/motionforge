import { describe, expect, it } from 'vitest';
import {
  makeTransform,
  matrix,
  matrix3d,
  perspective,
  rotate,
  rotate3d,
  rotateX,
  scale,
  scale3d,
  skew,
  skewX,
  translate,
  translate3d,
  translateX,
  translateY,
  translateZ,
} from '../src/utils/transform';
import { interpolateStyles } from '../src/utils/interpolate-styles';
import { Easing } from '../src/utils/animation';

describe('makeTransform and transform functions (@remotion/animation-utils)', () => {
  it('builds CSS transforms with default units', () => {
    expect(makeTransform([translateX(100), rotate(45), scale(1.2)])).toBe('translateX(100px) rotate(45deg) scale(1.2, 1.2)');
    expect(translate(10)).toBe('translate(10px)');
    expect(translate(10, 20)).toBe('translate(10px, 20px)');
    expect(translate('50%', '1em')).toBe('translate(50%, 1em)');
    expect(translate(5, 'vw')).toBe('translate(5vw)');
    expect(translate(5, '%', 6, 'px')).toBe('translate(5%, 6px)');
    expect(translateY(-50, '%')).toBe('translateY(-50%)');
    expect(translateZ('2rem')).toBe('translateZ(2rem)');
    expect(translate3d(1, '2%', 3)).toBe('translate3d(1px, 2%, 3px)');
    expect(translate3d(1, 'em', 2, 'px', 3, 'rem')).toBe('translate3d(1em, 2px, 3rem)');
    expect(rotate('0.5turn')).toBe('rotate(0.5turn)');
    expect(rotate(1, 'rad')).toBe('rotate(1rad)');
    expect(rotateX(30)).toBe('rotateX(30deg)');
    expect(rotate3d(0, 1, 0, 90)).toBe('rotate3d(0, 1, 0, 90deg)');
    expect(scale(2, 3)).toBe('scale(2, 3)');
    expect(scale3d(1, 2, 3)).toBe('scale3d(1, 2, 3)');
    expect(skew(10)).toBe('skew(10deg, 10deg)');
    expect(skew(10, 20)).toBe('skew(10deg, 20deg)');
    expect(skew('1rad')).toBe('skew(1rad, 1rad)');
    expect(skew(1, 'turn')).toBe('skew(1turn, 1turn)');
    expect(skew(1, 'deg', 2, 'rad')).toBe('skew(1deg, 2rad)');
    expect(skewX('5grad')).toBe('skewX(5grad)');
    expect(perspective(800)).toBe('perspective(800px)');
    expect(perspective('20em')).toBe('perspective(20em)');
    expect(matrix(1, 0, 0, 1, 10, 20)).toBe('matrix(1, 0, 0, 1, 10, 20)');
    expect(matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)).toBe('matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)');
  });

  it('throws on wrong arguments', () => {
    expect(() => translateX(Number.NaN)).toThrow(/translateX: x must be a finite number/);
    // @ts-expect-error not a length
    expect(() => translateX('10deg')).toThrow(/must be a number or a string ending in one of/);
    // @ts-expect-error not an angle unit
    expect(() => rotate(10, 'px')).toThrow(/rotate: angle unit must be one of rad, deg, grad, turn/);
    // @ts-expect-error no such signature
    expect(() => translate(1, 2, 3)).toThrow(/translate\(\) supports only the following signatures/);
    expect(() => matrix3d(1, 2, 3)).toThrow(/matrix3d: expects 16 numbers/);
    // @ts-expect-error not an array
    expect(() => makeTransform('rotate(1deg)')).toThrow(/makeTransform: expects an array/);
  });
});

describe('interpolateStyles (@remotion/animation-utils)', () => {
  const styles = [
    { opacity: 0, transform: makeTransform([translateY(-50), scale(0.5)]), color: 'red', width: '0%' },
    { opacity: 1, transform: makeTransform([translateY(0), scale(1)]), color: 'blue', width: '100%' },
    { opacity: 0, transform: makeTransform([translateY(50), scale(1)]), color: 'blue', width: '50%' },
  ];

  it('interpolates numbers, units, transform functions and colors per segment', () => {
    expect(interpolateStyles(15, [0, 30, 60], styles)).toEqual({
      opacity: 0.5,
      transform: 'translateY(-25px) scale(0.75, 0.75)',
      color: 'rgba(128, 0, 128, 1)',
      width: '50%',
    });
    expect(interpolateStyles(45, [0, 30, 60], styles)).toMatchObject({ opacity: 0.5, transform: 'translateY(25px) scale(1, 1)', width: '75%' });
  });

  it('extends by default and takes the interpolate() options', () => {
    expect(interpolateStyles(-15, [0, 30], [{ opacity: 0 }, { opacity: 1 }])).toEqual({ opacity: -0.5 });
    expect(interpolateStyles(-15, [0, 30], [{ opacity: 0 }, { opacity: 1 }], { extrapolateLeft: 'clamp' })).toEqual({ opacity: 0 });
    expect(interpolateStyles(15, [0, 30], [{ opacity: 0 }, { opacity: 1 }], { easing: Easing.quad })).toEqual({ opacity: 0.25 });
    expect(interpolateStyles(20, [0, 30], [{ opacity: 0 }, { opacity: 1 }], { posterize: 15 })).toEqual({ opacity: 0.5 });
    expect(
      interpolateStyles(45, [0, 30, 60], [{ left: 0 }, { left: 30 }, { left: 0 }], { easing: [Easing.linear, Easing.step1] }),
    ).toEqual({ left: 30 });
  });

  it('keeps values the end style lacks, and a unitless 0 takes the other unit', () => {
    expect(interpolateStyles(5, [0, 10], [{ top: 0, position: 'absolute' }, { top: '20px' }])).toEqual({ top: '10px', position: 'absolute' });
    expect(interpolateStyles(5, [0, 10], [{ boxShadow: '0 0 0px red, 0 0 10px blue' }, { boxShadow: '0 0 10px blue, 0 0 0px red' }])).toEqual({
      boxShadow: '0 0 5px rgba(128, 0, 128, 1), 0 0 5px rgba(128, 0, 128, 1)',
    });
  });

  it('throws on values it cannot interpolate', () => {
    expect(() => interpolateStyles(5, [0, 10], [{ width: '10px' }, { width: '20%' }])).toThrow(/width .* the units must match/);
    expect(() => interpolateStyles(5, [0, 10], [{ transform: 'rotate(1deg)' }, { transform: 'scale(2)' }])).toThrow(/same structure/);
    expect(() => interpolateStyles(5, [0, 10], [{ display: 'flex' }, { display: 'none' }])).toThrow(/same structure/);
    expect(() => interpolateStyles(5, [0, 0], [{ opacity: 0 }, { opacity: 1 }])).toThrow(/strictly increasing/);
    expect(() => interpolateStyles(5, [0, 10], [{ opacity: 0 }])).toThrow(/must have the same length/);
  });
});
