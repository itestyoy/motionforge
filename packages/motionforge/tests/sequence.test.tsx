import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrameContext, useCurrentFrame } from '../src/core/context';
import { Freeze, Loop, Sequence, Series, useRelativeCurrentFrame } from '../src/components/Sequence';

const ShowFrame = ({ id }: { id: string }) => <i data-id={id}>{useCurrentFrame()}</i>;

const renderAt = (frame: number, node: React.ReactNode) =>
  renderToStaticMarkup(
    <FrameContext.Provider
      value={{
        frame,
        fps: 30,
        durationInFrames: 300,
        width: 100,
        height: 100,
        playing: false,
        playbackRate: 1,
        setFrame: () => {},
        setPlaying: () => {},
        setPlaybackRate: () => {},
      }}
    >
      {node}
    </FrameContext.Provider>,
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
    expect(frameOf(renderAt(3, <Freeze frame={7} durationInFrames={10}><ShowFrame id="a" /></Freeze>), 'a')).toBe(7);
  });

  it('Series hands each child its own local frame', () => {
    const html = renderAt(
      15,
      <Series>
        <Sequence from={0} durationInFrames={10}><ShowFrame id="first" /></Sequence>
        <Sequence from={0} durationInFrames={10}><ShowFrame id="second" /></Sequence>
      </Series>,
    );
    expect(frameOf(html, 'first')).toBeNull();
    expect(frameOf(html, 'second')).toBe(5);
  });
});
