'use client';import { getEndPosition, serializeInstructions, reduceInstructions, parsePath, quadToCubic } from './chunk-ADMJBRUM.js';
export { centerPath, cutPath, evolvePath, extendViewBox, getBoundingBox, getInstructionIndexAtLength, getLength, getPointAtLength, getSubpaths, getTangentAtLength, normalizePath, parsePath, reduceInstructions, resetPath, reversePath, scalePath, serializeInstructions, translatePath, warpPath } from './chunk-ADMJBRUM.js';
import { checkImageProps, mediaTimeInSeconds, calculateImageFit } from './chunk-ZVSY5ZVR.js';
import { random, interpolate, Easing, spring, checkInterpolateArgs, interpolateColors, COLOR_FUNCTIONS, parseColor, isNamedColor } from './chunk-ZPHXLDRN.js';
export { Easing, Easing as easing, getFramesFromSeconds, getSecondsFromFrames, interpolate, interpolateColors, measureSpring, random, range, spring, useKeyframes } from './chunk-ZPHXLDRN.js';
export { AbsoluteFill, Audio, AbsoluteFill as Div, G, Img, Path, SVG, Text, Video, prefetch } from './chunk-6ZUQCR5A.js';
import './chunk-545UZ5CT.js';
export { Freeze, Loop, Retiming, Reverse, Sequence, Series, useRelativeCurrentFrame, useSequence } from './chunk-POVQTMPB.js';
import { rejectProps, CROP_AND_EFFECT_PROPS, SEQUENCE_PROPS, checkSrc, resolveSrc, serializeRequestInit, fetchAsset } from './chunk-WVAVUOFE.js';
import { useCurrentFrame, useVideoConfig, useDelayRender, holdAllGates, HostContext, isAppendOf, noStaticFiles, FrameProvider, TimelineContext, FrameContext, firstAtOrAfter, firstAfter } from './chunk-L5HQH5HH.js';
export { FrameProvider, createAudioCollector, createRenderGate, useCurrentFrame, useDelayRender, useVideoConfig } from './chunk-L5HQH5HH.js';
import React5, { createContext, forwardRef, useRef, useImperativeHandle, useCallback, useState, useEffect, useMemo, useContext } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { createNoise2D, createNoise3D, createNoise4D } from 'simplex-noise';

