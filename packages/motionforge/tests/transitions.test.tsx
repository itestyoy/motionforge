// @vitest-environment happy-dom
import React, { act, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { FrameProvider, useCurrentFrame, useVideoConfig } from '../src/core/context';
import { createRenderGate } from '../src/core/render-gate';
import { DelayRenderApi, useDelayRender } from '../src/core/delay-render';
import { measureSpring, spring } from '../src/utils/animation';
import { Easing } from '../src/utils/animation';
import { TransitionSeries } from '../src/components/transitions/TransitionSeries';
import { linearTiming, springTiming } from '../src/components/transitions/timings';
import { useTransitionProgress } from '../src/components/transitions/context';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../src/components/transitions/types';
import { fade } from '../src/components/transitions/presentations/fade';
import { slide } from '../src/components/transitions/presentations/slide';
import { wipe } from '../src/components/transitions/presentations/wipe';
import { flip } from '../src/components/transitions/presentations/flip';
import { cube } from '../src/components/transitions/presentations/cube';
import { clockWipe } from '../src/components/transitions/presentations/clock-wipe';
import { iris } from '../src/components/transitions/presentations/iris';
import { none } from '../src/components/transitions/presentations/none';
import { pushCut } from '../src/components/transitions/presentations/push-cut';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const renderAt = (frame: number, node: React.ReactNode) =>
  renderToStaticMarkup(
    <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100}>
      {node}
    </FrameProvider>,
  );

// A scene that shows its frame, its length and the transition progress.
const Scene = ({ id }: { id: string }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { entering, exiting, isInTransitionSeries } = useTransitionProgress();
  return (
    <i data-id={id} data-duration={durationInFrames} data-entering={entering} data-exiting={exiting} data-in={String(isInTransitionSeries)}>
      {frame}
    </i>
  );
};

const scene = (html: string, id: string) => {
  const match = html.match(
    new RegExp(`data-id="${id}" data-duration="(\\d+)" data-entering="([\\d.e-]+)" data-exiting="([\\d.e-]+)" data-in="(\\w+)">(-?\\d+)<`),
  );
  return match
    ? { frame: Number(match[5]), duration: Number(match[1]), entering: Number(match[2]), exiting: Number(match[3]) }
    : null;
};

const twoScenes = (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={40}>
      <Scene id="a" />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 30 })} presentation={fade()} />
    <TransitionSeries.Sequence durationInFrames={60}>
      <Scene id="b" />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);

