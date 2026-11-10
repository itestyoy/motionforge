import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  makeArrow,
  makeCallout,
  makeCircle,
  makeEllipse,
  makeHeart,
  makePie,
  makePolygon,
  makeRect,
  makeSpark,
  makeStar,
  makeTriangle,
} from '../src/components/shapes/make-shapes';
import { Circle, Pie, Rect, Star, Triangle } from '../src/components/shapes/Shapes';
import { getBoundingBox } from '../src/utils/path';

// The expected paths are what @remotion/shapes 4.0.542 returns for the same options.
describe('make*() as in @remotion/shapes', () => {
  it('makeRect', () => {
    const { path, width, height, transformOrigin, instructions } = makeRect({ width: 100, height: 50, cornerRadius: 10 });
    expect({ path, width, height, transformOrigin }).toEqual({
      width: 100,
      height: 50,
      path: 'M 90 0 L 90 0 a 10 10 0 0 1 10 10 L 100 40 a 10 10 0 0 1 -10 10 L 10 50 a 10 10 0 0 1 -10 -10 L 0 10 a 10 10 0 0 1 10 -10 Z',
      transformOrigin: '50 25',
    });
    expect(instructions[0]).toEqual({ type: 'M', x: 90, y: 0 });
    expect(makeRect({ width: 100, height: 50 }).path).toBe('M 0 0 L 100 0 L 100 50 L 0 50 L 0 0 Z');
  });

  it('makeCircle, makeEllipse, makePie', () => {
    expect(makeCircle({ radius: 50 }).path).toBe('M 50 0 a 50 50 0 1 1 0 100 a 50 50 0 1 1 0 -100 Z');
    expect(makeCircle({ radius: 50 })).toMatchObject({ width: 100, height: 100, transformOrigin: '50 50' });
    expect(makeEllipse({ rx: 40, ry: 20 }).path).toBe('M 40 0 a 40 20 0 1 0 1 0 Z');
    expect(makePie({ radius: 50, progress: 0.75 }).path).toBe('M 50 0 A 50 50 0 0 1 50 100 A 50 50 0 0 1 0 50 L 50 50 Z');
    // progress is clamped; a full pie has no line to the center.
    expect(makePie({ radius: 50, progress: 2 }).path).toBe(makePie({ radius: 50, progress: 1 }).path);
    expect(makePie({ radius: 50, progress: 1 }).path).not.toContain('L');
    expect(makePie({ radius: 50, progress: 0.25, closePath: false }).path).toBe('M 50 0 A 50 50 0 0 1 100 50');
  });

  it('makeTriangle', () => {
    expect(makeTriangle({ length: 100, direction: 'up' })).toMatchObject({
      path: 'M 50 0 L 0 86.60254037844386 L 100 86.60254037844386 L 50 0 Z',
      width: 100,
      height: 86.60254037844386,
      transformOrigin: '50 57.735026918962575',
    });
    expect(makeTriangle({ length: 100, direction: 'right' })).toMatchObject({ width: 86.60254037844386, height: 100 });
  });

  it('makeStar and makePolygon (moved to 0, 0)', () => {
    expect(makeStar({ points: 5, innerRadius: 40, outerRadius: 100 })).toMatchObject({
      path:
        'M 95.10565162951536 0 L 118.6170617212143 67.63932022500211 L 190.21130325903073 69.09830056250526 L 133.1479122813215 112.36067977499789 L 153.8841768587627 180.90169943749476 L 95.10565162951536 140 L 36.327126400268064 180.90169943749476 L 57.063390977709226 112.3606797749979 L 0 69.09830056250527 L 71.59424153781643 67.63932022500211 L 95.10565162951536 0 Z',
      width: 190.21130325903073,
      height: 180.90169943749476,
      transformOrigin: '100 100',
    });
    expect(makePolygon({ points: 6, radius: 50 })).toMatchObject({
      path:
        'M 43.30127018922195 0 L 86.60254037844388 25 L 86.60254037844389 75 L 43.30127018922195 100 L 2.842170943040401e-14 75.00000000000001 L 0 25.000000000000032 L 43.30127018922195 0',
      width: 86.60254037844389,
      height: 100,
      transformOrigin: '50 50',
    });
  });

  it('makeHeart, makeArrow, makeSpark, makeCallout', () => {
    expect(makeHeart({ height: 100 }).path).toBe(
      'M 55.00000000000001 100 C 32.00000000000001 69 0 60 0 25 C 0 13 13.000000000000004 0 27.500000000000004 0 C 42 0 50.00000000000001 7.000000000000001 55.00000000000001 17 C 60.00000000000001 7.000000000000001 70 0 82.50000000000001 0 C 97.00000000000001 0 110.00000000000001 13 110.00000000000001 25 C 110.00000000000001 60 78 69 55.00000000000001 100 Z',
    );
    expect(makeArrow({ direction: 'down', cornerRadius: 12 }).path).toBe(
      'M 64.5 0 L 120.5 0 C 132.5 0 132.5 0 132.5 12 L 132.5 180 L 173 180 C 185 180 185 180 177.67390567592835 189.50412236636322 L 99.82609432407163 290.4958776336368 C 92.5 300 92.5 300 85.17390567592837 290.4958776336368 L 7.326094324071638 189.50412236636322 C 0 180 0 180 12 180 L 52.5 180 L 52.5 12 C 52.5 0 52.5 0 64.5 0 Z',
    );
    expect(makeArrow({})).toMatchObject({ width: 300, height: 185, transformOrigin: '150 92.5' });
    expect(makeSpark({ width: 100, height: 140, cornerRadius: 10 }).path).toBe(
      'M 60 10 C 60 37.61423749153968 73.4314575050762 60 90 60 C 103.33333333333333 60 103.33333333333333 80 90 80 C 73.4314575050762 80 60 102.38576250846032 60 130 C 60 143.33333333333334 40 143.33333333333334 40 130 C 40 102.38576250846032 26.568542494923808 80 10 80 C -3.333333333333332 80 -3.333333333333332 60 10 60 C 26.568542494923808 60 40 37.61423749153968 40 10 C 40 -3.333333333333332 60 -3.333333333333332 60 10 Z',
    );
    expect(makeCallout({ pointerDirection: 'left', cornerRadius: 20 })).toMatchObject({
      width: 540,
      height: 200,
      path: 'M 60 0 L 520 0 a 20 20 0 0 1 20 20 L 540 180 a 20 20 0 0 1 -20 20 L 60 200 a 20 20 0 0 1 -20 -20 L 40 130 L 0 100 L 40 70 L 40 20 a 20 20 0 0 1 20 -20 Z',
      transformOrigin: '290 100',
    });
  });

  it('fit their width and height', () => {
    for (const shape of [
      makeHeart({ height: 80, aspectRatio: 1.3 }),
      makeArrow({ direction: 'left' }),
      makeCallout({ pointerDirection: 'up' }),
      makeTriangle({ length: 60, direction: 'down' }),
    ]) {
      const box = getBoundingBox(shape.path);
      expect(box.x1).toBeCloseTo(0, 9);
      expect(box.y1).toBeCloseTo(0, 9);
      expect(box.width).toBeCloseTo(shape.width, 9);
      expect(box.height).toBeCloseTo(shape.height, 9);
    }
  });

  it('throw on wrong options', () => {
    expect(() => makeRect({ width: -1, height: 10 })).toThrow(/makeRect: "width" must be a finite number >= 0/);
    expect(() => makeRect({ width: 10, height: 10, cornerRadius: 2, edgeRoundness: 0.5 })).toThrow(
      /"cornerRadius" and "edgeRoundness" cannot be specified at the same time/,
    );
    expect(() => makeStar({ points: 2, innerRadius: 1, outerRadius: 2 })).toThrow(/"points" should be an integer, minimum 3/);
    expect(() => makePolygon({ points: 4.5, radius: 10 })).toThrow(/"points" should be an integer/);
    // @ts-expect-error not a direction
    expect(() => makeTriangle({ length: 10, direction: 'north' })).toThrow(/"direction" must be one of/);
    expect(() => makeArrow({ headWidth: 50, shaftWidth: 80 })).toThrow(/"headWidth" must be greater than or equal to "shaftWidth"/);
    expect(() => makeArrow({ length: 100, headLength: 120 })).toThrow(/"headLength" must be less than or equal to "length"/);
    expect(() => makeCallout({ pointerPosition: 1.5 })).toThrow(/"pointerPosition" must be a number between 0 and 1/);
    expect(() => makePie({ radius: 10, progress: Number.NaN })).toThrow(/"progress" must be a finite number/);
    expect(() => makeHeart({ height: 10, aspectRatio: 0 })).toThrow(/"aspectRatio" must be a finite number > 0/);
  });
});

