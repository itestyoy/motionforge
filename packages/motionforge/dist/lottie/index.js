'use client';import { useDelayRender } from '../chunk-ULT45LAD.js';
import { useCurrentFrame, useVideoConfig } from '../chunk-SKDHOWVF.js';
import { useRef, useState, useEffect, useMemo } from 'react';
import lottie from 'lottie-web';
import { jsxs, jsx } from 'react/jsx-runtime';

var jsonOfData = /* @__PURE__ */ new WeakMap();
var sourceKey = (src) => {
  if (typeof src === "string" && src !== "") return `url:${src}`;
  if (typeof src === "object" && src !== null) {
    let json = jsonOfData.get(src);
    if (json === void 0) {
      json = JSON.stringify(src);
      jsonOfData.set(src, json);
    }
    return `data:${json}`;
  }
  throw new Error(`Lottie: src must be a URL or animation data (an object), got ${JSON.stringify(src)}`);
};
var Lottie = ({
  src,
  frameStart = 0,
  frameEnd,
  playbackRate = 1,
  loop = false,
  width,
  height,
  style,
  className
}) => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const srcKey = sourceKey(src);
  const loadHandle = useRef(null);
  const currentFrame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useEffect(() => {
    setIsLoaded(false);
    setError(null);
    if (typeof window === "undefined" || !containerRef.current) return;
    let isCancelled = false;
    const handle = delayRender(`<Lottie> ${typeof src === "string" ? src : "animation data"}`);
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
    const params = {
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      rendererSettings: {
        progressiveLoad: false,
        hideOnTransparent: true
      }
    };
    if (typeof src === "string") {
      params.path = src;
    } else {
      params.animationData = src;
    }
    try {
      const anim = lottie.loadAnimation(params);
      animationRef.current = anim;
      const onLoaded = () => {
        if (!isCancelled) {
          setIsLoaded(true);
        }
      };
      anim.addEventListener("DOMLoaded", onLoaded);
      anim.addEventListener("data_ready", onLoaded);
      anim.addEventListener("data_failed", () => {
        if (!isCancelled) {
          fail(
            typeof src === "string" ? `failed to load animation data from ${src}` : "failed to load animation data"
          );
        }
      });
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
  }, [srcKey, delayRender, continueRender, cancelRender]);
  useEffect(() => {
    if (!animationRef.current || !isLoaded) return;
    const anim = animationRef.current;
    const totalLottieFrames = anim.totalFrames;
    const start = frameStart;
    const end = frameEnd ?? totalLottieFrames;
    const duration = end - start;
    if (duration <= 0) {
      cancelRender(
        new Error(`<Lottie> frameEnd (${end}) must be greater than frameStart (${start}); the animation has ${totalLottieFrames} frames`)
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
    const finalFrame = start + targetFrame;
    anim.goToAndStop(finalFrame, true);
    if (loadHandle.current !== null) {
      continueRender(loadHandle.current);
      loadHandle.current = null;
    }
  }, [currentFrame, fps, isLoaded, frameStart, frameEnd, playbackRate, loop, continueRender, cancelRender]);
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

export { Lottie };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map