describe('TransitionSeries', () => {
  it('overlaps two scenes during a transition, each with its own frames and length', () => {
    // A: frames 0-39, B: 40 - 30 = 10 to 69 (60 + 40 - 30 = 70 frames in all).
    expect(scene(renderAt(5, twoScenes), 'a')).toEqual({ frame: 5, duration: 40, entering: 1, exiting: 0 });
    expect(scene(renderAt(5, twoScenes), 'b')).toBeNull();
    expect(scene(renderAt(25, twoScenes), 'a')).toEqual({ frame: 25, duration: 40, entering: 1, exiting: 0.5 });
    expect(scene(renderAt(25, twoScenes), 'b')).toEqual({ frame: 15, duration: 60, entering: 0.5, exiting: 0 });
    expect(scene(renderAt(40, twoScenes), 'a')).toBeNull();
    expect(scene(renderAt(40, twoScenes), 'b')).toEqual({ frame: 30, duration: 60, entering: 1, exiting: 0 });
    expect(scene(renderAt(69, twoScenes), 'b')).toEqual({ frame: 59, duration: 60, entering: 1, exiting: 0 });
    expect(renderAt(70, twoScenes)).not.toContain('data-id');
  });

  it('passes the progress to the presentation: fade', () => {
    const html = renderAt(25, twoScenes);
    // The entering scene fades in; the exiting one stays opaque.
    expect(html).toMatch(/opacity:0\.5[^"]*"><i data-id="b"/);
    expect(html).toMatch(/opacity:1[^"]*"><i data-id="a"/);
  });

  it('shortens the series by each transition, as in Remotion (40 + 60 + 90 - 30 - 45 = 115)', () => {
    const three = (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40}><Scene id="a" /></TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 30 })} />
        <TransitionSeries.Sequence durationInFrames={60}><Scene id="b" /></TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 45 })} />
        <TransitionSeries.Sequence durationInFrames={90}><Scene id="c" /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    // C starts at 40 - 30 + 60 - 45 = 25.
    expect(scene(renderAt(24, three), 'c')).toBeNull();
    expect(scene(renderAt(25, three), 'c')).toEqual({ frame: 0, duration: 90, entering: 0, exiting: 0 });
    expect(scene(renderAt(114, three), 'c')?.frame).toBe(89);
    expect(renderAt(115, three)).not.toContain('data-id');
    // B is entering and exiting at the same time: 10 + 30 = 40 is past its entrance, 25 starts its exit.
    expect(scene(renderAt(30, three), 'b')).toEqual({ frame: 20, duration: 60, entering: 2 / 3, exiting: 5 / 45 });
  });

  it('defaults to slide() and counts offsets', () => {
    const series = (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={20}><Scene id="a" /></TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} />
        <TransitionSeries.Sequence durationInFrames={20} offset={5}><Scene id="b" /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    // B starts at 20 - 10 + 5 = 15.
    expect(scene(renderAt(15, series), 'b')?.frame).toBe(0);
    expect(renderAt(20, series)).toContain('transform:translateX(-50%)');
  });

  it('animates the entrance or exit with a transition first or last', () => {
    const entrance = (
      <TransitionSeries>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={40}><Scene id="a" /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    expect(scene(renderAt(0, entrance), 'a')).toEqual({ frame: 0, duration: 40, entering: 0, exiting: 0 });
    expect(scene(renderAt(5, entrance), 'a')?.entering).toBe(0.5);
    expect(scene(renderAt(39, entrance), 'a')?.frame).toBe(39);
    expect(renderAt(40, entrance)).not.toContain('data-id');

    const exit = (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40}><Scene id="a" /></TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} presentation={fade({ shouldFadeOutExitingScene: true })} />
      </TransitionSeries>
    );
    expect(scene(renderAt(29, exit), 'a')?.exiting).toBe(0);
    expect(scene(renderAt(35, exit), 'a')?.exiting).toBe(0.5);
    expect(renderAt(35, exit)).toMatch(/opacity:0\.5[^"]*"><i data-id="a"/);
  });

  it('renders an overlay on top of the cut without shortening the series', () => {
    const series = (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={60}><Scene id="a" /></TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={20}><Scene id="flash" /></TransitionSeries.Overlay>
        <TransitionSeries.Sequence durationInFrames={60}><Scene id="b" /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    expect(scene(renderAt(49, series), 'flash')).toBeNull();
    expect(scene(renderAt(50, series), 'flash')).toEqual({ frame: 0, duration: 20, entering: 1, exiting: 0 });
    // The overlay comes after both scenes, so it is on top.
    const html = renderAt(60, series);
    expect(html.indexOf('data-id="flash"')).toBeGreaterThan(html.indexOf('data-id="b"'));
    expect(scene(html, 'b')?.frame).toBe(0);
    expect(scene(renderAt(119, series), 'b')?.frame).toBe(59);
    // An offset moves it from the center of the cut.
    const shifted = (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={60}><Scene id="a" /></TransitionSeries.Sequence>
        <TransitionSeries.Overlay durationInFrames={20} offset={-5}><Scene id="flash" /></TransitionSeries.Overlay>
        <TransitionSeries.Sequence durationInFrames={60}><Scene id="b" /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    expect(scene(renderAt(45, shifted), 'flash')?.frame).toBe(0);
  });

  it('checks overlays as Remotion does', () => {
    const overlay = (props: { durationInFrames: number; offset?: number }, before = 60, after = 60) => (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={30}>{null}</TransitionSeries.Sequence>
        <TransitionSeries.Sequence durationInFrames={before}>{null}</TransitionSeries.Sequence>
        <TransitionSeries.Overlay {...props}>{null}</TransitionSeries.Overlay>
        <TransitionSeries.Sequence durationInFrames={after}>{null}</TransitionSeries.Sequence>
      </TransitionSeries>
    );
    expect(() => renderAt(0, overlay({ durationInFrames: 20, offset: -31 }, 5))).toThrow(/extends before frame 0/);
    expect(() => renderAt(0, overlay({ durationInFrames: 20, offset: -25 }, 30))).toThrow(/extends beyond the previous sequence/);
    expect(() =>
      renderAt(
        0,
        <TransitionSeries>
          <TransitionSeries.Overlay durationInFrames={20}>{null}</TransitionSeries.Overlay>
          <TransitionSeries.Sequence durationInFrames={30}>{null}</TransitionSeries.Sequence>
        </TransitionSeries>,
      ),
    ).toThrow(/extends before frame 0/);
    expect(() => renderAt(0, overlay({ durationInFrames: 20 }, 60, 5))).toThrow(/extends beyond the next sequence/);
    expect(() => renderAt(0, overlay({ durationInFrames: 2.5 }))).toThrow(/durationInFrames must be a positive integer/);
    expect(() => renderAt(0, overlay({ durationInFrames: 20, offset: 0.5 }))).toThrow(/offset must be an integer/);
  });

  it('enforces the rules of a TransitionSeries', () => {
    const t = <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} />;
    const o = <TransitionSeries.Overlay durationInFrames={10}>{null}</TransitionSeries.Overlay>;
    const s = (duration = 20) => <TransitionSeries.Sequence durationInFrames={duration}>{null}</TransitionSeries.Sequence>;
    const series = (...children: React.ReactElement[]) => (
      <TransitionSeries>{children.map((child, key) => React.cloneElement(child, { key }))}</TransitionSeries>
    );
    expect(() => renderAt(0, series(s(), t, t, s()))).toThrow(/Transition> must not be followed by a <TransitionSeries.Transition>/);
    expect(() => renderAt(0, series(s(), t, o, s()))).toThrow(/Transition> must not be followed by a <TransitionSeries.Overlay>/);
    expect(() => renderAt(0, series(s(), o, t, s()))).toThrow(/Overlay> must not be followed by a <TransitionSeries.Transition>/);
    expect(() => renderAt(0, series(t))).toThrow(/needs a <TransitionSeries.Sequence> before or after it/);
    expect(() => renderAt(0, series(s(5), t, s()))).toThrow(/must not be shorter than the next <TransitionSeries.Transition>/);
    expect(() => renderAt(0, series(s(), t, s(5)))).toThrow(/must not be shorter than the previous <TransitionSeries.Transition>/);
    expect(() => renderAt(0, <TransitionSeries><div /></TransitionSeries>)).toThrow(/children must be <TransitionSeries.Sequence>.*got <div>/);
    expect(() => renderAt(0, <TransitionSeries>text</TransitionSeries>)).toThrow(/got the string "text"/);
    expect(() => renderAt(0, s())).toThrow(/must be a direct child of <TransitionSeries>/);
    expect(() => renderAt(0, series(<TransitionSeries.Sequence durationInFrames={0}>{null}</TransitionSeries.Sequence>))).toThrow(
      /durationInFrames must be a positive integer/,
    );
    const noneLayout = { durationInFrames: 10, layout: 'none' } as unknown as React.ComponentProps<typeof TransitionSeries.Sequence>;
    expect(() => renderAt(0, series(<TransitionSeries.Sequence {...noneLayout}>{null}</TransitionSeries.Sequence>))).toThrow(
      /must be absolutely positioned/,
    );
    const rate = { durationInFrames: 10, playbackRate: 2 } as unknown as React.ComponentProps<typeof TransitionSeries.Sequence>;
    expect(() => renderAt(0, series(<TransitionSeries.Sequence {...rate}>{null}</TransitionSeries.Sequence>))).toThrow(
      /does not take "playbackRate": put a <Retiming> inside the scene instead/,
    );
    const badTiming = { timing: { getDurationInFrames: () => 2.5, getProgress: () => 0 } };
    expect(() => renderAt(0, series(s(), <TransitionSeries.Transition {...badTiming} />, s()))).toThrow(
      /getDurationInFrames\(\) must return a non-negative integer, got 2.5/,
    );
  });

  it('is a Sequence itself: from, durationInFrames and style', () => {
    const series = (
      <TransitionSeries from={10} durationInFrames={50} style={{ background: 'red' }}>
        <TransitionSeries.Sequence durationInFrames={100}><Scene id="a" /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    expect(renderAt(9, series)).not.toContain('data-id');
    expect(scene(renderAt(12, series), 'a')?.frame).toBe(2);
    expect(renderAt(12, series)).toContain('background:red');
    expect(renderAt(60, series)).not.toContain('data-id');
  });

  it('passes the transition length and both sides to custom presentations', () => {
    const seen: Array<Pick<TransitionPresentationComponentProps<{ tag: string }>, 'presentationDirection' | 'presentationDurationInFrames' | 'bothEnteringAndExiting' | 'passedProps'>> = [];
    const Custom = ({ children, ...props }: TransitionPresentationComponentProps<{ tag: string }>) => {
      seen.push({
        presentationDirection: props.presentationDirection,
        presentationDurationInFrames: props.presentationDurationInFrames,
        bothEnteringAndExiting: props.bothEnteringAndExiting,
        passedProps: props.passedProps,
      });
      return <>{children}</>;
    };
    renderAt(
      15,
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={20}>{null}</TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 8 })} presentation={{ component: Custom, props: { tag: 'x' } }} />
        <TransitionSeries.Sequence durationInFrames={20}>{null}</TransitionSeries.Sequence>
      </TransitionSeries>,
    );
    expect(seen).toEqual([
      { presentationDirection: 'exiting', presentationDurationInFrames: 8, bothEnteringAndExiting: false, passedProps: { tag: 'x' } },
      { presentationDirection: 'entering', presentationDurationInFrames: 8, bothEnteringAndExiting: false, passedProps: { tag: 'x' } },
    ]);
  });

  it('tells useTransitionProgress() it is outside a TransitionSeries', () => {
    expect(renderAt(3, <Scene id="x" />)).toContain('data-entering="1" data-exiting="0" data-in="false"');
  });
});

