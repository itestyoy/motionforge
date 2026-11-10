import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrameProvider, useCurrentFrame, useVideoConfig } from '../src/core/context';
import { Composition } from '../src/components/Composition';
import { Freeze, Loop, Retiming, Reverse, Sequence, Series } from '../src/components/Sequence';
import { useFade, useProgress, useTimeline } from '../src/hooks/animation';
import { useMemoizedFrame } from '../src/hooks/performance';
import * as entry from '../src/index';

const ShowFrame = ({ id }: { id: string }) => <i data-id={id}>{useCurrentFrame()}</i>;
const ShowDuration = ({ id }: { id: string }) => <i data-id={id}>{useVideoConfig().durationInFrames}</i>;

const renderAt = (frame: number, node: React.ReactNode, durationInFrames = 300) =>
  renderToStaticMarkup(
    <FrameProvider frame={frame} fps={30} durationInFrames={durationInFrames} width={100} height={100}>
      {node}
    </FrameProvider>,
  );

const valueOf = (html: string, id: string) => {
  const match = html.match(new RegExp(`data-id="${id}">([^<]*)<`));
  return match ? match[1] : null;
};

describe('FrameProvider', () => {
  it('rejects frames the composition does not have', () => {
    for (const frame of [-1, 90, 500, 1.5, Number.NaN]) {
      expect(() => renderAt(frame, null, 90)).toThrow(/frame must be an integer from 0 to 89/);
    }
    expect(() => renderAt(89, null, 90)).not.toThrow();
  });

  it('rejects a non-positive config', () => {
    const render = (props: { fps?: number; durationInFrames?: number; width?: number; height?: number }) => () =>
      renderToStaticMarkup(
        <FrameProvider frame={0} fps={props.fps ?? 30} durationInFrames={props.durationInFrames ?? 10} width={props.width ?? 100} height={props.height ?? 100}>
          {null}
        </FrameProvider>,
      );
    expect(render({ fps: 0 })).toThrow(/fps must be a positive number/);
    expect(render({ fps: Number.NaN })).toThrow(/fps must be a positive number/);
    expect(render({ width: 0 })).toThrow(/width and height must be positive/);
    expect(render({ height: -1 })).toThrow(/width and height must be positive/);
    expect(render({ durationInFrames: 0 })).toThrow(/durationInFrames must be a positive integer/);
    expect(render({ durationInFrames: 2.5 })).toThrow(/durationInFrames must be a positive integer/);
  });

  it('validates through Composition too', () => {
    const Empty = () => null;
    expect(() =>
      renderToStaticMarkup(<Composition id="c" component={Empty} frame={500} durationInFrames={90} />),
    ).toThrow(/frame must be an integer/);
  });
});

describe('useMemoizedFrame', () => {
  it('keeps each component its own value', () => {
    const A = () => <i data-id="A">{useMemoizedFrame(() => 'value-of-A', [])}</i>;
    const B = () => <i data-id="B">{useMemoizedFrame(() => 'value-of-B', [])}</i>;
    const html = renderAt(5, <><A /><B /></>);
    expect(valueOf(html, 'A')).toBe('value-of-A');
    expect(valueOf(html, 'B')).toBe('value-of-B');
  });
});

describe('Retiming', () => {
  const at = (frame: number, rate: number | ((f: number) => number)) =>
    Number(valueOf(renderAt(frame, <Retiming playbackRate={rate}><ShowFrame id="a" /></Retiming>), 'a'));

  it('accumulates a variable rate instead of jumping', () => {
    const speedUp = (f: number) => (f < 30 ? 1 : 2);
    expect([at(29, speedUp), at(30, speedUp), at(31, speedUp)]).toEqual([29, 30, 32]);
    const slowDown = (f: number) => (f < 30 ? 2 : 1);
    expect([at(29, slowDown), at(30, slowDown), at(31, slowDown)]).toEqual([58, 60, 61]);
  });

  it('is the same at a frame whatever was rendered before', () => {
    const ramp = (f: number) => 0.5 + f / 100;
    const forward = Array.from({ length: 100 }, (_, f) => at(f, ramp));
    const backward = Array.from({ length: 100 }, (_, i) => at(99 - i, ramp)).reverse();
    expect(backward).toEqual(forward);
    forward.slice(1).forEach((value, i) => expect(value).toBeGreaterThanOrEqual(forward[i]));
  });

  it('keeps a constant rate', () => {
    expect(at(10, 1.5)).toBe(15);
  });

  it('rejects a rate that is not a finite number', () => {
    expect(() => at(10, () => Number.NaN)).toThrow(/playbackRate must be a finite number/);
  });
});

