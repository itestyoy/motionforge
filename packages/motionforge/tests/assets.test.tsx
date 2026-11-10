import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { StaticFiles } from '../src/core/static-files';
import { useStaticFile } from '../src/core/use-static-file';
import { Composition } from '../src/components/Composition';
import { Img } from '../src/components/Media';
import { fitRect } from '../src/utils/fit-rect';
import * as main from '../src/index';

const Url = ({ path }: { path: string }) => {
  const staticFile = useStaticFile();
  return <i>{staticFile(path)}</i>;
};

const render = (node: React.ReactNode, staticFiles?: StaticFiles) =>
  renderToStaticMarkup(
    <FrameProvider frame={0} durationInFrames={10} width={100} height={100} staticFiles={staticFiles}>
      {node}
    </FrameProvider>,
  );

describe('useStaticFile', () => {
  it('appends the path to the base URL the host passes, encoding each segment as Remotion does', () => {
    expect(render(<Url path="images/hero.png" />, 'https://cdn.test/creative-42/')).toBe('<i>https://cdn.test/creative-42/images/hero.png</i>');
    expect(render(<Url path="hero.png" />, '/static')).toBe('<i>/static/hero.png</i>');
    expect(render(<Url path="my image#1.png" />, '/')).toBe('<i>/my%20image%231.png</i>');
  });

  it('asks the host function for each path (signed or blob URLs)', () => {
    const signed: Record<string, string> = { 'a.png': 'https://cdn.test/a.png?sig=1' };
    expect(render(<Url path="a.png" />, (path) => signed[path])).toBe('<i>https://cdn.test/a.png?sig=1</i>');
    expect(() => render(<Url path="b.png" />, (path) => signed[path])).toThrow(
      /staticFile\("b.png"\): the staticFiles function of the FrameProvider must return a non-empty string \(a URL\), got undefined/,
    );
  });

  it('resolves with the FrameProvider the component is in; an inner one without staticFiles uses the outer one', () => {
    const html = renderToStaticMarkup(
      <>
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} staticFiles="https://a.test/">
          <Url path="x.png" />
          <FrameProvider frame={3} durationInFrames={10} width={10} height={10}>
            <Url path="inner.png" />
          </FrameProvider>
          <FrameProvider frame={3} durationInFrames={10} width={10} height={10} staticFiles={(path) => `blob:${path}`}>
            <Url path="own.png" />
          </FrameProvider>
        </FrameProvider>
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} staticFiles="https://b.test/">
          <Url path="x.png" />
        </FrameProvider>
      </>,
    );
    expect(html).toBe('<i>https://a.test/x.png</i><i>https://a.test/inner.png</i><i>blob:own.png</i><i>https://b.test/x.png</i>');
  });

  it('gives plain URLs that Img and Composition take as they are', () => {
    const Scene = () => <Img src={useStaticFile()('hero.png')} />;
    expect(render(<Scene />, '/assets/')).toContain('src="/assets/hero.png"');
    expect(
      renderToStaticMarkup(<Composition id="c" component={Scene} frame={0} durationInFrames={10} staticFiles="/c/" />),
    ).toContain('src="/c/hero.png"');
  });

  it('throws without staticFiles, and for paths that are not inside the static files', () => {
    expect(() => render(<Url path="hero.png" />)).toThrow(
      /staticFile\("hero.png"\): the FrameProvider has no staticFiles\. The host app decides where static files come from/,
    );
    expect(() => render(<Url path="/hero.png" />, '/s/')).toThrow(/without a leading slash \("hero.png"\)/);
    expect(() => render(<Url path="https://x.test/a.png" />, '/s/')).toThrow(/already a URL; use it as it is/);
    expect(() => render(<Url path="../secret.txt" />, '/s/')).toThrow(/must not contain empty, "\." or "\.\." segments/);
    expect(() => render(<Url path="" />, '/s/')).toThrow(/path must be a non-empty string/);
    expect(() => render(<Url path="a.png" />, '')).toThrow(/staticFiles must be a base URL \(a non-empty string/);
    // @ts-expect-error not a base URL or a function
    expect(() => render(<Url path="a.png" />, 42)).toThrow(/staticFiles must be a base URL .* got 42/);
    expect(() => renderToStaticMarkup(<Url path="a.png" />)).toThrow(/useStaticFile must be used within a FrameProvider/);
  });

  it('replaces the hard-coded staticFile() export', () => {
    expect(main).not.toHaveProperty('staticFile');
    expect(main).toHaveProperty('useStaticFile');
    expect(main).toHaveProperty('fitRect');
  });
});