describe('timings', () => {
  it('linearTiming: progress from 0 to 1 over durationInFrames, clamped, with easing', () => {
    const timing = linearTiming({ durationInFrames: 10 });
    expect(timing.getDurationInFrames({ fps: 30 })).toBe(10);
    expect([-1, 0, 5, 10, 11].map((frame) => timing.getProgress({ frame, fps: 30 }))).toEqual([0, 0, 0.5, 1, 1]);
    const eased = linearTiming({ durationInFrames: 10, easing: Easing.in(Easing.quad) });
    expect(eased.getProgress({ frame: 5, fps: 30 })).toBeCloseTo(0.25, 12);
    expect(() => linearTiming({ durationInFrames: 0 })).toThrow(/durationInFrames must be a positive integer/);
    expect(() => linearTiming({ durationInFrames: 2.5 })).toThrow(/durationInFrames must be a positive integer/);
  });

  it('springTiming: lasts until the spring settles, or durationInFrames; progress is spring()', () => {
    const config = { damping: 20 };
    const timing = springTiming({ config });
    // As in Remotion (where a damping of 20 settles after 23 frames at 30 fps).
    expect(timing.getDurationInFrames({ fps: 30 })).toBe(23);
    expect(timing.getDurationInFrames({ fps: 30 })).toBe(measureSpring({ fps: 30, config }));
    expect(timing.getProgress({ frame: 8, fps: 30 })).toBe(spring({ frame: 8, fps: 30, config }));
    expect(timing.getProgress({ frame: 8, fps: 30 })).toBeCloseTo(0.74523, 5);
    expect(springTiming({ durationInFrames: 20 }).getDurationInFrames({ fps: 30 })).toBe(20);
    expect(springTiming({ durationRestThreshold: 0.1 }).getDurationInFrames({ fps: 30 })).toBe(
      measureSpring({ fps: 30, threshold: 0.1 }),
    );
    // reverse plays the spring backwards in time, still from 0 to 1.
    const reversed = springTiming({ config, reverse: true });
    expect(reversed.getProgress({ frame: 0, fps: 30 })).toBeCloseTo(0, 2);
    expect(reversed.getProgress({ frame: 10, fps: 30 })).toBe(
      spring({ frame: 10, fps: 30, config, from: 1, to: 0, reverse: true }),
    );
    expect(reversed.getProgress({ frame: 23, fps: 30 })).toBe(1);
    expect(() => springTiming({ durationInFrames: -1 })).toThrow(/durationInFrames must be a positive integer/);
  });
});

