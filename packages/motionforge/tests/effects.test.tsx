import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import {
  Counter,
  Flip3D,
  Glitch,
  GradientText,
  LetterByLetter,
  ProgressBar,
  RainbowText,
  Typewriter,
  WaveText,
  WordByWord,
} from '../src/components/Effects';
import { StickyGridScroll } from '../src/components/animations/StickyGridScroll';
import { KineticTypography } from '../src/components/animations/KineticTypography';
import { FlipImageReveal } from '../src/components/animations/FlipImageReveal';
import { DepthGallery3D } from '../src/components/animations/DepthGallery3D';

// The 3D scene renders through @react-three/fiber, which needs WebGL: replace
// the canvas and drei primitives with plain elements to see what is rendered.
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div data-canvas="">{children}</div>,
  useFrame: () => {},
}));
vi.mock('@react-three/drei', () => ({
  Image: ({ url }: { url: string }) => <img data-url={url} />,
  Text: ({ children }: { children: React.ReactNode }) => <span data-text="">{children}</span>,
  ScrollControls: () => null,
  Scroll: () => null,
  useScroll: () => null,
  Float: () => null,
}));

const renderAt = (frame: number, node: React.ReactNode) =>
  renderToStaticMarkup(
    <FrameProvider frame={frame} fps={30} durationInFrames={300} width={1080} height={1920}>
      {node}
    </FrameProvider>,
  );

const spanTexts = (html: string) =>
  [...html.matchAll(/<span[^>]*>(.*?)<\/span>/g)].map((match) => match[1]);

describe('frame-independent CSS', () => {
  it('StickyGridScroll shows the items inside the viewport and has no CSS transition', () => {
    const html = renderAt(150, <StickyGridScroll items={Array.from({ length: 12 }, (_, i) => <b key={i}>{i}</b>)} />);
    const opacities = [...html.matchAll(/opacity:([\d.]+)/g)].map((match) => Number(match[1]));
    expect(Math.max(...opacities)).toBe(1);
    expect(html).not.toContain('transition');
  });

  it('ProgressBar has no CSS transition', () => {
    const html = renderAt(0, <ProgressBar progress={0.5} />);
    expect(html).toContain('width:50%');
    expect(html).not.toContain('transition');
  });

  it('Glitch renders the same markup for the same frame', () => {
    for (const frame of [0, 1, 2, 11]) {
      expect(renderAt(frame, <Glitch>X</Glitch>)).toBe(renderAt(frame, <Glitch>X</Glitch>));
    }
    // It still glitches: a non-zero offset on glitch frames.
    expect(renderAt(1, <Glitch intensity={10}>X</Glitch>)).not.toContain('left:0;');
  });
});

describe('WordByWord', () => {
  it('uses durationInFrames', () => {
    const fast = renderAt(5, <WordByWord text="tap to play" durationInFrames={10} />);
    const slow = renderAt(5, <WordByWord text="tap to play" durationInFrames={200} />);
    expect(fast).not.toBe(slow);
    // Each of the 3 words animates for durationInFrames / 3 frames.
    expect(renderAt(3, <WordByWord text="a b c" durationInFrames={9} />)).toMatch(/^<div[^>]*><span style="display:inline-block;opacity:1"/);
  });
});

describe('text effects keep whole characters', () => {
  const text = 'Win🎉👍🏽';
  const expected = ['W', 'i', 'n', '🎉', '👍🏽'];

  it('LetterByLetter', () => {
    expect(spanTexts(renderAt(100, <LetterByLetter text={text} />))).toEqual(expected);
  });

  it('WaveText', () => {
    expect(spanTexts(renderAt(10, <WaveText text={text} />))).toEqual(expected);
  });

  it('RainbowText', () => {
    expect(spanTexts(renderAt(10, <RainbowText text={text} />))).toEqual(expected);
  });

  it('KineticTypography', () => {
    expect(spanTexts(renderAt(10, <KineticTypography text={text} />))).toEqual(expected);
  });

  it('Typewriter', () => {
    // 5 characters over 50 frames: at frame 40 four are typed.
    expect(renderAt(40, <Typewriter text={text} durationInFrames={50} cursor={false} />)).toBe('<span>Win🎉</span>');
  });
});

describe('GradientText', () => {
  const background = (html: string) => html.match(/background:([^;]*)/)![1];
  const position = (html: string) => html.match(/background-position:([^;]*)/)![1];

  it('animates the position of a fixed gradient', () => {
    const a = renderAt(10, <GradientText text="x" colors={['#ff0000', '#0000ff']} />);
    const b = renderAt(30, <GradientText text="x" colors={['#ff0000', '#0000ff']} />);
    expect(background(a)).toBe(background(b));
    expect(position(a)).not.toBe(position(b));
    const stops = [...background(a).matchAll(/ ([\d.]+)%/g)].map((match) => Number(match[1]));
    expect(stops).toEqual([...stops].sort((x, y) => x - y));
    expect(stops[0]).toBe(0);
    expect(stops[stops.length - 1]).toBe(100);
  });

  it('works with one color', () => {
    expect(renderAt(0, <GradientText text="x" colors={['#ffffff']} />)).not.toContain('NaN');
  });

  it('throws without colors', () => {
    expect(() => renderAt(0, <GradientText text="x" colors={[]} />)).toThrow(/at least one color/);
  });
});

describe('Counter', () => {
  it('formats with a fixed default locale, or the given one', () => {
    expect(renderAt(100, <Counter to={1234567} durationInFrames={10} />)).toBe('<span>1,234,567</span>');
    expect(renderAt(100, <Counter to={1234567} durationInFrames={10} locale="de-DE" />)).toBe('<span>1.234.567</span>');
    expect(renderAt(100, <Counter to={5} durationInFrames={10} format={(v) => `${v}%`} />)).toBe('<span>5%</span>');
  });
});

describe('no demo copy', () => {
  it('Flip3D renders front and back and takes no children', () => {
    const html = renderAt(0, <Flip3D front={<b>front</b>} back={<b>back</b>} />);
    expect(html).toContain('<b>front</b>');
    expect(html).toContain('<b>back</b>');
  });

  it('FlipImageReveal shows only the text it is given', () => {
    const plain = renderAt(100, <FlipImageReveal src="a.png" thumbnailRect={{ x: 0, y: 0, width: 10, height: 10 }} />);
    expect(plain).not.toContain('Cinematic Reveal');
    expect(plain).not.toContain('<h2');
    expect(plain).not.toContain('alt="Reveal"');
    const titled = renderAt(
      100,
      <FlipImageReveal src="a.png" alt="Level 2" title="New level" thumbnailRect={{ x: 0, y: 0, width: 10, height: 10 }} />,
    );
    expect(titled).toContain('New level</h2>');
    expect(titled).toContain('alt="Level 2"');
    expect(titled).not.toContain('<p');
  });

  it('DepthGallery3D shows only the captions it is given', () => {
    const plain = renderAt(0, <DepthGallery3D images={['a.png', 'b.png']} />);
    expect(plain).toContain('data-url="a.png"');
    expect(plain).not.toContain('Art Piece');
    const captioned = renderAt(0, <DepthGallery3D images={['a.png', 'b.png']} captions={['First']} />);
    expect(captioned).toContain('<span data-text="">First</span>');
    expect(captioned).not.toContain('Art Piece');
  });
});
