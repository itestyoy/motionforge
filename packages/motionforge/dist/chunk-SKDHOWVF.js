'use client';import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { jsx } from 'react/jsx-runtime';

// src/core/render-gate.ts
var DEFAULT_TIMEOUT_MS = 3e4;
var internalsOf = /* @__PURE__ */ new WeakMap();
var isVisible = (scope) => {
  for (let s = scope; s; s = s.parent) {
    if (!s.visible) return false;
  }
  return true;
};
var createRenderGate = () => {
  const pending = /* @__PURE__ */ new Map();
  let lastHandle = 0;
  let error = null;
  let committedFrame = null;
  let attached = false;
  let checkScheduled = false;
  const waiters = /* @__PURE__ */ new Set();
  const errorListeners = /* @__PURE__ */ new Set();
  const blocking = () => [...pending].filter(([, entry]) => isVisible(entry.scope)).map(([handle, entry]) => ({ handle, label: entry.label }));
  const settle = (waiter) => {
    waiters.delete(waiter);
    if (waiter.timer !== null) clearTimeout(waiter.timer);
  };
  const check = () => {
    checkScheduled = false;
    for (const waiter of [...waiters]) {
      if (error) {
        settle(waiter);
        waiter.reject(error);
      } else if (committedFrame !== null && (waiter.frame === void 0 || waiter.frame === committedFrame) && blocking().length === 0) {
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
  const describePending = () => {
    const list = blocking();
    if (list.length === 0) return "no delayRender() handle is pending";
    return "pending: " + list.map(({ handle, label }) => label === null ? `delayRender() #${handle} (no label)` : `"${label}"`).join(", ");
  };
  const gate = {
    waitUntilReady(options = {}) {
      const { frame, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
      if (frame !== void 0 && (!Number.isInteger(frame) || frame < 0)) {
        throw new Error(`waitUntilReady: frame must be a non-negative integer, got ${frame}`);
      }
      if (typeof timeoutMs !== "number" || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
        throw new Error(`waitUntilReady: timeoutMs must be a positive number (or Infinity), got ${timeoutMs}`);
      }
      if (error) return Promise.reject(error);
      return new Promise((resolve, reject) => {
        const waiter = { frame, resolve, reject, timer: null };
        if (Number.isFinite(timeoutMs)) {
          waiter.timer = setTimeout(() => {
            settle(waiter);
            const notCommitted = frame !== void 0 && committedFrame !== frame ? `frame ${frame} was not committed (FrameProvider is at ${committedFrame ?? "no frame yet"}); ` : "";
            reject(
              new Error(
                `waitUntilReady: the frame was not ready after ${timeoutMs} ms: ${notCommitted}${describePending()}`
              )
            );
          }, timeoutMs);
        }
        waiters.add(waiter);
        scheduleCheck();
      });
    },
    getPending: blocking,
    get error() {
      return error;
    }
  };
  const internals = {
    delay(label, scope) {
      lastHandle += 1;
      pending.set(lastHandle, { label, scope });
      return lastHandle;
    },
    continue(handle) {
      if (!Number.isInteger(handle) || handle < 1 || handle > lastHandle) {
        throw new Error(
          `continueRender: ${JSON.stringify(handle)} is not a handle returned by delayRender() of this FrameProvider`
        );
      }
      if (pending.delete(handle)) scheduleCheck();
    },
    cancel(cancelError) {
      if (!error) error = cancelError;
      errorListeners.forEach((listener) => listener(error));
      scheduleCheck();
    },
    attach() {
      if (attached) {
        throw new Error("A render gate can serve only one FrameProvider at a time; create one gate per FrameProvider");
      }
      attached = true;
      return () => {
        attached = false;
        committedFrame = null;
      };
    },
    commit(frame) {
      committedFrame = frame;
      scheduleCheck();
    },
    changed: scheduleCheck,
    onError(listener) {
      errorListeners.add(listener);
      if (error) listener(error);
      return () => {
        errorListeners.delete(listener);
      };
    }
  };
  internalsOf.set(gate, internals);
  return gate;
};
var isRenderGate = (value) => typeof value === "object" && value !== null && internalsOf.has(value);
var getGateInternals = (gate) => {
  const internals = internalsOf.get(gate);
  if (!internals) throw new Error("Not a render gate: create it with createRenderGate()");
  return internals;
};
var FrameContext = createContext(null);
var useCurrentFrame = () => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error("useCurrentFrame must be used within a FrameProvider");
  }
  return context.frame;
};
var useVideoConfig = () => {
  const context = useContext(FrameContext);
  if (!context) {
    throw new Error("useVideoConfig must be used within a FrameProvider");
  }
  return {
    fps: context.fps,
    durationInFrames: context.durationInFrames,
    width: context.width,
    height: context.height
  };
};
var GateContext = createContext(null);
var isPositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var validateFrameProps = ({
  frame,
  fps,
  durationInFrames,
  width,
  height
}) => {
  if (!isPositive(fps)) {
    throw new Error(`FrameProvider: fps must be a positive number, got ${fps}`);
  }
  if (!isPositive(width) || !isPositive(height)) {
    throw new Error(`FrameProvider: width and height must be positive numbers, got ${width}x${height}`);
  }
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(
      `FrameProvider: durationInFrames must be a positive integer, got ${durationInFrames}`
    );
  }
  if (!Number.isInteger(frame) || frame < 0 || frame > durationInFrames - 1) {
    throw new Error(
      `FrameProvider: frame must be an integer from 0 to ${durationInFrames - 1} (durationInFrames - 1), got ${frame}`
    );
  }
};
var FrameProvider = ({
  frame,
  fps = 30,
  durationInFrames,
  width,
  height,
  gate,
  children
}) => {
  validateFrameProps({ frame, fps, durationInFrames, width, height });
  if (gate !== void 0 && !isRenderGate(gate)) {
    throw new Error("FrameProvider: gate must be created with createRenderGate()");
  }
  const value = useMemo(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height]
  );
  const outer = useContext(GateContext);
  const [privateGate] = useState(createRenderGate);
  const owned = gate ?? (outer ? null : privateGate);
  const gateValue = useMemo(
    () => owned ? { gate: owned, scope: null } : outer,
    [owned, outer]
  );
  useEffect(() => owned ? getGateInternals(owned).attach() : void 0, [owned]);
  useEffect(() => {
    if (owned) getGateInternals(owned).commit(frame);
  }, [owned, frame]);
  const [cancelled, setCancelled] = useState(null);
  useEffect(
    () => owned === privateGate ? getGateInternals(privateGate).onError((error) => setCancelled(() => error)) : void 0,
    [owned, privateGate]
  );
  if (cancelled && owned === privateGate) throw cancelled;
  return /* @__PURE__ */ jsx(GateContext.Provider, { value: gateValue, children: /* @__PURE__ */ jsx(FrameContext.Provider, { value, children }) });
};

export { FrameContext, FrameProvider, GateContext, createRenderGate, getGateInternals, useCurrentFrame, useVideoConfig };
//# sourceMappingURL=chunk-SKDHOWVF.js.map
//# sourceMappingURL=chunk-SKDHOWVF.js.map