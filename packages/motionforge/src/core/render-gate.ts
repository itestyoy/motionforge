/**
 * Render readiness: a scene holds the frame with delayRender() while it waits
 * for something asynchronous (an image to decode, a video to seek, data to
 * load); the host waits for the frame with gate.waitUntilReady() before it
 * captures or shows it.
 *
 * A gate belongs to one FrameProvider. Handles are plain numbers counted per
 * gate (1, 2, 3, ...). The one thing shared by all gates is page-wide loading
 * (loadFont()): fonts belong to the document, so a font that is loading holds
 * every gate, and one that failed fails every gate.
 */

import { InputEvent, isAppendOf } from './input-log';

export interface PendingDelay {
  /** The number delayRender() returned; negative for a page-wide load (loadFont()). */
  handle: number;
  /** The label passed to delayRender(), or null. */
  label: string | null;
}

export interface WaitUntilReadyOptions {
  /**
   * The frame the host passed to FrameProvider. When given, the wait also
   * covers the time until React has rendered and committed that frame, so the
   * host can call it right after setting the frame. Without it, the wait is
   * for the frame FrameProvider has committed last.
   */
  frame?: number;
  /**
   * The input log the host passed to FrameProvider (playable mode). The wait
   * also covers the time until React has committed a render with this log
   * (or with more events appended to it): an input appended from an event
   * handler, e.g. pointermove, which React renders with a lower priority,
   * is on the frame the wait resolves for. Required when the FrameProvider
   * renders an input log: a wait without it rejects.
   */
  input?: readonly InputEvent[];
  /** Rejects after this many milliseconds (default 30000; Infinity waits forever). */
  timeoutMs?: number;
}

export interface RenderGate {
  /**
   * Resolves when FrameProvider has committed the frame (see `frame`) with
   * the input log (see `input`) and no delayRender() handle of a visible
   * component is pending. Rejects with the cancelRender() error, or on
   * timeout with an error listing the pending labels.
   */
  waitUntilReady(options?: WaitUntilReadyOptions): Promise<void>;
  /** Handles that hold the frame right now (premounted content is not counted), and page-wide loads. */
  getPending(): PendingDelay[];
  /**
   * The error passed to cancelRender() (or of a delayRender() timeout, or of a
   * failed loadFont()), if any. A cancelled gate stays cancelled.
   */
  readonly error: Error | null;
}

/**
 * Visibility of a premounted subtree: handles registered inside count only
 * while the scope and all its parents are visible.
 */
export interface GateScope {
  visible: boolean;
  parent: GateScope | null;
}

export interface GateInternals {
  /** With `timeoutInMilliseconds`, the gate is cancelled if the handle is still pending then. */
  delay(label: string | null, scope: GateScope | null, timeoutInMilliseconds?: number): number;
  continue(handle: number): void;
  cancel(error: Error): void;
  /** Called by the FrameProvider that owns the gate; returns the detach function. */
  attach(): () => void;
  /**
   * Called by the owning FrameProvider after the effects of `frame` have run,
   * with the input log it rendered (null: it has no `input` prop).
   */
  commit(frame: number, input: readonly InputEvent[] | null): void;
  /** A scope changed visibility. */
  changed(): void;
  onError(listener: (error: Error) => void): () => void;
}

const DEFAULT_TIMEOUT_MS = 30000;

const MISSING_INPUT =
  'waitUntilReady: this FrameProvider renders an input log, so pass the log you gave it: ' +
  'waitUntilReady({ frame, input }). Without it the wait can resolve before React has rendered an event ' +
  'you appended (React renders pointermove and other continuous events later), and the frame would miss it.';

const internalsOf = new WeakMap<RenderGate, GateInternals>();

// Page-wide loads (loadFont()): pending ones hold every gate, a failed one
// fails every gate. Gates with waiters subscribe to changes.
const pageWidePending = new Map<number, string>();
let pageWideError: Error | null = null;
let lastPageWideHandle = 0;
const pageWideListeners = new Set<() => void>();