describe('presentations', () => {
  const at = <P extends Record<string, unknown>>(
    presentation: TransitionPresentation<P>,
    progress: number,
    direction: 'entering' | 'exiting',
  ) => {
    const Component = presentation.component as React.ComponentType<TransitionPresentationComponentProps<P>>;
    return renderToStaticMarkup(
      <Component
        presentationProgress={progress}
        presentationDirection={direction}
        passedProps={presentation.props}
        presentationDurationInFrames={22}
        bothEnteringAndExiting={false}
      >
        <b>x</b>
      </Component>,
    );
  };

  it("render the styles of Remotion's presentations", () => {
    // These strings are what @remotion/transitions 4.0.542 renders.
    expect(at(slide({ direction: 'from-right' }), 0.5, 'entering')).toBe(
      '<div style="position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;align-items:center;transform:translateX(50.01%)"><b>x</b></div>',
    );
    expect(at(slide({ direction: 'from-right' }), 0.5, 'exiting')).toContain('transform:translateX(-50%)');
    expect(at(wipe({ direction: 'from-top-left' }), 0.2, 'entering')).toContain('clip-path:polygon(0% 0%, 40% 0%, 0% 40%)');
    expect(at(flip(), 0.5, 'entering')).toContain('transform:rotateY(-90deg)');
    expect(at(cube({ direction: 'from-bottom' }), 0.5, 'exiting')).toContain('transform-origin:bottom;transform:translateY(-50%) rotateX(45deg)');
    expect(at(iris({ width: 300, height: 400 }), 0.5, 'entering')).toContain(
      'clip-path:path(&quot;M 150 75 a 125 125 0 1 1 0 250 a 125 125 0 1 1 0 -250 Z&quot;)',
    );
    expect(at(iris({ width: 300, height: 400 }), 0.5, 'exiting')).not.toContain('clip-path');
    expect(at(clockWipe({ width: 300, height: 400 }), 0.25, 'entering')).toContain('clip-path:path(&quot;M 150 -50 A 250 250 0 0 1 400 200 L 150 200 Z&quot;)');
    expect(at(none({ exitStyle: { opacity: 0.3 } }), 0.5, 'exiting')).toContain('opacity:0.3');
    expect(at(pushCut(), 0.2, 'entering')).toMatch(/^<div style="[^"]*opacity:0/);
    expect(at(pushCut(), 0.5, 'entering')).toBe(
      '<div style="position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;display:flex;flex-direction:column;opacity:1;overflow:hidden"><div style="position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;display:flex;flex-direction:column;transform:scale(1.0447916666666668);transform-origin:50% 50%;will-change:transform"><b>x</b></div><div style="position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;display:flex;flex-direction:column;background-color:#f5f2ed;opacity:0.09999999999999994;pointer-events:none"></div></div>',
    );
  });

  it('throw on wrong options', () => {
    // @ts-expect-error not a direction
    expect(() => slide({ direction: 'left' })).toThrow(/direction must be one of "from-left"/);
    // @ts-expect-error direction is required
    expect(() => cube({})).toThrow(/direction must be one of/);
    // @ts-expect-error width and height are required
    expect(() => iris({})).toThrow(/width must be a positive number/);
    expect(() => clockWipe({ width: 100, height: 0 })).toThrow(/height must be a positive number/);
    expect(() => flip({ perspective: -1 })).toThrow(/perspective must be a positive number/);
    expect(() => pushCut({ cutProgress: 1 })).toThrow(/cutProgress must be greater than 0 and less than 1/);
    expect(() => pushCut({ flashOpacity: 2 })).toThrow(/flashOpacity must be between 0 and 1/);
  });
});