var requireDom = () => {
  if (typeof document === "undefined") {
    throw new Error("usePreloadAssets needs a browser DOM (document is not defined)");
  }
};
var checkSrc2 = (src, index) => {
  if (typeof src !== "string" || src === "") {
    throw new Error(`usePreloadAssets: assets[${index}].src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
};
var loadImage = (src) => {
  const image = new Image();
  image.src = src;
  return image.decode().then(
    () => void 0,
    () => {
      throw new Error(`usePreloadAssets: could not load or decode ${src}`);
    }
  );
};
var loadMedia = (element, src) => new Promise((resolve, reject) => {
  const cleanup = () => {
    element.removeEventListener("loadeddata", onLoaded);
    element.removeEventListener("error", onError);
  };
  const onLoaded = () => {
    cleanup();
    resolve();
  };
  const onError = () => {
    cleanup();
    const detail = element.error ? `: ${element.error.message || `media error code ${element.error.code}`}` : "";
    reject(new Error(`usePreloadAssets: could not load ${src}${detail}`));
  };
  element.addEventListener("loadeddata", onLoaded);
  element.addEventListener("error", onError);
  element.preload = "auto";
  element.src = src;
  element.load();
});
var loadVideo = (src) => {
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  return loadMedia(video, src);
};
var WEIGHTS = { normal: 400, bold: 700 };
var toWeight = (weight) => {
  const value = typeof weight === "number" ? weight : WEIGHTS[weight.trim().toLowerCase()] ?? Number(weight);
  if (!Number.isFinite(value)) throw new Error(`usePreloadAssets: font weight must be a number, 'normal' or 'bold', got ${JSON.stringify(weight)}`);
  return value;
};
var coversWeight = (descriptor, weight) => {
  const [low, high = low] = descriptor.trim().split(/\s+/).map(toWeight);
  return weight >= low && weight <= high;
};
var unquote = (family) => family.trim().replace(/^(['"])(.*)\1$/, "$2").toLowerCase();
var loadFontFaces = (family, weight, style) => {
  if (!document.fonts || typeof document.fonts.forEach !== "function") {
    throw new Error("usePreloadAssets: fonts need the CSS Font Loading API (document.fonts)");
  }
  const wanted = unquote(family);
  const wantedWeight = weight === void 0 ? void 0 : toWeight(weight);
  const wantedStyle = style?.trim().toLowerCase();
  const faces = [];
  document.fonts.forEach((face) => {
    if (unquote(face.family) !== wanted) return;
    if (wantedWeight !== void 0 && !coversWeight(face.weight, wantedWeight)) return;
    if (wantedStyle !== void 0 && face.style.trim().toLowerCase().split(/\s+/)[0] !== wantedStyle) return;
    faces.push(face);
  });
  const describe3 = [family, weight, style].filter((part) => part !== void 0).join(" ");
  if (faces.length === 0) {
    return Promise.reject(
      new Error(`usePreloadAssets: no font face matches ${describe3}; declare it with @font-face or load it with loadFont()`)
    );
  }
  return Promise.all(faces.map((face) => face.load())).then(
    () => void 0,
    () => {
      throw new Error(`usePreloadAssets: could not load the font ${describe3}`);
    }
  );
};
var loadAsset = (asset) => {
  requireDom();
  switch (asset.type) {
    case "image":
      return loadImage(asset.src);
    case "video":
      return loadVideo(asset.src);
    case "audio":
      return loadMedia(document.createElement("audio"), asset.src);
    case "font":
      return loadFontFaces(asset.family, asset.weight, asset.style);
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
    if (asset.type === "font") {
      if (typeof asset.family !== "string" || asset.family.trim() === "") {
        throw new Error(`usePreloadAssets: assets[${i}].family must be a non-empty string, got ${JSON.stringify(asset.family)}`);
      }
    } else {
      checkSrc2(asset.src, i);
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
    Promise.resolve().then(() => Promise.all(list.map(loadAsset))).then(
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

// src/core/fonts.ts
var FORMATS = ["woff2", "woff", "opentype", "truetype"];
var DESCRIPTORS = [
  "ascentOverride",
  "descentOverride",
  "display",
  "featureSettings",
  "lineGapOverride",
  "stretch",
  "style",
  "unicodeRange",
  "variant",
  "weight"
];
var loads = /* @__PURE__ */ new Map();
var handled = (promise) => {
  promise.catch(() => void 0);
  return promise;
};
var loadFont = (options) => {
  if (typeof options !== "object" || options === null) {
    throw new TypeError(`loadFont: expects an options object { family, url, ... }, got ${JSON.stringify(options)}`);
  }
  const { family, url, format: format2 } = options;
  if (typeof family !== "string" || family.trim() === "") {
    throw new TypeError(`loadFont: family must be a non-empty string, got ${JSON.stringify(family)}`);
  }
  if (typeof url !== "string" || url === "") {
    throw new TypeError(`loadFont: url must be a non-empty string, got ${JSON.stringify(url)}`);
  }
  if (format2 !== void 0 && !FORMATS.includes(format2)) {
    throw new TypeError(`loadFont: format must be one of ${FORMATS.join(", ")}, got ${JSON.stringify(format2)}`);
  }
  for (const key2 of DESCRIPTORS) {
    if (options[key2] !== void 0 && typeof options[key2] !== "string") {
      throw new TypeError(`loadFont: ${key2} must be a string (a CSS @font-face value), got ${JSON.stringify(options[key2])}`);
    }
  }
  if (typeof document === "undefined" || !document.fonts || typeof FontFace === "undefined") {
    return handled(Promise.reject(new Error("loadFont needs a browser DOM with the CSS Font Loading API (document.fonts)")));
  }
  const key = JSON.stringify([family, url, format2, ...DESCRIPTORS.map((d) => options[d])]);
  const existing = loads.get(key);
  if (existing) return existing;
  const descriptors = {};
  for (const name of DESCRIPTORS) {
    if (options[name] !== void 0) descriptors[name] = options[name];
  }
  const source = `url(${JSON.stringify(url)})${format2 ? ` format(${JSON.stringify(format2)})` : ""}`;
  const hold = holdAllGates(`loadFont() ${family} from ${url}`);
  const load = Promise.resolve().then(() => new FontFace(family, source, descriptors).load()).then(
    (face) => {
      document.fonts.add(face);
      hold.release();
    },
    (cause) => {
      const error = new Error(
        `loadFont: could not load ${family} from ${url}${cause instanceof Error && cause.message ? `: ${cause.message}` : ""}`
      );
      hold.fail(error);
      throw error;
    }
  );
  loads.set(key, load);
  return handled(load);
};
var useInputWindow = (hook) => {
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
var toLocal = (event, offset) => offset === 0 ? event : { ...event, frame: event.frame - offset };
var useInputEvents = () => {
  const { log, offset, first, end } = useInputWindow("useInputEvents");
  return useMemo(
    () => Object.freeze(log.slice(first, end).map((event) => toLocal(event, offset))),
    [log, offset, first, end]
  );
};
var useEmitInput = () => {
  const host = useContext(HostContext);
  if (!host) {
    throw new Error("useEmitInput must be used within a FrameProvider");
  }
  return host.emit;
};
var useReducedState = (reducer, initialState) => {
  if (typeof reducer !== "function") {
    throw new Error(`useReducedState: reducer must be a function (state, event) => state, got ${JSON.stringify(reducer)}`);
  }
  const { log, offset, first, end } = useInputWindow("useReducedState");
  const cache = useRef(null);
  let current = cache.current;
  const folded = current ? current.states.length - 1 : 0;
  const valid = current !== null && current.offset === offset && current.first === first && (current.log === log || isAppendOf(current.log, log) && (folded === 0 || log[first + folded - 1] === current.log[first + folded - 1]));
  if (!valid || current === null) {
    current = { log, offset, first, states: [initialState] };
    cache.current = current;
  }
  current.log = log;
  const { states } = current;
  while (states.length - 1 < end - first) {
    const index = first + states.length - 1;
    states.push(reducer(states[states.length - 1], toLocal(log[index], offset)));
  }
  return states[end - first];
};
var useLastEvent = (predicate) => {
  if (predicate !== void 0 && typeof predicate !== "function") {
    throw new Error(`useLastEvent: predicate must be a function (event) => boolean, got ${JSON.stringify(predicate)}`);
  }
  const { log, offset, first, end, frame } = useInputWindow("useLastEvent");
  for (let i = end - 1; i >= first; i--) {
    const event = toLocal(log[i], offset);
    if (!predicate || predicate(event)) return { event, framesSince: frame - event.frame };
  }
  return null;
};
var useStaticFile = () => {
  const host = useContext(HostContext);
  if (!host) {
    throw new Error("useStaticFile must be used within a FrameProvider");
  }
  return host.staticFiles ?? noStaticFiles;
};

// src/utils/fit-rect.ts
var FITS = ["contain", "cover", "fill", "none", "scale-down"];
var describe = (value) => {
  try {
    return JSON.stringify(value) ?? String(value);
  } catch {
    return String(value);
  }
};
var checkSize = (name, size) => {
  const { width, height } = size ?? {};
  for (const [key, value] of [["width", width], ["height", height]]) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new Error(`fitRect: ${name}.${key} must be a positive number, got ${describe(value)}`);
    }
  }
};
var checkFinite = (name, value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`fitRect: ${name} must be a finite number, got ${describe(value)}`);
  }
};
var fitRect = (container, content, fit, anchor = { x: 0.5, y: 0.5 }) => {
  checkSize("container", container);
  checkSize("content", content);
  if (!FITS.includes(fit)) {
    throw new Error(`fitRect: fit must be one of ${FITS.map((f) => `'${f}'`).join(", ")}, got ${describe(fit)}`);
  }
  const { x: left = 0, y: top = 0 } = container;
  checkFinite("container.x", left);
  checkFinite("container.y", top);
  if (typeof anchor !== "object" || anchor === null) {
    throw new Error(`fitRect: anchor must be { x, y } (0 left/top, 0.5 centre, 1 right/bottom), got ${describe(anchor)}`);
  }
  checkFinite("anchor.x", anchor.x);
  checkFinite("anchor.y", anchor.y);
  let scaleX2;
  let scaleY2;
  if (fit === "fill") {
    scaleX2 = container.width / content.width;
    scaleY2 = container.height / content.height;
  } else {
    const contain = Math.min(container.width / content.width, container.height / content.height);
    const scale2 = fit === "contain" ? contain : fit === "cover" ? Math.max(container.width / content.width, container.height / content.height) : fit === "none" ? 1 : Math.min(1, contain);
    scaleX2 = scale2;
    scaleY2 = scale2;
  }
  const width = scaleX2 === container.width / content.width ? container.width : content.width * scaleX2;
  const height = scaleY2 === container.height / content.height ? container.height : content.height * scaleY2;
  return {
    x: left + (container.width - width) * anchor.x,
    y: top + (container.height - height) * anchor.y,
    width,
    height,
    scaleX: scaleX2,
    scaleY: scaleY2
  };
};
var CompositionContext = createContext(null);
var useComposition = () => {
  const context = useContext(CompositionContext);
  if (!context) {
    throw new Error("useComposition must be used within a Composition");
  }
  return context;
};
var Composition = ({
  id,
  component: Component,
  frame,
  width = 1920,
  height = 1080,
  fps = 30,
  durationInFrames,
  defaultProps = {},
  gate,
  audio,
  staticFiles,
  input,
  onInput
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
          audio,
          staticFiles,
          input,
          onInput,
          children: /* @__PURE__ */ jsx(Component, { ...defaultProps })
        }
      )
    }
  );
};

// src/components/animated-image/decoder.ts
var COMPONENT = "<AnimatedImage>";
var openAnimatedImage = async (src, requestInit, signal) => {
  if (typeof ImageDecoder === "undefined") {
    throw new Error(
      `${COMPONENT} needs the WebCodecs ImageDecoder API, which this browser does not have (Chromium-based browsers and Firefox have it, Safari does not). For a GIF, use <Gif> from 'motionforge/gif', which decodes in JavaScript.`
    );
  }
  const response = await fetchAsset(COMPONENT, src, requestInit, signal);
  const type = response.headers.get("Content-Type")?.split(";")[0].trim() || "image/gif";
  if (!await ImageDecoder.isTypeSupported(type)) {
    throw new Error(`${COMPONENT} cannot decode ${src}: this browser's ImageDecoder does not support "${type}"`);
  }
  const decoder = new ImageDecoder({ data: response.body ?? await response.arrayBuffer(), type });
  try {
    await Promise.all([decoder.completed, decoder.tracks.ready]);
    const track = decoder.tracks.selectedTrack;
    if (!track || track.frameCount < 1) {
      throw new Error(`${COMPONENT} found no image frames in ${src}`);
    }
    const starts = [];
    let durationUs = 0;
    for (let frameIndex = 0; frameIndex < track.frameCount; frameIndex++) {
      const { image } = await decoder.decode({ frameIndex, completeFramesOnly: true });
      starts.push(image.timestamp);
      if (!image.duration) durationUs = null;
      else if (durationUs !== null) durationUs = image.timestamp + image.duration;
      image.close();
    }
    return {
      frameCount: track.frameCount,
      starts,
      durationUs: track.frameCount > 1 ? durationUs : null,
      decode: (frameIndex) => decoder.decode({ frameIndex, completeFramesOnly: true }).then((result) => result.image),
      close: () => decoder.close()
    };
  } catch (error) {
    decoder.close();
    if (error instanceof Error && (error.name === "AbortError" || error.message.startsWith(COMPONENT))) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${COMPONENT} could not decode ${src}: ${message}`);
  }
};
var getAnimatedImageFrameIndex = (track, timeInSeconds, loopBehavior) => {
  const { starts, durationUs } = track;
  if (durationUs === null || starts.length === 1) return 0;
  let time = timeInSeconds * 1e6;
  if (loopBehavior === "loop") {
    time = (time % durationUs + durationUs) % durationUs;
  } else if (time >= durationUs) {
    return loopBehavior === "pause-after-finish" ? starts.length - 1 : null;
  }
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (starts[mid] <= time) low = mid;
    else high = mid - 1;
  }
  return low;
};
var LOOP_BEHAVIORS = ["loop", "pause-after-finish", "clear-after-finish"];
var AnimatedImage = forwardRef((props, ref) => {
  rejectProps("<AnimatedImage>", props, { ...SEQUENCE_PROPS, ...CROP_AND_EFFECT_PROPS });
  const {
    src,
    width,
    height,
    onError,
    fit = "fill",
    playbackRate = 1,
    loopBehavior = "loop",
    requestInit,
    ...canvasProps
  } = props;
  checkSrc("<AnimatedImage>", src);
  checkImageProps("<AnimatedImage>", { fit, width, height, playbackRate });
  if (!LOOP_BEHAVIORS.includes(loopBehavior)) {
    throw new Error(
      `<AnimatedImage>: loopBehavior must be 'loop', 'pause-after-finish' or 'clear-after-finish', got ${JSON.stringify(loopBehavior)}`
    );
  }
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const time = mediaTimeInSeconds(frame, fps, playbackRate);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvasRef = useRef(null);
  useImperativeHandle(ref, () => canvasRef.current, []);
  const requestInitRef = useRef(requestInit);
  requestInitRef.current = requestInit;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const fail = useCallback(
    (error) => {
      const asError = error instanceof Error ? error : new Error(String(error));
      if (onErrorRef.current) onErrorRef.current(asError);
      else cancelRender(asError);
    },
    [cancelRender]
  );
  const resolvedSrc = resolveSrc(src);
  const key = `${resolvedSrc} ${serializeRequestInit(requestInit)}`;
  const [loaded, setLoaded] = useState(null);
  const current = loaded !== null && loaded.key === key ? loaded : null;
  useEffect(() => {
    const handle = delayRender(`<AnimatedImage> loading ${src}`);
    const controller = new AbortController();
    let active = true;
    let track = null;
    openAnimatedImage(resolvedSrc, requestInitRef.current, controller.signal).then(
      (opened) => {
        if (!active) {
          opened.close();
          return;
        }
        track = opened;
        setLoaded({ key, track: opened, handle });
      },
      (error) => {
        if (!active) return;
        fail(error);
        continueRender(handle);
      }
    );
    return () => {
      active = false;
      controller.abort();
      track?.close();
      continueRender(handle);
    };
  }, [key, delayRender, continueRender, fail]);
  useEffect(() => {
    if (!current) return;
    const handle = delayRender(`<AnimatedImage> ${src} at ${time}s`);
    continueRender(current.handle);
    let active = true;
    const canvas = canvasRef.current;
    const index = getAnimatedImageFrameIndex(current.track, time, loopBehavior);
    if (index === null || !canvas) {
      canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
      continueRender(handle);
      return;
    }
    current.track.decode(index).then(
      (image) => {
        try {
          if (!active) return;
          const context = canvas.getContext("2d");
          if (!context) throw new Error("<AnimatedImage> could not get a 2D context for its canvas");
          const canvasWidth = width ?? image.displayWidth;
          const canvasHeight = height ?? image.displayHeight;
          if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
          if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
          context.clearRect(0, 0, canvasWidth, canvasHeight);
          context.drawImage(
            image,
            ...calculateImageFit(
              fit,
              { width: image.displayWidth, height: image.displayHeight },
              { width: canvasWidth, height: canvasHeight }
            )
          );
          continueRender(handle);
        } catch (error) {
          fail(error);
          continueRender(handle);
        } finally {
          image.close();
        }
      },
      (error) => {
        if (!active) return;
        fail(new Error(`<AnimatedImage> could not decode frame ${index} of ${src}: ${error instanceof Error ? error.message : error}`));
        continueRender(handle);
      }
    );
    return () => {
      active = false;
      continueRender(handle);
    };
  }, [current, time, loopBehavior, fit, width, height, src, delayRender, continueRender, fail]);
  return /* @__PURE__ */ jsx("canvas", { ref: canvasRef, width, height, ...canvasProps });
});
AnimatedImage.displayName = "AnimatedImage";
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
  const { seed, origin, area, startFrame = 0, count, emitDuration = 0, lifetime, speed, angle: angle2 = -90, spread = 360 } = options;
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
  if (!finite(angle2)) throw new Error(`getParticles: angle must be a finite number of degrees, got ${angle2}`);
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
    angle: angle2 = -90,
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
    const direction = (angle2 + (random(key("angle")) - 0.5) * spread) * Math.PI / 180;
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
    (particle) => render ? /* @__PURE__ */ jsx(React5.Fragment, { children: render(particle) }, particle.index) : /* @__PURE__ */ jsx(
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
  const numberFormat = React5.useMemo(
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
  rotateX: rotateX2 = 0,
  rotateY: rotateY2 = 360,
  rotateZ: rotateZ2 = 0,
  durationInFrames = 60,
  startFrame = 0,
  perspective: perspective2 = 1e3,
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
  const rx = rotateX2 * progress;
  const ry = rotateY2 * progress;
  const rz = rotateZ2 * progress;
  return /* @__PURE__ */ jsx("div", { style: { perspective: perspective2, ...style }, children: /* @__PURE__ */ jsx(
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
  perspective: perspective2 = 1e3,
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
  return /* @__PURE__ */ jsx("div", { style: { perspective: perspective2, ...style }, children: /* @__PURE__ */ jsxs(
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
  rotateX: rotateX2 = 20,
  rotateY: rotateY2 = 20,
  perspective: perspective2 = 800,
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
  return /* @__PURE__ */ jsx("div", { style: { perspective: perspective2, ...style }, children: /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        transform: `rotateX(${rotateX2 * progress}deg) rotateY(${rotateY2 * progress}deg)`,
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
  const rotateY2 = interpolate(frame, [0, durationInFrames], [0, 360], {
    extrapolateRight: "extend"
  });
  const rotateX2 = interpolate(frame, [0, durationInFrames], [0, 360], {
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
        transform: `rotateX(${rotateX2}deg) rotateY(${rotateY2}deg)`
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
  const particles = React5.useMemo(() => {
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
        const bounce = progress < 0.5 ? progress * 2 : 2 - progress * 2;
        transform = `scale(${0.5 + bounce * 0.5})`;
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
  angle: angle2 = 90,
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
        background: `linear-gradient(${angle2}deg, ${gradientStops})`,
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
  const blur = interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [from, to],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return /* @__PURE__ */ jsx("div", { style: { filter: `blur(${blur}px)`, ...style }, children });
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
  angle: angle2 = 30,
  speed = 0.15,
  damping = 0.995,
  durationInFrames = 120,
  style
}) => {
  const frame = useCurrentFrame();
  const dampFactor = Math.pow(damping, frame);
  const rotation = Math.sin(frame * speed) * angle2 * dampFactor;
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
  const confettiPieces = React5.useMemo(() => {
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
          const blur = interpolate(charFrame, [0, 10], [20, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp"
          });
          charStyle = {
            ...charStyle,
            transform: `translateY(${y}px)`,
            opacity,
            filter: `blur(${blur}px)`
          };
        } else if (type === "stretching") {
          const scaleY2 = spring({
            frame: charFrame,
            fps,
            config: { damping: 12, stiffness: 200 },
            from: 0,
            to: 1
          });
          const scaleX2 = spring({
            frame: charFrame,
            fps,
            config: { damping: 15, stiffness: 150 },
            from: 2,
            to: 1
          });
          charStyle = {
            ...charStyle,
            transform: `scale(${scaleX2}, ${scaleY2})`,
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
  const id = React5.useId().replace(/:/g, "");
  const wavePath = React5.useMemo(() => {
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
  const rotateX2 = interpolate(progress, [0, 1], [0, 25]);
  const rotateY2 = interpolate(progress, [0, 1], [0, -25]);
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
            transform: `rotateX(${rotateX2}deg) rotateY(${rotateY2}deg)`,
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
  React5.useId().replace(/:/g, "");
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
var streamOf = (seed, dimensions) => {
  let i = 0;
  return () => random(`noise${dimensions}D:${seed}:${i++}`);
};
var CACHE_SIZE = 64;
var cached = (create, dimensions) => {
  const cache = /* @__PURE__ */ new Map();
  return (seed) => {
    const key = String(seed);
    let noise = cache.get(key);
    if (noise === void 0) {
      if (cache.size >= CACHE_SIZE) cache.delete(cache.keys().next().value);
      noise = create(streamOf(key, dimensions));
      cache.set(key, noise);
    }
    return noise;
  };
};
var noise2DOf = cached(createNoise2D, 2);
var noise3DOf = cached(createNoise3D, 3);
var noise4DOf = cached(createNoise4D, 4);
var check = (fn, seed, coordinates) => {
  if (!(typeof seed === "string" || typeof seed === "number" && Number.isFinite(seed))) {
    throw new Error(`${fn}: seed must be a string or a finite number, got ${JSON.stringify(seed)}`);
  }
  for (const [name, value] of Object.entries(coordinates)) {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      throw new Error(`${fn}: ${name} must be a finite number, got ${value}`);
    }
  }
};
var noise2D = (seed, x, y) => {
  check("noise2D", seed, { x, y });
  return noise2DOf(seed)(x, y);
};
var noise3D = (seed, x, y, z) => {
  check("noise3D", seed, { x, y, z });
  return noise3DOf(seed)(x, y, z);
};
var noise4D = (seed, x, y, z, w) => {
  check("noise4D", seed, { x, y, z, w });
  return noise4DOf(seed)(x, y, z, w);
};

// src/utils/transform.ts
var lengthUnits = [
  "px",
  "em",
  "rem",
  "pt",
  "cap",
  "ch",
  "ex",
  "ic",
  "lh",
  "rlh",
  "vmax",
  "vmin",
  "vb",
  "vi",
  "cqw",
  "vh",
  "vw",
  "cqh",
  "cqi",
  "cqb",
  "cqmin",
  "cqmax",
  "cm",
  "mm",
  "Q",
  "in",
  "pc"
];
var angleUnits = ["rad", "deg", "grad", "turn"];
var lengthPercentageUnits = ["%", ...lengthUnits];
var NUMBER_WITH_UNIT = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z%]+)$/;
var checkNumber = (api, param, value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${api}: ${param} must be a finite number, got ${JSON.stringify(value)}`);
  }
  return value;
};
var checkUnit = (api, param, unit, units) => {
  if (typeof unit !== "string" || !units.includes(unit)) {
    throw new TypeError(`${api}: ${param} unit must be one of ${units.join(", ")}, got ${JSON.stringify(unit)}`);
  }
  return unit;
};
var withUnit = (api, param, value, units, unit) => {
  if (typeof value === "string") {
    const match = value.match(NUMBER_WITH_UNIT);
    if (!match || !units.includes(match[2])) {
      throw new TypeError(
        `${api}: ${param} ${JSON.stringify(value)} must be a number or a string ending in one of ${units.join(", ")}`
      );
    }
    if (unit !== void 0) {
      throw new TypeError(`${api}: ${param} ${JSON.stringify(value)} already has a unit; pass a number to give one`);
    }
    return value;
  }
  return `${checkNumber(api, param, value)}${checkUnit(api, param, unit, units)}`;
};
var length = (api, param, value, unit = "px") => withUnit(api, param, value, lengthPercentageUnits, typeof value === "string" ? void 0 : unit);
var angle = (api, param, value, unit = "deg") => withUnit(api, param, value, angleUnits, typeof value === "string" ? void 0 : unit);
var signatures = (api, list) => new TypeError([`${api}() supports only the following signatures:`, ...list.map((s) => `${api}(${s})`)].join("\n"));
var makeTransform = (transforms) => {
  if (!Array.isArray(transforms) || transforms.some((t) => typeof t !== "string")) {
    throw new TypeError(`makeTransform: expects an array of transform strings, got ${JSON.stringify(transforms)}`);
  }
  return transforms.join(" ");
};
function matrix(a, b, c, d, tx, ty) {
  const values = { a, b, c, d, tx, ty };
  Object.entries(values).forEach(([name, value]) => checkNumber("matrix", name, value));
  return `matrix(${a}, ${b}, ${c}, ${d}, ${tx}, ${ty})`;
}
function matrix3d(...values) {
  if (values.length !== 16) throw new TypeError(`matrix3d: expects 16 numbers, got ${values.length}`);
  values.forEach((value, i) => checkNumber("matrix3d", `argument ${i + 1}`, value));
  return `matrix3d(${values.join(", ")})`;
}
function perspective(value, unit = "px") {
  if (typeof value === "string") return `perspective(${withUnit("perspective", "length", value, lengthUnits)})`;
  return `perspective(${withUnit("perspective", "length", value, lengthUnits, unit)})`;
}
function rotate(value, unit) {
  return `rotate(${angle("rotate", "angle", value, unit)})`;
}
function rotate3d(x, y, z, value, unit) {
  checkNumber("rotate3d", "x", x);
  checkNumber("rotate3d", "y", y);
  checkNumber("rotate3d", "z", z);
  return `rotate3d(${x}, ${y}, ${z}, ${angle("rotate3d", "angle", value, unit)})`;
}
function rotateX(value, unit) {
  return `rotateX(${angle("rotateX", "angle", value, unit)})`;
}
function rotateY(value, unit) {
  return `rotateY(${angle("rotateY", "angle", value, unit)})`;
}
function rotateZ(value, unit) {
  return `rotateZ(${angle("rotateZ", "angle", value, unit)})`;
}
function scale(x, y = x) {
  checkNumber("scale", "x", x);
  checkNumber("scale", "y", y);
  return `scale(${x}, ${y})`;
}
function scale3d(x, y, z) {
  checkNumber("scale3d", "x", x);
  checkNumber("scale3d", "y", y);
  checkNumber("scale3d", "z", z);
  return `scale3d(${x}, ${y}, ${z})`;
}
function scaleX(x) {
  return `scaleX(${checkNumber("scaleX", "x", x)})`;
}
function scaleY(y) {
  return `scaleY(${checkNumber("scaleY", "y", y)})`;
}
function scaleZ(z) {
  return `scaleZ(${checkNumber("scaleZ", "z", z)})`;
}
function skew(...args) {
  const [a, b, c, d] = args;
  if (args.length === 1) {
    const value = angle("skew", "angle", a);
    return `skew(${value}, ${value})`;
  }
  if (args.length === 2) {
    if (typeof a === "string" && typeof b === "string") {
      return `skew(${angle("skew", "angleX", a)}, ${angle("skew", "angleY", b)})`;
    }
    if (typeof a === "number" && typeof b === "number") {
      return `skew(${angle("skew", "angleX", a)}, ${angle("skew", "angleY", b)})`;
    }
    if (typeof a === "number" && typeof b === "string") {
      const value = angle("skew", "angle", a, b);
      return `skew(${value}, ${value})`;
    }
  }
  if (args.length === 4 && typeof a === "number" && typeof c === "number") {
    return `skew(${angle("skew", "angleX", a, b)}, ${angle("skew", "angleY", c, d)})`;
  }
  throw signatures("skew", [
    "angle: number | AngleUnitString",
    "angle: AngleUnitString, angle2: AngleUnitString",
    "angle: number, unit: AngleUnit",
    "angleX: number, angleY: number",
    "angleX: number, unitX: AngleUnit, angleY: number, unitY: AngleUnit"
  ]);
}
function skewX(value, unit) {
  return `skewX(${angle("skewX", "angle", value, unit)})`;
}
function skewY(value, unit) {
  return `skewY(${angle("skewY", "angle", value, unit)})`;
}
function translate(...args) {
  const [a, b, c, d] = args;
  if (args.length === 1) return `translate(${length("translate", "x", a)})`;
  if (args.length === 2) {
    if (typeof a === "number" && typeof b === "number" || typeof a === "string" && typeof b === "string") {
      return `translate(${length("translate", "x", a)}, ${length("translate", "y", b)})`;
    }
    if (typeof a === "number" && typeof b === "string") return `translate(${length("translate", "x", a, b)})`;
  }
  if (args.length === 4 && typeof a === "number" && typeof c === "number") {
    return `translate(${length("translate", "x", a, b)}, ${length("translate", "y", c, d)})`;
  }
  throw signatures("translate", [
    "x: number | LengthPercentageUnitString",
    "x: number, y: number",
    "x: LengthPercentageUnitString, y: LengthPercentageUnitString",
    "translation: number, unit: LengthPercentageUnit",
    "x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit"
  ]);
}
function translate3d(...args) {
  if (args.length === 3) {
    const [x, y, z] = args;
    const zValue = typeof z === "string" ? withUnit("translate3d", "z", z, lengthUnits) : withUnit("translate3d", "z", z, lengthUnits, "px");
    return `translate3d(${length("translate3d", "x", x)}, ${length("translate3d", "y", y)}, ${zValue})`;
  }
  if (args.length === 6) {
    const [x, unitX, y, unitY, z, unitZ] = args;
    if (typeof x === "number" && typeof y === "number" && typeof z === "number") {
      return `translate3d(${length("translate3d", "x", x, unitX)}, ${length("translate3d", "y", y, unitY)}, ${withUnit("translate3d", "z", z, lengthUnits, unitZ)})`;
    }
  }
  throw signatures("translate3d", [
    "x: number | LengthPercentageUnitString, y: number | LengthPercentageUnitString, z: number | LengthUnitString",
    "x: number, unitX: LengthPercentageUnit, y: number, unitY: LengthPercentageUnit, z: number, unitZ: LengthUnit"
  ]);
}
function translateX(value, unit) {
  return `translateX(${length("translateX", "x", value, unit)})`;
}
function translateY(value, unit) {
  return `translateY(${length("translateY", "y", value, unit)})`;
}
function translateZ(value, unit = "px") {
  if (typeof value === "string") return `translateZ(${withUnit("translateZ", "z", value, lengthUnits)})`;
  return `translateZ(${withUnit("translateZ", "z", value, lengthUnits, unit)})`;
}

