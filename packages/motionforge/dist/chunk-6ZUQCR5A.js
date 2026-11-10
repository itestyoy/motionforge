'use client';import { useAudioTrack } from './chunk-545UZ5CT.js';
import { useCurrentFrame, useVideoConfig, useDelayRender } from './chunk-L5HQH5HH.js';
import { useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { jsx } from 'react/jsx-runtime';

var prefetched = /* @__PURE__ */ new Map();
var snapshot = /* @__PURE__ */ new Map();
var listeners = /* @__PURE__ */ new Set();
var publish = () => {
  snapshot = new Map([...prefetched].map(([src, list]) => [src, list[list.length - 1].url]));
  listeners.forEach((listener) => listener());
};
var withoutHash = (src) => {
  const index = src.indexOf("#");
  return index === -1 ? src : src.slice(0, index);
};
var toDataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("prefetch: could not read the downloaded data"));
  reader.readAsDataURL(blob);
});
var prefetch = (src, options = {}) => {
  if (typeof src !== "string" || src === "") {
    throw new TypeError(`prefetch: src must be a non-empty string, got ${JSON.stringify(src)}`);
  }
  const { method = "blob-url", contentType, credentials, onProgress } = options;
  if (method !== "blob-url" && method !== "base64") {
    throw new TypeError(`prefetch: method must be 'blob-url' or 'base64', got ${JSON.stringify(method)}`);
  }
  if (typeof fetch !== "function" || typeof URL.createObjectURL !== "function") {
    throw new Error("prefetch needs a browser (fetch and URL.createObjectURL)");
  }
  const source = withoutHash(src);
  const id = /* @__PURE__ */ Symbol("prefetch");
  const controller = new AbortController();
  let freed = false;
  let url = null;
  const done = (async () => {
    const response = await fetch(source, { signal: controller.signal, credentials });
    if (!response.ok) throw new Error(`prefetch: ${source} returned HTTP ${response.status}`);
    const total = Number(response.headers.get("Content-Length"));
    const totalBytes = Number.isFinite(total) && total > 0 ? total : null;
    const chunks = [];
    let loadedBytes = 0;
    if (response.body) {
      const reader = response.body.getReader();
      for (; ; ) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        chunks.push(value);
        loadedBytes += value.length;
        onProgress?.({ loadedBytes, totalBytes });
      }
    }
    const blob = new Blob(chunks, { type: contentType ?? response.headers.get("Content-Type") ?? "" });
    const result = method === "base64" ? await toDataUrl(blob) : URL.createObjectURL(blob);
    if (freed) {
      if (method === "blob-url") URL.revokeObjectURL(result);
      throw new Error(`prefetch: free() was called before ${source} was downloaded`);
    }
    url = result;
    prefetched.set(source, [...prefetched.get(source) ?? [], { id, url: result }]);
    publish();
    return result;
  })().catch((error) => {
    throw freed ? new Error(`prefetch: free() was called before ${source} was downloaded`) : error instanceof Error && error.message.startsWith("prefetch") ? error : new Error(`prefetch: could not download ${source}: ${error instanceof Error ? error.message : String(error)}`);
  });
  done.catch(() => void 0);
  return {
    free: () => {
      if (freed) return;
      freed = true;
      if (url === null) {
        controller.abort();
        return;
      }
      if (method === "blob-url") URL.revokeObjectURL(url);
      const rest = (prefetched.get(source) ?? []).filter((entry) => entry.id !== id);
      if (rest.length === 0) prefetched.delete(source);
      else prefetched.set(source, rest);
      publish();
    },
    waitUntilDone: () => done
  };
};
var subscribe = (listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
var getSnapshot = () => snapshot;
var NOTHING = /* @__PURE__ */ new Map();
var getServerSnapshot = () => NOTHING;
var usePrefetchedSrc = (src) => {
  const urls = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const source = withoutHash(src);
  const url = urls.get(source);
  return url === void 0 ? src : url + src.slice(source.length);
};
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
var resolveTiming = (component, { trimBefore, trimAfter, durationInFrames, playbackRate = 1, loop = false, volume }) => {
  const fail = (message) => {
    throw new Error(`<${component}>: ${message}`);
  };
  if (trimBefore !== void 0 && !(typeof trimBefore === "number" && Number.isFinite(trimBefore) && trimBefore >= 0)) {
    fail(`trimBefore must be a finite number >= 0, got ${trimBefore}`);
  }
  if (trimAfter !== void 0 && !(typeof trimAfter === "number" && Number.isFinite(trimAfter) && trimAfter > 0)) {
    fail(`trimAfter must be a positive finite number, got ${trimAfter}`);
  }
  if (trimAfter !== void 0 && trimBefore !== void 0 && trimAfter <= trimBefore) {
    fail(`trimAfter (${trimAfter}) must be greater than trimBefore (${trimBefore})`);
  }
  if (durationInFrames !== void 0 && !(typeof durationInFrames === "number" && Number.isFinite(durationInFrames) && durationInFrames > 0)) {
    fail(`durationInFrames must be a positive finite number, got ${durationInFrames}`);
  }
  if (!(typeof playbackRate === "number" && Number.isFinite(playbackRate) && playbackRate > 0)) {
    fail(`playbackRate must be a finite number above 0 (playing backwards is not supported), got ${playbackRate}`);
  }
  if (typeof loop !== "boolean") fail(`loop must be a boolean, got ${JSON.stringify(loop)}`);
  if (volume !== void 0 && typeof volume !== "function" && !(typeof volume === "number" && Number.isFinite(volume) && volume >= 0)) {
    fail(`volume must be a number >= 0 or a function (frame) => number, got ${JSON.stringify(volume)}`);
  }
  const start = trimBefore ?? 0;
  const byDuration = durationInFrames === void 0 ? void 0 : start + durationInFrames;
  const end = byDuration === void 0 ? trimAfter : trimAfter === void 0 ? byDuration : Math.min(trimAfter, byDuration);
  return {
    trimBefore: start,
    end,
    rate: playbackRate,
    loop,
    shownFor: end === void 0 || loop ? void 0 : (end - start) / playbackRate
  };
};
var loopSpan = (component, timing, mediaDuration, fps) => {
  const span = (timing.end ?? mediaDuration * fps) - timing.trimBefore;
  if (!Number.isFinite(span) || span <= 0) {
    throw new Error(
      `<${component}>: loop needs a media with a finite duration after trimBefore, or trimAfter / durationInFrames (duration: ${mediaDuration} s)`
    );
  }
  return span;
};
var getMediaTime = (component, frame, fps, timing, mediaDuration) => {
  let elapsed = Math.max(0, frame) * timing.rate;
  if (timing.loop) {
    elapsed %= loopSpan(component, timing, mediaDuration, fps);
  }
  return (timing.trimBefore + elapsed) / fps;
};
var mediaTrack = (component, src, timing, { volume, muted, name }) => {
  if (typeof muted !== "boolean") {
    throw new Error(`<${component}>: muted must be a boolean, got ${JSON.stringify(muted)}`);
  }
  if (name !== void 0 && typeof name !== "string") {
    throw new Error(`<${component}>: name must be a string, got ${JSON.stringify(name)}`);
  }
  return {
    src,
    buffer: null,
    bufferKey: null,
    name: name ?? null,
    trimBefore: timing.trimBefore,
    trimAfter: timing.end ?? null,
    playbackRate: timing.rate,
    loop: timing.loop,
    muted,
    volume,
    at: 0,
    lengthInFrames: timing.shownFor
  };
};
var checkMediaSrc = (component, src) => {
  if (typeof src !== "string" || src === "") {
    throw new Error(`<${component}>: src must be a non-empty string (a URL), got ${JSON.stringify(src)}`);
  }
};
var needsSeek = (currentTime, targetTime, fps) => Math.abs(currentTime - targetTime) > 0.5 / fps;
var OBJECT_FITS = ["contain", "cover", "fill", "none", "scale-down"];
var Video = ({
  src,
  trimBefore,
  trimAfter,
  durationInFrames,
  volume,
  playbackRate,
  muted = false,
  loop,
  name,
  objectFit,
  style,
  ...props
}) => {
  const [videoRef, setVideoRef] = useElementRef(props.ref);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  checkMediaSrc("Video", src);
  const timing = resolveTiming("Video", { trimBefore, trimAfter, durationInFrames, playbackRate, loop, volume });
  const { trimBefore: start, end, rate, loop: looping } = timing;
  useAudioTrack("Video", mediaTrack("Video", src, timing, { volume, muted, name }));
  const resolvedSrc = usePrefetchedSrc(src);
  if (objectFit !== void 0 && !OBJECT_FITS.includes(objectFit)) {
    throw new Error(`<Video>: objectFit must be one of ${OBJECT_FITS.join(", ")}, got ${JSON.stringify(objectFit)}`);
  }
  if (objectFit !== void 0 && style?.objectFit !== void 0 && style.objectFit !== objectFit) {
    throw new Error(`<Video>: objectFit="${objectFit}" and style.objectFit="${style.objectFit}" disagree; pass one`);
  }
  const shown = timing.shownFor === void 0 || currentFrame < timing.shownFor;
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
    function cancel(error) {
      if (settled) return;
      settled = true;
      removeListeners();
      cancelRender(error);
      continueRender(handle);
    }
    function fail() {
      const detail = video.error ? `: ${video.error.message || `media error code ${video.error.code}`}` : "";
      cancel(new Error(`<Video> could not load ${src}${detail}`));
    }
    function sync() {
      video.removeEventListener("loadeddata", sync);
      let time;
      try {
        time = getMediaTime("Video", currentFrame, fps, { ...timing }, video.duration);
      } catch (error) {
        cancel(error);
        return;
      }
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
  }, [currentFrame, fps, start, end, rate, looping, resolvedSrc, shown, delayRender, continueRender, cancelRender]);
  if (!shown) return null;
  return /* @__PURE__ */ jsx(
    "video",
    {
      src: resolvedSrc,
      muted: true,
      playsInline: true,
      style: { ...style, objectFit: objectFit ?? style?.objectFit ?? "contain" },
      ...props,
      ref: setVideoRef
    }
  );
};
var Audio = ({
  src,
  trimBefore,
  trimAfter,
  durationInFrames,
  volume,
  playbackRate,
  muted = false,
  loop,
  name,
  ...rest
}) => {
  const unknown = Object.keys(rest);
  if (unknown.length > 0) {
    throw new Error(
      `<Audio> renders no element and takes no ${unknown.map((key) => JSON.stringify(key)).join(", ")}: it describes an audio track (src, trimBefore, trimAfter, durationInFrames, playbackRate, loop, volume, muted, name)`
    );
  }
  checkMediaSrc("Audio", src);
  const timing = resolveTiming("Audio", { trimBefore, trimAfter, durationInFrames, playbackRate, loop, volume });
  useAudioTrack("Audio", mediaTrack("Audio", src, timing, { volume, muted, name }));
  return null;
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
  const resolvedSrc = usePrefetchedSrc(src);
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
  }, [src, resolvedSrc, shown, delayRender, continueRender, cancelRender]);
  if (!shown) {
    return null;
  }
  return /* @__PURE__ */ jsx(
    "img",
    {
      src: resolvedSrc,
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

export { AbsoluteFill, Audio, G, Img, Path, SVG, Text, Video, prefetch };
//# sourceMappingURL=chunk-6ZUQCR5A.js.map
//# sourceMappingURL=chunk-6ZUQCR5A.js.map