describe('durationInFrames inside sequences', () => {
  it('is the sequence duration inside a Sequence', () => {
    const html = renderAt(149, <Sequence from={60} durationInFrames={90}><ShowDuration id="d" /></Sequence>);
    expect(valueOf(html, 'd')).toBe('90');
  });

  it('runs to the end of the parent when the Sequence has no duration', () => {
    const html = renderAt(100, <Sequence from={60}><ShowDuration id="d" /></Sequence>);
    expect(valueOf(html, 'd')).toBe('240');
  });

  it('is the loop length inside a Loop', () => {
    expect(valueOf(renderAt(25, <Loop durationInFrames={10}><ShowDuration id="d" /></Loop>), 'd')).toBe('10');
  });

  it("is each Series.Sequence's own duration inside a Series", () => {
    const html = renderAt(
      15,
      <Series>
        <Series.Sequence durationInFrames={10}><ShowDuration id="first" /></Series.Sequence>
        <Series.Sequence durationInFrames={20}><ShowDuration id="second" /></Series.Sequence>
      </Series>,
    );
    expect(valueOf(html, 'second')).toBe('20');
  });

  it('lets useFade fade out on the last frame of the sequence', () => {
    const Opacity = () => <i data-id="o">{useFade(10, 10)}</i>;
    const html = renderAt(149, <Sequence from={60} durationInFrames={90}><Opacity /></Sequence>);
    expect(Number(valueOf(html, 'o'))).toBe(0);
  });
});

describe('Sequence layout="none"', () => {
  it('renders no wrapper element', () => {
    expect(renderAt(5, <Sequence from={0} layout="none"><span>x</span></Sequence>)).toBe('<span>x</span>');
  });
});

describe('Freeze', () => {
  it('shows `frame` while active, the current frame otherwise (Remotion semantics)', () => {
    const at = (f: number, active?: boolean | ((frame: number) => boolean)) =>
      valueOf(renderAt(f, <Freeze frame={7} active={active}><ShowFrame id="a" /></Freeze>), 'a');
    expect([at(0), at(150), at(299)]).toEqual(['7', '7', '7']);
    expect(at(150, false)).toBe('150');
    const fromTen = (frame: number) => frame >= 10;
    expect([at(5, fromTen), at(10, fromTen), at(200, fromTen)]).toEqual(['5', '7', '7']);
  });

  it('keeps the parent duration in useVideoConfig()', () => {
    const html = renderAt(5, <Freeze frame={2}><ShowDuration id="d" /></Freeze>);
    expect(valueOf(html, 'd')).toBe('300');
  });

  it('throws on a frame that is not an integer or an active that is not a boolean', () => {
    expect(() => renderAt(0, <Freeze frame={1.5}><ShowFrame id="a" /></Freeze>)).toThrow(/frame must be an integer/);
    // @ts-expect-error not a boolean
    expect(() => renderAt(0, <Freeze frame={1} active="yes"><ShowFrame id="a" /></Freeze>)).toThrow(
      /active must be a boolean or a function/,
    );
    // @ts-expect-error returns a number
    expect(() => renderAt(0, <Freeze frame={1} active={() => 1}><ShowFrame id="a" /></Freeze>)).toThrow(
      /active\(0\) must return a boolean, got 1/,
    );
  });
});