describe('shape components', () => {
  it('render their own <svg> with the path, as Remotion does', () => {
    expect(renderToStaticMarkup(<Circle radius={10} fill="red" />)).toBe(
      '<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">' +
        '<path transform-origin="10 10" d="M 10 0 a 10 10 0 1 1 0 20 a 10 10 0 1 1 0 -20 Z" style="transform-box:fill-box" fill="red"></path></svg>',
    );
  });

  it('put style on the <svg> and pathStyle and the other attributes on the <path>', () => {
    const html = renderToStaticMarkup(
      <Rect width={40} height={20} style={{ opacity: 0.5 }} pathStyle={{ transform: 'scale(2)' }} stroke="blue" strokeWidth={3} />,
    );
    expect(html).toContain('style="overflow:visible;opacity:0.5"');
    expect(html).toContain('style="transform-box:fill-box;transform:scale(2)" stroke="blue" stroke-width="3"');
    expect(html).toContain('d="M 0 0 L 40 0 L 40 20 L 0 20 L 0 0 Z"');
  });

  it('draw the control points with debug', () => {
    const html = renderToStaticMarkup(<Star points={5} innerRadius={10} outerRadius={20} edgeRoundness={0.5} debug />);
    expect(html.match(/<circle /g)).toHaveLength(20);
    expect(renderToStaticMarkup(<Pie radius={10} progress={0.5} />)).not.toContain('<circle');
  });

  it('do not take <Sequence> props or effects', () => {
    const withFrom = { length: 10, direction: 'up', from: 5 } as unknown as React.ComponentProps<typeof Triangle>;
    expect(() => renderToStaticMarkup(<Triangle {...withFrom} />)).toThrow(
      /<Triangle> does not take "from": put it inside <Sequence from=\{\.\.\.\}> instead/,
    );
    const withEffects = { radius: 10, effects: [] } as unknown as React.ComponentProps<typeof Circle>;
    expect(() => renderToStaticMarkup(<Circle {...withEffects} />)).toThrow(/<Circle> does not take "effects": effects are not supported/);
  });
});
