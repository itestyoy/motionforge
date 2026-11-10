'use client';import { useDelayRender, useCurrentFrame, useVideoConfig } from '../chunk-L5HQH5HH.js';
import { useRef, useState, useEffect, useMemo } from 'react';
import lottie from 'lottie-web';
import { jsxs, jsx } from 'react/jsx-runtime';

var jsonOfData = /* @__PURE__ */ new WeakMap();
var jsonOf = (data) => {
  let json = jsonOfData.get(data);
  if (json === void 0) {
    json = JSON.stringify(data);
    jsonOfData.set(data, json);
  }
  return json;
};
var checkAnimationData = (component, animationData) => {
  if (typeof animationData !== "object" || animationData === null || Array.isArray(animationData)) {
    throw new Error(
      `${component}: animationData must be the animation JSON as an object, got ${JSON.stringify(animationData)}. If you have the URL of the JSON file, fetch it and pass the result as animationData.`
    );
  }
};
var getLottieMetadata = (animationData) => {
  checkAnimationData("getLottieMetadata", animationData);
  const { w: width, h: height, fr: fps, op } = animationData;
  if (![width, height, fps, op].every((value) => typeof value === "number" && Number.isFinite(value) && value > 0)) {
    return null;
  }
  return { durationInFrames: Math.floor(op), durationInSeconds: op / fps, fps, height, width };
};
var RENDERERS = ["svg", "canvas", "html"];
var Lottie = ({
  animationData,
  direction = "forward",
  loop = false,
  playbackRate = 1,
  renderer = "svg",
  preserveAspectRatio,
  assetsPath,
  onAnimationLoaded,
  frameStart = 0,
  frameEnd,
  width,
  height,
  style,
  className
}) => {
  checkAnimationData("Lottie", animationData);
  if (direction !== "forward" && direction !== "backward") {
    throw new Error(`Lottie: direction must be 'forward' or 'backward', got ${JSON.stringify(direction)}`);
  }
  if (typeof loop !== "boolean") {
    throw new Error(`Lottie: loop must be a boolean, got ${JSON.stringify(loop)}`);
  }
  if (typeof playbackRate !== "number" || !Number.isFinite(playbackRate) || playbackRate <= 0) {
    throw new Error(`Lottie: playbackRate must be a finite number above 0, got ${playbackRate}`);
  }
  if (!RENDERERS.includes(renderer)) {
    throw new Error(`Lottie: renderer must be one of ${RENDERERS.join(", ")}, got ${JSON.stringify(renderer)}`);
  }
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const dataKey = jsonOf(animationData);
  const onLoadedRef = useRef(onAnimationLoaded);
  onLoadedRef.current = onAnimationLoaded;
  const loadHandle = useRef(null);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useEffect(() => {
    setIsLoaded(false);
    setError(null);
    if (typeof window === "undefined" || !containerRef.current) return;
    let isCancelled = false;
    const handle = delayRender("<Lottie> animation data");
    loadHandle.current = handle;
    const release = () => {
      continueRender(handle);
      if (loadHandle.current === handle) loadHandle.current = null;
    };
    const fail = (message) => {
      setError(message);
      cancelRender(new Error(`<Lottie> ${message}`));
      release();
    };
    try {
      const anim = lottie.loadAnimation({
        container: containerRef.current,
        renderer,
        loop: false,
        autoplay: false,
        animationData: JSON.parse(dataKey),
        assetsPath,
        rendererSettings: {
          progressiveLoad: false,
          hideOnTransparent: true,
          ...preserveAspectRatio !== void 0 ? { preserveAspectRatio } : null
        }
      });
      animationRef.current = anim;
      const onLoaded = () => {
        if (!isCancelled) setIsLoaded(true);
      };
      anim.addEventListener("DOMLoaded", onLoaded);
      anim.addEventListener("data_ready", onLoaded);
      anim.addEventListener("data_failed", () => {
        if (!isCancelled) fail("failed to load animation data");
      });
      onLoadedRef.current?.(anim);
      return () => {
        isCancelled = true;
        release();
        anim.destroy();
        animationRef.current = null;
      };
    } catch (err) {
      fail(err instanceof Error ? err.message : String(err));
      return () => {
      };
    }
  }, [dataKey, renderer, preserveAspectRatio, assetsPath, delayRender, continueRender, cancelRender]);
  useEffect(() => {
    if (!animationRef.current || !isLoaded) return;
    const anim = animationRef.current;
    const start = frameStart;
    const end = frameEnd ?? anim.totalFrames;
    const duration = end - start;
    if (duration <= 0) {
      cancelRender(
        new Error(`<Lottie> frameEnd (${end}) must be greater than frameStart (${start}); the animation has ${anim.totalFrames} frames`)
      );
      if (loadHandle.current !== null) {
        continueRender(loadHandle.current);
        loadHandle.current = null;
      }
      return;
    }
    let targetFrame = currentFrame / fps * anim.frameRate * playbackRate;
    if (loop) {
      targetFrame = (targetFrame % duration + duration) % duration;
    } else {
      targetFrame = Math.max(0, Math.min(targetFrame, duration - 0.01));
    }
    const finalFrame = direction === "backward" ? start + (duration - targetFrame) : start + targetFrame;
    anim.goToAndStop(finalFrame, true);
    if (loadHandle.current !== null) {
      continueRender(loadHandle.current);
      loadHandle.current = null;
    }
  }, [currentFrame, fps, isLoaded, frameStart, frameEnd, playbackRate, loop, direction, continueRender, cancelRender]);
  const containerStyle = useMemo(() => ({
    width: width ?? "100%",
    height: height ?? "100%",
    ...style
  }), [width, height, style]);
  return /* @__PURE__ */ jsxs("div", { style: containerStyle, className, "data-lottie-loaded": isLoaded, children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        ref: containerRef,
        style: { width: "100%", height: "100%", display: error ? "none" : void 0 }
      }
    ),
    error && /* @__PURE__ */ jsxs("div", { role: "alert", style: { color: "red", border: "1px solid red", padding: "10px" }, children: [
      /* @__PURE__ */ jsx("strong", { children: "Lottie Error:" }),
      " ",
      error
    ] })
  ] });
};

export { Lottie, getLottieMetadata };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map