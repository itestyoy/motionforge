'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { GateContext } from './context';
import { GateInternals, getGateInternals } from './render-gate';

// Layout effects run before any passive effect of the same commit, so a
// component counts as mounted before effects (its own or its children's) call
// delayRender(). On the server neither runs.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Options of delayRender(), as in Remotion. */
export interface DelayRenderOptions {
  /**
   * When the handle is still pending after this many milliseconds, the render
   * is cancelled with an error naming the label (the gate's waitUntilReady()
   * rejects with it). Without it, only the host's waitUntilReady() timeout applies.
   */
  timeoutInMilliseconds?: number;
}

export interface DelayRenderApi {
  /**
   * Holds the current frame until continueRender(handle) is called. Call it
   * from an effect or a callback, never during render. Handles still pending
   * when the component unmounts are continued automatically.
   */
  delayRender: (label?: string, options?: DelayRenderOptions) => number;
  /** Releases a handle. Releasing one twice is allowed. */
  continueRender: (handle: number) => void;
  /**
   * Fails the render: the gate's waitUntilReady() rejects with this error.
   * Without a host gate the error is thrown to the nearest error boundary.
   */
  cancelRender: (error: unknown) => void;
}

// Thrown when delayRender() runs during render, e.g. Remotion's
// `const [handle] = useState(() => delayRender())`.
const DURING_RENDER =
  'delayRender() was called during render. In MotionForge call it from an effect or a callback, not during render ' +
  'and not in a useState() initializer: React may render a component (and run its initializers) more than once ' +
  'without keeping the result (StrictMode, interrupted renders), and such a handle would hold the frame forever. ' +
  'Instead of `const [handle] = useState(() => delayRender(label))`, write:\n' +
  '  const { delayRender, continueRender, cancelRender } = useDelayRender();\n' +
  '  const handle = useRef<number | null>(null);\n' +
  '  useEffect(() => {\n' +
  '    handle.current = delayRender(label);\n' +
  '    load().then(setData, cancelRender);\n' +
  '    return () => continueRender(handle.current!);\n' +
  '  }, []);\n' +
  '  useEffect(() => { if (data !== null) continueRender(handle.current!); }, [data]);';

const checkOptions = (options: unknown): number | undefined => {
  if (options === undefined) return undefined;
  if (typeof options !== 'object' || options === null) {
    throw new Error(`delayRender: options must be an object, got ${JSON.stringify(options)}`);
  }
  for (const key of Object.keys(options)) {
    if (key !== 'timeoutInMilliseconds') {
      throw new Error(
        `delayRender: unknown option ${JSON.stringify(key)}` +
          (key === 'retries' ? ' (retries are not supported: the host decides whether to render a frame again)' : ''),
      );
    }
  }
  const { timeoutInMilliseconds } = options as DelayRenderOptions;
  if (
    timeoutInMilliseconds !== undefined &&
    (typeof timeoutInMilliseconds !== 'number' || Number.isNaN(timeoutInMilliseconds) || timeoutInMilliseconds <= 0)
  ) {
    throw new Error(
      `delayRender: timeoutInMilliseconds must be a positive number (or Infinity), got ${JSON.stringify(timeoutInMilliseconds)}`,
    );
  }
  return timeoutInMilliseconds;
};

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  return new Error(typeof error === 'string' ? error : `cancelRender: ${JSON.stringify(error)}`);
};

/**
 * delayRender / continueRender / cancelRender for the FrameProvider this
 * component is in.
 *
 *   const { delayRender, continueRender, cancelRender } = useDelayRender();
 *   const handle = useRef<number | null>(null);
 *   useEffect(() => {
 *     handle.current = delayRender('fetch data');
 *     fetchData().then(setData, cancelRender);
 *     return () => continueRender(handle.current!);
 *   }, []);
 *   // Release after the data has rendered (setData renders later).
 *   useEffect(() => {
 *     if (data !== null) continueRender(handle.current!);
 *   }, [data]);
 *
 * Inside a premounted Sequence the handles do not hold the frame until the
 * sequence starts.
 */
export const useDelayRender = (): DelayRenderApi => {
  const context = useContext(GateContext);
  if (!context) {
    throw new Error('useDelayRender must be used within a FrameProvider');
  }
  const mounted = useRef(false);
  const unmounted = useRef(false);
  // Handles this component created and has not continued yet, per gate.
  const owned = useRef(new Set<{ internals: GateInternals; handle: number }>());

  useIsomorphicLayoutEffect(() => {
    mounted.current = true;
    unmounted.current = false;
    const handles = owned.current;
    return () => {
      // Unmount (also StrictMode's simulated one): release what is still held.
      mounted.current = false;
      unmounted.current = true;
      handles.forEach(({ internals, handle }) => internals.continue(handle));
      handles.clear();
    };
  }, []);

  return useMemo<DelayRenderApi>(() => {
    const internals = getGateInternals(context.gate);
    return {
      delayRender: (label, options) => {
        if (label !== undefined && typeof label !== 'string') {
          throw new Error(`delayRender: label must be a string, got ${JSON.stringify(label)}`);
        }
        const timeoutInMilliseconds = checkOptions(options);
        if (!mounted.current) {
          throw new Error(unmounted.current ? 'delayRender() was called after the component unmounted' : DURING_RENDER);
        }
        const handle = internals.delay(label ?? null, context.scope, timeoutInMilliseconds);
        owned.current.add({ internals, handle });
        return handle;
      },
      continueRender: (handle) => {
        internals.continue(handle);
        owned.current.forEach((entry) => {
          if (entry.internals === internals && entry.handle === handle) owned.current.delete(entry);
        });
      },
      cancelRender: (error) => internals.cancel(toError(error)),
    };
  }, [context]);
};
