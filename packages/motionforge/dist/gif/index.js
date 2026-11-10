'use client';import { checkImageProps, mediaTimeInSeconds, calculateImageFit } from '../chunk-ZVSY5ZVR.js';
import { CROP_AND_EFFECT_PROPS, SEQUENCE_PROPS, rejectProps, checkSrc, resolveSrc, serializeRequestInit, fetchAsset } from '../chunk-WVAVUOFE.js';
import { useCurrentFrame, useVideoConfig, useDelayRender } from '../chunk-L5HQH5HH.js';
import { forwardRef, useRef, useImperativeHandle, useCallback, useState, useEffect } from 'react';
import { GifReader } from 'omggif';
import { jsx } from 'react/jsx-runtime';

var CACHE_SIZE = 30;
var cache = /* @__PURE__ */ new Map();
var readGif = (bytes, src) => {
  const signature = String.fromCharCode(...bytes.subarray(0, 6));
  if (signature !== "GIF87a" && signature !== "GIF89a") {
    throw new Error(`<Gif>: ${src} is not a GIF (it does not start with GIF87a or GIF89a)`);
  }
  let reader;
  try {
    reader = new GifReader(bytes);
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
  const resolved = resolveSrc(src);
  const key = `${resolved} ${serializeRequestInit(requestInit)}`;
  const cached = cache.get(key);
  if (cached) {
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }
  const loading = fetchAsset("<Gif>", resolved, requestInit).then((response) => response.arrayBuffer()).then((buffer) => readGif(new Uint8Array(buffer), src));
  cache.set(key, loading);
  if (cache.size > CACHE_SIZE) cache.delete(cache.keys().next().value);
  loading.catch(() => {
    if (cache.get(key) === loading) cache.delete(key);
  });
  return loading;
};
var getGifDurationInSeconds = async (src, options) => {
  checkSrc("getGifDurationInSeconds()", src);
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
  ...SEQUENCE_PROPS,
  ...CROP_AND_EFFECT_PROPS,
  delayRenderTimeoutInMilliseconds: "the host sets the timeout with gate.waitUntilReady({ timeoutMs })"
};
var Gif = forwardRef((props, ref) => {
  rejectProps("<Gif>", props, UNSUPPORTED);
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
  checkSrc("<Gif>", src);
  checkImageProps("<Gif>", { fit, width, height, playbackRate });
  if (!LOOP_BEHAVIORS.includes(loopBehavior)) {
    throw new Error(
      `<Gif>: loopBehavior must be 'loop', 'pause-after-finish' or 'unmount-after-finish', got ${JSON.stringify(loopBehavior)}`
    );
  }
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const canvasRef = useRef(null);
  useImperativeHandle(ref, () => canvasRef.current, []);
  const requestInitRef = useRef(requestInit);
  requestInitRef.current = requestInit;
  const onLoadRef = useRef(onLoad);
  onLoadRef.current = onLoad;
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
  const key = `${resolveSrc(src)} ${serializeRequestInit(requestInit)}`;
  const [loaded, setLoaded] = useState(
    null
  );
  const current = loaded !== null && loaded.key === key ? loaded : null;
  useEffect(() => {
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
  const index = current ? getGifFrameIndex(current.gif.delays, mediaTimeInSeconds(frame, fps, playbackRate) * 1e3, loopBehavior) : 0;
  const [scratch] = useState(() => typeof document === "undefined" ? null : document.createElement("canvas"));
  useEffect(() => {
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
        ...calculateImageFit(fit, { width: gif.width, height: gif.height }, { width: canvasWidth, height: canvasHeight })
      );
    } catch (error) {
      fail(error);
    }
    continueRender(current.handle);
  }, [current, index, fit, width, height, scratch, continueRender, fail]);
  if (index === -1) return null;
  return /* @__PURE__ */ jsx(
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

export { Gif, getGifDurationInSeconds };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map