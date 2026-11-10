import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrameProvider, useCurrentFrame, useVideoConfig } from '../src/core/context';
import { Freeze, Loop, Sequence, Series, useRelativeCurrentFrame } from '../src/components/Sequence';

const ShowFrame = ({ id }: { id: string }) => <i data-id={id}>{useCurrentFrame()}</i>;

const renderAt = (frame: number, node: React.ReactNode) =>
  renderToStaticMarkup(
    <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100}>
      {node}
    </FrameProvider>,
  );

const frameOf = (html: string, id: string) => {
  const match = html.match(new RegExp(`data-id="${id}">(-?\\d+)<`));
  return match ? Number(match[1]) : null;
};

describe('Sequence', () => {
  it('shifts useCurrentFrame() to the sequence start', () => {
    const html = renderAt(40, <Sequence from={30}><ShowFrame id="a" /></Sequence>);
    expect(frameOf(html, 'a')).toBe(10);
  });

  it('composes when nested', () => {
    const html = renderAt(
      50,
      <Sequence from={30}>
        <Sequence from={15}>
          <ShowFrame id="inner" />
        </Sequence>
      </Sequence>,
    );
    expect(frameOf(html, 'inner')).toBe(5);
  });

  it('renders nothing outside its range', () => {
    expect(frameOf(renderAt(20, <Sequence from={30}><ShowFrame id="a" /></Sequence>), 'a')).toBeNull();
    expect(
      frameOf(renderAt(40, <Sequence from={0} durationInFrames={40}><ShowFrame id="a" /></Sequence>), 'a'),
    ).toBeNull();
  });

  it('keeps useRelativeCurrentFrame() equal to the shifted frame', () => {
    const Relative = () => <i data-id="rel">{useRelativeCurrentFrame()}</i>;
    expect(frameOf(renderAt(40, <Sequence from={30}><Relative /></Sequence>), 'rel')).toBe(10);
  });
});

describe('time-remapping components', () => {
  it('Loop repeats its frames', () => {
    expect(frameOf(renderAt(25, <Loop durationInFrames={10}><ShowFrame id="a" /></Loop>), 'a')).toBe(5);
  });

  it('Freeze holds a frame', () => {
    expect(frameOf(renderAt(3, <Freeze frame={7}><ShowFrame id="a" /></Freeze>), 'a')).toBe(7);
  });

});

describe('Series', () => {
  const ShowConfig = ({ id }: { id: string }) => (
    <i data-id={id}>{useCurrentFrame()}</i>
  );
  const durationOf = (html: string, id: string) => {
    const match = html.match(new RegExp(`data-duration="${id}">(\\d+)<`));
    return match ? Number(match[1]) : null;
  };
  const ShowDuration = ({ id }: { id: string }) => <b data-duration={id}>{useVideoConfig().durationInFrames}</b>;

  it('plays Series.Sequence children one after another with their own frame and duration', () => {
    const scene = (
      <Series>
        <Series.Sequence durationInFrames={10}><ShowConfig id="first" /><ShowDuration id="first" /></Series.Sequence>
        <Series.Sequence durationInFrames={20}><ShowConfig id="second" /><ShowDuration id="second" /></Series.Sequence>
      </Series>
    );
    expect(frameOf(renderAt(9, scene), 'first')).toBe(9);
    expect(durationOf(renderAt(9, scene), 'first')).toBe(10);
    const html = renderAt(15, scene);
    expect(frameOf(html, 'first')).toBeNull();
    expect(frameOf(html, 'second')).toBe(5);
    expect(durationOf(html, 'second')).toBe(20);
    expect(frameOf(renderAt(30, scene), 'second')).toBeNull();
  });

  it('renders overlapping sequences at the same time (negative offset)', () => {
    const scene = (
      <Series>
        <Series.Sequence durationInFrames={30}><ShowConfig id="a" /></Series.Sequence>
        <Series.Sequence durationInFrames={30} offset={-10}><ShowConfig id="b" /></Series.Sequence>
        <Series.Sequence durationInFrames={10}><ShowConfig id="c" /></Series.Sequence>
      </Series>
    );
    // b starts at 20, so c starts at 50.
    const html = renderAt(25, scene);
    expect(frameOf(html, 'a')).toBe(25);
    expect(frameOf(html, 'b')).toBe(5);
    expect(html.indexOf('data-id="a"')).toBeLessThan(html.indexOf('data-id="b"'));
    expect(frameOf(renderAt(50, scene), 'c')).toBe(0);
    expect(frameOf(renderAt(49, scene), 'c')).toBeNull();
  });

  it('leaves a gap for a positive offset', () => {
    const scene = (
      <Series>
        <Series.Sequence durationInFrames={10}><ShowConfig id="a" /></Series.Sequence>
        <Series.Sequence durationInFrames={10} offset={5}><ShowConfig id="b" /></Series.Sequence>
      </Series>
    );
    const gap = renderAt(12, scene);
    expect(frameOf(gap, 'a')).toBeNull();
    expect(frameOf(gap, 'b')).toBeNull();
    expect(frameOf(renderAt(15, scene), 'b')).toBe(0);
  });

  it('passes name, layout and premountFor to the sequence', () => {
    const scene = (
      <Series>
        <Series.Sequence durationInFrames={10} name="intro" layout="none"><ShowConfig id="a" /></Series.Sequence>
        <Series.Sequence durationInFrames={10} name="outro" premountFor={5}><ShowConfig id="b" /></Series.Sequence>
      </Series>
    );
    const html = renderAt(6, scene);
    expect(html.startsWith('<i data-id="a">6</i>')).toBe(true);
    expect(html).toMatch(/data-sequence-name="outro"[^>]*style="[^"]*opacity:0/);
    expect(frameOf(html, 'b')).toBe(0);
  });

  it('accepts fragments, arrays and empty children', () => {
    const html = renderAt(
      12,
      <Series>
        <>
          <Series.Sequence durationInFrames={5}><ShowConfig id="a" /></Series.Sequence>
        </>
        {[1, 2].map((n) => (
          <Series.Sequence key={n} durationInFrames={5}><ShowConfig id={`m${n}`} /></Series.Sequence>
        ))}
        {false}
        {null}
      </Series>,
    );
    expect(frameOf(html, 'm2')).toBe(2);
  });

  it('throws on children that are not Series.Sequence', () => {
    expect(() =>
      renderAt(0, <Series><Sequence from={0} durationInFrames={10}><ShowConfig id="a" /></Sequence></Series>),
    ).toThrow(/children must be <Series.Sequence> elements, got <Sequence> at index 0/);
    expect(() => renderAt(0, <Series>text</Series>)).toThrow(/got the string "text"/);
    expect(() => renderAt(0, <Series.Sequence durationInFrames={10}>x</Series.Sequence>)).toThrow(
      /must be a direct child of <Series>/,
    );
  });

  it('throws on a duration that is not a positive integer or an offset that is not an integer', () => {
    for (const durationInFrames of [0, -5, 2.5, Number.NaN, Infinity]) {
      expect(() =>
        renderAt(0, <Series><Series.Sequence durationInFrames={durationInFrames}>x</Series.Sequence></Series>),
      ).toThrow(/durationInFrames must be a positive integer/);
    }
    expect(() =>
      renderAt(0, <Series><Series.Sequence durationInFrames={5} offset={1.5}>x</Series.Sequence></Series>),
    ).toThrow(/offset must be an integer/);
  });
});
