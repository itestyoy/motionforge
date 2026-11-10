# MotionForge

<div align="center">
  <img src="https://img.shields.io/npm/v/motionforge?color=10b981&label=npm&style=for-the-badge" alt="npm version" />
  <img src="https://img.shields.io/npm/dt/motionforge?color=10b981&style=for-the-badge" alt="downloads" />
  <img src="https://img.shields.io/github/license/codedbytahir/motionforge?color=10b981&style=for-the-badge" alt="license" />
</div>

<div align="center">
  <h3>Headless React SDK for frame-based motion graphics</h3>
  <p>A scene is a pure function of the frame. Your app renders it at any frame and owns playback, seeking and export.</p>
</div>

---

## ✨ Features

- 🎬 **Frame-Based Rendering** - Precise control over every frame
- 🎨 **70+ Effect Components** - Fade, Scale, Slide, 3D transforms, particles, and more
- 🌊 **Spring Physics** - Natural, physics-based animations
- 📊 **Interpolation System** - Smooth transitions with 20+ easing functions
- 🧩 **Headless** - No player, no UI, no clock: the host app passes the frame in
- 🎯 **TypeScript First** - Full type safety out of the box

## 📦 Installation

```bash
# npm
npm install motionforge

# yarn
yarn add motionforge

# pnpm
pnpm add motionforge

# bun
bun add motionforge
```

## 🚀 Quick Start

```tsx
import { 
  AbsoluteFill, 
  useCurrentFrame, 
  interpolate,
  spring,
  FrameProvider,
} from 'motionforge';

// Create a video composition
const MyVideo = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Spring animation
  const scale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 100 }
  });
  
  // Interpolation
  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp'
  });
  
  return (
    <AbsoluteFill 
      style={{ 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: '#0a0a0a'
      }}
    >
      <h1 style={{ 
        opacity, 
        transform: `scale(${scale})`,
        fontSize: 72,
        color: '#10b981'
      }}>
        Hello MotionForge!
      </h1>
    </AbsoluteFill>
  );
};

// Render it at any frame. Your app owns time: a player advances `frame`,
// a scrubber sets it, an exporter steps through 0..durationInFrames-1.
// `frame` must be an integer in that range; anything else throws.
const Preview = ({ frame }: { frame: number }) => (
  <FrameProvider frame={frame} fps={30} durationInFrames={150} width={1920} height={1080}>
    <MyVideo />
  </FrameProvider>
);
```

## ⏳ Render readiness

A frame is ready when everything it shows has loaded: images decoded, the video seeked to the frame, fonts loaded, data fetched. Scenes hold the frame with `delayRender()`; the host waits for it before it captures or shows the frame.

**Host:** create one gate per `FrameProvider` and await it after setting the frame.

```tsx
import { FrameProvider, createRenderGate } from 'motionforge';

const gate = createRenderGate();

// render <FrameProvider gate={gate} frame={n} ...><Scene /></FrameProvider>, then:
await gate.waitUntilReady({ frame: n, timeoutMs: 10000 });
// capture frame n
```

- `waitUntilReady({ frame?, timeoutMs? })` resolves once `FrameProvider` has committed `frame` (React rendered it and ran its effects) and no handle of a visible component is pending. Without `frame` it waits on the frame committed last, so call it only after React has rendered. `timeoutMs` defaults to 30000 (`Infinity` waits forever); on timeout it rejects with an error listing the pending labels.
- `cancelRender(error)` rejects every current and later `waitUntilReady()` with that error; `gate.error` holds it. A cancelled gate stays cancelled: create a new gate (and remount) to try again.
- `gate.getPending()` lists the handles holding the frame: `{ handle, label }`.
- A gate serves one `FrameProvider` at a time. A `FrameProvider` without `gate` inside another one uses the outer gate.
- **Without a gate** the outermost `FrameProvider` keeps a private one nobody waits on: `delayRender()` and `continueRender()` work and change nothing visible, and a `cancelRender()` error is thrown during render to the nearest error boundary, so it is never lost.

**Scene:** `useDelayRender()` returns `{ delayRender, continueRender, cancelRender }`.

```tsx
import { useDelayRender } from 'motionforge';

const Chart = () => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [data, setData] = useState(null);
  useEffect(() => {
    const handle = delayRender('chart data');
    fetchData().then(setData, cancelRender).finally(() => continueRender(handle));
    return () => continueRender(handle);
  }, []);
  // ...
};
```

- Call `delayRender(label?)` from an effect or a callback, never during render (it throws there: React may render twice and that handle would never be continued). Handles are numbers counted per gate.
- Handles still pending when the component unmounts are continued automatically, so StrictMode's double effects and unmounting do not leak them. Continuing a handle twice is allowed.
- Built in: `Img` holds the frame until the image is loaded and decoded (`decode()`), `Video` until it has data and has seeked to the frame (`seeked`), `Lottie` (from `motionforge/lottie`) until its data is ready and the frame is set. Their load errors go to `cancelRender()`.