// src/utils/interpolate-styles.ts
var NUMBER = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)([a-zA-Z%]*)$/;
var FUNCTION = /^([a-zA-Z-][a-zA-Z0-9-]*)\(([\s\S]*)\)$/;
var split = (text, commas = false) => {
  const tokens = [];
  let depth = 0;
  let current = "";
  const flush = () => {
    if (current.trim() !== "") tokens.push(current.trim());
    current = "";
  };
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (depth === 0 && ch === ",") {
      flush();
      if (!commas) tokens.push(",");
    } else if (depth === 0 && !commas && /\s/.test(ch)) {
      flush();
    } else {
      current += ch;
    }
  }
  flush();
  return tokens;
};
var parseToken = (token) => {
  const call = token.match(FUNCTION);
  if (call) {
    if (COLOR_FUNCTIONS.includes(call[1].toLowerCase())) {
      parseColor(token, "interpolateStyles");
      return { kind: "color", text: token };
    }
    return { kind: "function", name: call[1], args: split(call[2], true).map(parseValue) };
  }
  if (token.startsWith("#") || isNamedColor(token)) {
    parseColor(token, "interpolateStyles");
    return { kind: "color", text: token };
  }
  const number = token.match(NUMBER);
  if (number) return { kind: "number", value: parseFloat(number[1]), unit: number[2] };
  return { kind: "word", text: token };
};
var parseValue = (value) => typeof value === "number" ? [{ kind: "number", value, unit: "" }] : split(value).map(parseToken);
var serialize = (parts) => parts.reduce((out, part) => part === "," ? `${out},` : out === "" ? `${part}` : `${out} ${part}`, "");
var describe2 = (value) => JSON.stringify(value);
var interpolateParts = (property, start, end, segment, values) => {
  const mismatch2 = () => new TypeError(
    `interpolateStyles: ${property} cannot be interpolated from ${describe2(values[0])} to ${describe2(values[1])}: the values must have the same structure`
  );
  if (start.length !== end.length) throw mismatch2();
  return start.map((a, i) => {
    const b = end[i];
    if (a.kind === "number" && b.kind === "number") {
      if (a.unit !== b.unit && a.value !== 0 && b.value !== 0) {
        throw new TypeError(
          `interpolateStyles: ${property} cannot be interpolated from ${describe2(values[0])} to ${describe2(values[1])}: the units must match`
        );
      }
      const n = interpolate(segment.input, segment.range, [a.value, b.value], segment.options);
      const unit = a.unit || b.unit;
      return unit ? `${n}${unit}` : n;
    }
    if (a.kind === "color" && b.kind === "color") {
      return interpolateColors(segment.input, segment.range, [a.text, b.text], { easing: segment.options.easing });
    }
    if (a.kind === "function" && b.kind === "function") {
      if (a.name !== b.name || a.args.length !== b.args.length) throw mismatch2();
      const args = a.args.map((arg, j) => serialize(interpolateParts(property, arg, b.args[j], segment, values)));
      return `${a.name}(${args.join(", ")})`;
    }
    if (a.kind === "word" && b.kind === "word" && a.text === b.text) return a.text;
    throw mismatch2();
  });
};
var checkStyles = (outputStylesRange, length2) => {
  if (!Array.isArray(outputStylesRange)) {
    throw new Error("interpolateStyles: outputStylesRange must be an array of style objects");
  }
  if (outputStylesRange.length !== length2) {
    throw new Error(
      `interpolateStyles: inputRange (${length2}) and outputStylesRange (${outputStylesRange.length}) must have the same length`
    );
  }
  outputStylesRange.forEach((style, i) => {
    if (typeof style !== "object" || style === null || Array.isArray(style)) {
      throw new Error(`interpolateStyles: outputStylesRange[${i}] must be a style object, got ${describe2(style)}`);
    }
  });
};
var interpolateStyles = (input, inputRange, outputStylesRange, options = {}) => {
  checkStyles(outputStylesRange, inputRange.length);
  checkInterpolateArgs("interpolateStyles", input, inputRange, outputStylesRange.length, options);
  if (inputRange.length < 2) {
    throw new Error("interpolateStyles: inputRange must have at least 2 elements");
  }
  for (let i = 1; i < inputRange.length; i++) {
    if (!(inputRange[i] > inputRange[i - 1])) {
      throw new Error(`interpolateStyles: inputRange must be strictly increasing, got [${inputRange.join(", ")}]`);
    }
  }
  const { posterize, easing, extrapolateLeft = "extend", extrapolateRight = "extend" } = options;
  const x = posterize === void 0 ? input : Math.floor(input / posterize) * posterize;
  let index = inputRange.findIndex((step) => x < step) - 1;
  if (index === -1) index = 0;
  if (index === -2) index = inputRange.length - 2;
  const segment = {
    input: x,
    range: [inputRange[index], inputRange[index + 1]],
    options: {
      easing: Array.isArray(easing) ? easing[index] : easing,
      extrapolateLeft,
      extrapolateRight
    }
  };
  const startStyle = outputStylesRange[index];
  const endStyle = outputStylesRange[index + 1];
  const result = {};
  for (const property of Object.keys(startStyle)) {
    const from = startStyle[property];
    const to = endStyle[property];
    if (to === void 0 || to === null) {
      result[property] = from;
      continue;
    }
    if (typeof from !== "string" && typeof from !== "number" || typeof to !== "string" && typeof to !== "number") {
      throw new TypeError(
        `interpolateStyles: ${property} must be a number or a string in both styles, got ${describe2(from)} and ${describe2(to)}`
      );
    }
    const value = serialize(interpolateParts(property, parseValue(from), parseValue(to), segment, [from, to]));
    result[property] = value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value;
  }
  return result;
};

