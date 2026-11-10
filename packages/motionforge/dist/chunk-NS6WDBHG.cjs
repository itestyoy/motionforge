'use client';'use strict';

var react = require('react');
var jsxRuntime = require('react/jsx-runtime');

// src/core/render-gate.ts
var DEFAULT_TIMEOUT_MS = 3e4;
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
  const check = () => {
    checkScheduled = false;
    for (const waiter of [...waiters]) {
      const failed = failure();
      if (failed) {
        settle(waiter);
        waiter.reject(failed);
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
      const failed = failure();
      if (failed) return Promise.reject(failed);
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

// src/core/audio-collector.ts
var internalsOf2 = /* @__PURE__ */ new WeakMap();
var createAudioCollector = () => {
  const entries = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  let snapshot = [];
  let attached = false;
  const publish = () => {
    const tracks = [];
    for (const { track, most } of entries.values()) {
      for (let i = 0; i < most; i++) tracks.push(i === 0 ? track : { ...track, id: `${track.id}#${i + 1}` });
    }
    tracks.sort((a, b) => a.startFrame - b.startFrame || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    snapshot = Object.freeze(tracks);
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
    attach() {
      if (attached) {
        throw new Error(
          "An audio collector can serve only one FrameProvider at a time; create one collector per FrameProvider"
        );
      }
      attached = true;
      return () => {
        attached = false;
      };
    },
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
    }
  });
  return collector;
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
var describe = (value) => {
  try {
    return typeof value === "function" ? "a function" : JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var checkPath = (path) => {
  if (typeof path !== "string" || path === "") {
    throw new Error(`staticFile: path must be a non-empty string, got ${describe(path)}`);
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
        throw new Error(`staticFile(${JSON.stringify(path)}): the staticFiles function of the FrameProvider must return a non-empty string (a URL), got ${describe(url)}`);
      }
      return url;
    };
  }
  throw new Error(`FrameProvider: staticFiles must be a base URL (a non-empty string) or a function (path) => url, got ${describe(staticFiles)}`);
};
var noStaticFiles = (path) => {
  throw new Error(
    `staticFile(${JSON.stringify(checkPath(path))}): the FrameProvider has no staticFiles. The host app decides where static files come from: <FrameProvider staticFiles="https://cdn.example.com/creative/"> (a base URL) or staticFiles={(path) => url}.`
  );
};

// src/core/input-log.ts
var checkedUpTo = /* @__PURE__ */ new WeakMap();
var describe2 = (value) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var checkInputLog = (log, previous) => {
  if (!Array.isArray(log)) {
    throw new Error(`FrameProvider: input must be an array of events { frame, type, ... }, got ${describe2(log)}`);
  }
  const events = log;
  let from = checkedUpTo.get(events) ?? 0;
  if (from === 0 && previous && previous !== events && isAppendOf(previous, events)) {
    from = checkedUpTo.get(previous) ?? 0;
  }
  for (let i = from; i < events.length; i++) {
    const event = events[i];
    if (typeof event !== "object" || event === null) {
      throw new Error(`FrameProvider: input[${i}] must be an event { frame, type, ... }, got ${describe2(event)}`);
    }
    if (!Number.isInteger(event.frame) || event.frame < 0) {
      throw new Error(`FrameProvider: input[${i}].frame must be an integer >= 0, got ${describe2(event.frame)}`);
    }
    if (typeof event.type !== "string" || event.type === "") {
      throw new Error(`FrameProvider: input[${i}].type must be a non-empty string, got ${describe2(event.type)}`);
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
var useIsomorphicLayoutEffect = typeof window === "undefined" ? react.useEffect : react.useLayoutEffect;
var FrameContext = react.createContext(null);
var useCurrentFrame = () => {
  const context = react.useContext(FrameContext);
  if (!context) {
    throw new Error("useCurrentFrame must be used within a FrameProvider");
  }
  return context.frame;
};
var useVideoConfig = () => {
  const context = react.useContext(FrameContext);
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
var GateContext = react.createContext(null);
var TimelineContext = react.createContext(null);
var HostContext = react.createContext(null);
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
  const value = react.useMemo(
    () => ({ frame, fps, durationInFrames, width, height }),
    [frame, fps, durationInFrames, width, height]
  );
  const outer = react.useContext(GateContext);
  const [privateGate] = react.useState(createRenderGate);
  const owned = gate ?? (outer ? null : privateGate);
  const gateValue = react.useMemo(
    () => owned ? { gate: owned, scope: null } : outer,
    [owned, outer]
  );
  const timeline = react.useMemo(
    () => ({ offset: 0, start: 0, end: durationInFrames, remappedBy: null }),
    [durationInFrames]
  );
  const outerHost = react.useContext(HostContext);
  const resolveStaticFile = react.useMemo(
    () => staticFiles === void 0 ? outerHost?.staticFiles ?? null : makeStaticFileResolver(staticFiles),
    [staticFiles, outerHost]
  );
  if (onInput !== void 0 && typeof onInput !== "function") {
    throw new Error(`FrameProvider: onInput must be a function (event) => void, got ${JSON.stringify(onInput)}`);
  }
  const lastLog = react.useRef(null);
  const log = input === void 0 ? NO_EVENTS : checkInputLog(input, lastLog.current);
  lastLog.current = log;
  const emitState = react.useRef({ frame, onInput });
  useIsomorphicLayoutEffect(() => {
    emitState.current = { frame, onInput };
  });
  const emit = react.useCallback((event) => {
    if (typeof event !== "object" || event === null || typeof event.type !== "string" || event.type === "") {
      throw new Error(`emitInput: the event must be { type, ... } with a non-empty type, got ${JSON.stringify(event)}`);
    }
    if ("frame" in event) {
      throw new Error("emitInput: leave out frame: the event happens at the frame shown, which MotionForge sets");
    }
    const { frame: shown, onInput: handler } = emitState.current;
    handler?.({ ...event, frame: shown });
  }, []);
  const host = react.useMemo(
    () => ({ audio: audio ?? null, staticFiles: resolveStaticFile, input: log, emit }),
    [audio, resolveStaticFile, log, emit]
  );
  react.useEffect(() => owned ? getGateInternals(owned).attach() : void 0, [owned]);
  react.useEffect(() => audio ? getAudioCollectorInternals(audio).attach() : void 0, [audio]);
  react.useEffect(() => {
    if (owned) getGateInternals(owned).commit(frame);
  }, [owned, frame]);
  const [cancelled, setCancelled] = react.useState(null);
  react.useEffect(
    () => owned === privateGate ? getGateInternals(privateGate).onError((error) => setCancelled(() => error)) : void 0,
    [owned, privateGate]
  );
  if (cancelled && owned === privateGate) throw cancelled;
  return /* @__PURE__ */ jsxRuntime.jsx(GateContext.Provider, { value: gateValue, children: /* @__PURE__ */ jsxRuntime.jsx(HostContext.Provider, { value: host, children: /* @__PURE__ */ jsxRuntime.jsx(TimelineContext.Provider, { value: timeline, children: /* @__PURE__ */ jsxRuntime.jsx(FrameContext.Provider, { value, children }) }) }) });
};
var useIsomorphicLayoutEffect2 = typeof window === "undefined" ? react.useEffect : react.useLayoutEffect;
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
  const context = react.useContext(GateContext);
  if (!context) {
    throw new Error("useDelayRender must be used within a FrameProvider");
  }
  const mounted = react.useRef(false);
  const unmounted = react.useRef(false);
  const owned = react.useRef(/* @__PURE__ */ new Set());
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
  return react.useMemo(() => {
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

exports.FrameContext = FrameContext;
exports.FrameProvider = FrameProvider;
exports.GateContext = GateContext;
exports.HostContext = HostContext;
exports.TimelineContext = TimelineContext;
exports.createAudioCollector = createAudioCollector;
exports.createRenderGate = createRenderGate;
exports.firstAfter = firstAfter;
exports.firstAtOrAfter = firstAtOrAfter;
exports.getAudioCollectorInternals = getAudioCollectorInternals;
exports.getGateInternals = getGateInternals;
exports.hashString = hashString;
exports.holdAllGates = holdAllGates;
exports.isAppendOf = isAppendOf;
exports.noStaticFiles = noStaticFiles;
exports.useCurrentFrame = useCurrentFrame;
exports.useDelayRender = useDelayRender;
exports.useVideoConfig = useVideoConfig;
//# sourceMappingURL=chunk-NS6WDBHG.cjs.map
//# sourceMappingURL=chunk-NS6WDBHG.cjs.map