**Preloading:** `preloadImage(src)`, `preloadVideo(src)`, `preloadAudio(src)` and `preloadFont(family, { weight?, style?, source? })` (CSS Font Loading API; without `source` the family must be declared with `@font-face`) return promises that reject with an error naming the asset. `usePreloadAssets(assets)` holds the frame until all assets are loaded, returns whether they are, and reports a failure through `cancelRender()`:

```tsx
const ready = usePreloadAssets([
  { type: 'image', src: '/hero.png' },
  { type: 'font', family: 'Inter', weight: 700 },
]);
```

**Premounting:** `<Sequence from={60} premountFor={30}>` mounts its children 30 frames early, invisible (`opacity: 0`, `pointer-events: none`) and at their frame 0, so their assets load before the sequence starts. While premounted, their `delayRender()` handles do not hold the frame; from the start on, the ones still pending do. It needs `layout="absolute-fill"` (the default).

## 📦 Entry points

| Import | What it contains | Extra dependencies |
|--------|------------------|--------------------|
| `motionforge` | Core: `FrameProvider`, frame hooks, sequences, effects, utilities | — |
| `motionforge/three` | `DepthGallery3D`, `ShaderImageReveal`, `DitheringEffect` | `three`, `@react-three/fiber`, `@react-three/drei` |
| `motionforge/lottie` | `Lottie` | `lottie-web` (installed with the package) |
All entries share one frame context, so components from `motionforge/three` and `motionforge/lottie` read the frame of the `FrameProvider` from `motionforge`.

## 🎨 Available Components

### Layout Components

| Component | Description |
|-----------|-------------|
| `AbsoluteFill` | Full-screen container with absolute positioning |
| `Sequence` | Time-based rendering for scene management; inside it `useCurrentFrame()` counts from the sequence start; `premountFor` mounts it early, invisibly |
| `Loop` | Loop content infinitely or for a set number of times |
| `Freeze` | Pause content at a specific frame |
| `Retiming` | Variable speed playback; with a function rate the content frame is `floor(Σ rate(i), i < frame)` |
| `Reverse` | Play content backwards |
| `Series` | Sequential scene management |

### Effect Components

```tsx
import { 
  Fade, Scale, Slide, Rotate,
  Typewriter, Counter, NeonGlow,
  Rotate3D, Cube3D, Perspective3D,
  ParticleSystem, Confetti,
  LetterByLetter, WaveText, RainbowText
} from 'motionforge';

// Example: 3D rotating cube
<Cube3D size={100} durationInFrames={120} />

// Example: Letter by letter animation
<LetterByLetter 
  text="Hello World" 
  animation="scale" 
  delayPerLetter={3} 
/>

// Example: Particle system
<ParticleSystem 
  count={100} 
  direction="up" 
  colors={['#10b981', '#34d399']} 
/>
```

### Animation Functions

```tsx
import { spring, interpolate, Easing } from 'motionforge';

// Spring physics
const value = spring({
  frame: 30,
  fps: 30,
  config: { damping: 10, stiffness: 100, mass: 1 }
});

// Interpolation with easing
const progress = interpolate(frame, [0, 60], [0, 100], {
  easing: Easing.easeOutCubic,
  extrapolateLeft: 'clamp',
  extrapolateRight: 'clamp'
});

// Available easing functions
Easing.linear
Easing.easeInQuad, Easing.easeOutQuad, Easing.easeInOutQuad
Easing.easeInCubic, Easing.easeOutCubic, Easing.easeInOutCubic
Easing.easeInElastic, Easing.easeOutElastic
Easing.easeInBounce, Easing.easeOutBounce
// ... and more!
```

## 🎯 Performance Optimization

```tsx
import { 
  useMemoizedFrame,
  useOptimizedSpring,
  usePrecomputeFrames,
} from 'motionforge';

// Memoize expensive computations
const value = useMemoizedFrame(() => expensiveCalculation(), [deps]);

// Pre-compute upcoming frames
const frameCache = usePrecomputeFrames(
  (frame) => computeValue(frame),
  10 // lookahead
);

// Cached spring animation
const scale = useOptimizedSpring({ damping: 10 }, 0, 1);
```

## 📚 API Reference

### Hooks

| Hook | Description |
|------|-------------|
| `useCurrentFrame()` | Returns the current frame number |
| `useVideoConfig()` | Returns video configuration `{ fps, width, height, durationInFrames }`; inside a `Sequence`, `Loop` or `Series` `durationInFrames` is the sequence's own length |
| `useLoopInfo()` | Inside a `Loop`: `{ loopedFrame, currentLoop, durationInFrames }` |
| `useSpring(config)` | Creates spring-based animations |
| `useInterpolate(inputRange, outputRange, options)` | Interpolates values with easing |

