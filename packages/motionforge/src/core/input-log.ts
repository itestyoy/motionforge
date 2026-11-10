/**
 * The input log of a playable scene: events the host records (live taps) or
 * scripts (a video of the playable), each at the frame it happened.
 */

/**
 * One input event. `frame` is the frame it happened at: in the log, a frame
 * of the composition; inside a Sequence the hooks hand it out in the
 * sequence's frames (as useCurrentFrame() counts them). Everything besides
 * `frame` and `type` is the scene's own payload (keep it serializable, so a
 * recorded log can be replayed).
 */
export interface InputEvent {
  frame: number;
  type: string;
  [key: string]: unknown;
}

/** What a scene emits with useEmitInput(): an event without `frame` (the SDK stamps it). */
export interface InputEventInit {
  type: string;
  frame?: never;
  [key: string]: unknown;
}

// How many leading events of a log array have been checked.
const checkedUpTo = new WeakMap<readonly InputEvent[], number>();

const describe = (value: unknown) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};

/**
 * Checks the log: every event `{ frame, type }` with an integer frame ≥ 0 and
 * a non-empty type, in frame order. Only events not checked before are
 * looked at: a log that is `previous` with events appended (or the same
 * array, pushed to) costs only the new events.
 */
export const checkInputLog = (log: unknown, previous: readonly InputEvent[] | null): readonly InputEvent[] => {
  if (!Array.isArray(log)) {
    throw new Error(`FrameProvider: input must be an array of events { frame, type, ... }, got ${describe(log)}`);
  }
  const events = log as readonly InputEvent[];
  let from = checkedUpTo.get(events) ?? 0;
  if (from === 0 && previous && previous !== events && isAppendOf(previous, events)) {
    from = checkedUpTo.get(previous) ?? 0;
  }
  for (let i = from; i < events.length; i++) {
    const event = events[i];
    if (typeof event !== 'object' || event === null) {
      throw new Error(`FrameProvider: input[${i}] must be an event { frame, type, ... }, got ${describe(event)}`);
    }
    if (!Number.isInteger(event.frame) || event.frame < 0) {
      throw new Error(`FrameProvider: input[${i}].frame must be an integer >= 0, got ${describe(event.frame)}`);
    }
    if (typeof event.type !== 'string' || event.type === '') {
      throw new Error(`FrameProvider: input[${i}].type must be a non-empty string, got ${describe(event.type)}`);
    }
    if (i > 0 && event.frame < events[i - 1].frame) {
      throw new Error(
        `FrameProvider: input[${i}].frame (${event.frame}) is before input[${i - 1}].frame (${events[i - 1].frame}): ` +
          'the input log is append-only, in frame order',
      );
    }
  }
  checkedUpTo.set(events, events.length);
  return events;
};

/**
 * Whether `next` is `previous` with events appended. The log is append-only,
 * so the first and the last event `previous` had are compared (by identity),
 * not every one.
 */
export const isAppendOf = (previous: readonly InputEvent[], next: readonly InputEvent[]): boolean => {
  if (previous === next) return true;
  if (next.length < previous.length) return false;
  if (previous.length === 0) return true;
  return next[0] === previous[0] && next[previous.length - 1] === previous[previous.length - 1];
};

/** The index of the first event at `frame` or later. */
export const firstAtOrAfter = (log: readonly InputEvent[], frame: number): number => {
  let low = 0;
  let high = log.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (log[mid].frame < frame) low = mid + 1;
    else high = mid;
  }
  return low;
};

/** The index of the first event after `frame`. */
export const firstAfter = (log: readonly InputEvent[], frame: number): number => {
  let low = 0;
  let high = log.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (log[mid].frame <= frame) low = mid + 1;
    else high = mid;
  }
  return low;
};
