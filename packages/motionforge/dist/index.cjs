'use client';'use strict';

var chunkQS27YGBM_cjs = require('./chunk-QS27YGBM.cjs');
var React5 = require('react');
var jsxRuntime = require('react/jsx-runtime');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var React5__default = /*#__PURE__*/_interopDefault(React5);

var CompositionContext = React5.createContext(null);
var useComposition = () => {
  const context = React5.useContext(CompositionContext);
  if (!context) {
    throw new Error("useComposition must be used within a Composition");
  }
  return context;
};
var useVideoConfig2 = () => chunkQS27YGBM_cjs.useVideoConfig();
var Composition = ({
  id,
  component: Component,
  frame,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames,
  defaultProps = {}
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    CompositionContext.Provider,
    {
      value: {
        id,
        config: { width, height, fps, durationInFrames }
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        chunkQS27YGBM_cjs.FrameProvider,
        {
          frame,
          fps,
          durationInFrames,
          width,
          height,
          children: /* @__PURE__ */ jsxRuntime.jsx(Component, { ...defaultProps })
        }
      )
    }
  );
};
var SequenceContext = React5.createContext({
  relativeFrom: 0,
  isActive: true,
  startFrame: 0,
  endFrame: Infinity
});
var useSequence = () => React5.useContext(SequenceContext);
var Sequence = ({
  from,
  durationInFrames,
  offset = 0,
  name,
  children,
  layout = "absolute-fill"
}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const parent = React5.useContext(chunkQS27YGBM_cjs.FrameContext);
  const startFrame = from + offset;
  const endFrame = durationInFrames !== void 0 ? startFrame + durationInFrames : Infinity;
  const relativeFrame = currentFrame - startFrame;
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;
  const contextValue = {
    relativeFrom: startFrame,
    durationInFrames,
    isActive,
    startFrame,
    endFrame
  };
  if (!isActive) {
    return null;
  }
  const localDuration = durationInFrames ?? (parent ? parent.durationInFrames - startFrame : void 0);
  const content = /* @__PURE__ */ jsxRuntime.jsx(SequenceFrameProvider, { relativeFrame, durationInFrames: localDuration, children });
  if (layout === "none") {
    return /* @__PURE__ */ jsxRuntime.jsx(SequenceContext.Provider, { value: contextValue, children: content });
  }
  return /* @__PURE__ */ jsxRuntime.jsx(SequenceContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      "data-sequence-name": name,
      "data-sequence-from": startFrame,
      "data-sequence-duration": durationInFrames,
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column"
      },
      children: content
    }
  ) });
};
var SequenceFrameProvider = ({
  relativeFrame,
  durationInFrames,
  children
}) => {
  const parent = React5.useContext(chunkQS27YGBM_cjs.FrameContext);
  const frameValue = React5.useMemo(
    () => parent ? {
      ...parent,
      frame: relativeFrame,
      durationInFrames: durationInFrames ?? parent.durationInFrames
    } : null,
    [parent, relativeFrame, durationInFrames]
  );
  return /* @__PURE__ */ jsxRuntime.jsx(chunkQS27YGBM_cjs.FrameContext.Provider, { value: frameValue, children: /* @__PURE__ */ jsxRuntime.jsx(RelativeFrameContext.Provider, { value: relativeFrame, children }) });
};
var RelativeFrameContext = React5.createContext(null);
var useRelativeCurrentFrame = () => React5.useContext(RelativeFrameContext);
var Loop = ({
  durationInFrames,
  times = Infinity,
  children,
  name
}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const totalFrames = times === Infinity ? durationInFrames : durationInFrames * times;
  const loopedFrame = currentFrame % durationInFrames;
  const currentLoop = Math.floor(currentFrame / durationInFrames);
  if (times !== Infinity && currentFrame >= totalFrames) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntime.jsx(LoopContext.Provider, { value: { loopedFrame, currentLoop, durationInFrames }, children: /* @__PURE__ */ jsxRuntime.jsx(SequenceFrameProvider, { relativeFrame: loopedFrame, durationInFrames, children }) });
};
var LoopContext = React5.createContext({
  loopedFrame: 0,
  currentLoop: 0,
  durationInFrames: 0
});
var useLoopInfo = () => React5.useContext(LoopContext);
var Freeze = ({
  frame: freezeFrame,
  durationInFrames,
  children
}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const displayFrame = currentFrame < durationInFrames ? freezeFrame : currentFrame - durationInFrames + freezeFrame + 1;
  return /* @__PURE__ */ jsxRuntime.jsx(SequenceFrameProvider, { relativeFrame: displayFrame, children });
};
var checkRate = (rate, frame) => {
  if (typeof rate !== "number" || !Number.isFinite(rate)) {
    throw new Error(`Retiming: playbackRate must be a finite number, got ${rate} at frame ${frame}`);
  }
  return rate;
};
var cumulativeTables = /* @__PURE__ */ new WeakMap();
var cumulativeRate = (rate, frame) => {
  const whole = Math.floor(frame);
  const partial = frame - whole === 0 ? 0 : (frame - whole) * checkRate(rate(whole), whole);
  if (whole < 0) {
    let sum = 0;
    for (let i = whole; i < 0; i++) sum -= checkRate(rate(i), i);
    return sum + partial;
  }
  let table = cumulativeTables.get(rate);
  if (!table) {
    table = [0];
    cumulativeTables.set(rate, table);
  }
  for (let n = table.length; n <= whole; n++) {
    table.push(table[n - 1] + checkRate(rate(n - 1), n - 1));
  }
  return table[whole] + partial;
};
var Retiming = ({
  children,
  playbackRate
}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const retimedFrame = typeof playbackRate === "function" ? Math.floor(cumulativeRate(playbackRate, currentFrame)) : Math.floor(currentFrame * checkRate(playbackRate, currentFrame));
  return /* @__PURE__ */ jsxRuntime.jsx(SequenceFrameProvider, { relativeFrame: retimedFrame, children });
};
var Reverse = ({
  children,
  durationInFrames
}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const reversedFrame = durationInFrames - 1 - currentFrame % durationInFrames;
  return /* @__PURE__ */ jsxRuntime.jsx(SequenceFrameProvider, { relativeFrame: reversedFrame, children });
};
var Series = ({ children }) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  let accumulatedFrames = 0;
  let activeChildIndex = -1;
  let activeDuration = 0;
  let relativeFrame = currentFrame;
  const childArray = React5__default.default.Children.toArray(children);
  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];
    if (React5__default.default.isValidElement(child) && child.props.durationInFrames) {
      const childDuration = child.props.durationInFrames;
      if (currentFrame >= accumulatedFrames && currentFrame < accumulatedFrames + childDuration) {
        activeChildIndex = i;
        activeDuration = childDuration;
        relativeFrame = currentFrame - accumulatedFrames;
        break;
      }
      accumulatedFrames += childDuration;
    }
  }
  if (activeChildIndex === -1) {
    return null;
  }
  const activeChild = childArray[activeChildIndex];
  return /* @__PURE__ */ jsxRuntime.jsx(SequenceFrameProvider, { relativeFrame, durationInFrames: activeDuration, children: activeChild });
};
var AbsoluteFill = ({
  children,
  style,
  className
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        ...style
      },
      children
    }
  );
};
var getMediaTime = (frame, fps, startFrom, playbackRate) => (startFrom + frame * playbackRate) / fps;
var needsSeek = (currentTime, targetTime, fps) => Math.abs(currentTime - targetTime) > 0.5 / fps;
var Video = ({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = true,
  style,
  pauseOnFrame = true,
  onLoadedData,
  ...props
}) => {
  const videoRef = React5.useRef(null);
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  const [loaded, setLoaded] = React5.useState(false);
  React5.useEffect(() => {
    if (videoRef.current && loaded) {
      const time = getMediaTime(currentFrame, fps, startFrom, playbackRate);
      if (needsSeek(videoRef.current.currentTime, time, fps)) {
        videoRef.current.currentTime = time;
      }
    }
  }, [currentFrame, fps, startFrom, playbackRate, loaded]);
  React5.useEffect(() => {
    if (videoRef.current) {
      const vol = typeof volume === "function" ? volume(currentFrame) : volume;
      videoRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [currentFrame, volume]);
  React5.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  const handleLoadedData = (event) => {
    setLoaded(true);
    onLoadedData?.(event);
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    "video",
    {
      ref: videoRef,
      src,
      muted,
      playsInline: true,
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style
      },
      ...props,
      onLoadedData: handleLoadedData
    }
  );
};
var Audio = ({
  src,
  startFrom = 0,
  endAt,
  volume = 1,
  playbackRate = 1,
  muted = false,
  onLoadedData,
  ...props
}) => {
  const audioRef = React5.useRef(null);
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  const [loaded, setLoaded] = React5.useState(false);
  React5.useEffect(() => {
    if (audioRef.current && loaded) {
      const time = getMediaTime(currentFrame, fps, startFrom, playbackRate);
      if (needsSeek(audioRef.current.currentTime, time, fps)) {
        audioRef.current.currentTime = time;
      }
    }
  }, [currentFrame, fps, startFrom, playbackRate, loaded]);
  React5.useEffect(() => {
    if (audioRef.current) {
      const vol = typeof volume === "function" ? volume(currentFrame) : volume;
      audioRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [currentFrame, volume]);
  React5.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  const handleLoadedData = (event) => {
    setLoaded(true);
    onLoadedData?.(event);
  };
  return /* @__PURE__ */ jsxRuntime.jsx(
    "audio",
    {
      ref: audioRef,
      src,
      muted,
      ...props,
      onLoadedData: handleLoadedData
    }
  );
};
var Img = ({
  src,
  style,
  startFrom,
  endAt,
  ...props
}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  if (startFrom !== void 0 && currentFrame < startFrom) {
    return null;
  }
  if (endAt !== void 0 && currentFrame > endAt) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntime.jsx(
    "img",
    {
      src,
      alt: "",
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...style
      },
      ...props
    }
  );
};
var staticFile = (path) => {
  return `/static/${path}`;
};
var Text = ({
  children,
  style,
  className
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        display: "inline-block",
        ...style
      },
      children
    }
  );
};
var SVG = ({
  width = "100%",
  height = "100%",
  viewBox = "0 0 100 100",
  children,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "svg",
    {
      width,
      height,
      viewBox,
      style: {
        overflow: "visible",
        ...style
      },
      children
    }
  );
};
var Rect = ({
  width,
  height,
  x = 0,
  y = 0,
  rx = 0,
  ry = 0,
  fill = "black",
  stroke,
  strokeWidth,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "rect",
    {
      x,
      y,
      width,
      height,
      rx,
      ry,
      fill,
      stroke,
      strokeWidth,
      style
    }
  );
};
var Circle = ({
  r,
  cx = 0,
  cy = 0,
  fill = "black",
  stroke,
  strokeWidth,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "circle",
    {
      cx,
      cy,
      r,
      fill,
      stroke,
      strokeWidth,
      style
    }
  );
};
var Path = ({
  d,
  fill = "black",
  stroke,
  strokeWidth,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "path",
    {
      d,
      fill,
      stroke,
      strokeWidth,
      style
    }
  );
};
var G = ({
  children,
  transform,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx("g", { transform, style, children });
};
var HyperFrame = ({
  html,
  css,
  js,
  frameVariableName = "frame",
  className,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { width, height, fps } = chunkQS27YGBM_cjs.useVideoConfig();
  const iframeRef = React5.useRef(null);
  const isLoadedRef = React5.useRef(false);
  React5.useEffect(() => {
    if (!iframeRef.current) return;
    const doc = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              width: ${width}px;
              height: ${height}px;
              overflow: hidden;
              background: transparent;
            }
            ${css || ""}
          </style>
        </head>
        <body>
          <div id="content">${html}</div>
          <script>
            window.onFrameUpdate = function(newFrame, config) {
              const ${frameVariableName} = newFrame;
              const fps = config.fps;
              const width = config.width;
              const height = config.height;

              try {
                ${js || ""}
                if (typeof renderFrame === 'function') {
                  renderFrame(newFrame, config);
                }
              } catch (e) {
                console.error('Error in HyperFrame JS:', e);
              }
            };

            // Signal that we are ready
            window.parent.postMessage('hyperframe-ready', '*');
          </script>
        </body>
      </html>
    `;
    iframeRef.current.srcdoc = doc;
    isLoadedRef.current = false;
  }, [html, css, js, width, height, frameVariableName]);
  React5.useEffect(() => {
    const handleMessage = (event) => {
      if (event.data === "hyperframe-ready") {
        isLoadedRef.current = true;
        updateIframeFrame(frame);
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [frame]);
  const updateIframeFrame = (currentFrame) => {
    if (iframeRef.current && iframeRef.current.contentWindow && isLoadedRef.current) {
      try {
        if (typeof iframeRef.current.contentWindow.onFrameUpdate === "function") {
          iframeRef.current.contentWindow.onFrameUpdate(currentFrame, { fps, width, height });
        }
      } catch (e) {
        iframeRef.current.contentWindow.postMessage({
          type: "update-frame",
          frame: currentFrame,
          config: { fps, width, height }
        }, "*");
      }
    }
  };
  React5.useEffect(() => {
    updateIframeFrame(frame);
  }, [frame, fps, width, height]);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        width: "100%",
        height: "100%",
        position: "relative",
        ...style
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "iframe",
        {
          ref: iframeRef,
          title: "hyperframe-render",
          style: {
            width: "100%",
            height: "100%",
            border: "none",
            pointerEvents: "none"
          }
        }
      )
    }
  );
};

// src/utils/animation.ts
var Easing = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => --t * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - --t * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * --t * t * t * t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + --t * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * --t * t * t * t * t,
  easeInSine: (t) => 1 - Math.cos(t * Math.PI / 2),
  easeOutSine: (t) => Math.sin(t * Math.PI / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * (t - 1)),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
    return (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t) => 1 - Math.sqrt(1 - t * t),
  easeOutCirc: (t) => Math.sqrt(1 - --t * t),
  easeInOutCirc: (t) => t < 0.5 ? (1 - Math.sqrt(1 - 4 * t * t)) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5 ? Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2) / 2 : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: (t) => {
    const c4 = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t) => {
    const c4 = 2 * Math.PI / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t) => {
    const c5 = 2 * Math.PI / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    if (t < 0.5) return -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2;
    return Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5) / 2 + 1;
  },
  easeInBounce: (t) => 1 - Easing.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t) => t < 0.5 ? (1 - Easing.easeOutBounce(1 - 2 * t)) / 2 : (1 + Easing.easeOutBounce(2 * t - 1)) / 2,
  // Cubic bezier easing, like CSS cubic-bezier(x1, y1, x2, y2). The curve's x
  // is solved for t with Newton's method from a sampled guess, falling back to
  // bisection where Newton does not converge (steep or flat parts).
  bezier: (x1, y1, x2, y2) => {
    if (![x1, y1, x2, y2].every(Number.isFinite) || x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
      throw new Error(
        `Easing.bezier: control points must be finite and x1, x2 must be in [0, 1], got (${x1}, ${y1}, ${x2}, ${y2})`
      );
    }
    if (x1 === y1 && x2 === y2) return (t) => t;
    const coefficients = (p1, p2) => [1 - 3 * p2 + 3 * p1, 3 * p2 - 6 * p1, 3 * p1];
    const [ax, bx, cx] = coefficients(x1, x2);
    const [ay, by, cy] = coefficients(y1, y2);
    const curveX = (t) => ((ax * t + bx) * t + cx) * t;
    const curveY = (t) => ((ay * t + by) * t + cy) * t;
    const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
    const samples = 11;
    const step = 1 / (samples - 1);
    const table = Array.from({ length: samples }, (_, i) => curveX(i * step));
    const solveT = (x) => {
      let i = 0;
      while (i < samples - 2 && table[i + 1] <= x) i++;
      const lo = i * step;
      const hi = lo + step;
      const span = table[i + 1] - table[i];
      let t = span > 0 ? lo + (x - table[i]) / span * step : lo;
      for (let k = 0; k < 8; k++) {
        const error = curveX(t) - x;
        if (Math.abs(error) < 1e-12) return t;
        const slope = slopeX(t);
        if (Math.abs(slope) < 1e-9) break;
        t -= error / slope;
      }
      if (x < 0 || x > 1) return t;
      if (t >= lo && t <= hi && Math.abs(curveX(t) - x) < 1e-12) return t;
      let a = lo;
      let b = hi;
      for (let k = 0; k < 60; k++) {
        t = (a + b) / 2;
        if (curveX(t) < x) a = t;
        else b = t;
        if (b - a < 1e-12) break;
      }
      return (a + b) / 2;
    };
    return (x) => x === 0 ? 0 : x === 1 ? 1 : curveY(solveT(x));
  }
};
var isPositive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0;
var resolveSpringConfig = (fn, config = {}) => {
  const { damping = 10, mass = 1, stiffness = 100, overshootClamping = false } = config;
  if (!isPositive(mass) || !isPositive(stiffness) || !Number.isFinite(damping) || damping < 0) {
    throw new Error(
      `${fn}: config needs mass > 0, stiffness > 0 and damping >= 0, got mass ${mass}, stiffness ${stiffness}, damping ${damping}`
    );
  }
  return {
    omega: Math.sqrt(stiffness / mass),
    zeta: damping / (2 * Math.sqrt(stiffness * mass)),
    overshootClamping
  };
};
var springStep = (time, omega, zeta) => {
  if (zeta < 1 - 1e-6) {
    const omegaD = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * time) * (Math.cos(omegaD * time) + zeta * omega / omegaD * Math.sin(omegaD * time));
  }
  if (zeta <= 1 + 1e-6) {
    return 1 - (1 + omega * time) * Math.exp(-omega * time);
  }
  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -omega * (zeta - root);
  const r2 = -omega * (zeta + root);
  const c1 = r2 / (r2 - r1);
  const c2 = -r1 / (r2 - r1);
  return 1 - c1 * Math.exp(r1 * time) - c2 * Math.exp(r2 * time);
};
var settleFrame = (fps, omega, zeta, threshold) => {
  const off = (n) => Math.abs(springStep(n / fps, omega, zeta) - 1);
  if (zeta >= 1 - 1e-6) {
    let hi = 1;
    while (off(hi) >= threshold) hi *= 2;
    let lo = 0;
    while (hi - lo > 1) {
      const mid = Math.floor((lo + hi) / 2);
      if (off(mid) >= threshold) lo = mid;
      else hi = mid;
    }
    return hi;
  }
  if (zeta === 0) {
    throw new Error("measureSpring: a spring with damping 0 oscillates forever and never comes to rest");
  }
  const envelopeTime = Math.log(1 / (threshold * Math.sqrt(1 - zeta * zeta))) / (zeta * omega);
  for (let n = Math.ceil(envelopeTime * fps); n >= 0; n--) {
    if (off(n) >= threshold) return n + 1;
  }
  return 0;
};
var spring = ({
  frame,
  fps,
  config = {},
  from = 0,
  to = 1,
  durationInFrames,
  durationRestThreshold = 5e-3
}) => {
  if (!isPositive(fps)) {
    throw new Error(`spring: fps must be a positive number (use useVideoConfig().fps), got ${fps}`);
  }
  if (typeof frame !== "number" || Number.isNaN(frame)) {
    throw new Error(`spring: frame must be a number, got ${frame}`);
  }
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new Error(`spring: from and to must be finite numbers, got ${from} and ${to}`);
  }
  if (durationInFrames !== void 0 && !isPositive(durationInFrames)) {
    throw new Error(`spring: durationInFrames must be a positive number, got ${durationInFrames}`);
  }
  const { omega, zeta, overshootClamping } = resolveSpringConfig("spring", config);
  if (frame <= 0) return from;
  let time = frame / fps;
  if (durationInFrames !== void 0) {
    if (frame >= durationInFrames) return to;
    const naturalDuration = measureSpring({ fps, config, threshold: durationRestThreshold });
    time = frame * naturalDuration / durationInFrames / fps;
  }
  let value = springStep(time, omega, zeta);
  if (overshootClamping) {
    value = Math.max(0, Math.min(1, value));
  }
  return from + (to - from) * value;
};
var findSegment = (input, inputRange) => {
  for (let i = 1; i < inputRange.length - 1; i++) {
    if (input <= inputRange[i]) return i - 1;
  }
  return inputRange.length - 2;
};
var checkRanges = (fn, input, inputRange, outputLength) => {
  if (typeof input !== "number" || Number.isNaN(input)) {
    throw new Error(`${fn}: input must be a number, got ${input}`);
  }
  if (inputRange.length !== outputLength) {
    throw new Error(`${fn}: inputRange and outputRange must have the same length`);
  }
  if (inputRange.length < 2) {
    throw new Error(`${fn}: inputRange must have at least 2 elements`);
  }
  for (let i = 0; i < inputRange.length; i++) {
    if (typeof inputRange[i] !== "number" || Number.isNaN(inputRange[i])) {
      throw new Error(`${fn}: inputRange must contain numbers, got [${inputRange.join(", ")}]`);
    }
    if (i > 0 && inputRange[i] < inputRange[i - 1]) {
      throw new Error(`${fn}: inputRange must be ascending, got [${inputRange.join(", ")}]`);
    }
  }
};
var segmentProgress = (input, start, end) => end === start ? input >= end ? 1 : 0 : (input - start) / (end - start);
var interpolate = (input, inputRange, outputRange, options = {}) => {
  const {
    extrapolateLeft = "clamp",
    extrapolateRight = "clamp",
    easing
  } = options;
  checkRanges("interpolate", input, inputRange, outputRange.length);
  outputRange.forEach((value) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      throw new Error(`interpolate: outputRange must contain numbers, got [${outputRange.join(", ")}]`);
    }
  });
  if (input < inputRange[0]) {
    if (extrapolateLeft === "clamp") {
      return outputRange[0];
    } else if (extrapolateLeft === "identity") {
      return input;
    }
  }
  if (input > inputRange[inputRange.length - 1]) {
    if (extrapolateRight === "clamp") {
      return outputRange[outputRange.length - 1];
    } else if (extrapolateRight === "identity") {
      return input;
    }
  }
  const segmentIndex = findSegment(input, inputRange);
  const inputStart = inputRange[segmentIndex];
  const inputEnd = inputRange[segmentIndex + 1];
  const outputStart = outputRange[segmentIndex];
  const outputEnd = outputRange[segmentIndex + 1];
  if (inputEnd === inputStart) {
    return segmentProgress(input, inputStart, inputEnd) === 1 ? outputEnd : outputStart;
  }
  let progress = segmentProgress(input, inputStart, inputEnd);
  if (easing) {
    progress = easing(progress);
  }
  return outputStart + progress * (outputEnd - outputStart);
};
var NUMBER = "[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?%?";
var COMMA_RGB = new RegExp(
  `^rgba?\\(\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*,\\s*(${NUMBER})\\s*(?:,\\s*(${NUMBER})\\s*)?\\)$`,
  "i"
);
var SPACE_RGB = new RegExp(
  `^rgba?\\(\\s*(${NUMBER})\\s+(${NUMBER})\\s+(${NUMBER})\\s*(?:\\/\\s*(${NUMBER})\\s*)?\\)$`,
  "i"
);
var HEX = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
var parseColor = (color) => {
  const value = typeof color === "string" ? color.trim() : "";
  const hex = value.match(HEX)?.[1];
  if (hex) {
    const digits = hex.length <= 4 ? hex.split("").map((d) => d + d) : hex.match(/../g);
    const [r, g, b] = digits.map((d) => parseInt(d, 16));
    return [r, g, b, digits.length === 4 ? parseInt(digits[3], 16) / 255 : 1];
  }
  const rgb = value.match(COMMA_RGB) ?? value.match(SPACE_RGB);
  if (rgb) {
    const channel = (part) => part.endsWith("%") ? parseFloat(part) / 100 * 255 : parseFloat(part);
    const alpha = (part) => part === void 0 ? 1 : part.endsWith("%") ? parseFloat(part) / 100 : parseFloat(part);
    return [
      channel(rgb[1]),
      channel(rgb[2]),
      channel(rgb[3]),
      Math.max(0, Math.min(1, alpha(rgb[4])))
    ];
  }
  throw new Error(
    `interpolateColors: unsupported color "${color}" (use #rgb, #rgba, #rrggbb, #rrggbbaa, rgb() or rgba())`
  );
};
var formatColor = ([r, g, b, a]) => {
  const channel = (x) => Math.round(Math.max(0, Math.min(255, x)));
  if (a >= 1) {
    return "#" + [r, g, b].map((x) => channel(x).toString(16).padStart(2, "0")).join("");
  }
  const alpha = Math.round(Math.max(0, a) * 1e3) / 1e3;
  return `rgba(${channel(r)}, ${channel(g)}, ${channel(b)}, ${alpha})`;
};
var interpolateColors = (input, inputRange, outputRange) => {
  checkRanges("interpolateColors", input, inputRange, outputRange.length);
  const clamped = Math.max(inputRange[0], Math.min(inputRange[inputRange.length - 1], input));
  const segmentIndex = findSegment(clamped, inputRange);
  const inputStart = inputRange[segmentIndex];
  const inputEnd = inputRange[segmentIndex + 1];
  const colorStart = parseColor(outputRange[segmentIndex]);
  const colorEnd = parseColor(outputRange[segmentIndex + 1]);
  const progress = segmentProgress(clamped, inputStart, inputEnd);
  const mix = (i) => colorStart[i] + progress * (colorEnd[i] - colorStart[i]);
  return formatColor([mix(0), mix(1), mix(2), mix(3)]);
};
var useKeyframes = (keyframes, frame) => {
  if (keyframes.length === 0) return 0;
  if (keyframes.length === 1) return keyframes[0].value;
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  let prev = sorted[0];
  let next = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }
  if (frame <= prev.frame) return prev.value;
  if (frame >= next.frame) return next.value;
  let progress = (frame - prev.frame) / (next.frame - prev.frame);
  if (next.easing) {
    progress = next.easing(progress);
  } else if (prev.easing) {
    progress = prev.easing(progress);
  }
  if (typeof prev.value === "number" && typeof next.value === "number") {
    return prev.value + progress * (next.value - prev.value);
  }
  return progress < 0.5 ? prev.value : next.value;
};
var measureSpring = ({
  fps,
  config = {},
  threshold = 5e-3
}) => {
  if (!isPositive(fps)) {
    throw new Error(`measureSpring: fps must be a positive number, got ${fps}`);
  }
  if (!isPositive(threshold) || threshold >= 1) {
    throw new Error(`measureSpring: threshold must be between 0 and 1, got ${threshold}`);
  }
  const { omega, zeta } = resolveSpringConfig("measureSpring", config);
  return settleFrame(fps, omega, zeta, threshold);
};
var getFramesFromSeconds = (seconds, fps) => {
  return Math.round(seconds * fps);
};
var getSecondsFromFrames = (frames, fps) => {
  return frames / fps;
};
var range = (start, end, step = 1) => {
  const result = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
};
var random = (seed, min = 0, max = 1) => {
  const str = typeof seed === "number" ? seed.toString() : seed;
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 2246822507);
  hash ^= hash >>> 13;
  hash = Math.imul(hash, 3266489909);
  hash ^= hash >>> 16;
  const normalized = (hash >>> 0) / 4294967296;
  return min + normalized * (max - min);
};
var noise2D = (x, y) => {
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new Error(`noise2D: x and y must be finite numbers, got ${x}, ${y}`);
  }
  const X = Math.floor(x);
  const Y = Math.floor(y);
  const fx = x - X;
  const fy = y - Y;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const lattice = (i, j) => random(`noise2D:${i}:${j}`);
  const a = lattice(X, Y);
  const b = lattice(X + 1, Y);
  const c = lattice(X, Y + 1);
  const d = lattice(X + 1, Y + 1);
  const top = a + (b - a) * u;
  const bottom = c + (d - c) * u;
  return top + (bottom - top) * v;
};