### Utility Functions

| Function | Description |
|----------|-------------|
| `spring({ frame, fps, config })` | Calculate spring animation value; with `durationInFrames` the motion is stretched to settle at that frame and is exactly `to` from then on |
| `measureSpring({ fps, config, threshold })` | Frames until a spring stays within `threshold` of its target |
| `interpolate(input, inputRange, outputRange, options)` | Map values between ranges; `inputRange` must be ascending |
| `interpolateColors(input, inputRange, outputRange)` | Smooth color transitions between `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` / `rgba()` (comma or `rgb(r g b / a)` syntax) |
| `random(seed)` | Deterministic random number generator |
| `noise2D(x, y)` | Smooth deterministic 2D value noise in [0, 1) |

## ✏️ SVG paths

Pure functions on a path's `d` string: no DOM, so they work during SSR and in Node, and give the same numbers everywhere. They read `M L H V C S Q T A Z`, absolute and relative.

| Function | Returns |
|----------|---------|
| `getLength(d)` | Length of the path (moves do not count), like `getTotalLength()` |
| `getPointAtLength(d, length)` | `{ x, y }` at `length` along the path; `length` is clamped to `[0, getLength(d)]` |
| `getTangentAtLength(d, length)` | Unit vector `{ x, y }` of the direction of travel; throws for a path without length |
| `evolvePath(progress, d)` | `{ strokeDasharray, strokeDashoffset }` that draw `progress` (0–1) of the path |
| `pathFromPoints(points, { cornerRadius?, closed? })` | A polyline (or polygon) through the points, corners rounded with circular arcs; a radius that does not fit in half of each edge shrinks to fit |

```tsx
const d = pathFromPoints([{ x: 80, y: 400 }, { x: 300, y: 260 }, { x: 520, y: 400 }], { cornerRadius: 40 });
const length = getLength(d);
const progress = interpolate(frame, [0, 60], [0, 1]);
const tip = getPointAtLength(d, progress * length);
const { x, y } = getTangentAtLength(d, progress * length);

<svg>
  <path d={d} stroke="#fff" strokeWidth={8} fill="none" {...evolvePath(progress, d)} />
</svg>
// a finger tracing the stroke: positioned at the tip, turned along the path
<img src="/finger.png" style={{ position: 'absolute', left: tip.x, top: tip.y, transform: `rotate(${Math.atan2(y, x)}rad)` }} />
```

Wrong input throws: a `d` that does not parse (the error names the position), a non-finite length or progress, fewer than two points.

## 🎭 Using Lottie in MotionForge

MotionForge provides first-class, production-grade Lottie support. Animations are synchronized with the frame system for deterministic, frame-perfect rendering.

### Basic Usage

```tsx
import { AbsoluteFill } from 'motionforge';
import { Lottie } from 'motionforge/lottie';

const MyComposition = () => {
  return (
    <AbsoluteFill>
      <Lottie
        src="https://assets.lottiefiles.com/packages/lf20_u4j3X6.json"
        width={400}
        height={400}
      />
    </AbsoluteFill>
  );
};
```

### Advanced Configuration

The `Lottie` component supports several props to control playback and appearance:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string \| object` | - | URL to JSON or imported JSON object |
| `frameStart` | `number` | `0` | Lottie frame (on the animation's own timeline) to start from |
| `frameEnd` | `number` | - | Lottie frame to stop at (default: its last frame) |
| `playbackRate` | `number` | `1` | Speed of the animation; composition frame `f` shows the Lottie at time `f / fps × playbackRate` |
| `loop` | `boolean` | `false` | Whether to loop the animation |
| `width` | `number \| string` | `100%` | Width of the container |
| `height` | `number \| string` | `100%` | Height of the container |

### Syncing with Sequences

Inside a `Sequence`, `useCurrentFrame()` (and so `Lottie`) counts from the sequence start.

```tsx
<Sequence from={30} durationInFrames={120}>
  <Lottie
    src={myAnimationData}
    playbackRate={1.5}
    loop
  />
</Sequence>
```

### Performance Tips

1. **Pre-loading**: For imported JSON objects, Lottie initializes instantly. For URLs, it fetches the data once and memoizes the instance.
2. **SSR Support**: The component handles server-side rendering gracefully by only initializing the Lottie engine on the client.
3. **Memoization**: Internal animation instances are memoized and properly cleaned up to prevent memory leaks.

## 📖 Documentation

- [Getting Started](https://motionforge.dev/docs/getting-started)
- [API Reference](https://motionforge.dev/docs/api)
- [Examples](https://motionforge.dev/examples)
- [Guides](https://motionforge.dev/guides)

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

## 🙏 Acknowledgments

Inspired by [Remotion](https://remotion.dev) - The original React video framework.

---

<div align="center">
  Made with ❤️ by the MotionForge Team
</div>