const notifyPageWide = () => pageWideListeners.forEach((listener) => listener());

/**
 * Holds every render gate until release() or fail() is called. For loads that
 * belong to the whole document, like fonts.
 */
export const holdAllGates = (label: string): { release: () => void; fail: (error: Error) => void } => {
  lastPageWideHandle += 1;
  const handle = lastPageWideHandle;
  pageWidePending.set(handle, label);
  notifyPageWide();
  return {
    release: () => {
      if (pageWidePending.delete(handle)) notifyPageWide();
    },
    fail: (error) => {
      pageWidePending.delete(handle);
      if (!pageWideError) pageWideError = error;
      notifyPageWide();
    },
  };
};

const isVisible = (scope: GateScope | null): boolean => {
  for (let s = scope; s; s = s.parent) {
    if (!s.visible) return false;
  }
  return true;
};

interface Waiter {
  frame: number | undefined;
  input: readonly InputEvent[] | undefined;
  resolve: () => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

/**
 * Creates a render gate for one FrameProvider:
 *
 *   const gate = createRenderGate();
 *   <FrameProvider gate={gate} frame={n} ...>
 *   await gate.waitUntilReady({ frame: n, timeoutMs: 10000 });
 */
export const createRenderGate = (): RenderGate => {
  const pending = new Map<
    number,
    { label: string | null; scope: GateScope | null; timer: ReturnType<typeof setTimeout> | null }
  >();
  let lastHandle = 0;
  let error: Error | null = null;
  let committedFrame: number | null = null;
  let committedInput: readonly InputEvent[] | null = null;
  let attached = false;
  let checkScheduled = false;
  const waiters = new Set<Waiter>();
  const errorListeners = new Set<(error: Error) => void>();

  const blocking = (): PendingDelay[] => [
    ...[...pending]
      .filter(([, entry]) => isVisible(entry.scope))
      .map(([handle, entry]) => ({ handle, label: entry.label })),
    ...[...pageWidePending].map(([handle, label]) => ({ handle: -handle, label })),
  ];

  const failure = (): Error | null => error ?? pageWideError;

  const settle = (waiter: Waiter) => {
    waiters.delete(waiter);
    if (waiter.timer !== null) clearTimeout(waiter.timer);
    if (waiters.size === 0) pageWideListeners.delete(scheduleCheck);
  };

  // Checks run in a microtask, so a batch of effects (children first, the
  // FrameProvider's commit last) is seen as a whole.
  // Whether the committed log is the waiter's (or extends it).
  const inputCommitted = (waiter: Waiter) =>
    waiter.input === undefined || (committedInput !== null && isAppendOf(waiter.input, committedInput));

  const check = () => {
    checkScheduled = false;
    for (const waiter of [...waiters]) {
      const failed = failure();
      if (failed) {
        settle(waiter);
        waiter.reject(failed);
      } else if (committedFrame !== null && committedInput !== null && waiter.input === undefined) {
        settle(waiter);
        waiter.reject(new Error(MISSING_INPUT));
      } else if (
        committedFrame !== null &&
        (waiter.frame === undefined || waiter.frame === committedFrame) &&
        inputCommitted(waiter) &&
        blocking().length === 0
      ) {
        settle(waiter);
        waiter.resolve();
      }
    }
  };

  const scheduleCheck = () => {
    if (checkScheduled || waiters.size === 0) return;
    checkScheduled = true;
    queueMicrotask(check);
  };

  const describePending = (): string => {
    const list = blocking();
    if (list.length === 0) return 'no delayRender() handle is pending';
    return (
      'pending: ' +
      list.map(({ handle, label }) => (label === null ? `delayRender() #${handle} (no label)` : `"${label}"`)).join(', ')
    );
  };

  const gate: RenderGate = {
    waitUntilReady(options = {}) {
      const { frame, input, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
      if (frame !== undefined && (!Number.isInteger(frame) || frame < 0)) {
        throw new Error(`waitUntilReady: frame must be a non-negative integer, got ${frame}`);
      }
      if (input !== undefined && !Array.isArray(input)) {
        throw new Error(`waitUntilReady: input must be the input log (an array) passed to FrameProvider, got ${JSON.stringify(input)}`);
      }
      if (typeof timeoutMs !== 'number' || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
        throw new Error(`waitUntilReady: timeoutMs must be a positive number (or Infinity), got ${timeoutMs}`);
      }
      const failed = failure();
      if (failed) return Promise.reject(failed);
      return new Promise<void>((resolve, reject) => {
        const waiter: Waiter = { frame, input, resolve, reject, timer: null };
        if (Number.isFinite(timeoutMs)) {
          waiter.timer = setTimeout(() => {
            settle(waiter);
            const notCommitted =
              frame !== undefined && committedFrame !== frame
                ? `frame ${frame} was not committed (FrameProvider is at ${committedFrame ?? 'no frame yet'}); `
                : !inputCommitted(waiter)
                  ? `the input log of ${input!.length} events was not committed (FrameProvider renders ${committedInput === null ? 'no input log' : `a log of ${committedInput.length} events that does not extend it`}); `
                  : '';
            reject(
              new Error(
                `waitUntilReady: the frame was not ready after ${timeoutMs} ms: ${notCommitted}${describePending()}`,
              ),
            );
          }, timeoutMs);
        }
        waiters.add(waiter);
        pageWideListeners.add(scheduleCheck);
        scheduleCheck();
      });
    },
    getPending: blocking,
    get error() {
      return failure();
    },
  };

  const internals: GateInternals = {
    delay(label, scope, timeoutInMilliseconds) {
      lastHandle += 1;
      const handle = lastHandle;
      const timer =
        timeoutInMilliseconds === undefined || !Number.isFinite(timeoutInMilliseconds)
          ? null
          : setTimeout(() => {
              if (!pending.has(handle)) return;
              internals.cancel(
                new Error(
                  `A delayRender() ${label === null ? `#${handle} (no label)` : `"${label}"`} was called but not continued after ${timeoutInMilliseconds} ms`,
                ),
              );
            }, timeoutInMilliseconds);
      pending.set(handle, { label, scope, timer });
      return handle;
    },
    continue(handle) {
      if (!Number.isInteger(handle) || handle < 1 || handle > lastHandle) {
        throw new Error(
          `continueRender: ${JSON.stringify(handle)} is not a handle returned by delayRender() of this FrameProvider`,
        );
      }
      // Continuing a handle twice is allowed (e.g. on load and again on unmount).
      const entry = pending.get(handle);
      if (!entry) return;
      if (entry.timer !== null) clearTimeout(entry.timer);
      pending.delete(handle);
      scheduleCheck();
    },
    cancel(cancelError) {
      if (!error) error = cancelError;
      errorListeners.forEach((listener) => listener(error as Error));
      scheduleCheck();
    },
    attach() {
      if (attached) {
        throw new Error('A render gate can serve only one FrameProvider at a time; create one gate per FrameProvider');
      }
      attached = true;
      return () => {
        attached = false;
        committedFrame = null;
        committedInput = null;
      };
    },
    commit(frame, input) {
      committedFrame = frame;
      committedInput = input;
      scheduleCheck();
    },
    changed: scheduleCheck,
    onError(listener) {
      errorListeners.add(listener);
      if (error) listener(error);
      return () => {
        errorListeners.delete(listener);
      };
    },
  };

  internalsOf.set(gate, internals);
  return gate;
};

export const isRenderGate = (value: unknown): value is RenderGate =>
  typeof value === 'object' && value !== null && internalsOf.has(value as RenderGate);

export const getGateInternals = (gate: RenderGate): GateInternals => {
  const internals = internalsOf.get(gate);
  if (!internals) throw new Error('Not a render gate: create it with createRenderGate()');
  return internals;
};
