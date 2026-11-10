'use client';import { useDelayRender } from './chunk-ULT45LAD.js';
export { useDelayRender } from './chunk-ULT45LAD.js';
import { useCurrentFrame, FrameContext, GateContext, getGateInternals, useVideoConfig, FrameProvider } from './chunk-SKDHOWVF.js';
export { FrameProvider, createRenderGate, useCurrentFrame, useVideoConfig } from './chunk-SKDHOWVF.js';
import React2, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { jsx, Fragment, jsxs } from 'react/jsx-runtime';

var requireDom = (fn) => {
  if (typeof document === "undefined") {
    throw new Error(`${fn} needs a browser DOM (document is not defined)`);
  }
};
var checkSrc = (fn, src) => {
  if (typeof src !== "string" || src === "") {
    throw new Error(`${fn}: src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
};
var preloadImage = (src) => {
  checkSrc("preloadImage", src);
  requireDom("preloadImage");
  const image = new Image();
  image.src = src;
  return image.decode().then(
    () => image,
    () => {
      throw new Error(`preloadImage: could not load or decode ${src}`);
    }
  );
};
var preloadMedia = (fn, element, src) => {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      element.removeEventListener("loadeddata", onLoaded);
      element.removeEventListener("error", onError);
    };
    const onLoaded = () => {
      cleanup();
      resolve(element);
    };
    const onError = () => {
      cleanup();
      const detail = element.error ? `: ${element.error.message || `media error code ${element.error.code}`}` : "";
      reject(new Error(`${fn}: could not load ${src}${detail}`));
    };
    element.addEventListener("loadeddata", onLoaded);
    element.addEventListener("error", onError);
    element.preload = "auto";
    element.src = src;
    element.load();
  });
};
var preloadVideo = (src) => {
  checkSrc("preloadVideo", src);
  requireDom("preloadVideo");
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  return preloadMedia("preloadVideo", video, src);
};
var preloadAudio = (src) => {
  checkSrc("preloadAudio", src);
  requireDom("preloadAudio");
  return preloadMedia("preloadAudio", document.createElement("audio"), src);
};
var preloadFont = (family, options = {}) => {
  if (typeof family !== "string" || family.trim() === "") {
    throw new Error(`preloadFont: family must be a non-empty string, got ${JSON.stringify(family)}`);
  }
  requireDom("preloadFont");
  if (!document.fonts) {
    throw new Error("preloadFont needs the CSS Font Loading API (document.fonts)");
  }
  const weight = String(options.weight ?? 400);
  const style = options.style ?? "normal";
  const describe = `${family} ${weight} ${style}`;
  if (options.source !== void 0) {
    checkSrc("preloadFont", options.source);
    const face = new FontFace(family, `url(${JSON.stringify(options.source)})`, { weight, style });
    return face.load().then(
      (loaded) => {
        document.fonts.add(loaded);
      },
      () => {
        throw new Error(`preloadFont: could not load ${describe} from ${options.source}`);
      }
    );
  }
  return document.fonts.load(`${style} ${weight} 16px ${JSON.stringify(family)}`).then(
    (faces) => {
      if (faces.length === 0) {
        throw new Error(`preloadFont: no font face matches ${describe}; declare it with @font-face or pass source`);
      }
    },
    () => {
      throw new Error(`preloadFont: could not load ${describe}`);
    }
  );
};
var preloadAsset = (asset) => {
  switch (asset.type) {
    case "image":
      return preloadImage(asset.src);
    case "video":
      return preloadVideo(asset.src);
    case "audio":
      return preloadAudio(asset.src);
    case "font": {
      const { family, ...options } = asset;
      return preloadFont(family, options);
    }
  }
};
var ASSET_TYPES = ["image", "video", "audio", "font"];
var checkAssets = (assets) => {
  if (!Array.isArray(assets)) {
    throw new Error("usePreloadAssets: assets must be an array");
  }
  assets.forEach((asset, i) => {
    if (typeof asset !== "object" || asset === null || !ASSET_TYPES.includes(asset.type)) {
      throw new Error(
        `usePreloadAssets: assets[${i}] must be { type: 'image' | 'video' | 'audio' | 'font', ... }, got ${JSON.stringify(asset)}`
      );
    }
  });
};
var usePreloadAssets = (assets) => {
  checkAssets(assets);
  const key = JSON.stringify(assets);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [loadedKey, setLoadedKey] = useState(null);
  const handle = useRef(null);
  useEffect(() => {
    const list = JSON.parse(key);
    const current = delayRender(`usePreloadAssets ${list.map((a) => a.type === "font" ? a.family : a.src).join(", ")}`);
    handle.current = current;
    let active = true;
    Promise.resolve().then(() => Promise.all(list.map(preloadAsset))).then(
      () => {
        if (active) setLoadedKey(key);
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(current);
      }
    );
    return () => {
      active = false;
      continueRender(current);
      handle.current = null;
    };
  }, [key, delayRender, continueRender, cancelRender]);
  useEffect(() => {
    if (loadedKey === key && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [loadedKey, key, continueRender]);
  return loadedKey === key;
};
var CompositionContext = createContext(null);
var useComposition = () => {
  const context = useContext(CompositionContext);
  if (!context) {
    throw new Error("useComposition must be used within a Composition");
  }
  return context;
};
var useVideoConfig2 = () => useVideoConfig();
var Composition = ({
  id,
  component: Component,
  frame,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames,
  defaultProps = {},
  gate
}) => {
  return /* @__PURE__ */ jsx(
    CompositionContext.Provider,
    {
      value: {
        id,
        config: { width, height, fps, durationInFrames }
      },
      children: /* @__PURE__ */ jsx(
        FrameProvider,
        {
          frame,
          fps,
          durationInFrames,
          width,
          height,
          gate,
          children: /* @__PURE__ */ jsx(Component, { ...defaultProps })
        }
      )
    }
  );
};
var SequenceContext = createContext({
  relativeFrom: 0,
  isActive: true,
  isPremounted: false,
  startFrame: 0,
  endFrame: Infinity
});
var useSequence = () => useContext(SequenceContext);
var Sequence = ({
  from,
  durationInFrames,
  offset = 0,
  name,
  children,
  layout = "absolute-fill",
  premountFor = 0
}) => {
  const currentFrame = useCurrentFrame();
  const parent = useContext(FrameContext);
  const parentGate = useContext(GateContext);
  if (!Number.isInteger(from)) {
    throw new Error(`Sequence: from must be an integer, got ${from}`);
  }
  if (!Number.isInteger(offset)) {
    throw new Error(`Sequence: offset must be an integer, got ${offset}`);
  }
  if (durationInFrames !== void 0 && (!Number.isInteger(durationInFrames) || durationInFrames <= 0)) {
    throw new Error(
      `Sequence: durationInFrames must be a positive integer (leave it out to run to the end), got ${durationInFrames}`
    );
  }
  if (!Number.isInteger(premountFor) || premountFor < 0) {
    throw new Error(`Sequence: premountFor must be a non-negative integer, got ${premountFor}`);
  }
  if (premountFor > 0 && layout === "none") {
    throw new Error('Sequence: premountFor needs layout="absolute-fill" (the wrapper hides the premounted content)');
  }
  const startFrame = from + offset;
  const endFrame = durationInFrames !== void 0 ? startFrame + durationInFrames : Infinity;
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;
  const isPremounted = !isActive && currentFrame >= startFrame - premountFor && currentFrame < startFrame;
  const relativeFrame = isPremounted ? 0 : currentFrame - startFrame;
  const [scope] = useState(() => ({ visible: !isPremounted, parent: parentGate?.scope ?? null }));
  useEffect(() => {
    if (!parentGate || scope.visible === !isPremounted) return;
    scope.visible = !isPremounted;
    getGateInternals(parentGate.gate).changed();
  }, [isPremounted, parentGate, scope]);
  const gateValue = useMemo(
    () => parentGate && premountFor > 0 ? { gate: parentGate.gate, scope } : parentGate,
    [parentGate, premountFor, scope]
  );
  const contextValue = {
    relativeFrom: startFrame,
    durationInFrames,
    isActive,
    isPremounted,
    startFrame,
    endFrame
  };
  if (!isActive && !isPremounted) {
    return null;
  }
  const localDuration = durationInFrames ?? (parent ? parent.durationInFrames - startFrame : void 0);
  const content = /* @__PURE__ */ jsx(GateContext.Provider, { value: gateValue, children: /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame, durationInFrames: localDuration, children }) });
  if (layout === "none") {
    return /* @__PURE__ */ jsx(SequenceContext.Provider, { value: contextValue, children: content });
  }
  return /* @__PURE__ */ jsx(SequenceContext.Provider, { value: contextValue, children: /* @__PURE__ */ jsx(
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
        flexDirection: "column",
        ...isPremounted ? { opacity: 0, pointerEvents: "none" } : null
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
  const parent = useContext(FrameContext);
  const frameValue = useMemo(
    () => parent ? {
      ...parent,
      frame: relativeFrame,
      durationInFrames: durationInFrames ?? parent.durationInFrames
    } : null,
    [parent, relativeFrame, durationInFrames]
  );
  return /* @__PURE__ */ jsx(FrameContext.Provider, { value: frameValue, children: /* @__PURE__ */ jsx(RelativeFrameContext.Provider, { value: relativeFrame, children }) });
};
var RelativeFrameContext = createContext(null);
var useRelativeCurrentFrame = () => useContext(RelativeFrameContext);
var checkFrameNotNegative = (component, frame) => {
  if (frame < 0) {
    throw new Error(`${component}: the current frame must be >= 0, got ${frame} (a parent shifted it below 0)`);
  }
};
var Loop = ({
  durationInFrames,
  times = Infinity,
  children
}) => {
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Loop: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  if (times !== Infinity && (!Number.isInteger(times) || times <= 0)) {
    throw new Error(`Loop: times must be a positive integer or Infinity, got ${times}`);
  }
  checkFrameNotNegative("Loop", currentFrame);
  const totalFrames = times === Infinity ? durationInFrames : durationInFrames * times;
  const loopedFrame = currentFrame % durationInFrames;
  const currentLoop = Math.floor(currentFrame / durationInFrames);
  if (times !== Infinity && currentFrame >= totalFrames) {
    return null;
  }
  return /* @__PURE__ */ jsx(LoopContext.Provider, { value: { loopedFrame, currentLoop, durationInFrames }, children: /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: loopedFrame, durationInFrames, children }) });
};
var LoopContext = createContext({
  loopedFrame: 0,
  currentLoop: 0,
  durationInFrames: 0
});
var useLoopInfo = () => useContext(LoopContext);
var Freeze = ({
  frame: frozenFrame,
  active = true,
  children
}) => {
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(frozenFrame)) {
    throw new Error(`Freeze: frame must be an integer, got ${frozenFrame}`);
  }
  if (typeof active !== "boolean" && typeof active !== "function") {
    throw new Error(`Freeze: active must be a boolean or a function of the frame, got ${active}`);
  }
  const isActive = typeof active === "function" ? active(currentFrame) : active;
  if (typeof isActive !== "boolean") {
    throw new Error(`Freeze: active(${currentFrame}) must return a boolean, got ${isActive}`);
  }
  return /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: isActive ? frozenFrame : currentFrame, children });
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
  const currentFrame = useCurrentFrame();
  const retimedFrame = typeof playbackRate === "function" ? Math.floor(cumulativeRate(playbackRate, currentFrame)) : Math.floor(currentFrame * checkRate(playbackRate, currentFrame));
  return /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: retimedFrame, children });
};
var Reverse = ({
  children,
  durationInFrames
}) => {
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Reverse: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  checkFrameNotNegative("Reverse", currentFrame);
  const reversedFrame = durationInFrames - 1 - currentFrame % durationInFrames;
  return /* @__PURE__ */ jsx(SequenceFrameProvider, { relativeFrame: reversedFrame, durationInFrames, children });
};
var SeriesSequence = () => {
  throw new Error("<Series.Sequence> must be a direct child of <Series>");
};
var describeChild = (child) => {
  if (typeof child === "string") return `the string ${JSON.stringify(child)}`;
  if (React2.isValidElement(child)) {
    const type = child.type;
    const name = typeof type === "string" ? type : type.displayName ?? type.name ?? "Component";
    return `<${name}>`;
  }
  return String(child);
};
var flattenChildren = (children, prefix = "") => React2.Children.toArray(children).flatMap((child, index) => {
  const key = `${prefix}${React2.isValidElement(child) && child.key !== null ? child.key : index}`;
  if (React2.isValidElement(child) && child.type === React2.Fragment) {
    return flattenChildren(child.props.children, `${key}/`);
  }
  return [{ key, child }];
});
var SeriesRoot = ({ children }) => {
  let start = 0;
  const sequences = flattenChildren(children).map(({ key, child }, index) => {
    if (typeof child === "string" && child.trim() === "") return null;
    if (!React2.isValidElement(child) || child.type !== SeriesSequence) {
      throw new Error(`Series: children must be <Series.Sequence> elements, got ${describeChild(child)} at index ${index}`);
    }
    const { durationInFrames, offset = 0, name, layout, premountFor, children: content } = child.props;
    if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
      throw new Error(
        `Series.Sequence: durationInFrames must be a positive integer, got ${durationInFrames} at index ${index}`
      );
    }
    if (!Number.isInteger(offset)) {
      throw new Error(`Series.Sequence: offset must be an integer, got ${offset} at index ${index}`);
    }
    const from = start + offset;
    start = from + durationInFrames;
    return /* @__PURE__ */ jsx(
      Sequence,
      {
        from,
        durationInFrames,
        name,
        layout,
        premountFor,
        children: content
      },
      key
    );
  });
  return /* @__PURE__ */ jsx(Fragment, { children: sequences });
};
var Series = Object.assign(SeriesRoot, { Sequence: SeriesSequence });
var AbsoluteFill = ({
  children,
  style,
  className
}) => {
  return /* @__PURE__ */ jsx(
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
var useElementRef = (callerRef) => {
  const ref = useRef(null);
  const setRef = useCallback(
    (element) => {
      ref.current = element;
      if (typeof callerRef === "function") callerRef(element);
      else if (callerRef && typeof callerRef === "object") callerRef.current = element;
    },
    [callerRef]
  );
  return [ref, setRef];
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
  ...props
}) => {
  const [videoRef, setVideoRef] = useElementRef(props.ref);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handle = delayRender(`<Video> ${src} at frame ${currentFrame}`);
    let settled = false;
    const removeListeners = () => {
      video.removeEventListener("loadeddata", sync);
      video.removeEventListener("seeked", done);
      video.removeEventListener("error", fail);
    };
    function done() {
      if (settled) return;
      settled = true;
      removeListeners();
      continueRender(handle);
    }
    function fail() {
      if (settled) return;
      settled = true;
      removeListeners();
      const detail = video.error ? `: ${video.error.message || `media error code ${video.error.code}`}` : "";
      cancelRender(new Error(`<Video> could not load ${src}${detail}`));
      continueRender(handle);
    }
    function sync() {
      video.removeEventListener("loadeddata", sync);
      const time = getMediaTime(currentFrame, fps, startFrom, playbackRate);
      if (needsSeek(video.currentTime, time, fps)) {
        video.addEventListener("seeked", done);
        video.currentTime = time;
      } else {
        done();
      }
    }
    video.addEventListener("error", fail);
    if (video.error) {
      fail();
    } else if (video.readyState >= 2) {
      sync();
    } else {
      video.addEventListener("loadeddata", sync);
    }
    return () => {
      removeListeners();
      if (!settled) {
        settled = true;
        continueRender(handle);
      }
    };
  }, [currentFrame, fps, startFrom, playbackRate, src, delayRender, continueRender, cancelRender]);
  useEffect(() => {
    if (videoRef.current) {
      const vol = typeof volume === "function" ? volume(currentFrame) : volume;
      videoRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [currentFrame, volume]);
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  return /* @__PURE__ */ jsx(
    "video",
    {
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
      ref: setVideoRef
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
  const audioRef = useRef(null);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (audioRef.current && loaded) {
      const time = getMediaTime(currentFrame, fps, startFrom, playbackRate);
      if (needsSeek(audioRef.current.currentTime, time, fps)) {
        audioRef.current.currentTime = time;
      }
    }
  }, [currentFrame, fps, startFrom, playbackRate, loaded]);
  useEffect(() => {
    if (audioRef.current) {
      const vol = typeof volume === "function" ? volume(currentFrame) : volume;
      audioRef.current.volume = Math.max(0, Math.min(1, vol));
    }
  }, [currentFrame, volume]);
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  const handleLoadedData = (event) => {
    setLoaded(true);
    onLoadedData?.(event);
  };
  return /* @__PURE__ */ jsx(
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
  const currentFrame = useCurrentFrame();
  const [imageRef, setImageRef] = useElementRef(props.ref);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const shown = !(startFrom !== void 0 && currentFrame < startFrom) && !(endAt !== void 0 && currentFrame > endAt);
  useEffect(() => {
    const image = imageRef.current;
    if (!shown || !image) return;
    const handle = delayRender(`<Img> ${src}`);
    let active = true;
    const settle = (error) => {
      if (!active) return;
      active = false;
      if (error) cancelRender(error);
      continueRender(handle);
    };
    if (typeof image.decode !== "function") {
      settle(new Error("<Img> needs HTMLImageElement.decode() to know when the image is ready"));
    } else {
      image.decode().then(
        () => settle(),
        () => settle(new Error(`<Img> could not load or decode ${src}`))
      );
    }
    return () => settle();
  }, [src, shown, delayRender, continueRender, cancelRender]);
  if (!shown) {
    return null;
  }
  return /* @__PURE__ */ jsx(
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
      ...props,
      ref: setImageRef
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
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("g", { transform, style, children });
};
var HyperFrame = ({
  html,
  css,
  js,
  frameVariableName = "frame",
  className,
  style
}) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const iframeRef = useRef(null);
  const isLoadedRef = useRef(false);
  useEffect(() => {
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
  useEffect(() => {
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
  useEffect(() => {
    updateIframeFrame(frame);
  }, [frame, fps, width, height]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      className,
      style: {
        width: "100%",
        height: "100%",
        position: "relative",
        ...style
      },
      children: /* @__PURE__ */ jsx(
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
var pinned = (fn) => (t) => t === 0 ? 0 : t === 1 ? 1 : fn(t);
var clampUnit = (t) => Math.min(1, Math.max(0, t));
var easeOutBounce = (t) => {
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
};
var cubicBezier = (x1, y1, x2, y2) => {
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
};
var pinAll = (fns) => Object.fromEntries(Object.entries(fns).map(([name, fn]) => [name, pinned(fn)]));
var namedEasings = pinAll({
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
  easeInBounce: (t) => 1 - easeOutBounce(1 - t),
  easeOutBounce,
  easeInOutBounce: (t) => t < 0.5 ? (1 - easeOutBounce(1 - 2 * t)) / 2 : (1 + easeOutBounce(2 * t - 1)) / 2
});
var checkEasing = (name, easing) => {
  if (typeof easing !== "function") {
    throw new Error(`Easing.${name}: expects an easing function, got ${easing}`);
  }
  return easing;
};
var checkNumber = (name, value, min = -Infinity) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min) {
    throw new Error(`Easing.${name}: expects a finite number${min > -Infinity ? ` >= ${min}` : ""}, got ${value}`);
  }
  return value;
};
var easeCurve = cubicBezier(0.42, 0, 1, 1);
var Easing = {
  ...namedEasings,
  linear: (t) => t,
  /** Remotion's `ease`: bezier(0.42, 0, 1, 1). */
  ease: easeCurve,
  quad: pinned((t) => t * t),
  cubic: pinned((t) => t * t * t),
  /** t to the power n (n > 0). */
  poly: (n) => {
    const power = checkNumber("poly", n);
    if (power <= 0) throw new Error(`Easing.poly: expects n > 0, got ${n}`);
    return pinned((t) => t ** power);
  },
  sin: pinned((t) => 1 - Math.cos(t * Math.PI / 2)),
  circle: pinned((t) => {
    const u = clampUnit(t);
    return 1 - Math.sqrt(1 - u * u);
  }),
  exp: pinned((t) => 2 ** (10 * (t - 1))),
  /** Springy overshoot; `bounciness` (default 1) sets how many times it goes back and forth. */
  elastic: (bounciness = 1) => {
    const p = checkNumber("elastic", bounciness, 0) * Math.PI;
    return pinned((t) => 1 - Math.cos(t * Math.PI / 2) ** 3 * Math.cos(t * p));
  },
  /** Pulls back before moving; `s` (default 1.70158) sets how far. */
  back: (s = 1.70158) => {
    const overshoot = checkNumber("back", s);
    return pinned((t) => t * t * ((overshoot + 1) * t - overshoot));
  },
  bounce: pinned((t) => easeOutBounce(clampUnit(t))),
  bezier: cubicBezier,
  /** Runs the easing forwards (returns it as is). */
  in: (easing) => pinned(checkEasing("in", easing)),
  /** Runs the easing backwards: out(f)(t) = 1 - f(1 - t). */
  out: (easing) => {
    const fn = checkEasing("out", easing);
    return pinned((t) => 1 - fn(1 - t));
  },
  /** Symmetric: the easing for the first half, mirrored for the second. */
  inOut: (easing) => {
    const fn = checkEasing("inOut", easing);
    return pinned((t) => t < 0.5 ? fn(t * 2) / 2 : 1 - fn((1 - t) * 2) / 2);
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
  durationRestThreshold = 5e-3,
  delay = 0,
  reverse = false
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
  if (typeof delay !== "number" || !Number.isFinite(delay)) {
    throw new Error(`spring: delay must be a finite number of frames, got ${delay}`);
  }
  if (typeof reverse !== "boolean") {
    throw new Error(`spring: reverse must be a boolean, got ${reverse}`);
  }
  const { omega, zeta, overshootClamping } = resolveSpringConfig("spring", config);
  const naturalDuration = reverse || durationInFrames !== void 0 ? measureSpring({ fps, config, threshold: durationRestThreshold }) : 0;
  const elapsed = frame - delay;
  const local = reverse ? (durationInFrames ?? naturalDuration) - elapsed : elapsed;
  if (local <= 0) return from;
  if (reverse && local >= (durationInFrames ?? naturalDuration)) return to;
  let time = local / fps;
  if (durationInFrames !== void 0) {
    if (local >= durationInFrames) return to;
    time = local * naturalDuration / durationInFrames / fps;
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
var EXTRAPOLATE = ["clamp", "extend", "identity", "wrap"];
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
  for (const [name, value] of [["extrapolateLeft", extrapolateLeft], ["extrapolateRight", extrapolateRight]]) {
    if (!EXTRAPOLATE.includes(value)) {
      throw new Error(`interpolate: ${name} must be one of ${EXTRAPOLATE.join(", ")}, got ${JSON.stringify(value)}`);
    }
  }
  const segments = inputRange.length - 1;
  if (Array.isArray(easing)) {
    if (easing.length !== segments) {
      throw new Error(
        `interpolate: an easing array needs one easing per segment (inputRange.length - 1 = ${segments}), got ${easing.length}`
      );
    }
    easing.forEach((fn, i) => {
      if (typeof fn !== "function") throw new Error(`interpolate: easing[${i}] must be a function, got ${fn}`);
    });
  } else if (easing !== void 0 && typeof easing !== "function") {
    throw new Error(`interpolate: easing must be a function or an array of functions, got ${easing}`);
  }
  const first = inputRange[0];
  const last = inputRange[inputRange.length - 1];
  if (input < first && extrapolateLeft === "wrap" || input > last && extrapolateRight === "wrap") {
    const span = last - first;
    if (span === 0) {
      throw new Error(`interpolate: extrapolate 'wrap' needs an inputRange that spans more than one value, got [${inputRange.join(", ")}]`);
    }
    input = ((input - first) % span + span) % span + first;
  }
  if (input < first) {
    if (extrapolateLeft === "clamp") {
      return outputRange[0];
    } else if (extrapolateLeft === "identity") {
      return input;
    }
  }
  if (input > last) {
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
  const segmentEasing = Array.isArray(easing) ? easing[segmentIndex] : easing;
  if (segmentEasing) {
    progress = segmentEasing(progress);
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

// src/utils/particles.ts
var finite = (value) => typeof value === "number" && Number.isFinite(value);
var checkRange = (name, range2, values) => {
  const list = Array.isArray(range2) ? range2 : [range2];
  const valid = (v) => finite(v) && (values === "positive" ? v > 0 : values === "non-negative" ? v >= 0 : true);
  const ok = (typeof range2 === "number" || Array.isArray(range2) && range2.length === 2) && list.every(valid) && (list.length === 1 || list[0] <= list[1]);
  if (!ok) {
    throw new Error(
      `getParticles: ${name} must be a ${values} number or [min, max] of them with min <= max, got ${JSON.stringify(range2)}`
    );
  }
};
var pick = (range2, key) => typeof range2 === "number" ? range2 : range2[0] + random(key) * (range2[1] - range2[0]);
var checkOptions = (options) => {
  const { seed, origin, area, startFrame = 0, count, emitDuration = 0, lifetime, speed, angle = -90, spread = 360 } = options;
  const { gravity = 0, drag = 0, size, colors = ["#ffffff"], rotation = 0, spin = 0, fadeOut = true, frame, fps } = options;
  if (!finite(frame)) throw new Error(`getParticles: frame must be a finite number, got ${frame}`);
  if (!finite(fps) || fps <= 0) throw new Error(`getParticles: fps must be a positive number, got ${fps}`);
  if (typeof seed !== "string" && !finite(seed)) {
    throw new Error(`getParticles: seed must be a string or a finite number, got ${JSON.stringify(seed)}`);
  }
  if (typeof origin !== "function" && (typeof origin !== "object" || origin === null || !finite(origin.x) || !finite(origin.y))) {
    throw new Error(`getParticles: origin must be { x, y } or a function of the frame, got ${JSON.stringify(origin)}`);
  }
  if (area !== void 0 && (typeof area !== "object" || !finite(area.width) || !finite(area.height) || area.width < 0 || area.height < 0)) {
    throw new Error(`getParticles: area must be { width, height } with numbers >= 0, got ${JSON.stringify(area)}`);
  }
  if (!finite(startFrame)) throw new Error(`getParticles: startFrame must be a finite number, got ${startFrame}`);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`getParticles: count must be a non-negative integer, got ${count}`);
  }
  if (!finite(emitDuration) || emitDuration < 0) {
    throw new Error(`getParticles: emitDuration must be a number of seconds >= 0, got ${emitDuration}`);
  }
  checkRange("lifetime", lifetime, "positive");
  checkRange("speed", speed, "non-negative");
  checkRange("size", size, "non-negative");
  checkRange("rotation", rotation, "finite");
  checkRange("spin", spin, "finite");
  if (!finite(angle)) throw new Error(`getParticles: angle must be a finite number of degrees, got ${angle}`);
  if (!finite(spread) || spread < 0 || spread > 360) {
    throw new Error(`getParticles: spread must be between 0 and 360 degrees, got ${spread}`);
  }
  if (!finite(gravity)) throw new Error(`getParticles: gravity must be a finite number, got ${gravity}`);
  if (!finite(drag) || drag < 0) throw new Error(`getParticles: drag must be a number >= 0, got ${drag}`);
  if (!Array.isArray(colors) || colors.length === 0 || colors.some((c) => typeof c !== "string")) {
    throw new Error(`getParticles: colors must be a non-empty array of strings, got ${JSON.stringify(colors)}`);
  }
  if (typeof fadeOut !== "boolean") throw new Error(`getParticles: fadeOut must be a boolean, got ${fadeOut}`);
};
var getParticles = (options) => {
  checkOptions(options);
  const {
    seed,
    origin,
    area = { width: 0, height: 0 },
    startFrame = 0,
    count,
    emitDuration = 0,
    lifetime,
    speed,
    angle = -90,
    spread = 360,
    gravity = 0,
    drag = 0,
    size,
    colors = ["#ffffff"],
    rotation = 0,
    spin = 0,
    fadeOut = true,
    frame,
    fps
  } = options;
  const now = (frame - startFrame) / fps;
  const particles = [];
  for (let i = 0; i < count; i++) {
    const key = (name) => `${seed}:${i}:${name}`;
    const birth = emitDuration * i / count;
    const age = now - birth;
    if (age < 0) continue;
    const life = pick(lifetime, key("lifetime"));
    if (age >= life) continue;
    const birthOrigin = typeof origin === "function" ? origin(startFrame + birth * fps) : origin;
    if (typeof birthOrigin !== "object" || birthOrigin === null || !finite(birthOrigin.x) || !finite(birthOrigin.y)) {
      throw new Error(`getParticles: origin(${startFrame + birth * fps}) must return { x, y } with finite numbers, got ${JSON.stringify(birthOrigin)}`);
    }
    const x0 = birthOrigin.x + (random(key("x")) - 0.5) * area.width;
    const y0 = birthOrigin.y + (random(key("y")) - 0.5) * area.height;
    const direction = (angle + (random(key("angle")) - 0.5) * spread) * Math.PI / 180;
    const v0 = pick(speed, key("speed"));
    const vx0 = Math.cos(direction) * v0;
    const vy0 = Math.sin(direction) * v0;
    let x;
    let y;
    let vx;
    let vy;
    if (drag === 0) {
      x = x0 + vx0 * age;
      y = y0 + vy0 * age + gravity * age * age / 2;
      vx = vx0;
      vy = vy0 + gravity * age;
    } else {
      const decay = Math.exp(-drag * age);
      const terminal = gravity / drag;
      x = x0 + vx0 * (1 - decay) / drag;
      y = y0 + terminal * age + (vy0 - terminal) * (1 - decay) / drag;
      vx = vx0 * decay;
      vy = terminal + (vy0 - terminal) * decay;
    }
    const progress = age / life;
    particles.push({
      index: i,
      x,
      y,
      vx,
      vy,
      size: pick(size, key("size")),
      rotation: pick(rotation, key("rotation")) + pick(spin, key("spin")) * age,
      color: colors[Math.min(colors.length - 1, Math.floor(random(key("color")) * colors.length))],
      opacity: fadeOut ? 1 - progress : 1,
      age,
      lifetime: life,
      progress
    });
  }
  return particles;
};
var SHAPES = {
  circle: void 0,
  square: void 0,
  triangle: "polygon(50% 0%, 100% 100%, 0% 100%)",
  star: "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)"
};
var Particles = ({ shape = "circle", render, style, className, ...options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!(shape in SHAPES)) {
    throw new Error(`Particles: shape must be one of ${Object.keys(SHAPES).join(", ")}, got ${JSON.stringify(shape)}`);
  }
  if (render !== void 0 && typeof render !== "function") {
    throw new Error("Particles: render must be a function of the particle");
  }
  const particles = getParticles({ ...options, frame, fps });
  return /* @__PURE__ */ jsx("div", { className, style: { position: "absolute", inset: 0, pointerEvents: "none", ...style }, children: particles.map(
    (particle) => render ? /* @__PURE__ */ jsx(React2.Fragment, { children: render(particle) }, particle.index) : /* @__PURE__ */ jsx(
      "div",
      {
        style: {
          position: "absolute",
          left: particle.x,
          top: particle.y,
          width: particle.size,
          height: particle.size,
          backgroundColor: particle.color,
          borderRadius: shape === "circle" ? "50%" : void 0,
          clipPath: SHAPES[shape],
          opacity: particle.opacity,
          transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`
        }
      },
      particle.index
    )
  ) });
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
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return /* @__PURE__ */ jsx("div", { style: { opacity, ...style }, children });
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
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  const scale2 = from + (to - from) * progress;
  return /* @__PURE__ */ jsx("div", { style: { transform: `scale(${scale2})`, ...style }, children });
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
  const frame = useCurrentFrame();
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
  return /* @__PURE__ */ jsx("div", { style: { transform, ...style }, children });
};
var Rotate = ({
  children,
  degrees = 360,
  durationInFrames = 60,
  startFrame = 0,
  easing = Easing.linear,
  style
}) => {
  const frame = useCurrentFrame();
  const rotation = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, degrees],
    { extrapolateLeft: "clamp", extrapolateRight: "extend", easing }
  );
  return /* @__PURE__ */ jsx("div", { style: { transform: `rotate(${rotation}deg)`, ...style }, children });
};
var Typewriter = ({
  text,
  durationInFrames = 60,
  startFrame = 0,
  style,
  cursor = true,
  cursorChar = "|"
}) => {
  const frame = useCurrentFrame();
  const characters = splitGraphemes(text);
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, characters.length],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const displayText = characters.slice(0, Math.floor(progress)).join("");
  const showCursor = cursor && frame % 30 < 15;
  return /* @__PURE__ */ jsxs("span", { style, children: [
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
  format: format2
}) => {
  const frame = useCurrentFrame();
  const numberFormat = React2.useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale]
  );
  const value = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  return /* @__PURE__ */ jsx("span", { style, children: format2 ? format2(value) : numberFormat.format(Math.round(value) + 0) });
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
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const shouldGlitch = frame % 10 < 3;
  const offset = shouldGlitch ? random(`glitch-${frame}-offset`) * intensity : 0;
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", ...style }, children: [
    /* @__PURE__ */ jsx(
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
    /* @__PURE__ */ jsx(
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
    /* @__PURE__ */ jsx("div", { style: { position: "relative" }, children })
  ] });
};
var Trail = ({
  children,
  trailLength = 5,
  opacityDecay = 0.2,
  style
}) => {
  const frame = useCurrentFrame();
  return /* @__PURE__ */ jsxs("div", { style: { position: "relative", ...style }, children: [
    Array.from({ length: trailLength }, (_, i) => {
      const trailFrame = frame - i * 2;
      if (trailFrame < 0) return null;
      return /* @__PURE__ */ jsx(
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
    /* @__PURE__ */ jsx("div", { style: { position: "relative" }, children })
  ] });
};
var ShakeEffect = ({
  children,
  intensity = 5,
  active = true,
  style
}) => {
  const frame = useCurrentFrame();
  if (!active) {
    return /* @__PURE__ */ jsx("div", { style, children });
  }
  const x = Math.sin(frame * 0.8) * intensity;
  const y = Math.cos(frame * 1.2) * intensity;
  return /* @__PURE__ */ jsx("div", { style: { transform: `translate(${x}px, ${y}px)`, ...style }, children });
};
var Highlight = ({
  children,
  color = "#ffeb3b",
  progress = 1,
  style
}) => {
  return /* @__PURE__ */ jsx(
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
  return /* @__PURE__ */ jsx("div", { style: { clipPath, ...style }, children });
};
var NeonGlow = ({
  children,
  color = "#00ff00",
  intensity = 1,
  style
}) => {
  const frame = useCurrentFrame();
  const pulseIntensity = 0.8 + Math.sin(frame * 0.1) * 0.2;
  return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing }
  );
  const rx = rotateX * progress;
  const ry = rotateY * progress;
  const rz = rotateZ * progress;
  return /* @__PURE__ */ jsx("div", { style: { perspective, ...style }, children: /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 180],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutCubic }
  );
  const rotateAxis = direction === "horizontal" ? "rotateY" : "rotateX";
  return /* @__PURE__ */ jsx("div", { style: { perspective, ...style }, children: /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeOutCubic }
  );
  return /* @__PURE__ */ jsx("div", { style: { perspective, ...style }, children: /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
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
  return /* @__PURE__ */ jsx("div", { style: { perspective: 600, ...style }, children: /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx("div", { style: { ...faceStyle, backgroundColor: colors.front, transform: `translateZ(${halfSize}px)` }, children: "Front" }),
        /* @__PURE__ */ jsx("div", { style: { ...faceStyle, backgroundColor: colors.back, transform: `rotateY(180deg) translateZ(${halfSize}px)` }, children: "Back" }),
        /* @__PURE__ */ jsx("div", { style: { ...faceStyle, backgroundColor: colors.left, transform: `rotateY(-90deg) translateZ(${halfSize}px)` }, children: "Left" }),
        /* @__PURE__ */ jsx("div", { style: { ...faceStyle, backgroundColor: colors.right, transform: `rotateY(90deg) translateZ(${halfSize}px)` }, children: "Right" }),
        /* @__PURE__ */ jsx("div", { style: { ...faceStyle, backgroundColor: colors.top, transform: `rotateX(90deg) translateZ(${halfSize}px)` }, children: "Top" }),
        /* @__PURE__ */ jsx("div", { style: { ...faceStyle, backgroundColor: colors.bottom, transform: `rotateX(-90deg) translateZ(${halfSize}px)` }, children: "Bottom" })
      ]
    }
  ) });
};
var PARTICLE_DIRECTIONS = ["random", "up", "down", "left", "right"];
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
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  if (!PARTICLE_DIRECTIONS.includes(direction)) {
    throw new Error(
      `ParticleSystem: direction must be one of ${PARTICLE_DIRECTIONS.join(", ")}, got ${JSON.stringify(direction)} (for bursts use <Particles>)`
    );
  }
  const particles = React2.useMemo(() => {
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
      return /* @__PURE__ */ jsx("div", { style: { ...shapeStyle, backgroundColor: "transparent" }, children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", width: p.size, height: p.size, fill: p.color, children: /* @__PURE__ */ jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }) }, index);
    }
    if (particleShape === "triangle") {
      return /* @__PURE__ */ jsx("div", { style: { ...shapeStyle, backgroundColor: "transparent" }, children: /* @__PURE__ */ jsx("svg", { viewBox: "0 0 24 24", width: p.size, height: p.size, fill: p.color, children: /* @__PURE__ */ jsx("path", { d: "M12 2L2 22h20L12 2z" }) }) }, index);
    }
    return /* @__PURE__ */ jsx("div", { style: shapeStyle }, index);
  };
  return /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, overflow: "hidden", ...style }, children: particles.map(renderParticle) });
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
  const frame = useCurrentFrame();
  const letters = splitGraphemes(text);
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", ...style }, children: letters.map((char, index) => {
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
    return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const words = text.split(" ");
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: "0.3em", ...style }, children: words.map((word, index) => {
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
    return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", alignItems: "center", ...style }, children: splitGraphemes(text).map((char, index) => {
    const offset = Math.sin(frame * speed + index * frequency) * amplitude;
    return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  return /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", ...style }, children: splitGraphemes(text).map((char, index) => {
    const hue = (frame * speed + index * 20) % 360;
    const color = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  if (colors.length === 0) {
    throw new Error("GradientText: colors must contain at least one color");
  }
  const cycle = [...colors, ...colors, colors[0]];
  const gradientStops = cycle.map((color, i) => `${color} ${i * 100 / (cycle.length - 1)}%`).join(", ");
  const position = (frame * speed % 100 + 100) % 100;
  return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const blur2 = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return /* @__PURE__ */ jsx("div", { style: { filter: `blur(${blur2}px)`, ...style }, children });
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
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
  return /* @__PURE__ */ jsx("div", { style: { transform: `translateY(${-y}px)`, ...style }, children });
};
var Pulse = ({
  children,
  minScale = 0.95,
  maxScale = 1.05,
  speed = 0.1,
  style
}) => {
  const frame = useCurrentFrame();
  const scale2 = minScale + (maxScale - minScale) * (0.5 + Math.sin(frame * speed) * 0.5);
  return /* @__PURE__ */ jsx("div", { style: { transform: `scale(${scale2})`, ...style }, children });
};
var Swing = ({
  children,
  angle = 30,
  speed = 0.15,
  damping = 0.995,
  durationInFrames = 120,
  style
}) => {
  const frame = useCurrentFrame();
  const dampFactor = Math.pow(damping, frame);
  const rotation = Math.sin(frame * speed) * angle * dampFactor;
  return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const confettiPieces = React2.useMemo(() => {
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
  return /* @__PURE__ */ jsx("div", { style: { position: "absolute", inset: 0, overflow: "hidden", ...style }, children: confettiPieces.map((piece, i) => {
    const y = piece.startY + piece.speed * frame;
    const x = piece.x + Math.sin(frame * piece.wobbleSpeed + piece.wobble) * 30;
    const rotation = piece.rotation + piece.rotationSpeed * frame;
    if (y > height + 50) return null;
    return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const characters = splitGraphemes(text);
  return /* @__PURE__ */ jsx(
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
        return /* @__PURE__ */ jsx("span", { style: charStyle, children: char === " " ? "\xA0" : char }, i);
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
  const frame = useCurrentFrame();
  const id = React2.useId().replace(/:/g, "");
  const wavePath = React2.useMemo(() => {
    let path = `M 0 ${height}`;
    for (let x = 0; x <= width; x += 10) {
      const y = Math.sin(frame * speed + x * 0.02) * amplitude + amplitude;
      path += ` L ${x} ${y}`;
    }
    path += ` L ${width} ${height} Z`;
    return path;
  }, [frame, width, height, speed, amplitude]);
  return /* @__PURE__ */ jsx("div", { className, style: { width, height, position: "relative", ...style }, children: /* @__PURE__ */ jsxs(
    "svg",
    {
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      style: { overflow: "visible" },
      children: [
        /* @__PURE__ */ jsx("defs", { children: /* @__PURE__ */ jsx("clipPath", { id: `text-clip-${id}`, children: /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsx(
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
        /* @__PURE__ */ jsxs("g", { clipPath: `url(#text-clip-${id})`, children: [
          /* @__PURE__ */ jsx("path", { d: wavePath, fill: fillColor }),
          /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const progress = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutCubic }
  );
  const rotateX = interpolate(progress, [0, 1], [0, 25]);
  const rotateY = interpolate(progress, [0, 1], [0, -25]);
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx(
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
            return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const progress = interpolate(
    frame - startFrame,
    [0, scrollDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.linear }
  );
  const totalHeight = Math.ceil(items.length / columns) * (height / 2) + padding * 2;
  const scrollY = progress * (totalHeight - height);
  return /* @__PURE__ */ jsx(
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
      children: /* @__PURE__ */ jsx(
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
            return /* @__PURE__ */ jsx(
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
  const frame = useCurrentFrame();
  const { width: videoWidth, height: videoHeight } = useVideoConfig();
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
  return /* @__PURE__ */ jsxs(
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
        /* @__PURE__ */ jsx(
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
        (title || description) && /* @__PURE__ */ jsxs(
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
              title && /* @__PURE__ */ jsx("h2", { style: { color: "white", fontSize: "48px", fontWeight: "bold" }, children: title }),
              description && /* @__PURE__ */ jsx("p", { style: { color: "#ccc", fontSize: "18px" }, children: description })
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
  const frame = useCurrentFrame();
  React2.useId().replace(/:/g, "");
  const progress = interpolate(
    frame - startFrame,
    [0, durationInFrames],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.easeInOutCubic }
  );
  const radius = progress * 150;
  return /* @__PURE__ */ jsx(
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

// src/utils/path.ts
var GAUSS_ORDER = 12;
var [GAUSS_X, GAUSS_W] = (() => {
  const xs = [];
  const ws = [];
  for (let i = 1; i <= GAUSS_ORDER; i++) {
    let x = Math.cos(Math.PI * (i - 0.25) / (GAUSS_ORDER + 0.5));
    let derivative = 0;
    for (let iteration = 0; iteration < 100; iteration++) {
      let p0 = 1;
      let p1 = x;
      for (let k = 2; k <= GAUSS_ORDER; k++) {
        const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
        p0 = p1;
        p1 = p2;
      }
      derivative = GAUSS_ORDER * (x * p1 - p0) / (x * x - 1);
      const step = p1 / derivative;
      x -= step;
      if (Math.abs(step) < 1e-16) break;
    }
    xs.push(x);
    ws.push(2 / ((1 - x * x) * derivative * derivative));
  }
  return [xs, ws];
})();
var integrate = (speed, a, b) => {
  const half = (b - a) / 2;
  const mid = (a + b) / 2;
  let sum = 0;
  for (let i = 0; i < GAUSS_ORDER; i++) sum += GAUSS_W[i] * speed(mid + half * GAUSS_X[i]);
  return sum * half;
};
var PIECES = 16;
var curveSegment = (point, derivative) => {
  const speed = (t) => {
    const d = derivative(t);
    return Math.hypot(d.x, d.y);
  };
  const cumulative = [0];
  for (let k = 0; k < PIECES; k++) {
    cumulative.push(cumulative[k] + integrate(speed, k / PIECES, (k + 1) / PIECES));
  }
  const length = cumulative[PIECES];
  return {
    length,
    point,
    derivative,
    tAtLength(s) {
      if (s <= 0) return 0;
      if (s >= length) return 1;
      let k = 0;
      while (k < PIECES - 1 && cumulative[k + 1] < s) k++;
      const a = k / PIECES;
      const target = s - cumulative[k];
      const pieceLength = cumulative[k + 1] - cumulative[k];
      let lo = a;
      let hi = (k + 1) / PIECES;
      let t = pieceLength > 0 ? a + target / pieceLength * (hi - lo) : a;
      for (let iteration = 0; iteration < 60; iteration++) {
        const error = integrate(speed, a, t) - target;
        if (Math.abs(error) <= 1e-12 * Math.max(1, length)) break;
        if (error > 0) hi = t;
        else lo = t;
        const v = speed(t);
        const next = v > 0 ? t - error / v : NaN;
        t = next > lo && next < hi ? next : (lo + hi) / 2;
        if (hi - lo < 1e-15) break;
      }
      return t;
    }
  };
};
var lineSegment = (p0, p1) => {
  const length = Math.hypot(p1.x - p0.x, p1.y - p0.y);
  return {
    length,
    point: (t) => ({ x: p0.x + (p1.x - p0.x) * t, y: p0.y + (p1.y - p0.y) * t }),
    derivative: () => ({ x: p1.x - p0.x, y: p1.y - p0.y }),
    tAtLength: (s) => length === 0 ? 0 : Math.max(0, Math.min(1, s / length))
  };
};
var quadSegment = (p0, p1, p2) => curveSegment(
  (t) => {
    const u = 1 - t;
    return {
      x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y
    };
  },
  (t) => ({
    x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
    y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y)
  })
);
var cubicSegment = (p0, p1, p2, p3) => curveSegment(
  (t) => {
    const u = 1 - t;
    const a = u * u * u;
    const b = 3 * u * u * t;
    const c = 3 * u * t * t;
    const d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
    };
  },
  (t) => {
    const u = 1 - t;
    return {
      x: 3 * u * u * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * t * t * (p3.x - p2.x),
      y: 3 * u * u * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * t * t * (p3.y - p2.y)
    };
  }
);
var arcSegment = (p0, radiusX, radiusY, rotationDegrees, largeArc, sweep, p1) => {
  if (p0.x === p1.x && p0.y === p1.y) return null;
  let rx = Math.abs(radiusX);
  let ry = Math.abs(radiusY);
  if (rx === 0 || ry === 0) return lineSegment(p0, p1);
  const phi = rotationDegrees * Math.PI / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (p0.x - p1.x) / 2;
  const dy = (p0.y - p1.y) / 2;
  const x1 = cos * dx + sin * dy;
  const y1 = -sin * dx + cos * dy;
  const lambda = x1 * x1 / (rx * rx) + y1 * y1 / (ry * ry);
  if (lambda > 1) {
    rx *= Math.sqrt(lambda);
    ry *= Math.sqrt(lambda);
  }
  const numerator = rx * rx * ry * ry - rx * rx * y1 * y1 - ry * ry * x1 * x1;
  const denominator = rx * rx * y1 * y1 + ry * ry * x1 * x1;
  const coefficient = (largeArc !== sweep ? 1 : -1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cxPrime = coefficient * rx * y1 / ry;
  const cyPrime = -coefficient * ry * x1 / rx;
  const cx = cos * cxPrime - sin * cyPrime + (p0.x + p1.x) / 2;
  const cy = sin * cxPrime + cos * cyPrime + (p0.y + p1.y) / 2;
  const angle = (ux2, uy2, vx2, vy2) => Math.atan2(ux2 * vy2 - uy2 * vx2, ux2 * vx2 + uy2 * vy2);
  const ux = (x1 - cxPrime) / rx;
  const uy = (y1 - cyPrime) / ry;
  const vx = (-x1 - cxPrime) / rx;
  const vy = (-y1 - cyPrime) / ry;
  const theta1 = angle(1, 0, ux, uy);
  let delta = angle(ux, uy, vx, vy);
  if (!sweep && delta > 0) delta -= 2 * Math.PI;
  if (sweep && delta < 0) delta += 2 * Math.PI;
  return curveSegment(
    (t) => {
      if (t === 1) return { x: p1.x, y: p1.y };
      const theta = theta1 + delta * t;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return { x: cx + rx * cos * c - ry * sin * s, y: cy + rx * sin * c + ry * cos * s };
    },
    (t) => {
      const theta = theta1 + delta * t;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      return { x: delta * (-rx * cos * s - ry * sin * c), y: delta * (-rx * sin * s + ry * cos * c) };
    }
  );
};
var COMMANDS = "MmLlHhVvCcSsQqTtAaZz";
var NUMBER2 = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/y;
var parsePath = (d) => {
  if (typeof d !== "string") {
    throw new Error(`path: d must be a string, got ${JSON.stringify(d)}`);
  }
  let i = 0;
  const fail = (message) => {
    throw new Error(`path: ${message} at position ${i} of "${d.length > 80 ? d.slice(0, 77) + "..." : d}"`);
  };
  const skipSeparators = () => {
    while (i < d.length && (d[i] === "," || d[i] === " " || d[i] === "	" || d[i] === "\n" || d[i] === "\r" || d[i] === "\f")) i++;
  };
  const number = () => {
    skipSeparators();
    NUMBER2.lastIndex = i;
    const match = NUMBER2.exec(d);
    if (!match) return fail("expected a number");
    i = NUMBER2.lastIndex;
    return parseFloat(match[0]);
  };
  const flag = () => {
    skipSeparators();
    if (d[i] === "0" || d[i] === "1") return d[i++] === "1";
    return fail("expected an arc flag (0 or 1)");
  };
  const numberAhead = () => {
    skipSeparators();
    return i < d.length && /[0-9.+-]/.test(d[i]);
  };
  const segments = [];
  let start = null;
  let current = { x: 0, y: 0 };
  let subpathStart = { x: 0, y: 0 };
  let lastCubicControl = null;
  let lastQuadControl = null;
  let command = null;
  const add = (segment) => {
    if (segment) segments.push(segment);
  };
  for (; ; ) {
    skipSeparators();
    if (i >= d.length) break;
    const char = d[i];
    if (COMMANDS.includes(char)) {
      command = char;
      i++;
    } else if (command === null) {
      fail("a path must start with M or m");
    } else if (command === "Z" || command === "z") {
      fail("expected a command after Z");
    } else if (!/[0-9.+-]/.test(char)) {
      fail(`unexpected "${char}"`);
    }
    if (start === null && command !== "M" && command !== "m") fail("a path must start with M or m");
    const relative = command === command.toLowerCase();
    const base = relative ? current : { x: 0, y: 0 };
    const at = (x, y) => ({ x: base.x + x, y: base.y + y });
    let cubicControl = null;
    let quadControl = null;
    switch (command.toUpperCase()) {
      case "M": {
        const p = at(number(), number());
        current = p;
        subpathStart = p;
        if (start === null) start = p;
        command = relative ? "l" : "L";
        break;
      }
      case "L": {
        const p = at(number(), number());
        add(lineSegment(current, p));
        current = p;
        break;
      }
      case "H": {
        const p = { x: base.x + number(), y: current.y };
        add(lineSegment(current, p));
        current = p;
        break;
      }
      case "V": {
        const p = { x: current.x, y: base.y + number() };
        add(lineSegment(current, p));
        current = p;
        break;
      }
      case "C": {
        const c1 = at(number(), number());
        const c2 = at(number(), number());
        const p = at(number(), number());
        add(cubicSegment(current, c1, c2, p));
        cubicControl = c2;
        current = p;
        break;
      }
      case "S": {
        const c1 = lastCubicControl ? { x: 2 * current.x - lastCubicControl.x, y: 2 * current.y - lastCubicControl.y } : current;
        const c2 = at(number(), number());
        const p = at(number(), number());
        add(cubicSegment(current, c1, c2, p));
        cubicControl = c2;
        current = p;
        break;
      }
      case "Q": {
        const c = at(number(), number());
        const p = at(number(), number());
        add(quadSegment(current, c, p));
        quadControl = c;
        current = p;
        break;
      }
      case "T": {
        const c = lastQuadControl ? { x: 2 * current.x - lastQuadControl.x, y: 2 * current.y - lastQuadControl.y } : current;
        const p = at(number(), number());
        add(quadSegment(current, c, p));
        quadControl = c;
        current = p;
        break;
      }
      case "A": {
        const rx = number();
        const ry = number();
        const rotation = number();
        const largeArc = flag();
        const sweep = flag();
        const p = at(number(), number());
        add(arcSegment(current, rx, ry, rotation, largeArc, sweep, p));
        current = p;
        break;
      }
      case "Z": {
        add(lineSegment(current, subpathStart));
        current = subpathStart;
        break;
      }
    }
    lastCubicControl = cubicControl;
    lastQuadControl = quadControl;
    if (command !== "Z" && command !== "z" && !numberAhead() && i < d.length && !COMMANDS.includes(d[i])) {
      fail(`unexpected "${d[i]}"`);
    }
  }
  if (start === null) {
    throw new Error("path: d is empty; a path must start with M or m");
  }
  const cumulative = [0];
  for (const segment of segments) {
    if (!Number.isFinite(segment.length)) {
      throw new Error(`path: "${d}" has a segment of non-finite length`);
    }
    cumulative.push(cumulative[cumulative.length - 1] + segment.length);
  }
  return { start, segments, cumulative };
};
var CACHE_SIZE = 64;
var cache = /* @__PURE__ */ new Map();
var getParsed = (d) => {
  const cached = cache.get(d);
  if (cached) {
    cache.delete(d);
    cache.set(d, cached);
    return cached;
  }
  const parsed = parsePath(d);
  cache.set(d, parsed);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  return parsed;
};
var totalLength = (path) => path.cumulative[path.cumulative.length - 1];
var locate = (fn, d, length) => {
  if (typeof length !== "number" || !Number.isFinite(length)) {
    throw new Error(`${fn}: length must be a finite number, got ${length}`);
  }
  const path = getParsed(d);
  const total = totalLength(path);
  const s = Math.max(0, Math.min(total, length));
  let index = -1;
  for (let k = 0; k < path.segments.length; k++) {
    if (path.segments[k].length > 0) {
      index = k;
      if (s <= path.cumulative[k + 1]) break;
    }
  }
  if (index === -1) return { path, segment: null, t: 0 };
  const segment = path.segments[index];
  return { path, segment, t: segment.tAtLength(s - path.cumulative[index]) };
};
var getLength = (d) => totalLength(getParsed(d));
var getPointAtLength = (d, length) => {
  const { path, segment, t } = locate("getPointAtLength", d, length);
  if (!segment) return { x: path.start.x, y: path.start.y };
  return segment.point(t);
};
var getTangentAtLength = (d, length) => {
  const { segment, t } = locate("getTangentAtLength", d, length);
  if (!segment) {
    throw new Error(`getTangentAtLength: the path "${d}" has no length, so it has no direction`);
  }
  let v = segment.derivative(t);
  for (let step = 1e-9; Math.hypot(v.x, v.y) < 1e-12 && step <= 1e-3; step *= 10) {
    v = segment.derivative(t < 0.5 ? t + step : t - step);
  }
  const norm = Math.hypot(v.x, v.y);
  return { x: v.x / norm, y: v.y / norm };
};
var evolvePath = (progress, d) => {
  if (typeof progress !== "number" || !Number.isFinite(progress)) {
    throw new Error(`evolvePath: progress must be a finite number, got ${progress}`);
  }
  const length = getLength(d);
  return {
    strokeDasharray: `${length} ${length}`,
    strokeDashoffset: length - progress * length
  };
};
var format = (n) => String(Math.abs(n) < 1e-12 ? 0 : n);
var pair = (p) => `${format(p.x)} ${format(p.y)}`;
var pathFromPoints = (points, options = {}) => {
  const { cornerRadius = 0, closed = false } = options;
  if (!Array.isArray(points) || points.length < 2) {
    throw new Error(`pathFromPoints: needs at least 2 points, got ${Array.isArray(points) ? points.length : points}`);
  }
  points.forEach((p, k) => {
    if (typeof p !== "object" || p === null || !Number.isFinite(p.x) || !Number.isFinite(p.y)) {
      throw new Error(`pathFromPoints: points[${k}] must be { x, y } with finite numbers, got ${JSON.stringify(p)}`);
    }
  });
  if (typeof cornerRadius !== "number" || !Number.isFinite(cornerRadius) || cornerRadius < 0) {
    throw new Error(`pathFromPoints: cornerRadius must be a finite number >= 0, got ${cornerRadius}`);
  }
  const n = points.length;
  const corner = (k) => {
    const prev = points[(k - 1 + n) % n];
    const vertex = points[k];
    const next = points[(k + 1) % n];
    const inLength = Math.hypot(vertex.x - prev.x, vertex.y - prev.y);
    const outLength = Math.hypot(next.x - vertex.x, next.y - vertex.y);
    if (cornerRadius === 0 || inLength === 0 || outLength === 0) return null;
    const u = { x: (prev.x - vertex.x) / inLength, y: (prev.y - vertex.y) / inLength };
    const v = { x: (next.x - vertex.x) / outLength, y: (next.y - vertex.y) / outLength };
    const cosine = Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y));
    const angle = Math.acos(cosine);
    if (angle < 1e-9 || Math.PI - angle < 1e-9) return null;
    const tanHalf = Math.tan(angle / 2);
    const cut = Math.min(cornerRadius / tanHalf, inLength / 2, outLength / 2);
    const cross = (vertex.x - prev.x) * (next.y - vertex.y) - (vertex.y - prev.y) * (next.x - vertex.x);
    return {
      enter: { x: vertex.x + u.x * cut, y: vertex.y + u.y * cut },
      leave: { x: vertex.x + v.x * cut, y: vertex.y + v.y * cut },
      radius: cut * tanHalf,
      // With y pointing down, a positive cross product is a clockwise turn.
      sweep: cross > 0 ? 1 : 0
    };
  };
  const parts = [];
  const visit = (k) => {
    const c = corner(k);
    if (!c) {
      parts.push(`L ${pair(points[k])}`);
      return;
    }
    parts.push(`L ${pair(c.enter)}`, `A ${format(c.radius)} ${format(c.radius)} 0 0 ${c.sweep} ${pair(c.leave)}`);
  };
  if (!closed) {
    parts.push(`M ${pair(points[0])}`);
    for (let k = 1; k < n - 1; k++) visit(k);
    parts.push(`L ${pair(points[n - 1])}`);
    return parts.join(" ");
  }
  const first = corner(0);
  parts.push(`M ${pair(first ? first.leave : points[0])}`);
  for (let k = 1; k < n; k++) visit(k);
  if (first) {
    parts.push(`L ${pair(first.enter)}`, `A ${format(first.radius)} ${format(first.radius)} 0 0 ${first.sweep} ${pair(first.leave)}`);
  }
  parts.push("Z");
  return parts.join(" ");
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
  const currentFrame = useCurrentFrame();
  const { fps: videoFps } = useVideoConfig();
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
  const frame = useCurrentFrame();
  return interpolate(frame, inputRange, outputRange, options);
};
var useCycle = (items, frame, durationPerItem) => {
  const index = Math.floor(frame / durationPerItem) % items.length;
  return items[index];
};
var useDurationInFrames = (seconds) => {
  const { fps } = useVideoConfig();
  return Math.round(seconds * fps);
};
var useDelay = (delayInFrames) => {
  const frame = useCurrentFrame();
  return frame >= delayInFrames;
};
var progressOf = (frame, durationInFrames) => durationInFrames > 1 ? frame / (durationInFrames - 1) : frame >= 0 ? 1 : 0;
var useProgress = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return progressOf(frame, durationInFrames);
};
var useLoop = (loopDuration) => {
  const frame = useCurrentFrame();
  return frame % loopDuration;
};
var useTimeline = () => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
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
  const frame = useCurrentFrame();
  const isInWindow = frame >= startFrame && frame < endFrame;
  const relativeFrame = frame - startFrame;
  return { isInWindow, relativeFrame: isInWindow ? relativeFrame : 0 };
};
var useAnimation = (startFrame, endFrame) => {
  const frame = useCurrentFrame();
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
  const frame = useCurrentFrame();
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
  const frame = useCurrentFrame();
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
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
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
  const frame = useCurrentFrame();
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
  const frame = useCurrentFrame();
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = (Math.sin(frame / fps * frequency * Math.PI * 2) + 1) / 2;
  const scale2 = interpolate(progress, [0, 1], [minScale, maxScale]);
  return { transform: `scale(${scale2})` };
};
function useMemoizedFrame(compute, deps = []) {
  const frame = useCurrentFrame();
  return useMemo(() => compute(), [frame, ...deps]);
}
function useAnimationValue(compute, _frameDeps) {
  const frame = useCurrentFrame();
  return useMemo(() => compute(frame), [frame, compute]);
}
function useCachedFrame(compositionId, renderer) {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return useMemo(() => {
    return renderer(frame);
  }, [compositionId, frame, width, height, renderer]);
}
function useFrameRange(startFrame, endFrame) {
  return useMemo(() => {
    const frames = [];
    for (let i = startFrame; i <= endFrame; i++) {
      frames.push(i);
    }
    return frames;
  }, [startFrame, endFrame]);
}
function usePrecomputeFrames(compute, lookahead = 10) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return useMemo(() => {
    const cache2 = /* @__PURE__ */ new Map();
    for (let i = frame; i < Math.min(frame + lookahead, durationInFrames); i++) {
      cache2.set(i, compute(i));
    }
    return cache2;
  }, [frame, lookahead, durationInFrames, compute]);
}
function useOptimizedSpring(config, from = 0, to = 1) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return useMemo(() => {
    return spring({ frame, fps, config, from, to });
  }, [frame, fps, config, from, to]);
}
function useOptimizedInterpolate(inputRange, outputRange, options) {
  return useCallback((frame) => {
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
 * @version 2.0.0
 * @license MIT
 */

export { AbsoluteFill, Audio, Blur, Bounce, CardExpansionMask, Circle, Composition, Confetti, Counter, Cube3D, AbsoluteFill as Div, Easing, Fade, Flip3D, FlipImageReveal, Freeze, G, Glitch, GradientText, Highlight, HyperFrame, Img, KineticTypography, LetterByLetter, LiquidText, Loop, MaskReveal, NeonGlow, ParticleSystem, Particles, Path, Perspective3D, ProgressBar, Pulse, RainbowText, Rect, Retiming, Reverse, Rotate, Rotate3D, SVG, Scale, Sequence, Series, ShakeEffect, Slide, StickyGridScroll, Swing, Text, TextStack3D, Trail, Typewriter, Video, WaveText, WordByWord, blur, bounce, combine, Easing as easing, evolvePath, fade, flash, flip, getFramesFromSeconds, getLength, getParticles, getPointAtLength, getSecondsFromFrames, getTangentAtLength, glitch, interpolate, interpolateColors, measureSpring, noise2D, pathFromPoints, preloadAudio, preloadFont, preloadImage, preloadVideo, pulse as pulseTransition, random, range, rotate as rotateTransition, scale as scaleTransition, shake as shakeTransition, slide, slideWithFade, spring, staticFile, transitions, useAnimation, useAnimationValue, useCachedFrame, useComposition, useVideoConfig2 as useConfig, useCycle, useDelay, useDurationInFrames, useFade, useFrameRange, useInterpolate, useKeyframeState, useKeyframes, useLoop, useLoopInfo, useMemoizedFrame, useOptimizedInterpolate, useOptimizedSpring, usePrecomputeFrames, usePreloadAssets, useProgress, usePulse, useRelativeCurrentFrame, useSequence, useShake, useSlide, useSpring, useTimeline, useTransform, useWindowedFrame, wipe, zoom };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map