// src/utils/path/interpolate.ts
var decasteljau = (points, t) => {
  const left = [];
  const right = [];
  const recurse = (level) => {
    if (level.length === 1) {
      left.push(level[0]);
      right.push(level[0]);
      return;
    }
    const next = [];
    for (let i = 0; i < level.length - 1; i++) {
      if (i === 0) left.push(level[0]);
      if (i === level.length - 2) right.push(level[i + 1]);
      next.push([(1 - t) * level[i][0] + t * level[i + 1][0], (1 - t) * level[i][1] + t * level[i + 1][1]]);
    }
    recurse(next);
  };
  if (points.length) recurse(points);
  return { left, right: right.reverse() };
};
var splitCurveAsPoints = (points, count) => {
  const pieces = [];
  let remaining = points;
  const increment = 1 / count;
  for (let i = 0; i < count - 1; i++) {
    const { left, right } = decasteljau(remaining, increment / (1 - increment * i));
    pieces.push(left);
    remaining = right;
  }
  pieces.push(remaining);
  return pieces;
};
var pointsToInstruction = (points) => {
  const [x, y] = points[points.length - 1];
  if (points.length === 4) {
    return { type: "C", cp1x: points[1][0], cp1y: points[1][1], cp2x: points[2][0], cp2y: points[2][1], x, y };
  }
  if (points.length === 3) {
    return quadToCubic({ x: points[0][0], y: points[0][1] }, points[1][0], points[1][1], x, y);
  }
  return { type: "L", x, y };
};
var splitSegment = (start, end, count) => {
  if (end.type === "L" || end.type === "C") {
    if (start.type === "Z") return [];
    const points = [[start.x, start.y]];
    if (end.type === "C") points.push([end.cp1x, end.cp1y], [end.cp2x, end.cp2y]);
    points.push([end.x, end.y]);
    return splitCurveAsPoints(points, count).map(pointsToInstruction);
  }
  const copy = start.type === "M" ? { type: "L", x: start.x, y: start.y } : start;
  return [...new Array(count - 1).fill(copy), end];
};
var extendInstructions = (commands, reference) => {
  const segments = commands.length - 1;
  const referenceSegments = reference.length - 1;
  const ratio = segments / referenceSegments;
  const counts = [];
  for (let i = 0; i < referenceSegments; i++) {
    const index = Math.floor(ratio * i);
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const extended = [commands[0]];
  counts.forEach((count, i) => {
    if (count === void 0) return;
    if (i === commands.length - 1) {
      const last = commands[commands.length - 1];
      const copy = last.type === "M" ? { type: "L", x: last.x, y: last.y } : { ...last };
      for (let k = 0; k < count; k++) extended.push(copy);
      return;
    }
    extended.push(...splitSegment(commands[i], commands[i + 1], count));
  });
  return extended;
};
var toSameType = (command, target, current) => {
  if (command.type === "M" || target.type === "M" || command.type === target.type) return { ...command };
  if (target.type === "C" && command.type === "L") {
    return { type: "C", cp1x: current.x, cp1y: current.y, cp2x: command.x, cp2y: command.y, x: command.x, y: command.y };
  }
  if (target.type === "L" && command.type === "C") return { type: "L", x: command.x, y: command.y };
  if (target.type === "Z") return { type: "Z" };
  throw new Error(`interpolatePath: cannot turn a ${command.type} instruction into a ${target.type} instruction`);
};
var mismatch = (fn) => {
  throw new Error(`${fn}: the paths have different subpath structures (a move or a close where the other path draws)`);
};
var mix = (t, a, b) => {
  if (a.type !== b.type) mismatch("interpolatePath");
  const lerp = (p, q) => (1 - t) * p + t * q;
  switch (a.type) {
    case "Z":
      return a;
    case "C": {
      const c = b;
      return {
        type: "C",
        cp1x: lerp(a.cp1x, c.cp1x),
        cp2x: lerp(a.cp2x, c.cp2x),
        cp1y: lerp(a.cp1y, c.cp1y),
        cp2y: lerp(a.cp2y, c.cp2y),
        x: lerp(a.x, c.x),
        y: lerp(a.y, c.y)
      };
    }
    default: {
      const p = b;
      return { type: a.type, x: lerp(a.x, p.x), y: lerp(a.y, p.y) };
    }
  }
};
var reducedOf = (fn, path) => {
  if (typeof path !== "string") {
    throw new Error(`${fn}: paths must be strings, got ${JSON.stringify(path)}`);
  }
  return reduceInstructions(parsePath(path));
};
var checkFinite2 = (fn, name, value) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${fn}: ${name} must be a finite number, got ${value}`);
  }
};
var interpolatePath = (value, firstPath, secondPath) => {
  checkFinite2("interpolatePath", "value", value);
  const a = reducedOf("interpolatePath", firstPath);
  const b = reducedOf("interpolatePath", secondPath);
  if (value === 1) return secondPath;
  if (value === 0) return firstPath;
  let aCommands = a.slice();
  let bCommands = b.slice();
  const addZ = aCommands[aCommands.length - 1].type === "Z" && bCommands[bCommands.length - 1].type === "Z";
  if (aCommands[aCommands.length - 1].type === "Z") aCommands.pop();
  if (bCommands[bCommands.length - 1].type === "Z") bCommands.pop();
  if (aCommands.length === 0) aCommands.push(bCommands[0]);
  else if (bCommands.length === 0) bCommands.push(aCommands[0]);
  if (bCommands.length > aCommands.length) aCommands = extendInstructions(aCommands, bCommands);
  else if (aCommands.length > bCommands.length) bCommands = extendInstructions(bCommands, aCommands);
  const aSameType = aCommands.map(
    (command, i) => toSameType(command, bCommands[i], getEndPosition(aCommands.slice(0, i)))
  );
  if (addZ) {
    aSameType.push({ type: "Z" });
    bCommands.push({ type: "Z" });
  }
  return serializeInstructions(aSameType.map((command, i) => mix(value, command, bCommands[i])));
};
var tidyNumbers = (path) => path.replace(/-?\d*\.?\d+(?:e[+-]?\d+)?/gi, (value) => {
  const number = Number(value);
  return Number.isInteger(number) ? value : String(Number(number.toPrecision(15)));
});
var interpolatePaths = (input, inputRange, outputRange, options) => {
  const fn = "interpolatePaths";
  if (!Array.isArray(outputRange)) {
    throw new Error(`${fn}: outputRange must be an array of SVG path strings, got ${JSON.stringify(outputRange)}`);
  }
  for (const path of outputRange) {
    if (typeof path !== "string") {
      throw new Error(`${fn}: outputRange must contain only SVG path strings, got ${JSON.stringify(path)}`);
    }
  }
  for (const side of ["extrapolateLeft", "extrapolateRight"]) {
    const extrapolation = options?.[side];
    if (extrapolation !== void 0 && extrapolation !== "extend" && extrapolation !== "clamp" && extrapolation !== "wrap") {
      throw new Error(`${fn}: ${side} must be "extend", "clamp" or "wrap", got ${JSON.stringify(extrapolation)}`);
    }
  }
  const weights = outputRange.map(
    (_, pathIndex) => interpolate(
      input,
      inputRange,
      outputRange.map((__, index) => index === pathIndex ? 1 : 0),
      options
    )
  );
  const exact = weights.findIndex(
    (weight, index) => weight === 1 && weights.every((other, otherIndex) => otherIndex === index || other === 0)
  );
  if (exact !== -1) return outputRange[exact];
  const contributing = outputRange.map((path, index) => ({ path, weight: weights[index] })).filter(({ weight }) => weight !== 0);
  const paths = contributing.map(({ path }) => reducedOf(fn, path));
  const closed = paths.every((commands) => commands[commands.length - 1].type === "Z");
  const open = paths.map((commands) => commands[commands.length - 1].type === "Z" ? commands.slice(0, -1) : commands);
  const reference = open.reduce((longest, commands) => commands.length > longest.length ? commands : longest);
  const extended = open.map(
    (commands) => commands.length < reference.length ? extendInstructions(commands, reference) : commands
  );
  const result = reference.map((_, index) => {
    const commands = extended.map((path) => path[index]);
    if (commands.some((command) => command.type === "Z")) {
      if (commands.every((command) => command.type === "Z")) return { type: "Z" };
      return mismatch(fn);
    }
    const target = commands.find((command) => command.type === "C") ?? commands[0];
    const coordinates = commands.map((command, pathIndex) => {
      if (command.type === "M" !== (target.type === "M")) mismatch(fn);
      const same = toSameType(command, target, getEndPosition(extended[pathIndex].slice(0, index)));
      if (same.type === "Z") return [];
      return same.type === "C" ? [same.x, same.y, same.cp1x, same.cp1y, same.cp2x, same.cp2y] : [same.x, same.y];
    });
    const values = coordinates[0].map((base, k) => {
      const mixed = coordinates.reduce((sum, path, pathIndex) => sum + (path[k] - base) * contributing[pathIndex].weight, base);
      if (Number.isFinite(mixed)) return mixed;
      return coordinates.reduce((sum, path, pathIndex) => sum + path[k] * contributing[pathIndex].weight, 0);
    });
    if (target.type === "C") {
      return { type: "C", x: values[0], y: values[1], cp1x: values[2], cp1y: values[3], cp2x: values[4], cp2y: values[5] };
    }
    return { type: target.type, x: values[0], y: values[1] };
  });
  if (closed) result.push({ type: "Z" });
  return tidyNumbers(serializeInstructions(result));
};

// src/utils/path/from-points.ts
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
    const angle2 = Math.acos(cosine);
    if (angle2 < 1e-9 || Math.PI - angle2 < 1e-9) return null;
    const tanHalf = Math.tan(angle2 / 2);
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
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }
  if (frame > endFrame - fadeOutDuration) {
    return interpolate(
      frame,
      [endFrame - fadeOutDuration, endFrame],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
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
    const cache = /* @__PURE__ */ new Map();
    for (let i = frame; i < Math.min(frame + lookahead, durationInFrames); i++) {
      cache.set(i, compute(i));
    }
    return cache;
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

export { AnimatedImage, Blur, Bounce, CardExpansionMask, Composition, Confetti, Counter, Cube3D, Fade, Flip3D, FlipImageReveal, Glitch, GradientText, Highlight, HyperFrame, KineticTypography, LetterByLetter, LiquidText, MaskReveal, NeonGlow, ParticleSystem, Particles, Perspective3D, ProgressBar, Pulse, RainbowText, Rotate, Rotate3D, Scale, ShakeEffect, Slide, StickyGridScroll, Swing, TextStack3D, Typewriter, WaveText, WordByWord, fitRect, getParticles, interpolatePath, interpolatePaths, interpolateStyles, loadFont, makeTransform, matrix, matrix3d, noise2D, noise3D, noise4D, pathFromPoints, perspective, rotate, rotate3d, rotateX, rotateY, rotateZ, scale, scale3d, scaleX, scaleY, scaleZ, skew, skewX, skewY, translate, translate3d, translateX, translateY, translateZ, useAnimation, useAnimationValue, useCachedFrame, useComposition, useCycle, useDelay, useDurationInFrames, useEmitInput, useFade, useFrameRange, useInputEvents, useInterpolate, useKeyframeState, useLastEvent, useLoop, useMemoizedFrame, useOptimizedInterpolate, useOptimizedSpring, usePrecomputeFrames, usePreloadAssets, useProgress, usePulse, useReducedState, useShake, useSlide, useSpring, useStaticFile, useTimeline, useTransform, useWindowedFrame };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map