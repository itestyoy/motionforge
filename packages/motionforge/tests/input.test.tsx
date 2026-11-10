// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider, useCurrentFrame } from '../src/core/context';
import { InputEvent } from '../src/core/input-log';
import { useEmitInput, useInputEvents, useLastEvent, useReducedState } from '../src/core/input';
import { Freeze, Loop, Sequence } from '../src/components/Sequence';
import { Composition } from '../src/components/Composition';
import { spring } from '../src/utils/animation';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
  vi.restoreAllMocks();
});

const DURATION = 120;

const renderAt = (frame: number, node: React.ReactNode, input?: readonly InputEvent[], onInput?: (event: InputEvent) => void) => {
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={DURATION} width={100} height={100} input={input} onInput={onInput}>
        {node}
      </FrameProvider>,
    ),
  );
  return container.innerHTML;
};

type Tap = InputEvent & { type: 'tap'; cell: number };

// A small playable: tapping cells fills them; the last tap pops; after 30
// idle frames a hint shows. The handler only emits.
const reducer = vi.fn((filled: readonly number[], event: Tap) =>
  event.type === 'tap' && !filled.includes(event.cell) ? [...filled, event.cell] : filled,
);
const Board = () => {
  const frame = useCurrentFrame();
  const emit = useEmitInput();
  const filled = useReducedState(reducer, [] as readonly number[]);
  const tap = useLastEvent<Tap>((e) => e.type === 'tap');
  const idle = useLastEvent()?.framesSince ?? frame;
  const pop = tap ? spring({ frame: tap.framesSince, fps: 30 }) : 0;
  return (
    <div>
      {[0, 1, 2, 3].map((cell) => (
        <button key={cell} data-cell={cell} data-on={filled.includes(cell)} onClick={() => emit({ type: 'tap', cell })} />
      ))}
      <b data-pop={pop.toFixed(4)} data-hint={idle > 30} />
    </div>
  );
};

const scripted: Tap[] = [
  { frame: 10, type: 'tap', cell: 2 },
  { frame: 25, type: 'tap', cell: 0 },
  { frame: 25, type: 'tap', cell: 0 },
  { frame: 70, type: 'tap', cell: 3 },
];