describe('TransitionSeries with premounting and the render gate', () => {
  let container: HTMLDivElement;
  let root: Root;
  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const mounts: string[] = [];
  const Probe = ({ id, api }: { id: string; api: { current: DelayRenderApi | null; handle?: number } }) => {
    const frame = useCurrentFrame();
    const instance = useRef(`${id}-${Math.random()}`);
    const delay = useDelayRender();
    useEffect(() => {
      mounts.push(instance.current);
      api.current = delay;
      api.handle = delay.delayRender(id);
    }, []);
    return <i data-probe={id}>{frame}</i>;
  };

  it('premounts the next scene, keeps it mounted through the transition and holds the gate only once it shows', async () => {
    mounts.length = 0;
    const gate = createRenderGate();
    const a = { current: null as DelayRenderApi | null, handle: undefined as number | undefined };
    const b = { current: null as DelayRenderApi | null, handle: undefined as number | undefined };
    const series = (
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40}><Probe id="a" api={a} /></TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={40} premountFor={15}><Probe id="b" api={b} /></TransitionSeries.Sequence>
      </TransitionSeries>
    );
    const renderAt = (frame: number) =>
      act(() =>
        root.render(
          <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100} gate={gate}>
            {series}
          </FrameProvider>,
        ),
      );

    // B starts at 30 and is premounted from 15 on, invisible and at its frame 0.
    renderAt(20);
    expect(container.querySelector('[data-probe="b"]')!.textContent).toBe('0');
    act(() => a.current!.continueRender(a.handle!));
    expect(gate.getPending()).toEqual([]);

    renderAt(35);
    expect(container.querySelector('[data-probe="a"]')!.textContent).toBe('35');
    expect(container.querySelector('[data-probe="b"]')!.textContent).toBe('5');
    expect(gate.getPending().map((pending) => pending.label)).toEqual(['b']);
    act(() => b.current!.continueRender(b.handle!));
    await expect(gate.waitUntilReady({ frame: 35, timeoutMs: 1000 })).resolves.toBeUndefined();

    renderAt(45);
    // Each scene mounted once, through premounting and the transition.
    expect(mounts.filter((m) => m.startsWith('a'))).toHaveLength(1);
    expect(mounts.filter((m) => m.startsWith('b'))).toHaveLength(1);
    expect(container.querySelector('[data-probe="a"]')).toBeNull();
  });
});