// src/utils/text.ts
var segmenter;
var splitGraphemes = (text) => {
  if (segmenter === void 0) {
    const Segmenter = Intl.Segmenter;
    segmenter = typeof Segmenter === "function" ? new Segmenter("en", { granularity: "grapheme" }) : null;
  }
  return segmenter ? Array.from(segmenter.segment(text), (part) => part.segment) : Array.from(text);
};
var Fade = ({
  children,
  durationInFrames = 30,
  startFrame = 0,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { opacity, ...style }, children });
};
var Scale = ({
  children,
  from = 0,
  to = 1,
  durationInFrames = 30,
  startFrame = 0,
  easing = Easing.easeOutCubic,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  const scale2 = from + (to - from) * progress;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { transform: `scale(${scale2})`, ...style }, children });
};
var Slide = ({
  children,
  direction,
  distance = 100,
  durationInFrames = 30,
  startFrame = 0,
  easing = Easing.easeOutCubic,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  let transform = "";
  const offset = distance * (1 - progress);
  switch (direction) {
    case "left":
      transform = `translateX(${-offset}px)`;
      break;
    case "right":
      transform = `translateX(${offset}px)`;
      break;
    case "up":
      transform = `translateY(${-offset}px)`;
      break;
    case "down":
      transform = `translateY(${offset}px)`;
      break;
  }
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { transform, ...style }, children });
};
var Rotate = ({
  children,
  degrees = 360,
  durationInFrames = 60,
  startFrame = 0,
  easing = Easing.linear,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const rotation = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, degrees],
    { extrapolateLeft: "clamp", extrapolateRight: "extend", easing }
  );
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { transform: `rotate(${rotation}deg)`, ...style }, children });
};
var Typewriter = ({
  text,
  durationInFrames = 60,
  startFrame = 0,
  style,
  cursor = true,
  cursorChar = "|"
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const characters = splitGraphemes(text);
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, characters.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const displayText = characters.slice(0, Math.floor(progress)).join("");
  const showCursor = cursor && frame % 30 < 15;
  return /* @__PURE__ */ jsxRuntime.jsxs("span", { style, children: [
    displayText,
    showCursor && cursorChar
  ] });
};
var Counter = ({
  from = 0,
  to,
  durationInFrames = 60,
  startFrame = 0,
  easing = Easing.easeOutCubic,
  style,
  locale = "en-US",
  format
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const numberFormat = React5__default.default.useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale]
  );
  const value = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  return /* @__PURE__ */ jsxRuntime.jsx("span", { style, children: format ? format(value) : numberFormat.format(Math.round(value) + 0) });
};
var ProgressBar = ({
  progress,
  width = 200,
  height = 10,
  backgroundColor = "#333",
  fillColor = "#3b82f6",
  borderRadius = 5,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        width,
        height,
        backgroundColor,
        borderRadius,
        overflow: "hidden",
        ...style
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            width: `${progress * 100}%`,
            height: "100%",
            backgroundColor: fillColor
          }
        }
      )
    }
  );
};
var Glitch = ({
  children,
  intensity = 10,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const shouldGlitch = frame % 10 < 3;
  const offset = shouldGlitch ? random(`glitch-${frame}-offset`) * intensity : 0;
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { position: "relative", ...style }, children: [
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: offset,
          opacity: shouldGlitch ? 0.8 : 0,
          color: "red",
          mixBlendMode: "screen"
        },
        children
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        style: {
          position: "absolute",
          top: 0,
          left: -offset,
          opacity: shouldGlitch ? 0.8 : 0,
          color: "cyan",
          mixBlendMode: "screen"
        },
        children
      }
    ),
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { position: "relative" }, children })
  ] });
};
var Trail = ({
  children,
  trailLength = 5,
  opacityDecay = 0.2,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { style: { position: "relative", ...style }, children: [
    Array.from({ length: trailLength }, (_, i) => {
      const trailFrame = frame - i * 2;
      if (trailFrame < 0) return null;
      return /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            opacity: 1 - i * opacityDecay,
            pointerEvents: "none"
          },
          children
        },
        i
      );
    }),
    /* @__PURE__ */ jsxRuntime.jsx("div", { style: { position: "relative" }, children })
  ] });
};
var ShakeEffect = ({
  children,
  intensity = 5,
  active = true,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  if (!active) {
    return /* @__PURE__ */ jsxRuntime.jsx("div", { style, children });
  }
  const x = Math.sin(frame * 0.8) * intensity;
  const y = Math.cos(frame * 1.2) * intensity;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { transform: `translate(${x}px, ${y}px)`, ...style }, children });
};
var Highlight = ({
  children,
  color = "#ffeb3b",
  progress = 1,
  style
}) => {
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      style: {
        background: `linear-gradient(90deg, ${color} ${progress * 100}%, transparent ${progress * 100}%)`,
        ...style
      },
      children
    }
  );
};
var MaskReveal = ({
  children,
  direction,
  progress,
  style
}) => {
  let clipPath = "";
  switch (direction) {
    case "left":
      clipPath = `inset(0 ${(1 - progress) * 100}% 0 0)`;
      break;
    case "right":
      clipPath = `inset(0 0 0 ${(1 - progress) * 100}%)`;
      break;
    case "up":
      clipPath = `inset(0 0 ${(1 - progress) * 100}% 0)`;
      break;
    case "down":
      clipPath = `inset(${(1 - progress) * 100}% 0 0 0)`;
      break;
  }
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { clipPath, ...style }, children });
};
var NeonGlow = ({
  children,
  color = "#00ff00",
  intensity = 1,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const pulseIntensity = 0.8 + Math.sin(frame * 0.1) * 0.2;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        textShadow: `
          0 0 ${5 * intensity}px ${color},
          0 0 ${10 * intensity}px ${color},
          0 0 ${20 * intensity}px ${color},
          0 0 ${40 * intensity}px ${color}
        `,
        opacity: pulseIntensity,
        ...style
      },
      children
    }
  );
};
var Rotate3D = ({
  children,
  rotateX = 0,
  rotateY = 360,
  rotateZ = 0,
  durationInFrames = 60,
  startFrame = 0,
  perspective = 1e3,
  easing = Easing.easeInOutCubic,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  const rx = rotateX * progress;
  const ry = rotateY * progress;
  const rz = rotateZ * progress;
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { perspective, ...style }, children: /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        transform: `rotateX(${rx}deg) rotateY(${ry}deg) rotateZ(${rz}deg)`,
        transformStyle: "preserve-3d"
      },
      children
    }
  ) });
};
var Flip3D = ({
  front,
  back,
  durationInFrames = 60,
  startFrame = 0,
  direction = "horizontal",
  perspective = 1e3,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 180],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutCubic }
  );
  const rotateAxis = direction === "horizontal" ? "rotateY" : "rotateX";
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { perspective, ...style }, children: /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      style: {
        position: "relative",
        transformStyle: "preserve-3d",
        transform: `${rotateAxis}(${progress}deg)`,
        width: "100%",
        height: "100%"
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            style: {
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden"
            },
            children: front
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsx(
          "div",
          {
            style: {
              position: "absolute",
              width: "100%",
              height: "100%",
              backfaceVisibility: "hidden",
              transform: `${rotateAxis}(180deg)`
            },
            children: back
          }
        )
      ]
    }
  ) });
};
var Perspective3D = ({
  children,
  rotateX = 20,
  rotateY = 20,
  perspective = 800,
  durationInFrames = 60,
  startFrame = 0,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeOutCubic }
  );
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { perspective, ...style }, children: /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        transform: `rotateX(${rotateX * progress}deg) rotateY(${rotateY * progress}deg)`,
        transformStyle: "preserve-3d"
      },
      children
    }
  ) });
};
var Cube3D = ({
  size = 100,
  durationInFrames = 120,
  colors = {
    front: "#10b981",
    back: "#059669",
    left: "#047857",
    right: "#065f46",
    top: "#34d399",
    bottom: "#6ee7b7"
  },
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const rotateY = interpolate(frame, [0, durationInFrames], [0, 360], {
    extrapolateRight: "extend"
  });
  const rotateX = interpolate(frame, [0, durationInFrames], [0, 360], {
    extrapolateRight: "extend"
  });
  const halfSize = size / 2;
  const faceStyle = {
    position: "absolute",
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: size * 0.3,
    fontWeight: "bold",
    color: "white",
    backfaceVisibility: "visible",
    border: "2px solid rgba(255,255,255,0.3)"
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { perspective: 600, ...style }, children: /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      style: {
        width: size,
        height: size,
        position: "relative",
        transformStyle: "preserve-3d",
        transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...faceStyle, backgroundColor: colors.front, transform: `translateZ(${halfSize}px)` }, children: "Front" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...faceStyle, backgroundColor: colors.back, transform: `rotateY(180deg) translateZ(${halfSize}px)` }, children: "Back" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...faceStyle, backgroundColor: colors.left, transform: `rotateY(-90deg) translateZ(${halfSize}px)` }, children: "Left" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...faceStyle, backgroundColor: colors.right, transform: `rotateY(90deg) translateZ(${halfSize}px)` }, children: "Right" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...faceStyle, backgroundColor: colors.top, transform: `rotateX(90deg) translateZ(${halfSize}px)` }, children: "Top" }),
        /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...faceStyle, backgroundColor: colors.bottom, transform: `rotateX(-90deg) translateZ(${halfSize}px)` }, children: "Bottom" })
      ]
    }
  ) });
};
var ParticleSystem = ({
  count = 50,
  colors = ["#10b981", "#34d399", "#6ee7b7", "#059669", "#047857"],
  minSize = 3,
  maxSize = 15,
  speed = 2,
  direction = "random",
  fadeOut = true,
  particleShape = "circle",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { width, height } = chunkQS27YGBM_cjs.useVideoConfig();
  const particles = React5__default.default.useMemo(() => {
    const seed = (n) => {
      const x = Math.sin(n * 9999) * 1e4;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => {
      const rand = seed(i);
      const rand2 = seed(i + 1e3);
      const rand3 = seed(i + 2e3);
      const rand4 = seed(i + 3e3);
      const rand5 = seed(i + 4e3);
      let vx = 0;
      let vy = 0;
      switch (direction) {
        case "up":
          vx = (rand2 - 0.5) * speed;
          vy = -rand3 * speed * 2 - speed;
          break;
        case "down":
          vx = (rand2 - 0.5) * speed;
          vy = rand3 * speed * 2 + speed;
          break;
        case "left":
          vx = -rand2 * speed * 2 - speed;
          vy = (rand3 - 0.5) * speed;
          break;
        case "right":
          vx = rand2 * speed * 2 + speed;
          vy = (rand3 - 0.5) * speed;
          break;
        case "explode":
          const angle = rand2 * Math.PI * 2;
          const mag = rand3 * speed * 3 + speed;
          vx = Math.cos(angle) * mag;
          vy = Math.sin(angle) * mag;
          break;
        default:
          vx = (rand2 - 0.5) * speed * 2;
          vy = (rand3 - 0.5) * speed * 2;
      }
      return {
        x: rand * width,
        y: rand2 * height,
        size: minSize + rand3 * (maxSize - minSize),
        speedX: vx,
        speedY: vy,
        color: colors[Math.floor(rand4 * colors.length)],
        opacity: 0.5 + rand5 * 0.5,
        rotation: rand4 * 360,
        rotationSpeed: (rand5 - 0.5) * 10
      };
    });
  }, [count, colors, minSize, maxSize, speed, direction, width, height]);
  const renderParticle = (p, index) => {
    const x = (p.x + p.speedX * frame) % width;
    const y = (p.y + p.speedY * frame) % height;
    const adjustedX = x < 0 ? x + width : x;
    const adjustedY = y < 0 ? y + height : y;
    const opacity = fadeOut ? p.opacity * (1 - Math.abs(frame % 120 - 60) / 60) : p.opacity;
    const rotation = p.rotation + p.rotationSpeed * frame;
    const shapeStyle = {
      position: "absolute",
      left: adjustedX,
      top: adjustedY,
      width: p.size,
      height: p.size,
      backgroundColor: particleShape === "circle" ? p.color : void 0,
      borderRadius: particleShape === "circle" ? "50%" : particleShape === "triangle" ? 0 : 2,
      opacity: Math.max(0.1, Math.min(1, opacity)),
      transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
      boxShadow: `0 0 ${p.size}px ${p.color}`
    };
    if (particleShape === "star") {
      return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...shapeStyle, backgroundColor: "transparent" }, children: /* @__PURE__ */ jsxRuntime.jsx("svg", { viewBox: "0 0 24 24", width: p.size, height: p.size, fill: p.color, children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }) }, index);
    }
    if (particleShape === "triangle") {
      return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { ...shapeStyle, backgroundColor: "transparent" }, children: /* @__PURE__ */ jsxRuntime.jsx("svg", { viewBox: "0 0 24 24", width: p.size, height: p.size, fill: p.color, children: /* @__PURE__ */ jsxRuntime.jsx("path", { d: "M12 2L2 22h20L12 2z" }) }) }, index);
    }
    return /* @__PURE__ */ jsxRuntime.jsx("div", { style: shapeStyle }, index);
  };
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { position: "absolute", inset: 0, overflow: "hidden", ...style }, children: particles.map(renderParticle) });
};
var LetterByLetter = ({
  text,
  durationInFrames = 60,
  startFrame = 0,
  delayPerLetter = 2,
  animation = "fade",
  easing = Easing.easeOutCubic,
  style,
  letterStyle
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const letters = splitGraphemes(text);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { display: "flex", flexWrap: "wrap", ...style }, children: letters.map((char, index) => {
    const letterStart = startFrame + index * delayPerLetter;
    const progress = interpolate(
      frame,
      [letterStart, letterStart + durationInFrames / letters.length],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
    );
    let transform = "";
    let opacity = progress;
    switch (animation) {
      case "scale":
        transform = `scale(${progress})`;
        break;
      case "slide":
        transform = `translateY(${(1 - progress) * 30}px)`;
        break;
      case "rotate":
        transform = `rotate(${(1 - progress) * 90}deg)`;
        break;
      case "bounce":
        const bounce2 = progress < 0.5 ? progress * 2 : 2 - progress * 2;
        transform = `scale(${0.5 + bounce2 * 0.5})`;
        break;
    }
    return /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        style: {
          display: "inline-block",
          opacity,
          transform,
          ...letterStyle
        },
        children: char === " " ? "\xA0" : char
      },
      index
    );
  }) });
};
var WordByWord = ({
  text,
  durationInFrames = 60,
  startFrame = 0,
  delayPerWord = 10,
  animation = "fade",
  style,
  wordStyle
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const words = text.split(" ");
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.3em", ...style }, children: words.map((word, index) => {
    const wordStart = startFrame + index * delayPerWord;
    const progress = interpolate(
      frame,
      [wordStart, wordStart + durationInFrames / words.length],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeOutBack }
    );
    let transform = "";
    switch (animation) {
      case "scale":
        transform = `scale(${progress})`;
        break;
      case "slide":
        transform = `translateY(${(1 - progress) * 20}px)`;
        break;
      case "pop":
        const popScale = 1 + (1 - progress) * 0.3;
        transform = `scale(${progress < 0.5 ? progress * 2 * popScale : popScale - (progress - 0.5) * 2 * (popScale - 1)})`;
        break;
    }
    return /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        style: {
          display: "inline-block",
          opacity: progress,
          transform,
          ...wordStyle
        },
        children: word
      },
      index
    );
  }) });
};
var WaveText = ({
  text,
  amplitude = 10,
  frequency = 0.3,
  speed = 0.15,
  style,
  letterStyle
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { display: "flex", alignItems: "center", ...style }, children: splitGraphemes(text).map((char, index) => {
    const offset = Math.sin(frame * speed + index * frequency) * amplitude;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        style: {
          display: "inline-block",
          transform: `translateY(${offset}px)`,
          ...letterStyle
        },
        children: char === " " ? "\xA0" : char
      },
      index
    );
  }) });
};
var RainbowText = ({
  text,
  speed = 5,
  saturation = 70,
  lightness = 60,
  style,
  letterStyle
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { display: "flex", flexWrap: "wrap", ...style }, children: splitGraphemes(text).map((char, index) => {
    const hue = (frame * speed + index * 20) % 360;
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "span",
      {
        style: {
          display: "inline-block",
          color,
          ...letterStyle
        },
        children: char === " " ? "\xA0" : char
      },
      index
    );
  }) });
};
var GradientText = ({
  text,
  colors = ["#10b981", "#34d399", "#6ee7b7", "#14b8a6", "#10b981"],
  speed = 2,
  angle = 90,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  if (colors.length === 0) {
    throw new Error("GradientText: colors must contain at least one color");
  }
  const cycle = [...colors, ...colors, colors[0]];
  const gradientStops = cycle.map((color, i) => `${color} ${i * 100 / (cycle.length - 1)}%`).join(", ");
  const position = (frame * speed % 100 + 100) % 100;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "span",
    {
      style: {
        background: `linear-gradient(${angle}deg, ${gradientStops})`,
        backgroundSize: "200% 100%",
        backgroundPosition: `${position}% 50%`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        ...style
      },
      children: text
    }
  );
};
var Blur = ({
  children,
  from = 20,
  to = 0,
  durationInFrames = 30,
  startFrame = 0,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const blur2 = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { filter: `blur(${blur2}px)`, ...style }, children });
};
var Bounce = ({
  children,
  height = 50,
  durationInFrames = 60,
  startFrame = 0,
  times = 3,
  damping = 0.7,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const bounceCount = times;
  const t = progress * bounceCount * Math.PI;
  const amplitude = height * Math.pow(damping, progress * bounceCount);
  const y = Math.abs(Math.sin(t)) * amplitude * (1 - progress);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { transform: `translateY(${-y}px)`, ...style }, children });
};
var Pulse = ({
  children,
  minScale = 0.95,
  maxScale = 1.05,
  speed = 0.1,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const scale2 = minScale + (maxScale - minScale) * (0.5 + Math.sin(frame * speed) * 0.5);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { transform: `scale(${scale2})`, ...style }, children });
};
var Swing = ({
  children,
  angle = 30,
  speed = 0.15,
  damping = 0.995,
  durationInFrames = 120,
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const dampFactor = Math.pow(damping, frame);
  const rotation = Math.sin(frame * speed) * angle * dampFactor;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      style: {
        transform: `rotate(${rotation}deg)`,
        transformOrigin: "top center",
        ...style
      },
      children
    }
  );
};
var Confetti = ({
  count = 100,
  colors = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"],
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { width, height } = chunkQS27YGBM_cjs.useVideoConfig();
  const confettiPieces = React5__default.default.useMemo(() => {
    const seed = (n) => {
      const x = Math.sin(n * 9999) * 1e4;
      return x - Math.floor(x);
    };
    return Array.from({ length: count }, (_, i) => ({
      x: seed(i) * width,
      startY: -50 - seed(i + 100) * 200,
      speed: 2 + seed(i + 200) * 4,
      rotation: seed(i + 300) * 360,
      rotationSpeed: (seed(i + 400) - 0.5) * 20,
      size: 8 + seed(i + 500) * 8,
      color: colors[Math.floor(seed(i + 600) * colors.length)],
      wobble: seed(i + 700) * Math.PI * 2,
      wobbleSpeed: 0.02 + seed(i + 800) * 0.05
    }));
  }, [count, colors, width]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { style: { position: "absolute", inset: 0, overflow: "hidden", ...style }, children: confettiPieces.map((piece, i) => {
    const y = piece.startY + piece.speed * frame;
    const x = piece.x + Math.sin(frame * piece.wobbleSpeed + piece.wobble) * 30;
    const rotation = piece.rotation + piece.rotationSpeed * frame;
    if (y > height + 50) return null;
    return /* @__PURE__ */ jsxRuntime.jsx(
      "div",
      {
        style: {
          position: "absolute",
          left: x,
          top: y,
          width: piece.size,
          height: piece.size * 0.6,
          backgroundColor: piece.color,
          transform: `rotate(${rotation}deg)`,
          borderRadius: 2
        }
      },
      i
    );
  }) });
};
var KineticTypography = ({
  text,
  durationInFrames = 60,
  startFrame = 0,
  stagger = 3,
  fontSize = 80,
  fontWeight = "bold",
  fontFamily = "Inter, system-ui, sans-serif",
  color = "white",
  className = "",
  type = "velocity",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  const characters = splitGraphemes(text);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        display: "flex",
        flexWrap: "wrap",
        fontSize,
        fontWeight,
        fontFamily,
        color,
        ...style
      },
      children: characters.map((char, i) => {
        const relativeStart = startFrame + i * stagger;
        const charFrame = frame - relativeStart;
        const progress = interpolate(
          charFrame,
          [0, durationInFrames],
          [0, 1],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeOutExpo }
        );
        let charStyle = {
          display: "inline-block",
          whiteSpace: "pre"
        };
        if (type === "velocity") {
          const y = interpolate(charFrame, [0, 20], [100, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.easeOutBack
          });
          const opacity = interpolate(charFrame, [0, 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });
          const blur2 = interpolate(charFrame, [0, 10], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });
          charStyle = {
            ...charStyle,
            transform: `translateY(${y}px)`,
            opacity,
            filter: `blur(${blur2}px)`
          };
        } else if (type === "stretching") {
          const scaleY = spring({
            frame: charFrame,
            fps,
            config: { damping: 12, stiffness: 200 },
            from: 0,
            to: 1
          });
          const scaleX = spring({
            frame: charFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
            from: 2,
            to: 1
          });
          charStyle = {
            ...charStyle,
            transform: `scale(${scaleX}, ${scaleY})`,
            transformOrigin: "bottom",
            opacity: progress
          };
        } else if (type === "glitch") {
          const seed = charFrame + i * 1e3;
          const randomVal = Math.sin(seed) * 1e4 % 1;
          const isGlitched = charFrame > 0 && charFrame < 15 && Math.abs(randomVal) > 0.8;
          const xOffset = isGlitched ? Math.sin(seed + 1) * 1e4 % 1 * 20 : 0;
          const colorShift = isGlitched ? "cyan" : color;
          charStyle = {
            ...charStyle,
            transform: `translateX(${xOffset}px)`,
            color: colorShift,
            opacity: progress
          };
        } else if (type === "reveal") {
          const clipWidth = interpolate(charFrame, [0, 20], [0, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });
          charStyle = {
            ...charStyle,
            clipPath: `inset(0 ${100 - clipWidth}% 0 0)`,
            opacity: progress > 0 ? 1 : 0
          };
        }
        return /* @__PURE__ */ jsxRuntime.jsx("span", { style: charStyle, children: char === " " ? "\xA0" : char }, i);
      })
    }
  );
};
var LiquidText = ({
  text,
  width = 800,
  height = 300,
  fillColor = "#10b981",
  strokeColor = "#059669",
  strokeWidth = 2,
  fontSize = 150,
  fontFamily = "Inter, system-ui, sans-serif",
  fontWeight = "bold",
  speed = 0.05,
  amplitude = 20,
  className = "",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const id = React5__default.default.useId().replace(/:/g, "");
  const wavePath = React5__default.default.useMemo(() => {
    let path = `M 0 ${height}`;
    for (let x = 0; x <= width; x += 10) {
      const y = Math.sin(frame * speed + x * 0.02) * amplitude + amplitude;
      path += ` L ${x} ${y}`;
    }
    path += ` L ${width} ${height} Z`;
    return path;
  }, [frame, width, height, speed, amplitude]);
  return /* @__PURE__ */ jsxRuntime.jsx("div", { className, style: { width, height, position: "relative", ...style }, children: /* @__PURE__ */ jsxRuntime.jsxs(
    "svg",
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      style: { overflow: "visible" },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx("defs", { children: /* @__PURE__ */ jsxRuntime.jsx("clipPath", { id: `text-clip-${id}`, children: /* @__PURE__ */ jsxRuntime.jsx(
          "text",
          {
            x: "50%",
            y: "50%",
            dominantBaseline: "middle",
            textAnchor: "middle",
            fontSize,
            fontFamily,
            fontWeight,
            children: text
          }
        ) }) }),
        /* @__PURE__ */ jsxRuntime.jsx(
          "text",
          {
            x: "50%",
            y: "50%",
            dominantBaseline: "middle",
            textAnchor: "middle",
            fontSize,
            fontFamily,
            fontWeight,
            fill: "none",
            stroke: strokeColor,
            strokeWidth,
            opacity: "0.3",
            children: text
          }
        ),
        /* @__PURE__ */ jsxRuntime.jsxs("g", { clipPath: `url(#text-clip-${id})`, children: [
          /* @__PURE__ */ jsxRuntime.jsx("path", { d: wavePath, fill: fillColor }),
          /* @__PURE__ */ jsxRuntime.jsx(
            "text",
            {
              x: "50%",
              y: "50%",
              dominantBaseline: "middle",
              textAnchor: "middle",
              fontSize,
              fontFamily,
              fontWeight,
              fill: "none",
              stroke: fillColor,
              strokeWidth,
              children: text
            }
          )
        ] })
      ]
    }
  ) });
};
var TextStack3D = ({
  text,
  layers = 8,
  depth = 5,
  fontSize = 120,
  fontWeight = "900",
  fontFamily = "Inter, system-ui, sans-serif",
  mainColor = "#ffffff",
  layerColor = "#10b981",
  durationInFrames = 60,
  startFrame = 0,
  className = "",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutCubic }
  );
  const rotateX = interpolate(progress, [0, 1], [0, 25]);
  const rotateY = interpolate(progress, [0, 1], [0, -25]);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        perspective: "1000px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            position: "relative",
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
            fontSize,
            fontWeight,
            fontFamily,
            lineHeight: 1,
            textAlign: "center"
          },
          children: Array.from({ length: layers }).map((_, i) => {
            const layerDepth = (i + 1) * depth * progress;
            const isTop = i === layers - 1;
            return /* @__PURE__ */ jsxRuntime.jsx(
              "span",
              {
                style: {
                  position: isTop ? "relative" : "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  color: isTop ? mainColor : layerColor,
                  transform: `translateZ(${layerDepth}px)`,
                  WebkitTextStroke: isTop ? "none" : `1px ${layerColor}`,
                  opacity: isTop ? 1 : 1 - i / layers,
                  pointerEvents: "none"
                },
                children: text
              },
              i
            );
          })
        }
      )
    }
  );
};
var StickyGridScroll = ({
  items,
  columns = 3,
  gap = 20,
  padding = 40,
  scrollDuration = 300,
  startFrame = 0,
  className = "",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { height } = chunkQS27YGBM_cjs.useVideoConfig();
  const progress = interpolate(
    frame - startFrame,
    [0, scrollDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear }
  );
  const totalHeight = Math.ceil(items.length / columns) * (height / 2) + padding * 2;
  const scrollY = progress * (totalHeight - height);
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        width: "100%",
        height: "100%",
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#050505",
        ...style
      },
      children: /* @__PURE__ */ jsxRuntime.jsx(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gap}px`,
            padding: `${padding}px`,
            transform: `translateY(${-scrollY}px)`
          },
          children: items.map((item, i) => {
            const itemRow = Math.floor(i / columns);
            const itemY = itemRow * (height / 2) + padding;
            const relativeY = itemY - scrollY;
            const viewportProgress = interpolate(
              relativeY,
              [0, height * 0.2, height * 0.8, height],
              [0, 1, 1, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
            );
            return /* @__PURE__ */ jsxRuntime.jsx(
              "div",
              {
                style: {
                  height: height / 2.5,
                  opacity: viewportProgress,
                  transform: `scale(${0.8 + 0.2 * viewportProgress}) translateY(${(1 - viewportProgress) * 50}px)`
                },
                children: item
              },
              i
            );
          })
        }
      )
    }
  );
};
var FlipImageReveal = ({
  src,
  thumbnailRect,
  alt = "",
  title,
  description,
  durationInFrames = 60,
  startFrame = 0,
  className = "",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { width: videoWidth, height: videoHeight } = chunkQS27YGBM_cjs.useVideoConfig();
  const progress = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutQuart }
  );
  const x = interpolate(progress, [0, 1], [thumbnailRect.x, 0]);
  const y = interpolate(progress, [0, 1], [thumbnailRect.y, 0]);
  const width = interpolate(progress, [0, 1], [thumbnailRect.width, videoWidth]);
  const height = interpolate(progress, [0, 1], [thumbnailRect.height, videoHeight]);
  const borderRadius = interpolate(progress, [0, 1], [12, 0]);
  const opacity = interpolate(progress, [0, 0.2], [0, 1]);
  return /* @__PURE__ */ jsxRuntime.jsxs(
    "div",
    {
      className,
      style: {
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        borderRadius: `${borderRadius}px`,
        overflow: "hidden",
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
        opacity,
        ...style
      },
      children: [
        /* @__PURE__ */ jsxRuntime.jsx(
          "img",
          {
            src,
            alt,
            style: {
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }
          }
        ),
        (title || description) && /* @__PURE__ */ jsxRuntime.jsxs(
          "div",
          {
            style: {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "40px",
              background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
              opacity: interpolate(progress, [0.8, 1], [0, 1]),
              transform: `translateY(${interpolate(progress, [0.8, 1], [20, 0])}px)`
            },
            children: [
              title && /* @__PURE__ */ jsxRuntime.jsx("h2", { style: { color: "white", fontSize: "48px", fontWeight: "bold" }, children: title }),
              description && /* @__PURE__ */ jsxRuntime.jsx("p", { style: { color: "#ccc", fontSize: "18px" }, children: description })
            ]
          }
        )
      ]
    }
  );
};
var CardExpansionMask = ({
  children,
  durationInFrames = 60,
  startFrame = 0,
  centerX = 50,
  // percentage
  centerY = 50,
  // percentage
  className = "",
  style
}) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  React5__default.default.useId().replace(/:/g, "");
  const progress = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutCubic }
  );
  const radius = progress * 150;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "div",
    {
      className,
      style: {
        position: "relative",
        width: "100%",
        height: "100%",
        clipPath: `circle(${radius}% at ${centerX}% ${centerY}%)`,
        ...style
      },
      children
    }
  );
};

// src/utils/transitions.ts
var fade = (progress) => {
  return progress;
};
var slide = (progress, direction = "right") => {
  const eased = progress;
  const offset = (1 - eased) * 100;
  switch (direction) {
    case "left":
      return { x: -offset, y: 0 };
    case "right":
      return { x: offset, y: 0 };
    case "up":
      return { x: 0, y: -offset };
    case "down":
      return { x: 0, y: offset };
  }
};
var scale = (progress, from = 0, to = 1) => {
  return from + (to - from) * progress;
};
var rotate = (progress, degrees = 360) => {
  return degrees * progress;
};
var zoom = (progress) => {
  return {
    scale: 0.5 + progress * 0.5,
    opacity: progress
  };
};
var wipe = (progress, direction = "right") => {
  const pct = progress * 100;
  switch (direction) {
    case "left":
      return { clipPath: `inset(0 ${100 - pct}% 0 0)` };
    case "right":
      return { clipPath: `inset(0 0 0 ${100 - pct}%)` };
    case "up":
      return { clipPath: `inset(0 0 ${100 - pct}% 0)` };
    case "down":
      return { clipPath: `inset(${100 - pct}% 0 0 0)` };
  }
};
var blur = (progress, maxBlur = 20) => {
  return {
    filter: `blur(${maxBlur * (1 - progress)}px)`,
    opacity: progress
  };
};
var glitch = (frame, intensity = 10) => {
  const offset = Math.sin(frame * 0.5) * intensity;
  return {
    transform: `translate(${offset}px, ${offset * 0.5}px)`
  };
};
var shake = (frame, intensity = 5) => {
  const x = Math.sin(frame * 0.8) * intensity;
  const y = Math.cos(frame * 1.2) * intensity;
  return {
    transform: `translate(${x}px, ${y}px)`
  };
};
var pulse = (frame, minScale = 0.95, maxScale = 1.05) => {
  const scale2 = minScale + (Math.sin(frame * 0.1) + 1) / 2 * (maxScale - minScale);
  return {
    transform: `scale(${scale2})`
  };
};
var bounce = (progress) => {
  const c4 = 2 * Math.PI / 3;
  return progress === 0 ? 0 : progress === 1 ? 1 : Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * c4) + 1;
};
var flash = (progress, flashAt = 0.5) => {
  const flashProgress = progress < flashAt ? progress / flashAt : (1 - progress) / (1 - flashAt);
  return {
    opacity: progress < flashAt ? 1 - flashProgress * 0.5 : 1,
    backgroundColor: progress < flashAt ? `rgba(255,255,255,${flashProgress * 0.3})` : "transparent"
  };
};
var slideWithFade = (progress, direction = "right") => {
  const { x, y } = slide(progress, direction);
  return {
    transform: `translate(${x}%, ${y}%)`,
    opacity: progress
  };
};
var flip = (progress, direction = "horizontal") => {
  const rotateValue = (1 - progress) * 90;
  const opacity = progress < 0.5 ? 1 - progress : progress;
  return {
    transform: direction === "horizontal" ? `rotateY(${rotateValue}deg)` : `rotateX(${rotateValue}deg)`,
    opacity
  };
};
var combine = (progress, ...transitions2) => {
  return transitions2.reduce((acc, transition) => ({
    ...acc,
    ...transition(progress)
  }), {});
};
var transitions = {
  fade: {
    enter: (p) => ({ opacity: fade(p) }),
    exit: (p) => ({ opacity: fade(1 - p) })
  },
  slideRight: {
    enter: (p) => ({ transform: `translateX(${100 - p * 100}%)` }),
    exit: (p) => ({ transform: `translateX(${p * -100}%)` })
  },
  slideLeft: {
    enter: (p) => ({ transform: `translateX(${ -100 + p * 100}%)` }),
    exit: (p) => ({ transform: `translateX(${p * 100}%)` })
  },
  slideUp: {
    enter: (p) => ({ transform: `translateY(${100 - p * 100}%)` }),
    exit: (p) => ({ transform: `translateY(${p * -100}%)` })
  },
  slideDown: {
    enter: (p) => ({ transform: `translateY(${ -100 + p * 100}%)` }),
    exit: (p) => ({ transform: `translateY(${p * 100}%)` })
  },
  scale: {
    enter: (p) => ({ transform: `scale(${scale(p, 0, 1)})` }),
    exit: (p) => ({ transform: `scale(${scale(p, 1, 0)})` })
  },
  zoom: {
    enter: (p) => {
      const { scale: s, opacity } = zoom(p);
      return { transform: `scale(${s})`, opacity };
    },
    exit: (p) => {
      const { scale: s, opacity } = zoom(1 - p);
      return { transform: `scale(${s})`, opacity };
    }
  },
  flipX: {
    enter: (p) => flip(p, "vertical"),
    exit: (p) => flip(1 - p, "vertical")
  },
  flipY: {
    enter: (p) => flip(p, "horizontal"),
    exit: (p) => flip(1 - p, "horizontal")
  }
};

// src/hooks/animation.ts
var useSpring = (options = {}) => {
  const currentFrame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps: videoFps } = chunkQS27YGBM_cjs.useVideoConfig();
  const {
    fps = videoFps,
    frame = currentFrame,
    config = {},
    from = 0,
    to = 1,
    durationInFrames
  } = options;
  return spring({
    frame,
    fps,
    config,
    from,
    to,
    durationInFrames
  });
};
var useInterpolate = (inputRange, outputRange, options) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return interpolate(frame, inputRange, outputRange, options);
};
var useCycle = (items, frame, durationPerItem) => {
  const index = Math.floor(frame / durationPerItem) % items.length;
  return items[index];
};
var useDurationInFrames = (seconds) => {
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  return Math.round(seconds * fps);
};
var useDelay = (delayInFrames) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return frame >= delayInFrames;
};
var progressOf = (frame, durationInFrames) => durationInFrames > 1 ? frame / (durationInFrames - 1) : frame >= 0 ? 1 : 0;
var useProgress = () => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { durationInFrames } = chunkQS27YGBM_cjs.useVideoConfig();
  return progressOf(frame, durationInFrames);
};
var useLoop = (loopDuration) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return frame % loopDuration;
};
var useTimeline = () => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { durationInFrames, fps } = chunkQS27YGBM_cjs.useVideoConfig();
  return {
    frame,
    durationInFrames,
    fps,
    progress: progressOf(frame, durationInFrames),
    timeInSeconds: frame / fps,
    durationInSeconds: durationInFrames / fps,
    remainingFrames: durationInFrames - frame - 1,
    remainingTimeInSeconds: (durationInFrames - frame - 1) / fps
  };
};
var useWindowedFrame = (startFrame, endFrame) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const isInWindow = frame >= startFrame && frame < endFrame;
  const relativeFrame = frame - startFrame;
  return { isInWindow, relativeFrame: isInWindow ? relativeFrame : 0 };
};
var useAnimation = (startFrame, endFrame) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const isAnimating = frame >= startFrame && frame < endFrame;
  const isComplete = frame >= endFrame;
  const progress = isAnimating ? (frame - startFrame) / (endFrame - startFrame) : isComplete ? 1 : 0;
  return {
    isAnimating,
    isComplete,
    progress,
    direction: frame < startFrame ? "forward" : frame >= endFrame ? "none" : "forward"
  };
};
var useKeyframeState = (keyframes) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const sorted = [...keyframes].sort((a, b) => a.frame - b.frame);
  let prev = sorted[0];
  let next = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (frame >= sorted[i].frame && frame <= sorted[i + 1].frame) {
      prev = sorted[i];
      next = sorted[i + 1];
      break;
    }
  }
  const progress = frame <= prev.frame ? 0 : frame >= next.frame ? 1 : (frame - prev.frame) / (next.frame - prev.frame);
  return {
    current: prev.value + progress * (next.value - prev.value),
    previous: prev !== sorted[0] ? prev.value : null,
    next: next !== sorted[sorted.length - 1] ? next.value : null,
    progress
  };
};
var useTransform = (options) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const transforms = [];
  if (options.translateX) {
    transforms.push(`translateX(${options.translateX(frame)}px)`);
  }
  if (options.translateY) {
    transforms.push(`translateY(${options.translateY(frame)}px)`);
  }
  if (options.scale) {
    transforms.push(`scale(${options.scale(frame)})`);
  }
  if (options.rotate) {
    transforms.push(`rotate(${options.rotate(frame)}deg)`);
  }
  const style = {};
  if (transforms.length > 0) {
    style.transform = transforms.join(" ");
  }
  if (options.opacity) {
    style.opacity = options.opacity(frame);
  }
  return style;
};
var useFade = (fadeInDuration, fadeOutDuration, options) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { durationInFrames } = chunkQS27YGBM_cjs.useVideoConfig();
  const startFrame = options?.startFrame ?? 0;
  const endFrame = options?.endFrame ?? durationInFrames - 1;
  if (frame < startFrame + fadeInDuration) {
    return interpolate(
      frame,
      [startFrame, startFrame + fadeInDuration],
      [0, 1],
      { extrapolateRight: "clamp" }
    );
  }
  if (frame > endFrame - fadeOutDuration) {
    return interpolate(
      frame,
      [endFrame - fadeOutDuration, endFrame],
      [1, 0],
      { extrapolateLeft: "clamp" }
    );
  }
  return 1;
};
var useSlide = (direction, distance, duration, startFrame = 0) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const easedProgress = Easing.easeOutCubic(progress);
  let transform = "";
  const offset = distance * (1 - easedProgress);
  switch (direction) {
    case "left":
      transform = `translateX(${-offset}px)`;
      break;
    case "right":
      transform = `translateX(${offset}px)`;
      break;
    case "up":
      transform = `translateY(${-offset}px)`;
      break;
    case "down":
      transform = `translateY(${offset}px)`;
      break;
  }
  return { transform };
};
var useShake = (intensity, duration, startFrame = 0) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const currentIntensity = intensity * (1 - progress);
  const shakeX = Math.sin(frame * 0.5) * currentIntensity;
  const shakeY = Math.cos(frame * 0.7) * currentIntensity;
  return { transform: `translate(${shakeX}px, ${shakeY}px)` };
};
var usePulse = (minScale, maxScale, frequency) => {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  const progress = (Math.sin(frame / fps * frequency * Math.PI * 2) + 1) / 2;
  const scale2 = interpolate(progress, [0, 1], [minScale, maxScale]);
  return { transform: `scale(${scale2})` };
};
function useMemoizedFrame(compute, deps = []) {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return React5.useMemo(() => compute(), [frame, ...deps]);
}
function useAnimationValue(compute, _frameDeps) {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  return React5.useMemo(() => compute(frame), [frame, compute]);
}
function useCachedFrame(compositionId, renderer) {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { width, height } = chunkQS27YGBM_cjs.useVideoConfig();
  return React5.useMemo(() => {
    return renderer(frame);
  }, [compositionId, frame, width, height, renderer]);
}
function useFrameRange(startFrame, endFrame) {
  return React5.useMemo(() => {
    const frames = [];
    for (let i = startFrame; i <= endFrame; i++) {
      frames.push(i);
    }
    return frames;
  }, [startFrame, endFrame]);
}
function usePrecomputeFrames(compute, lookahead = 10) {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { durationInFrames } = chunkQS27YGBM_cjs.useVideoConfig();
  return React5.useMemo(() => {
    const cache = /* @__PURE__ */ new Map();
    for (let i = frame; i < Math.min(frame + lookahead, durationInFrames); i++) {
      cache.set(i, compute(i));
    }
    return cache;
  }, [frame, lookahead, durationInFrames, compute]);
}
function useOptimizedSpring(config, from = 0, to = 1) {
  const frame = chunkQS27YGBM_cjs.useCurrentFrame();
  const { fps } = chunkQS27YGBM_cjs.useVideoConfig();
  return React5.useMemo(() => {
    return spring({ frame, fps, config, from, to });
  }, [frame, fps, config, from, to]);
}
function useOptimizedInterpolate(inputRange, outputRange, options) {
  return React5.useCallback((frame) => {
    return interpolate(frame, inputRange, outputRange, options);
  }, [inputRange, outputRange, options]);
}
/**
 * MotionForge - headless React SDK for frame-based motion: scenes are a pure
 * function of the frame; the host app owns time, rendering and playback.
 *
 * Build stunning videos with React components, spring animations,
 * and frame-perfect control. Perfect for data visualization,
 * marketing videos, and automated video generation.
 *
 * @package MotionForge
 * @version 1.4.0
 * @license MIT
 */

Object.defineProperty(exports, "FrameProvider", {
  enumerable: true,
  get: function () { return chunkQS27YGBM_cjs.FrameProvider; }
});
Object.defineProperty(exports, "useCurrentFrame", {
  enumerable: true,
  get: function () { return chunkQS27YGBM_cjs.useCurrentFrame; }
});
Object.defineProperty(exports, "useVideoConfig", {
  enumerable: true,
  get: function () { return chunkQS27YGBM_cjs.useVideoConfig; }
});
exports.AbsoluteFill = AbsoluteFill;
exports.Audio = Audio;
exports.Blur = Blur;
exports.Bounce = Bounce;
exports.CardExpansionMask = CardExpansionMask;
exports.Circle = Circle;
exports.Composition = Composition;
exports.Confetti = Confetti;
exports.Counter = Counter;
exports.Cube3D = Cube3D;
exports.Div = AbsoluteFill;
exports.Easing = Easing;
exports.Fade = Fade;
exports.Flip3D = Flip3D;
exports.FlipImageReveal = FlipImageReveal;
exports.Freeze = Freeze;
exports.G = G;
exports.Glitch = Glitch;
exports.GradientText = GradientText;
exports.Highlight = Highlight;
exports.HyperFrame = HyperFrame;
exports.Img = Img;
exports.KineticTypography = KineticTypography;
exports.LetterByLetter = LetterByLetter;
exports.LiquidText = LiquidText;
exports.Loop = Loop;
exports.MaskReveal = MaskReveal;
exports.NeonGlow = NeonGlow;
exports.ParticleSystem = ParticleSystem;
exports.Path = Path;
exports.Perspective3D = Perspective3D;
exports.ProgressBar = ProgressBar;
exports.Pulse = Pulse;
exports.RainbowText = RainbowText;
exports.Rect = Rect;
exports.Retiming = Retiming;
exports.Reverse = Reverse;
exports.Rotate = Rotate;
exports.Rotate3D = Rotate3D;
exports.SVG = SVG;
exports.Scale = Scale;
exports.Sequence = Sequence;
exports.Series = Series;
exports.ShakeEffect = ShakeEffect;
exports.Slide = Slide;
exports.StickyGridScroll = StickyGridScroll;
exports.Swing = Swing;
exports.Text = Text;
exports.TextStack3D = TextStack3D;
exports.Trail = Trail;
exports.Typewriter = Typewriter;
exports.Video = Video;
exports.WaveText = WaveText;
exports.WordByWord = WordByWord;
exports.blur = blur;
exports.bounce = bounce;
exports.combine = combine;
exports.easing = Easing;
exports.fade = fade;
exports.flash = flash;
exports.flip = flip;
exports.getFramesFromSeconds = getFramesFromSeconds;
exports.getSecondsFromFrames = getSecondsFromFrames;
exports.glitch = glitch;
exports.interpolate = interpolate;
exports.interpolateColors = interpolateColors;
exports.measureSpring = measureSpring;
exports.noise2D = noise2D;
exports.pulseTransition = pulse;
exports.random = random;
exports.range = range;
exports.rotateTransition = rotate;
exports.scaleTransition = scale;
exports.shakeTransition = shake;
exports.slide = slide;
exports.slideWithFade = slideWithFade;
exports.spring = spring;
exports.staticFile = staticFile;
exports.transitions = transitions;
exports.useAnimation = useAnimation;
exports.useAnimationValue = useAnimationValue;
exports.useCachedFrame = useCachedFrame;
exports.useComposition = useComposition;
exports.useConfig = useVideoConfig2;
exports.useCycle = useCycle;
exports.useDelay = useDelay;
exports.useDurationInFrames = useDurationInFrames;
exports.useFade = useFade;
exports.useFrameRange = useFrameRange;
exports.useInterpolate = useInterpolate;
exports.useKeyframeState = useKeyframeState;
exports.useKeyframes = useKeyframes;
exports.useLoop = useLoop;
exports.useLoopInfo = useLoopInfo;
exports.useMemoizedFrame = useMemoizedFrame;
exports.useOptimizedInterpolate = useOptimizedInterpolate;
exports.useOptimizedSpring = useOptimizedSpring;
exports.usePrecomputeFrames = usePrecomputeFrames;
exports.useProgress = useProgress;
exports.usePulse = usePulse;
exports.useRelativeCurrentFrame = useRelativeCurrentFrame;
exports.useSequence = useSequence;
exports.useShake = useShake;
exports.useSlide = useSlide;
exports.useSpring = useSpring;
exports.useTimeline = useTimeline;
exports.useTransform = useTransform;
exports.useWindowedFrame = useWindowedFrame;
exports.wipe = wipe;
exports.zoom = zoom;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map