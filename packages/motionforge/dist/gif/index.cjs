'use client';'use strict';

var chunkNJNXF7ZR_cjs = require('../chunk-NJNXF7ZR.cjs');
var chunk5SQGQMYR_cjs = require('../chunk-5SQGQMYR.cjs');
var chunkNS6WDBHG_cjs = require('../chunk-NS6WDBHG.cjs');
var react = require('react');
var omggif = require('omggif');
var jsxRuntime = require('react/jsx-runtime');

var CACHE_SIZE = 30;
var cache = /* @__PURE__ */ new Map();
var readGif = (bytes, src) => {
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new Error(`<Gif>: ${src} is not a GIF (it does not start with GIF87a or GIF89a)`);
  }
  let reader;
  try {
    reader = new omggif.GifReader(bytes);
  } catch (error) {
    throw new Error(`<Gif> could not read ${src}: ${error instanceof Error ? error.message : error}`);
  }
  const { width, height } = reader;
  const count = reader.numFrames();
  const delays = Array.from({ length: count }, (_, i) => (reader.frameInfo(i).delay || 10) * 10);
  let frames = null;
  const compose = () => {
    const result = [];
    let canvas = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < count; i++) {
      const info = reader.frameInfo(i);
      const previous = info.disposal === 3 ? canvas.slice() : null;
      try {
        reader.decodeAndBlitFrameRGBA(i, canvas);
      } catch (error) {
        throw new Error(`<Gif> could not decode frame ${i} of ${src}: ${error instanceof Error ? error.message : error}`);
      }
      result.push(new ImageData(canvas.slice(), width, height));
      if (info.disposal === 2) {
        const right = Math.min(width, info.x + info.width);
        const bottom = Math.min(height, info.y + info.height);
        for (let y = info.y; y < bottom; y++) {
          canvas.fill(0, (y * width + info.x) * 4, (y * width + right) * 4);
        }
      } else if (previous) {
        canvas = previous;
      }
    }
    return result;
  };
  return {
    width,
    height,
    delays,
    getFrames: () => frames ?? (frames = compose())
  };
};
var loadGif = (src, requestInit) => {
  const resolved = chunk5SQGQMYR_cjs.resolveSrc(src);
  const key = `${resolved} ${chunk5SQGQMYR_cjs.serializeRequestInit(requestInit)}`;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const loading = chunk5SQGQMYR_cjs.fetchAsset("<Gif>", resolved, requestInit).then((response) => response.arrayBuffer()).then((buffer) => readGif(new Uint8Array(buffer), src));
  cache.set(key, loading);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  loading.catch(() => {
    if (cache.get(key) === loading) cache.delete(key);
  });
  return loading;
};
var getGifDurationInSeconds = async (src, options) => {
  chunk5SQGQMYR_cjs.checkSrc("getGifDurationInSeconds()", src);
  const gif = await loadGif(src, options?.requestInit);
  return gif.delays.reduce((sum, delay) => sum + delay, 0) / 1e3;
};
var getGifFrameIndex = (delays, timeInMs, loopBehavior) => {
  if (delays.length === 0) return 0;
  const duration = delays.reduce((sum, delay) => sum + delay, 0);
  if (loopBehavior === "pause-after-finish" && timeInMs >= duration) return delays.length - 1;
  if (loopBehavior === "unmount-after-finish" && timeInMs >= duration) return -1;
  let currentTime = timeInMs % duration;
  for (let i = 0; i < delays.length; i++) {
    if (currentTime < delays[i]) return i;
    currentTime -= delays[i];
  }
  return 0;
};
var LOOP_BEHAVIORS = ["loop", "pause-after-finish", "unmount-after-finish"];
var UNSUPPORTED = {
  ...chunk5SQGQMYR_cjs.SEQUENCE_PROPS,
  ...chunk5SQGQMYR_cjs.CROP_AND_EFFECT_PROPS,
  delayRenderTimeoutInMilliseconds: "the host sets the timeout with gate.waitUntilReady({ timeoutMs })"
};
var Gif = react.forwardRef((props, ref) => {
  chunk5SQGQMYR_cjs.rejectProps("<Gif>", props, UNSUPPORTED);
  const {
    src,
    width,
    height,
    onLoad,
    onError,
    fit = "fill",
    playbackRate = 1,
    style,
    loopBehavior = "loop",
    id,
    requestInit
  } = props;
  chunk5SQGQMYR_cjs.checkSrc("<Gif>", src);
  chunkNJNXF7ZR_cjs.checkImageProps("<Gif>", { fit, width, height, playbackRate });
  if (!LOOP_BEHAVIORS.includes(loopBehavior)) {
    throw new Error(
      `<Gif>: loopBehavior must be 'loop', 'pause-after-finish' or 'unmount-after-finish', got ${JSON.stringify(loopBehavior)}`
    );
  }
  const frame = chunkNS6WDBHG_cjs.useCurrentFrame();
  const { fps } = chunkNS6WDBHG_cjs.useVideoConfig();
  const { delayRender, continueRender, cancelRender } = chunkNS6WDBHG_cjs.useDelayRender();
  const canvasRef = react.useRef(null);
  react.useImperativeHandle(ref, () => canvasRef.current, []);
  const requestInitRef = react.useRef(requestInit);
  requestInitRef.current = requestInit;
  const onLoadRef = react.useRef(onLoad);
  onLoadRef.current = onLoad;
  const onErrorRef = react.useRef(onError);
  onErrorRef.current = onError;
  const fail = react.useCallback(
    (error) => {
      const asError = error instanceof Error ? error : new Error(String(error));
      if (onErrorRef.current) onErrorRef.current(asError);
      else cancelRender(asError);
    },
    [cancelRender]
  );
  const key = `${chunk5SQGQMYR_cjs.resolveSrc(src)} ${chunk5SQGQMYR_cjs.serializeRequestInit(requestInit)}`;
  const [loaded, setLoaded] = react.useState(
    null
  );
  const current = loaded !== null && loaded.key === key ? loaded : null;
  react.useEffect(() => {
    const handle = delayRender(`<Gif> loading ${src}`);
    let active = true;
    loadGif(src, requestInitRef.current).then((gif) => {
      if (!active) return;
      const frames = gif.getFrames();
      onLoadRef.current?.({ width: gif.width, height: gif.height, delays: gif.delays, frames });
      setLoaded({ key, gif, frames, handle });
    }).catch((error) => {
      if (!active) return;
      fail(error);
      continueRender(handle);
    });
    return () => {
      active = false;
      continueRender(handle);
    };
  }, [key, delayRender, continueRender, fail]);
  const index = current ? getGifFrameIndex(current.gif.delays, chunkNJNXF7ZR_cjs.mediaTimeInSeconds(frame, fps, playbackRate) * 1e3, loopBehavior) : 0;
  const [scratch] = react.useState(() => typeof document === "undefined" ? null : document.createElement("canvas"));
  react.useEffect(() => {
    if (!current || index === -1) {
      if (current) continueRender(current.handle);
      return;
    }
    try {
      const canvas = canvasRef.current;
      const context = canvas?.getContext("2d");
      const scratchContext = scratch?.getContext("2d");
      if (!canvas || !context || !scratch || !scratchContext) {
        throw new Error("<Gif> could not get a 2D context for its canvas");
      }
      const { gif } = current;
      const canvasWidth = width ?? gif.width;
      const canvasHeight = height ?? gif.height;
      if (canvas.width !== canvasWidth) canvas.width = canvasWidth;
      if (canvas.height !== canvasHeight) canvas.height = canvasHeight;
      if (scratch.width !== gif.width) scratch.width = gif.width;
      if (scratch.height !== gif.height) scratch.height = gif.height;
      scratchContext.putImageData(current.frames[index], 0, 0);
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.drawImage(
        scratch,
        ...chunkNJNXF7ZR_cjs.calculateImageFit(fit, { width: gif.width, height: gif.height }, { width: canvasWidth, height: canvasHeight })
      );
    } catch (error) {
      fail(error);
    }
    continueRender(current.handle);
  }, [current, index, fit, width, height, scratch, continueRender, fail]);
  if (index === -1) return null;
  return /* @__PURE__ */ jsxRuntime.jsx(
    "canvas",
    {
      ref: canvasRef,
      id,
      style,
      width: width ?? current?.gif.width,
      height: height ?? current?.gif.height
    }
  );
});
Gif.displayName = "Gif";

exports.Gif = Gif;
exports.getGifDurationInSeconds = getGifDurationInSeconds;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map