// Equal up to floating-point rounding, key by key.
const expectClose = (actual: Record<string, number>, expected: Record<string, number>) => {
  expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort());
  for (const key of Object.keys(expected)) expect(actual[key], key).toBeCloseTo(expected[key], 9);
};

describe('fitRect', () => {
  const box = { width: 1080, height: 1920 };
  const photo = { width: 2000, height: 1500 };

  it('computes contain, cover, fill, none and scale-down as CSS object-fit does, centred', () => {
    expectClose({ ...fitRect(box, photo, 'contain') }, { x: 0, y: 555, width: 1080, height: 810, scaleX: 0.54, scaleY: 0.54 });
    expectClose({ ...fitRect(box, photo, 'cover') }, { x: -740, y: 0, width: 2560, height: 1920, scaleX: 1.28, scaleY: 1.28 });
    expectClose({ ...fitRect(box, photo, 'fill') }, { x: 0, y: 0, width: 1080, height: 1920, scaleX: 0.54, scaleY: 1.28 });
    expectClose({ ...fitRect(box, photo, 'none') }, { x: -460, y: 210, width: 2000, height: 1500, scaleX: 1, scaleY: 1 });
    // The side that fits is exactly the box's.
    expect(fitRect(box, photo, 'contain').width).toBe(1080);
    expect(fitRect(box, photo, 'cover').height).toBe(1920);
    // scale-down: the smaller of none and contain.
    expect(fitRect(box, photo, 'scale-down')).toEqual(fitRect(box, photo, 'contain'));
    expect(fitRect(box, { width: 100, height: 50 }, 'scale-down')).toEqual({ x: 490, y: 935, width: 100, height: 50, scaleX: 1, scaleY: 1 });
  });

  it('places by the anchor (object-position / 100) and offsets by the container position', () => {
    const at = (r: { x: number; y: number }) => ({ x: r.x, y: r.y });
    expectClose(at(fitRect(box, photo, 'cover', { x: 0, y: 0 })), { x: 0, y: 0 });
    expectClose(at(fitRect(box, photo, 'cover', { x: 1, y: 1 })), { x: -1480, y: 0 });
    expectClose(at(fitRect({ x: 100, y: 200, ...box }, photo, 'contain', { x: 0.5, y: 0 })), { x: 100, y: 200 });
  });

  it('maps a piece of the picture to the screen', () => {
    // The tile at (500, 300) of 250 × 250 px in the photo, with the photo covering the box.
    const r = fitRect(box, photo, 'cover');
    const tile = { x: r.x + 500 * r.scaleX, y: r.y + 300 * r.scaleY, size: 250 * r.scaleX };
    expectClose(tile, { x: -100, y: 384, size: 320 });
  });

  it('throws on wrong input', () => {
    expect(() => fitRect({ width: 0, height: 10 }, photo, 'contain')).toThrow(/container\.width must be a positive number, got 0/);
    expect(() => fitRect(box, { width: 10, height: NaN }, 'contain')).toThrow(/content\.height must be a positive number/);
    // @ts-expect-error not an object-fit value
    expect(() => fitRect(box, photo, 'stretch')).toThrow(/fit must be one of 'contain', 'cover', 'fill', 'none', 'scale-down', got "stretch"/);
    expect(() => fitRect(box, photo, 'cover', { x: Infinity, y: 0 })).toThrow(/anchor\.x must be a finite number/);
    expect(() => fitRect({ x: NaN, ...box }, photo, 'cover')).toThrow(/container\.x must be a finite number/);
  });
});