describe('useFade / useProgress / useTimeline', () => {
  it('useFade reaches 0 on the last frame by default', () => {
    const Opacity = () => <i data-id="o">{useFade(10, 10)}</i>;
    expect(Number(valueOf(renderAt(299, <Opacity />), 'o'))).toBe(0);
    expect(Number(valueOf(renderAt(150, <Opacity />), 'o'))).toBe(1);
  });

  it('give a number for a one-frame composition', () => {
    const Progress = () => <i data-id="p">{useProgress()}</i>;
    const Timeline = () => <i data-id="t">{useTimeline().progress}</i>;
    const html = renderAt(0, <><Progress /><Timeline /></>, 1);
    expect(valueOf(html, 'p')).toBe('1');
    expect(valueOf(html, 't')).toBe('1');
    expect(valueOf(renderAt(150, <Progress />, 301), 'p')).toBe('0.5');
  });
});

describe('public hooks', () => {
  it('exports the Loop context hook as useLoopInfo', () => {
    const Info = () => {
      const { loopedFrame, currentLoop, durationInFrames } = entry.useLoopInfo();
      return <i data-id="l">{`${loopedFrame}/${currentLoop}/${durationInFrames}`}</i>;
    };
    expect(valueOf(renderAt(25, <entry.Loop durationInFrames={10}><Info /></entry.Loop>), 'l')).toBe('5/2/10');
  });

  it('does not export hooks that ignore their arguments', () => {
    for (const name of ['usePerformanceMonitor', 'useThrottledFrame', 'useBatchFrameProcessor', 'useRenderPriority']) {
      expect(entry).not.toHaveProperty(name);
    }
  });
});

describe('input checks', () => {
  it('Loop needs a positive integer duration and times, and a frame >= 0', () => {
    for (const durationInFrames of [0, -1, 2.5, Number.NaN]) {
      expect(() => renderAt(5, <Loop durationInFrames={durationInFrames}><ShowFrame id="a" /></Loop>)).toThrow(
        /Loop: durationInFrames must be a positive integer/,
      );
    }
    for (const times of [0, 1.5, -2]) {
      expect(() => renderAt(5, <Loop durationInFrames={10} times={times}><ShowFrame id="a" /></Loop>)).toThrow(
        /Loop: times must be a positive integer or Infinity/,
      );
    }
    expect(() =>
      renderAt(5, <Freeze frame={-3}><Loop durationInFrames={10}><ShowFrame id="a" /></Loop></Freeze>),
    ).toThrow(/Loop: the current frame must be >= 0, got -3/);
    expect(valueOf(renderAt(25, <Loop durationInFrames={10} times={3}><ShowFrame id="a" /></Loop>), 'a')).toBe('5');
    expect(valueOf(renderAt(30, <Loop durationInFrames={10} times={3}><ShowFrame id="a" /></Loop>), 'a')).toBeNull();
  });

  it('Sequence needs integer from and offset and a positive integer duration', () => {
    expect(() => renderAt(0, <Sequence from={1.5}><ShowFrame id="a" /></Sequence>)).toThrow(/from must be an integer/);
    expect(() => renderAt(0, <Sequence from={0} offset={Number.NaN}><ShowFrame id="a" /></Sequence>)).toThrow(
      /offset must be an integer/,
    );
    for (const durationInFrames of [0, -10, 1.5, Infinity]) {
      expect(() => renderAt(0, <Sequence from={0} durationInFrames={durationInFrames}><ShowFrame id="a" /></Sequence>)).toThrow(
        /durationInFrames must be a positive integer \(leave it out to run to the end\)/,
      );
    }
  });

  it('Reverse plays backwards with its own duration in useVideoConfig()', () => {
    const scene = <Reverse durationInFrames={20}><ShowFrame id="f" /><ShowDuration id="d" /></Reverse>;
    expect(valueOf(renderAt(0, scene), 'f')).toBe('19');
    expect(valueOf(renderAt(19, scene), 'f')).toBe('0');
    expect(valueOf(renderAt(5, scene), 'd')).toBe('20');
    expect(() => renderAt(0, <Reverse durationInFrames={0}><ShowFrame id="f" /></Reverse>)).toThrow(
      /Reverse: durationInFrames must be a positive integer/,
    );
    expect(() => renderAt(0, <Freeze frame={-1}><Reverse durationInFrames={5}>{null}</Reverse></Freeze>)).toThrow(
      /Reverse: the current frame must be >= 0/,
    );
  });
});
