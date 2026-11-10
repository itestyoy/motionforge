'use client';

import { useContext, useMemo, useRef } from 'react';
import { FrameContext, HostContext, TimelineContext } from './context';
import { InputEvent, InputEventInit, firstAfter, firstAtOrAfter, isAppendOf } from './input-log';

/**
 * Playable mode: the scene reads the host's input log as a function of the
 * frame. The hooks see the events from the start of the enclosing sequence
 * up to the frame being rendered, with `frame` in the sequence's frames (as
 * useCurrentFrame() counts them): an event at composition frame 40 is at
 * frame 10 inside `<Sequence from={30}>`, and is seen from that sequence's
 * frame 10 on. Events before the sequence started are not seen there.
 */

// The events the component sees: log[first..end), shifted by `offset`.
const useInputWindow = (hook: string) => {
  const host = useContext(HostContext);
  const timeline = useContext(TimelineContext);
  const frameContext = useContext(FrameContext);
  if (!host || !timeline || !frameContext) {
    throw new Error(`${hook} must be used within a FrameProvider`);
  }
  const log = host.input;
  const { offset } = timeline;
  const { frame } = frameContext;
  const first = firstAtOrAfter(log, offset);
  const end = Math.max(first, firstAfter(log, offset + frame));
  return { log, offset, first, end, frame };
};

const toLocal = <E extends InputEvent>(event: InputEvent, offset: number): E =>
  (offset === 0 ? event : { ...event, frame: event.frame - offset }) as E;

/**
 * The input events up to the current frame, oldest first, with `frame` in
 * the frames of the enclosing sequence. The same array while no event is
 * added or removed.
 */
export const useInputEvents = <E extends InputEvent = InputEvent>(): readonly E[] => {
  const { log, offset, first, end } = useInputWindow('useInputEvents');
  return useMemo(
    () => Object.freeze(log.slice(first, end).map((event) => toLocal<E>(event, offset))),
    [log, offset, first, end],
  );
};

/**
 * The function scene handlers call to report input: `emit({ type: 'tap', x, y })`.
 * MotionForge stamps it with the composition frame shown and hands it to the
 * FrameProvider's `onInput`; the host appends it to the input log (live
 * play), and the scene reacts when it renders with the new log. Handlers
 * must not change the scene's own state: what the input changes is derived
 * from the log (useReducedState()), so a scripted log renders the same.
 */
export const useEmitInput = (): ((event: InputEventInit) => void) => {
  const host = useContext(HostContext);
  if (!host) {
    throw new Error('useEmitInput must be used within a FrameProvider');
  }
  return host.emit;
};

interface FoldCache<S> {
  log: readonly InputEvent[];
  offset: number;
  first: number;
  /** states[k]: the state after the first k events of the window. */
  states: S[];
}

/**
 * State derived from the input log: `reducer` folded over the events up to
 * the current frame (with `frame` in the sequence's frames), starting from
 * `initialState`, like useReducer() over the log. Each event is folded once:
 * frames moving forward fold only the new events, seeking back reads a
 * stored state, and a log that is not the previous one with events appended
 * (a new session) is folded again. `reducer` must be pure and return a new
 * state instead of changing the old one (the states are kept); like
 * useReducer's initial state, `initialState` is read when the fold starts.
 *
 *   const score = useReducedState((score, e) => (e.type === 'hit' ? score + 1 : score), 0);
 */
export const useReducedState = <S, E extends InputEvent = InputEvent>(
  reducer: (state: S, event: E) => S,
  initialState: S,
): S => {
  if (typeof reducer !== 'function') {
    throw new Error(`useReducedState: reducer must be a function (state, event) => state, got ${JSON.stringify(reducer)}`);
  }
  const { log, offset, first, end } = useInputWindow('useReducedState');
  const cache = useRef<FoldCache<S> | null>(null);
  let current = cache.current;
  const folded = current ? current.states.length - 1 : 0;
  // The fold so far stays valid if the events it folded are still there.
  const valid =
    current !== null &&
    current.offset === offset &&
    current.first === first &&
    (current.log === log ||
      (isAppendOf(current.log, log) && (folded === 0 || log[first + folded - 1] === current.log[first + folded - 1])));
  if (!valid || current === null) {
    current = { log, offset, first, states: [initialState] };
    cache.current = current;
  }
  current.log = log;
  const { states } = current;
  while (states.length - 1 < end - first) {
    const index = first + states.length - 1;
    states.push(reducer(states[states.length - 1], toLocal<E>(log[index], offset)));
  }
  return states[end - first];
};

/** The last input event up to the current frame, and how many frames ago it was. */
export interface LastInputEvent<E extends InputEvent = InputEvent> {
  /** The event, with `frame` in the frames of the enclosing sequence. */
  event: E;
  /** useCurrentFrame() - event.frame: 0 on the frame it happened, then 1, 2, ... */
  framesSince: number;
}

/**
 * The latest event up to the current frame (that `predicate` accepts), with
 * the frames since it: for animating from the moment of an input.
 *
 *   const tap = useLastEvent((e) => e.type === 'tap');
 *   const pop = tap ? spring({ frame: tap.framesSince, fps }) : 0;
 *   const idle = useLastEvent();  // no input for (idle?.framesSince ?? frame) frames: show a hint
 */
export const useLastEvent = <E extends InputEvent = InputEvent>(
  predicate?: (event: E) => boolean,
): LastInputEvent<E> | null => {
  if (predicate !== undefined && typeof predicate !== 'function') {
    throw new Error(`useLastEvent: predicate must be a function (event) => boolean, got ${JSON.stringify(predicate)}`);
  }
  const { log, offset, first, end, frame } = useInputWindow('useLastEvent');
  for (let i = end - 1; i >= first; i--) {
    const event = toLocal<E>(log[i], offset);
    if (!predicate || predicate(event)) return { event, framesSince: frame - event.frame };
  }
  return null;
};