describe('playable input log', () => {
  it('renders a scripted log (video) and a live log (play) with the same events to identical frames', () => {
    const video = Array.from({ length: DURATION }, (_, frame) => renderAt(frame, <Board />, scripted));
    act(() => root.unmount());
    root = createRoot(container);
    // Live: the host appends each tap at the frame it happens, by clicking.
    let log: readonly InputEvent[] = [];
    const onInput = (event: InputEvent) => {
      log = [...log, event];
    };
    const live: string[] = [];
    for (let frame = 0; frame < DURATION; frame++) {
      renderAt(frame, <Board />, log, onInput);
      for (const event of scripted.filter((e) => e.frame === frame)) {
        act(() => (container.querySelector(`[data-cell="${event.cell}"]`) as HTMLElement).click());
      }
      // The frame is shown again with the new events.
      live.push(renderAt(frame, <Board />, log, onInput));
    }
    expect(log).toEqual(scripted);
    expect(live).toEqual(video);
    expect(video[9]).toContain('data-hint="false"');
    expect(video[60]).toContain('data-hint="true"');
    expect(video[69]).toMatch(/data-cell="3" data-on="false"/);
    expect(video[70]).toMatch(/data-cell="3" data-on="true"/);
  });

  it('gives the same frames when seeking back and forth, folding each event once', () => {
    const sequential = Array.from({ length: DURATION }, (_, frame) => renderAt(frame, <Board />, scripted));
    act(() => root.unmount());
    root = createRoot(container);
    reducer.mockClear();
    const order = Array.from({ length: DURATION }, (_, i) => (i * 37) % DURATION);
    for (const frame of [...order, ...order.reverse()]) {
      expect(renderAt(frame, <Board />, scripted), `frame ${frame}`).toBe(sequential[frame]);
    }
    // Every event folded once, however often the frames were visited.
    expect(reducer).toHaveBeenCalledTimes(scripted.length);
  });

  it('folds only new events when frames move forward and the log grows', () => {
    const Count = () => <i>{useReducedState((n: number) => n + 1, 0)}</i>;
    const fold = vi.fn((n: number) => n + 1);
    const Counted = () => <i>{useReducedState(fold, 0)}</i>;
    let log: InputEvent[] = [];
    for (let frame = 0; frame < 60; frame++) {
      log = [...log, { frame, type: 'tick' }];
      expect(renderAt(frame, <Counted />, log)).toBe(`<i>${frame + 1}</i>`);
    }
    expect(fold).toHaveBeenCalledTimes(60);
    // A log that is not an extension (another session) is folded again.
    const other = [{ frame: 0, type: 'tick' }];
    expect(renderAt(59, <Counted />, other)).toBe('<i>1</i>');
    expect(fold).toHaveBeenCalledTimes(61);
    expect(renderAt(0, <Count />, [])).toBe('<i>0</i>');
  });

  it("maps event frames into a Sequence's frames, as useCurrentFrame() counts them", () => {
    const Probe = () => {
      const events = useInputEvents();
      const last = useLastEvent();
      return <i data-frame={useCurrentFrame()} data-events={events.map((e) => e.frame).join(',')} data-since={last?.framesSince ?? -1} />;
    };
    const log = [
      { frame: 5, type: 'a' },
      { frame: 30, type: 'b' },
      { frame: 40, type: 'c' },
      { frame: 50, type: 'd' },
    ];
    const scene = (
      <Sequence from={30} premountFor={10}>
        <Probe />
      </Sequence>
    );
    // At 45 the sequence is at its frame 15: events at 30 and 40 are at its frames 0 and 10; the one at 5 was before it.
    expect(renderAt(45, scene, log)).toContain('data-frame="15" data-events="0,10" data-since="5"');
    // Premounted, it renders its frame 0.
    expect(renderAt(22, scene, log)).toContain('data-frame="0" data-events="0" data-since="0"');
    // Nested sequences add up; a Loop starts every iteration afresh.
    expect(renderAt(55, <Sequence from={20}><Sequence from={10}><Probe /></Sequence></Sequence>, log)).toContain(
      'data-frame="25" data-events="0,10,20" data-since="5"',
    );
    expect(renderAt(55, <Loop durationInFrames={25}><Probe /></Loop>, log)).toContain('data-frame="5" data-events="0" data-since="5"');
    // Freeze shows the state at the frozen frame.
    expect(renderAt(55, <Freeze frame={35}><Probe /></Freeze>, log)).toContain('data-frame="35" data-events="5,30" data-since="5"');
  });

  it('stamps emitted events with the composition frame shown, also inside a Sequence', () => {
    const onInput = vi.fn();
    const Button = () => {
      const emit = useEmitInput();
      return <button onClick={() => emit({ type: 'tap', x: 3 })} />;
    };
    renderAt(47, <Sequence from={40}><Button /></Sequence>, [], onInput);
    act(() => container.querySelector('button')!.click());
    expect(onInput).toHaveBeenCalledWith({ type: 'tap', x: 3, frame: 47 });
    // Without onInput (a video) the event is dropped.
    renderAt(47, <Button />);
    expect(() => act(() => container.querySelector('button')!.click())).not.toThrow();
  });

  it('passes the log through Composition and works in server rendering', () => {
    const Score = () => <i>{useReducedState((n: number, e: InputEvent) => n + (e.type === 'hit' ? 1 : 0), 0)}</i>;
    const log = [{ frame: 1, type: 'hit' }, { frame: 2, type: 'miss' }, { frame: 3, type: 'hit' }];
    expect(renderToStaticMarkup(<Composition id="c" component={Score} frame={3} durationInFrames={10} input={log} />)).toBe('<i>2</i>');
    expect(renderToStaticMarkup(<Composition id="c" component={Score} frame={2} durationInFrames={10} input={log} />)).toBe('<i>1</i>');
  });

  it('throws on a wrong log, a wrong onInput and an event with a frame', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const Probe = () => <i>{useInputEvents().length}</i>;
    expect(() => renderAt(0, <Probe />, [{ frame: 5, type: 'a' }, { frame: 3, type: 'b' }])).toThrow(
      /input\[1\]\.frame \(3\) is before input\[0\]\.frame \(5\): the input log is append-only, in frame order/,
    );
    expect(() => renderAt(0, <Probe />, [{ frame: 1.5, type: 'a' }])).toThrow(/input\[0\]\.frame must be an integer >= 0, got 1.5/);
    expect(() => renderAt(0, <Probe />, [{ frame: 1, type: '' }])).toThrow(/input\[0\]\.type must be a non-empty string/);
    // @ts-expect-error not an array
    expect(() => renderAt(0, <Probe />, { frame: 1, type: 'a' })).toThrow(/input must be an array of events/);
    // @ts-expect-error not a function
    expect(() => renderAt(0, <Probe />, [], 'log')).toThrow(/onInput must be a function/);
    expect(() => renderToStaticMarkup(<Probe />)).toThrow(/useInputEvents must be used within a FrameProvider/);
    const emitted: Array<() => void> = [];
    const Grab = () => {
      const emit = useEmitInput();
      // @ts-expect-error the frame is set by MotionForge
      emitted.push(() => emit({ type: 'tap', frame: 3 }));
      return null;
    };
    renderAt(0, <Grab />, [], () => {});
    expect(emitted[0]).toThrow(/leave out frame/);
  });
});
