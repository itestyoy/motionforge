'use client';import { createContext, useContext, useMemo, useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { jsx } from 'react/jsx-runtime';

// src/core/input-log.ts
var checkedUpTo = /* @__PURE__ */ new WeakMap();
var describe = (value) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var checkInputLog = (log, previous) => {
  if (!Array.isArray(log)) {
    throw new Error(`FrameProvider: input must be an array of events { frame, type, ... }, got ${describe(log)}`);
  }
  const events = log;
  let from = checkedUpTo.get(events) ?? 0;
  if (from === 0 && previous && previous !== events && isAppendOf(previous, events)) {
    from = checkedUpTo.get(previous) ?? 0;
  }
  for (let i = from; i < events.length; i++) {
    const event = events[i];
    if (typeof event !== "object" || event === null) {
      throw new Error(`FrameProvider: input[${i}] must be an event { frame, type, ... }, got ${describe(event)}`);
    }
    if (!Number.isInteger(event.frame) || event.frame < 0) {
      throw new Error(`FrameProvider: input[${i}].frame must be an integer >= 0, got ${describe(event.frame)}`);
    }
    if (typeof event.type !== "string" || event.type === "") {
      throw new Error(`FrameProvider: input[${i}].type must be a non-empty string, got ${describe(event.type)}`);
    }
    if (i > 0 && event.frame < events[i - 1].frame) {
      throw new Error(
        `FrameProvider: input[${i}].frame (${event.frame}) is before input[${i - 1}].frame (${events[i - 1].frame}): the input log is append-only, in frame order`
      );
    }
  }
  checkedUpTo.set(events, events.length);
  return events;
};
var isAppendOf = (previous, next) => {
  if (previous === next) return true;
  if (next.length < previous.length) return false;
  if (previous.length === 0) return true;
  return next[0] === previous[0] && next[previous.length - 1] === previous[previous.length - 1];
};
var firstAtOrAfter = (log, frame) => {
  let low = 0;
  let high = log.length;
  while (low < high) {
    const mid = low + high >>> 1;
    if (log[mid].frame < frame) low = mid + 1;
    else high = mid;
  }
  return low;
};
var firstAfter = (log, frame) => {
  let low = 0;
  let high = log.length;
  while (low < high) {
    const mid = low + high >>> 1;
    if (log[mid].frame <= frame) low = mid + 1;
    else high = mid;
  }
  return low;
};

// src/core/render-gate.ts
var DEFAULT_TIMEOUT_MS = 3e4;
var MISSING_INPUT = "waitUntilReady: this FrameProvider renders an input log, so pass the log you gave it: waitUntilReady({ frame, input }). Without it the wait can resolve before React has rendered an event you appended (React renders pointermove and other continuous events later), and the frame would miss it.";
var internalsOf = /* @__PURE__ */ new WeakMap();
var pageWidePending = /* @__PURE__ */ new Map();
var pageWideError = null;
var lastPageWideHandle = 0;
var pageWideListeners = /* @__PURE__ */ new Set();
var notifyPageWide = () => pageWideListeners.forEach((listener) => listener());
var holdAllGates = (label) => {
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
    }
  };
};
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
  let committedInput = null;
  let attached = false;
  let checkScheduled = false;
  const waiters = /* @__PURE__ */ new Set();
  const errorListeners = /* @__PURE__ */ new Set();
  const blocking = () => [
    ...[...pending].filter(([, entry]) => isVisible(entry.scope)).map(([handle, entry]) => ({ handle, label: entry.label })),
    ...[...pageWidePending].map(([handle, label]) => ({ handle: -handle, label }))
  ];
  const failure = () => error ?? pageWideError;
  const settle = (waiter) => {
    waiters.delete(waiter);
    if (waiter.timer !== null) clearTimeout(waiter.timer);
    if (waiters.size === 0) pageWideListeners.delete(scheduleCheck);
  };
  const inputCommitted = (waiter) => waiter.input === void 0 || committedInput !== null && isAppendOf(waiter.input, committedInput);
  const check = () => {
    checkScheduled = false;
    for (const waiter of [...waiters]) {
      const failed = failure();
      if (failed) {
        settle(waiter);
        waiter.reject(failed);
      } else if (committedFrame !== null && committedInput !== null && waiter.input === void 0) {
        settle(waiter);
        waiter.reject(new Error(MISSING_INPUT));
      } else if (committedFrame !== null && (waiter.frame === void 0 || waiter.frame === committedFrame) && inputCommitted(waiter) && blocking().length === 0) {
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
      const { frame, input, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
      if (frame !== void 0 && (!Number.isInteger(frame) || frame < 0)) {
        throw new Error(`waitUntilReady: frame must be a non-negative integer, got ${frame}`);
      }
      if (input !== void 0 && !Array.isArray(input)) {
        throw new Error(`waitUntilReady: input must be the input log (an array) passed to FrameProvider, got ${JSON.stringify(input)}`);
      }
      if (typeof timeoutMs !== "number" || Number.isNaN(timeoutMs) || timeoutMs <= 0) {
        throw new Error(`waitUntilReady: timeoutMs must be a positive number (or Infinity), got ${timeoutMs}`);
      }
      const failed = failure();
      if (failed) return Promise.reject(failed);
      return new Promise((resolve, reject) => {
        const waiter = { frame, input, resolve, reject, timer: null };
        if (Number.isFinite(timeoutMs)) {
          waiter.timer = setTimeout(() => {
            settle(waiter);
            const notCommitted = frame !== void 0 && committedFrame !== frame ? `frame ${frame} was not committed (FrameProvider is at ${committedFrame ?? "no frame yet"}); ` : !inputCommitted(waiter) ? `the input log of ${input.length} events was not committed (FrameProvider renders ${committedInput === null ? "no input log" : `a log of ${committedInput.length} events that does not extend it`}); ` : "";
            reject(
              new Error(
                `waitUntilReady: the frame was not ready after ${timeoutMs} ms: ${notCommitted}${describePending()}`
              )
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
    }
  };
  const internals = {
    delay(label, scope, timeoutInMilliseconds) {
      lastHandle += 1;
      const handle = lastHandle;
      const timer = timeoutInMilliseconds === void 0 || !Number.isFinite(timeoutInMilliseconds) ? null : setTimeout(() => {
        if (!pending.has(handle)) return;
        internals.cancel(
          new Error(
            `A delayRender() ${label === null ? `#${handle} (no label)` : `"${label}"`} was called but not continued after ${timeoutInMilliseconds} ms`
          )
        );
      }, timeoutInMilliseconds);
      pending.set(handle, { label, scope, timer });
      return handle;
    },
    continue(handle) {
      if (!Number.isInteger(handle) || handle < 1 || handle > lastHandle) {
        throw new Error(
          `continueRender: ${JSON.stringify(handle)} is not a handle returned by delayRender() of this FrameProvider`
        );
      }
      const entry = pending.get(handle);
      if (!entry) return;
      if (entry.timer !== null) clearTimeout(entry.timer);
      pending.delete(handle);
      scheduleCheck();
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

// src/core/audio-collector.ts
var internalsOf2 = /* @__PURE__ */ new WeakMap();
var listTracks = (entries) => {
  const tracks = [];
  for (const { track, most } of entries) {
    for (let i = 0; i < most; i++) tracks.push(i === 0 ? track : { ...track, id: `${track.id}#${i + 1}` });
  }
  tracks.sort((a, b) => a.startFrame - b.startFrame || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return Object.freeze(tracks);
};
var attachOnce = (attached) => () => {
  if (attached.value) {
    throw new Error(
      "An audio collector can serve only one FrameProvider at a time; create one collector per FrameProvider"
    );
  }
  attached.value = true;
  return () => {
    attached.value = false;
  };
};
var createAudioCollector = () => {
  const entries = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  let snapshot = Object.freeze([]);
  const attached = { value: false };
  const publish = () => {
    snapshot = listTracks(entries.values());
    listeners.forEach((listener) => listener());
  };
  const collector = {
    getTracks: () => snapshot,
    subscribe(listener) {
      if (typeof listener !== "function") {
        throw new TypeError(`AudioCollector.subscribe: listener must be a function, got ${JSON.stringify(listener)}`);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
  internalsOf2.set(collector, {
    collecting: false,
    attach: attachOnce(attached),
    mount(track) {
      let entry = entries.get(track.id);
      if (!entry) {
        entry = { track: Object.freeze({ ...track }), mounted: 0, most: 0 };
        entries.set(track.id, entry);
      }
      const current = entry;
      current.mounted += 1;
      if (current.mounted > current.most) {
        current.most = current.mounted;
        publish();
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        current.mounted -= 1;
      };
    },
    collect() {
      throw new Error("collect() is for the collector of collectAudioTracks()");
    }
  });
  return collector;
};
var createCollectingCollector = () => {
  const entries = /* @__PURE__ */ new Map();
  let frame = null;
  const collector = {
    getTracks: () => listTracks(entries.values()),
    subscribe() {
      throw new Error("The tracks of collectAudioTracks() are complete when it resolves: there is nothing to subscribe to");
    }
  };
  internalsOf2.set(collector, {
    collecting: true,
    attach: attachOnce({ value: false }),
    mount() {
      throw new Error("mount() is for the collector of createAudioCollector()");
    },
    collect(instance, track) {
      if (!frame) throw new Error("collect() outside of a frame of collectAudioTracks()");
      if (!entries.has(track.id)) entries.set(track.id, { track: Object.freeze({ ...track }), most: 0 });
      const copies = frame.get(track.id) ?? /* @__PURE__ */ new Set();
      copies.add(instance);
      frame.set(track.id, copies);
    }
  });
  return {
    collector,
    beginFrame() {
      frame = /* @__PURE__ */ new Map();
    },
    endFrame() {
      for (const [id, copies] of frame ?? []) {
        const entry = entries.get(id);
        entry.most = Math.max(entry.most, copies.size);
      }
      frame = null;
    }
  };
};
var isAudioCollector = (value) => typeof value === "object" && value !== null && internalsOf2.has(value);
var getAudioCollectorInternals = (collector) => {
  const internals = internalsOf2.get(collector);
  if (!internals) throw new Error("Not an audio collector: create it with createAudioCollector()");
  return internals;
};
var hashString = (text) => {
  let h1 = 3735928559;
  let h2 = 1103547991;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507) ^ Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507) ^ Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
};

// src/core/static-files.ts
var describe2 = (value) => {
  try {
    return typeof value === "function" ? "a function" : JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var checkPath = (path) => {
  if (typeof path !== "string" || path === "") {
    throw new Error(`staticFile: path must be a non-empty string, got ${describe2(path)}`);
  }
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) {
    throw new Error(`staticFile(${JSON.stringify(path)}): this is already a URL; use it as it is`);
  }
  if (path.startsWith("/")) {
    throw new Error(
      `staticFile(${JSON.stringify(path)}): pass the path inside the static files without a leading slash (${JSON.stringify(path.replace(/^\/+/, ""))})`
    );
  }
  if (path.split("/").some((segment) => segment === "" || segment === "." || segment === "..") || path.includes("\\")) {
    throw new Error(`staticFile(${JSON.stringify(path)}): the path must not contain empty, "." or ".." segments or backslashes`);
  }
  return path;
};
var makeStaticFileResolver = (staticFiles) => {
  if (typeof staticFiles === "string") {
    if (staticFiles === "") {
      throw new Error('FrameProvider: staticFiles must be a base URL (a non-empty string, e.g. "/static/") or a function (path) => url, got ""');
    }
    const base = staticFiles.replace(/\/+$/, "");
    return (path) => `${base}/${checkPath(path).split("/").map(encodeURIComponent).join("/")}`;
  }
  if (typeof staticFiles === "function") {
    return (path) => {
      const url = staticFiles(checkPath(path));
      if (typeof url !== "string" || url === "") {
        throw new Error(`staticFile(${JSON.stringify(path)}): the staticFiles function of the FrameProvider must return a non-empty string (a URL), got ${describe2(url)}`);
      }
      return url;
    };
  }
  throw new Error(`FrameProvider: staticFiles must be a base URL (a non-empty string) or a function (path) => url, got ${describe2(staticFiles)}`);
};
var noStaticFiles = (path) => {
  throw new Error(
    `staticFile(${JSON.stringify(checkPath(path))}): the FrameProvider has no staticFiles. The host app decides where static files come from: <FrameProvider staticFiles="https://cdn.example.com/creative/"> (a base URL) or staticFiles={(path) => url}.`
  );
};
var useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;
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
var TimelineContext = createContext(null);
var HostContext = createContext(null);
var NO_EVENTS = Object.freeze([]);
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
  audio,
  staticFiles,
  input,
  onInput,
  children
}) => {
  validateFrameProps({ frame, fps, durationInFrames, width, height });
  if (gate !== void 0 && !isRenderGate(gate)) {
    throw new Error("FrameProvider: gate must be created with createRenderGate()");
  }
  if (audio !== void 0 && !isAudioCollector(audio)) {
    throw new Error("FrameProvider: audio must be created with createAudioCollector()");
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
  const timeline = useMemo(
    () => ({ offset: 0, start: 0, end: durationInFrames, noAudio: null, placements: [{ offset: 0, start: 0, end: durationInFrames }] }),
    [durationInFrames]
  );
  const outerHost = useContext(HostContext);
  const resolveStaticFile = useMemo(
    () => staticFiles === void 0 ? outerHost?.staticFiles ?? null : makeStaticFileResolver(staticFiles),
    [staticFiles, outerHost]
  );
  if (onInput !== void 0 && typeof onInput !== "function") {
    throw new Error(`FrameProvider: onInput must be a function (event) => void, got ${JSON.stringify(onInput)}`);
  }
  const lastLog = useRef(null);
  const log = input === void 0 ? NO_EVENTS : checkInputLog(input, lastLog.current);
  lastLog.current = log;
  const emitState = useRef({ frame, onInput });
  useIsomorphicLayoutEffect(() => {
    emitState.current = { frame, onInput };
  });
  const emit = useCallback((event) => {
    if (typeof event !== "object" || event === null || typeof event.type !== "string" || event.type === "") {
      throw new Error(`emitInput: the event must be { type, ... } with a non-empty type, got ${JSON.stringify(event)}`);
    }
    if ("frame" in event) {
      throw new Error("emitInput: leave out frame: the event happens at the frame shown, which MotionForge sets");
    }
    const { frame: shown, onInput: handler } = emitState.current;
    handler?.({ ...event, frame: shown });
  }, []);
  const host = useMemo(
    () => ({ audio: audio ?? null, staticFiles: resolveStaticFile, input: log, emit }),
    [audio, resolveStaticFile, log, emit]
  );
  useEffect(() => owned ? getGateInternals(owned).attach() : void 0, [owned]);
  useEffect(() => audio ? getAudioCollectorInternals(audio).attach() : void 0, [audio]);
  const committedLog = input === void 0 ? null : log;
  useEffect(() => {
    if (owned) getGateInternals(owned).commit(frame, committedLog);
  }, [owned, frame, committedLog]);
  const [cancelled, setCancelled] = useState(null);
  useEffect(
    () => owned === privateGate ? getGateInternals(privateGate).onError((error) => setCancelled(() => error)) : void 0,
    [owned, privateGate]
  );
  if (cancelled && owned === privateGate) throw cancelled;
  return /* @__PURE__ */ jsx(GateContext.Provider, { value: gateValue, children: /* @__PURE__ */ jsx(HostContext.Provider, { value: host, children: /* @__PURE__ */ jsx(TimelineContext.Provider, { value: timeline, children: /* @__PURE__ */ jsx(FrameContext.Provider, { value, children }) }) }) });
};
var useIsomorphicLayoutEffect2 = typeof window === "undefined" ? useEffect : useLayoutEffect;
var DURING_RENDER = "delayRender() was called during render. In MotionForge call it from an effect or a callback, not during render and not in a useState() initializer: React may render a component (and run its initializers) more than once without keeping the result (StrictMode, interrupted renders), and such a handle would hold the frame forever. Instead of `const [handle] = useState(() => delayRender(label))`, write:\n  const { delayRender, continueRender, cancelRender } = useDelayRender();\n  const handle = useRef<number | null>(null);\n  useEffect(() => {\n    handle.current = delayRender(label);\n    load().then(setData, cancelRender);\n    return () => continueRender(handle.current!);\n  }, []);\n  useEffect(() => { if (data !== null) continueRender(handle.current!); }, [data]);";
var checkOptions = (options) => {
  if (options === void 0) return void 0;
  if (typeof options !== "object" || options === null) {
    throw new Error(`delayRender: options must be an object, got ${JSON.stringify(options)}`);
  }
  for (const key of Object.keys(options)) {
    if (key !== "timeoutInMilliseconds") {
      throw new Error(
        `delayRender: unknown option ${JSON.stringify(key)}` + (key === "retries" ? " (retries are not supported: the host decides whether to render a frame again)" : "")
      );
    }
  }
  const { timeoutInMilliseconds } = options;
  if (timeoutInMilliseconds !== void 0 && (typeof timeoutInMilliseconds !== "number" || Number.isNaN(timeoutInMilliseconds) || timeoutInMilliseconds <= 0)) {
    throw new Error(
      `delayRender: timeoutInMilliseconds must be a positive number (or Infinity), got ${JSON.stringify(timeoutInMilliseconds)}`
    );
  }
  return timeoutInMilliseconds;
};
var toError = (error) => {
  if (error instanceof Error) return error;
  return new Error(typeof error === "string" ? error : `cancelRender: ${JSON.stringify(error)}`);
};
var useDelayRender = () => {
  const context = useContext(GateContext);
  if (!context) {
    throw new Error("useDelayRender must be used within a FrameProvider");
  }
  const mounted = useRef(false);
  const unmounted = useRef(false);
  const owned = useRef(/* @__PURE__ */ new Set());
  useIsomorphicLayoutEffect2(() => {
    mounted.current = true;
    unmounted.current = false;
    const handles = owned.current;
    return () => {
      mounted.current = false;
      unmounted.current = true;
      handles.forEach(({ internals, handle }) => internals.continue(handle));
      handles.clear();
    };
  }, []);
  return useMemo(() => {
    const internals = getGateInternals(context.gate);
    return {
      delayRender: (label, options) => {
        if (label !== void 0 && typeof label !== "string") {
          throw new Error(`delayRender: label must be a string, got ${JSON.stringify(label)}`);
        }
        const timeoutInMilliseconds = checkOptions(options);
        if (!mounted.current) {
          throw new Error(unmounted.current ? "delayRender() was called after the component unmounted" : DURING_RENDER);
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
      cancelRender: (error) => internals.cancel(toError(error))
    };
  }, [context]);
};

export { FrameContext, FrameProvider, GateContext, HostContext, TimelineContext, createAudioCollector, createCollectingCollector, createRenderGate, firstAfter, firstAtOrAfter, getAudioCollectorInternals, getGateInternals, hashString, holdAllGates, isAppendOf, noStaticFiles, useCurrentFrame, useDelayRender, useVideoConfig };
//# sourceMappingURL=chunk-3P73E4TK.js.map
//# sourceMappingURL=chunk-3P73E4TK.js.map