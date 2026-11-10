'use client';

import { useContext, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { GateContext } from './context';
import { GateInternals, getGateInternals } from './render-gate';

// Layout effects run before any passive effect of the same commit, so a
// component counts as mounted before effects (its own or its children's) call
// delayRender(). On the server neither runs.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface DelayRenderApi {
  /**
   * Holds the current frame until continueRender(handle) is called. Call it
   * from an effect or a callback, never during render. Handles still pending
   * when the component unmounts are continued automatically.
   */
  delayRender: (label?: string) => number;
  /** Releases a handle. Releasing one twice is allowed. */
  continueRender: (handle: number) => void;
  /**
   * Fails the render: the gate's waitUntilReady() rejects with this error.
   * Without a host gate the error is thrown to the nearest error boundary.
   */
  cancelRender: (error: unknown) => void;
}

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
  // Handles this component created and has not continued yet, per gate.
  const owned = useRef(new Set<{ internals: GateInternals; handle: number }>());

  useIsomorphicLayoutEffect(() => {
    mounted.current = true;
    const handles = owned.current;
    return () => {
      // Unmount (also StrictMode's simulated one): release what is still held.
      mounted.current = false;
      handles.forEach(({ internals, handle }) => internals.continue(handle));
      handles.clear();
    };
  }, []);

  return useMemo<DelayRenderApi>(() => {
    const internals = getGateInternals(context.gate);
    return {
      delayRender: (label) => {
        if (label !== undefined && typeof label !== 'string') {
          throw new Error(`delayRender: label must be a string, got ${JSON.stringify(label)}`);
        }
        if (!mounted.current) {
          throw new Error(
            'delayRender() must be called from an effect or a callback of a mounted component, not during render ' +
              '(React may render a component twice and that handle would never be continued) and not after unmount',
          );
        }
        const handle = internals.delay(label ?? null, context.scope);
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
