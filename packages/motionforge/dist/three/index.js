'use client';import { SequenceContext } from '../chunk-SJDKZF4M.js';
import { useIsCollectingAudio } from '../chunk-ZIJRMQAM.js';
import { FrameContext, GateContext, HostContext, TimelineContext, useDelayRender, useCurrentFrame, useVideoConfig } from '../chunk-3P73E4TK.js';
import { useContext, useMemo, useRef, useLayoutEffect, useCallback, Suspense, Component, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import { Image, Text, useTexture } from '@react-three/drei';

var SEQUENCE_PROPS = [
  "from",
  "durationInFrames",
  "trimBefore",
  "playbackRate",
  "loop",
  "freeze",
  "hidden",
  "name",
  "showInTimeline",
  "premountFor",
  "postmountFor",
  "styleWhilePremounted",
  "styleWhilePostmounted"
];
var validateDimension = (value, name) => {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new TypeError(`<ThreeCanvas>: "${name}" must be a positive integer (px), got ${JSON.stringify(value)}`);
  }
};
var Scale = ({ width, height }) => {
  const set = useThree((state) => state.set);
  const threeSetSize = useThree((state) => state.setSize);
  const [initialSetSize] = useState(() => threeSetSize);
  useLayoutEffect(() => {
    initialSetSize(width, height);
    set({ setSize: () => null });
    return () => set({ setSize: initialSetSize });
  }, [initialSetSize, width, height, set]);
  return null;
};
var FrameRenderer = ({ onRendered }) => {
  const advance = useThree((state) => state.advance);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useLayoutEffect(() => {
    advance(frame / fps);
    onRendered(frame);
  });
  return null;
};
var SuspenseHold = () => {
  const { delayRender, continueRender } = useDelayRender();
  useLayoutEffect(() => {
    const handle = delayRender("<ThreeCanvas> waiting for suspended scene content (textures, models) to load");
    return () => continueRender(handle);
  }, [delayRender, continueRender]);
  return null;
};
var CanvasErrorBoundary = class extends Component {
  constructor() {
    super(...arguments);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    this.props.onError(error);
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
};
var ThreeCanvas = (props) => {
  const collecting = useIsCollectingAudio();
  for (const name of SEQUENCE_PROPS) {
    if (name in props) {
      throw new Error(
        `<ThreeCanvas> does not take the <Sequence> prop "${name}": put the canvas inside <Sequence layout="none" ${name}={...}> instead`
      );
    }
  }
  const { children, width, height, style, resize, frameloop, onCreated, ...rest } = props;
  validateDimension(width, "width");
  validateDimension(height, "height");
  if (frameloop !== void 0 && frameloop !== "never") {
    throw new Error(
      `<ThreeCanvas>: frameloop must be 'never' or left out, got ${JSON.stringify(frameloop)}: the canvas is drawn once per frame; animate with useCurrentFrame() instead of useFrame()`
    );
  }
  const frameValue = useContext(FrameContext);
  if (!frameValue) {
    throw new Error("<ThreeCanvas> must be used within a FrameProvider");
  }
  if (collecting) return null;
  const gateValue = useContext(GateContext);
  const sequenceValue = useContext(SequenceContext);
  const hostValue = useContext(HostContext);
  const outerTimeline = useContext(TimelineContext);
  const timelineValue = useMemo(
    () => outerTimeline && {
      ...outerTimeline,
      noAudio: outerTimeline.noAudio ?? {
        inside: "ThreeCanvas",
        why: "the canvas renders in a React root of its own, which collectAudioTracks() does not render. Put the sound outside the canvas."
      }
    },
    [outerTimeline]
  );
  const { frame } = frameValue;
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const created = useRef(false);
  const createdHold = useRef(null);
  useLayoutEffect(() => {
    if (created.current) return;
    const handle = delayRender("<ThreeCanvas> creating the WebGL renderer (the canvas needs a non-zero size)");
    createdHold.current = handle;
    return () => {
      createdHold.current = null;
      continueRender(handle);
    };
  }, [delayRender, continueRender]);
  const handleCreated = useCallback(
    (state) => {
      created.current = true;
      if (createdHold.current !== null) {
        continueRender(createdHold.current);
        createdHold.current = null;
      }
      onCreated?.(state);
    },
    [onCreated, continueRender]
  );
  const renderedFrame = useRef(null);
  const frameHold = useRef(null);
  const onRendered = useCallback(
    (renderedAt) => {
      renderedFrame.current = renderedAt;
      const hold = frameHold.current;
      if (hold && hold.frame === renderedAt) {
        frameHold.current = null;
        continueRender(hold.handle);
      }
    },
    [continueRender]
  );
  useLayoutEffect(() => {
    if (renderedFrame.current === frame) return;
    const hold = { frame, handle: delayRender(`<ThreeCanvas> drawing frame ${frame}`) };
    frameHold.current = hold;
    return () => {
      if (frameHold.current === hold) frameHold.current = null;
      continueRender(hold.handle);
    };
  }, [frame, delayRender, continueRender]);
  const onError = useCallback(
    (error) => cancelRender(new Error(`<ThreeCanvas>: ${error instanceof Error ? error.message : String(error)}`)),
    [cancelRender]
  );
  return /* @__PURE__ */ jsx(CanvasErrorBoundary, { onError, children: /* @__PURE__ */ jsx(
    Canvas,
    {
      style: { width, height, ...style },
      ...rest,
      resize: { offsetSize: true, ...resize },
      frameloop: "never",
      onCreated: handleCreated,
      children: /* @__PURE__ */ jsx(FrameContext.Provider, { value: frameValue, children: /* @__PURE__ */ jsx(GateContext.Provider, { value: gateValue, children: /* @__PURE__ */ jsx(HostContext.Provider, { value: hostValue, children: /* @__PURE__ */ jsx(TimelineContext.Provider, { value: timelineValue, children: /* @__PURE__ */ jsxs(SequenceContext.Provider, { value: sequenceValue, children: [
        /* @__PURE__ */ jsx(Scale, { width, height }),
        /* @__PURE__ */ jsxs(Suspense, { fallback: /* @__PURE__ */ jsx(SuspenseHold, {}), children: [
          children,
          /* @__PURE__ */ jsx(FrameRenderer, { onRendered })
        ] })
      ] }) }) }) }) })
    }
  ) });
};
var DeterministicScene = ({ images, captions, progress }) => {
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("ambientLight", { intensity: 0.5 }),
    /* @__PURE__ */ jsx("pointLight", { position: [10, 10, 10] }),
    images.map((url, i) => {
      const z = -i * 10 + progress * images.length * 10;
      const opacity = Math.max(0, 1 - Math.abs(z) / 15);
      if (opacity <= 0) return null;
      return /* @__PURE__ */ jsxs("group", { position: [Math.sin(i * 1.5) * 3, Math.cos(i * 0.8) * 2, z], children: [
        /* @__PURE__ */ jsx(
          Image,
          {
            url,
            scale: [6, 4],
            transparent: true,
            opacity
          }
        ),
        captions?.[i] && /* @__PURE__ */ jsx(
          Text,
          {
            position: [0, -2.5, 0.1],
            fontSize: 0.5,
            color: "white",
            anchorX: "center",
            anchorY: "middle",
            children: captions[i]
          }
        )
      ] }, i);
    }),
    /* @__PURE__ */ jsx("fog", { attach: "fog", args: ["#000", 5, 20] })
  ] });
};
var DepthGallery3D = ({
  images,
  captions,
  durationInFrames = 300,
  startFrame = 0,
  className = "",
  style
}) => {
  const frame = useCurrentFrame();
  const progress = Math.max(0, (frame - startFrame) / durationInFrames);
  return /* @__PURE__ */ jsx("div", { className, style: { width: "100%", height: "100%", backgroundColor: "#000", ...style }, children: /* @__PURE__ */ jsx(Canvas, { camera: { position: [0, 0, 5], fov: 75 }, children: /* @__PURE__ */ jsx(DeterministicScene, { images, captions, progress }) }) });
};
var vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
var fragmentShader = `
  uniform sampler2D uTexture;
  uniform float uProgress;
  varying vec2 vUv;

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    float n = noise(vUv * 10.0);
    float threshold = uProgress * 1.2;
    float alpha = smoothstep(threshold - 0.1, threshold, n);

    vec4 color = texture2D(uTexture, vUv);
    gl_FragColor = vec4(color.rgb, color.a * (1.0 - alpha));
  }
`;
var RevealPlane = ({ src, progress }) => {
  const texture = useTexture(src);
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uProgress: { value: progress }
  }), [texture]);
  uniforms.uProgress.value = progress;
  return /* @__PURE__ */ jsxs("mesh", { children: [
    /* @__PURE__ */ jsx("planeGeometry", { args: [16, 9] }),
    /* @__PURE__ */ jsx(
      "shaderMaterial",
      {
        transparent: true,
        vertexShader,
        fragmentShader,
        uniforms
      }
    )
  ] });
};
var ShaderImageReveal = ({
  src,
  durationInFrames = 60,
  startFrame = 0,
  className = "",
  style
}) => {
  const frame = useCurrentFrame();
  const progress = Math.max(0, Math.min(1, (frame - startFrame) / durationInFrames));
  return /* @__PURE__ */ jsx("div", { className, style: { width: "100%", height: "100%", ...style }, children: /* @__PURE__ */ jsx(Canvas, { orthographic: true, camera: { zoom: 100 }, children: /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(RevealPlane, { src, progress }) }) }) });
};
var vertexShader2 = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
var fragmentShader2 = `
  uniform sampler2D uTexture;
  uniform float uIntensity;
  varying vec2 vUv;

  float luma(vec3 color) {
    return dot(color, vec3(0.299, 0.587, 0.114));
  }

  void main() {
    vec4 texColor = texture2D(uTexture, vUv);
    float brightness = luma(texColor.rgb);

    // Bayer Matrix 4x4
    float bayer[16];
    bayer[0] = 0.0/16.0; bayer[1] = 8.0/16.0; bayer[2] = 2.0/16.0; bayer[3] = 10.0/16.0;
    bayer[4] = 12.0/16.0; bayer[5] = 4.0/16.0; bayer[6] = 14.0/16.0; bayer[7] = 6.0/16.0;
    bayer[8] = 3.0/16.0; bayer[9] = 11.0/16.0; bayer[10] = 1.0/16.0; bayer[11] = 9.0/16.0;
    bayer[12] = 15.0/16.0; bayer[13] = 7.0/16.0; bayer[14] = 13.0/16.0; bayer[15] = 5.0/16.0;

    int x = int(mod(gl_FragCoord.x, 4.0));
    int y = int(mod(gl_FragCoord.y, 4.0));
    float threshold = bayer[y * 4 + x];

    float final = brightness > (threshold * uIntensity) ? 1.0 : 0.0;

    gl_FragColor = vec4(vec3(final), texColor.a);
  }
`;
var DitheringPlane = ({ src, intensity }) => {
  const texture = useTexture(src);
  const uniforms = useMemo(() => ({
    uTexture: { value: texture },
    uIntensity: { value: intensity }
  }), [texture, intensity]);
  uniforms.uIntensity.value = intensity;
  return /* @__PURE__ */ jsxs("mesh", { children: [
    /* @__PURE__ */ jsx("planeGeometry", { args: [16, 9] }),
    /* @__PURE__ */ jsx(
      "shaderMaterial",
      {
        vertexShader: vertexShader2,
        fragmentShader: fragmentShader2,
        uniforms
      }
    )
  ] });
};
var DitheringEffect = ({
  src,
  intensity = 1,
  className = "",
  style
}) => {
  return /* @__PURE__ */ jsx("div", { className, style: { width: "100%", height: "100%", ...style }, children: /* @__PURE__ */ jsx(Canvas, { orthographic: true, camera: { zoom: 100 }, children: /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx(DitheringPlane, { src, intensity }) }) }) });
};

export { DepthGallery3D, DitheringEffect, ShaderImageReveal, ThreeCanvas };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map