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
  useVideoConfig,
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
  
  // Interpolation (extends past the range unless clamped, as in Remotion)
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
- `Composition` takes `gate` too and passes it to its `FrameProvider`. A gate serves one `FrameProvider` at a time. A `FrameProvider` without `gate` inside another one uses the outer gate.
- **Without a gate** the outermost `FrameProvider` keeps a private one nobody waits on: `delayRender()` and `continueRender()` work and change nothing visible, and a `cancelRender()` error is thrown during render to the nearest error boundary, so it is never lost.

**Scene:** `useDelayRender()` returns `{ delayRender, continueRender, cancelRender }`, scoped to the `FrameProvider` the component is in.

```tsx
import { useDelayRender } from 'motionforge';

const Chart = () => {
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [data, setData] = useState(null);
  const handle = useRef<number | null>(null);
  useEffect(() => {
    handle.current = delayRender('chart data');
    fetchData().then(setData, cancelRender);
    return () => continueRender(handle.current!);
  }, []);
  // Release once the data is on screen: setData renders later, not at once.
  useEffect(() => {
    if (data !== null) continueRender(handle.current!);
  }, [data]);
  // ...
};
```

- Call `delayRender(label?, { timeoutInMilliseconds? })` from an effect or a callback, never during render. Handles are numbers counted per gate. With `timeoutInMilliseconds`, a handle still pending after that time cancels the render (`waitUntilReady()` rejects with `A delayRender() "label" was called but not continued after N ms`); without it only the host's `waitUntilReady({ timeoutMs })` applies. `retries` is not supported (the host decides whether to render a frame again).
- **Differs from Remotion:** Remotion's `const [handle] = useState(() => delayRender())` and the global `delayRender()` / `continueRender()` / `cancelRender()` functions are not available. A handle created during render cannot be made safe: React may run a component and its `useState` initializer more than once without keeping the result (StrictMode in development, interrupted concurrent renders), and the discarded handle would hold the frame forever. Remotion avoids this only because it ignores `delayRender()` outside of rendering. `delayRender()` during render throws an error that shows the effect-based code to write instead (above). Global functions cannot know which `FrameProvider` (gate) they belong to when several are mounted.
- `cancelRender(error)` reports the error through the gate and returns; unlike Remotion's, it does not throw.
- Continue a handle once React has rendered what it waited for (in an effect), not in the callback that sets the state: the state update renders after the callback, and the host would capture the frame from before.
- Handles still pending when the component unmounts are continued automatically, so StrictMode's double effects and unmounting do not leak them. Continuing a handle twice is allowed.
- Built in: `Img` holds the frame until the image is loaded and decoded (`decode()`), `Video` until it has data and has seeked to the frame (`seeked`), `Lottie` (from `motionforge/lottie`) until its data is ready and the frame is set, `AnimatedImage` and `Gif` until the image is decoded and the frame drawn, `ThreeCanvas` until the renderer exists, suspended content has loaded and the frame is drawn, `useAudioData()` / `useWindowedAudioData()` until the audio is decoded. Their load errors go to `cancelRender()`.

**Fonts:** `loadFont({ family, url, format?, weight?, style?, display?, unicodeRange?, stretch?, variant?, featureSettings?, ascentOverride?, descentOverride?, lineGapOverride? })` loads a font file into `document.fonts`, like `@remotion/fonts`. Descriptors are CSS strings (`weight: '700'`). Call it anywhere, e.g. at the top of a module; the same options load once. Fonts belong to the document, so until the font is loaded **every** gate on the page waits for it (it is listed in `getPending()` with a negative handle), and if it fails every gate fails with the error (the returned promise rejects too). Without a DOM (server rendering) the promise rejects.

```tsx
loadFont({ family: 'Bangers', url: staticFile('bangers.woff2') });
```

**Preloading:** `usePreloadAssets(assets)` holds the frame until all assets are loaded, returns whether they are, and reports a failure through `cancelRender()`. A font asset waits for every face declared for the family (`@font-face` in a stylesheet, e.g. Google Fonts, or `loadFont()`), narrowed by `weight` / `style` if given. Families split by `unicode-range` (Google Fonts, @fontsource: latin, cyrillic, greek, ...) load all their subsets, so Cyrillic text is ready too; no declared face is an error.

```tsx
const ready = usePreloadAssets([
  { type: 'image', src: '/hero.png' },
  { type: 'font', family: 'Inter', weight: 700 },
]);
```

**Prefetching:** `prefetch(src, { method?: 'blob-url' | 'base64', contentType?, credentials?, onProgress? })` downloads an asset into memory, like Remotion's, and returns `{ free, waitUntilDone }`. Once it is done, `Img`, `Video` and `Audio` with the same `src` (a `#fragment` is kept) use the in-memory copy, so seeking never waits for the network. It does not hold the gate: await `waitUntilDone()` (it resolves with the `blob:` / `data:` URL and rejects on an HTTP error or after `free()`). `free()` aborts the download or releases the memory.

There are no `preloadImage` / `preloadVideo` / `preloadAudio` / `preloadFont`: `@remotion/preload`'s functions only add a browser hint (`<link rel="preload">`) and return a cleanup function, and MotionForge's old ones returned promises; under one name either meaning would mislead. Use `prefetch()`, `usePreloadAssets()` or `loadFont()`.

**Premounting:** `<Sequence from={60} premountFor={30}>` mounts its children 30 frames early, invisible (`opacity: 0`, `pointer-events: none`, then `styleWhilePremounted`) and at their frame 0, so their assets load before the sequence starts. While premounted, their `delayRender()` handles do not hold the frame; from the start on, the ones still pending do. `postmountFor` keeps them mounted after the end, invisible (then `styleWhilePostmounted`) and at their last frame; it needs `durationInFrames`. Both need `layout="absolute-fill"` (the default).

## 📦 Entry points

| Import | What it contains | Extra dependencies |
|--------|------------------|--------------------|
| `motionforge` | Core: `FrameProvider`, frame hooks, sequences, effects, `AnimatedImage`, utilities | — |
| `motionforge/three` | `ThreeCanvas`, `DepthGallery3D`, `ShaderImageReveal`, `DitheringEffect` | `three`, `@react-three/fiber` (and `@react-three/drei` for the ready-made scenes) |
| `motionforge/lottie` | `Lottie`, `getLottieMetadata` | `lottie-web` (installed with the package) |
| `motionforge/motion-blur` | `Trail`, `CameraMotionBlur` | — |
| `motionforge/layout-utils` | `measureText`, `fitText`, `fitTextOnNLines`, `fillTextBox` | — |
| `motionforge/gif` | `Gif`, `getGifDurationInSeconds` | `omggif` (installed with the package) |
| `motionforge/media-utils` | `getVideoMetadata`, `getImageDimensions`, `getAudioDurationInSeconds`, `getAudioData`, `useAudioData`, `useWindowedAudioData`, `visualizeAudio`, `visualizeAudioWaveform`, `createSmoothSvgPath` | — |
| `motionforge/transitions` | `TransitionSeries`, `linearTiming`, `springTiming`, `useTransitionProgress`, `pushCut` | — |
| `motionforge/transitions/fade`, `/slide`, `/wipe`, `/flip`, `/clock-wipe`, `/iris`, `/cube`, `/none`, `/push-cut` | One presentation each: `fade`, `slide`, `wipe`, `flip`, `clockWipe`, `iris`, `cube`, `none`, `pushCut` | — |
| `motionforge/shapes` | `Rect`, `Circle`, `Ellipse`, `Triangle`, `Star`, `Polygon`, `Pie`, `Heart`, `Arrow`, `Spark`, `Callout` and their `make*()` functions | — |

They follow Remotion's packages: `@remotion/three`, `@remotion/motion-blur`, `@remotion/layout-utils`, `@remotion/gif`, `@remotion/media-utils`, `@remotion/transitions` (with the same per-presentation entries: `@remotion/transitions/fade` is `motionforge/transitions/fade`), `@remotion/shapes`. The functions of `@remotion/paths` are in the main entry. All entries share one frame context and render gate, so their components read the frame of the `FrameProvider` from `motionforge`.

## 🎨 Available Components

### Layout Components

| Component | Description |
|-----------|-------------|
| `AbsoluteFill` | Full-screen container with absolute positioning |
| `Sequence` | Time-based rendering for scene management; inside it `useCurrentFrame()` counts from the sequence start. Props as in Remotion: `from` (default 0), `durationInFrames`, `name`, `width` / `height` (what the children see in `useVideoConfig()`, and the wrapper size), `layout` (`'absolute-fill'` default, or `'none'`: no element, so no `style` / `className` / mounting props), `style`, `className`, `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted`; plus `offset` |
| `Loop` | Repeats its children every `durationInFrames` (a positive integer), `times` times (a non-negative integer, default `Infinity`). Each iteration is a `Sequence`: `layout`, `style`, `className` and `name` as there. `Loop.useLoop()` returns `{ iteration, durationInFrames }` inside a Loop and `null` outside |
| `Freeze` | `<Freeze frame={n} active?>`: the children see frame `n` while `active` (a boolean or `(frame) => boolean`, default `true`), the current frame otherwise. `n` may be a sub-frame (e.g. `12.5`), as in Remotion |
| `Retiming` | Variable speed playback; with a function rate the content frame is `floor(Σ rate(i), i < frame)` |
| `Reverse` | Play content backwards; inside it `useVideoConfig().durationInFrames` is its `durationInFrames` |
| `Series` | Scenes one after another: `<Series.Sequence durationInFrames offset? name? ...>` children only; the layout props of `Sequence` (`layout`, `style`, `className`, `premountFor`, `postmountFor`, ...) pass through |

### Series

```tsx
<Series>
  <Series.Sequence durationInFrames={45}><Hook /></Series.Sequence>
  {/* starts 10 frames before the hook ends: both render during the overlap */}
  <Series.Sequence durationInFrames={60} offset={-10} premountFor={15}><Gameplay /></Series.Sequence>
  <Series.Sequence durationInFrames={30}><EndCard /></Series.Sequence>
</Series>
```

Each `Series.Sequence` starts where the previous one ends, shifted by its `offset` (negative: overlap, positive: gap); the shift carries over to the sequences after it. Overlapping sequences render at the same time, later ones on top. Inside each, `useCurrentFrame()` counts from its start and `useVideoConfig().durationInFrames` is its own `durationInFrames`. `durationInFrames` must be a positive integer and `offset` an integer; any child other than `Series.Sequence` (except `null`, `false` and fragments around them) throws.

### Transitions

`motionforge/transitions` is `@remotion/transitions`: `<TransitionSeries>` is a `<Series>` whose scenes can overlap through a transition.

```tsx
import { useVideoConfig } from 'motionforge';
import { TransitionSeries, linearTiming, springTiming } from 'motionforge/transitions';
import { fade } from 'motionforge/transitions/fade';
import { wipe } from 'motionforge/transitions/wipe';
import { clockWipe } from 'motionforge/transitions/clock-wipe';

const Ad = () => {
  const { width, height } = useVideoConfig();
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}><Hook /></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={springTiming({ config: { damping: 20 } })} presentation={fade()} />
      <TransitionSeries.Sequence durationInFrames={90} premountFor={30}><Gameplay /></TransitionSeries.Sequence>
      <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 20 })} presentation={clockWipe({ width, height })} />
      <TransitionSeries.Sequence durationInFrames={45}><EndCard /></TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
```

- **`<TransitionSeries>`** is itself a `Sequence` (`from`, `durationInFrames`, `name`, `style`, `className`, `premountFor`, …); `layout="none"` throws: the scenes must be absolutely positioned to overlap.
- **`<TransitionSeries.Sequence durationInFrames offset? name? ...>`**: a scene (a positive integer length). It takes the layout props of `Sequence` (`style`, `className`, `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted`). Remotion's `playbackRate`, `trimBefore`, `freeze`, `loop`, `hidden` and `showInTimeline` throw with what to use instead.
- **`<TransitionSeries.Transition timing presentation?>`** between two scenes: both render while it runs, and the series gets shorter by its length (`40 + 60 - 30 = 70`). `presentation` defaults to `slide()`. A transition first or last animates the entrance of the first scene or the exit of the last.
- **`<TransitionSeries.Overlay durationInFrames offset?>`** between two scenes: its children render on top of the cut, centered on it (`offset` shifts it, positive later); the scenes keep their lengths. It also takes `premountFor`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted`.
- Inside each scene `useCurrentFrame()` counts from the scene's start and `useVideoConfig().durationInFrames` is its own length, also while it overlaps its neighbour. `useTransitionProgress()` returns `{ entering, exiting, isInTransitionSeries }`: how far the transitions into (0 → 1, then 1) and out of (0, then 0 → 1) the scene are, to animate its contents along; outside a series `{ entering: 1, exiting: 0, isInTransitionSeries: false }`.
- The rules of Remotion throw with a clear error: a transition longer than the scene before or after it, two transitions or overlays next to each other, a transition or an overlay without a scene next to it, an overlay that starts before frame 0 or reaches past the scene before or after it.
- Premounting, postmounting and the render gate work as in `Sequence`: a premounted scene is mounted at its frame 0 and its `delayRender()` handles hold the frame only once it shows. Each scene stays mounted through its transitions.

**Timings**

| Timing | Length | Progress |
|--------|--------|----------|
| `linearTiming({ durationInFrames, easing? })` | `durationInFrames` (a positive integer) | 0 → 1 linearly or along `easing`, clamped |
| `springTiming({ config?, durationInFrames?, durationRestThreshold?, reverse? })` | `durationInFrames`, or until the spring settles (`measureSpring({ config, threshold: durationRestThreshold })`) | `spring()` from 0 to 1; `reverse` plays the spring backwards in time |

A custom timing is `{ getDurationInFrames({ fps }) → non-negative integer, getProgress({ frame, fps }) → number }`.

**Presentations** (each from its own entry, options as in Remotion)

| Presentation | Options | Effect |
|--------------|---------|--------|
| `fade()` | `enterStyle`, `exitStyle`, `shouldFadeOutExitingScene` (default `false`) | The entering scene fades in over the exiting one |
| `slide()` | `direction`: `'from-left'` (default), `'from-right'`, `'from-top'`, `'from-bottom'`; `enterStyle`, `exitStyle` | The entering scene pushes the exiting one out |
| `wipe()` | `direction`: `'from-left'` (default), `'from-top-left'`, `'from-top'`, `'from-top-right'`, `'from-right'`, `'from-bottom-right'`, `'from-bottom'`, `'from-bottom-left'`; `outerEnterStyle`, `outerExitStyle`, `innerEnterStyle`, `innerExitStyle` | The entering scene is revealed by a moving edge |
| `flip()` | `direction` (as `slide`), `perspective` (default 1000); outer/inner enter/exit styles | The exiting scene flips over, the entering one is on its back |
| `clockWipe({ width, height })` | `width`, `height` of the scene (required); outer/inner enter/exit styles | A clock hand sweeps the entering scene in |
| `iris({ width, height })` | `width`, `height` (required); outer/inner enter/exit styles | A circle grows from the center |
| `cube({ direction })` | `direction` (required, as `slide`), `perspective` (default 1000) | Both scenes turn as faces of a cube |
| `none()` | `enterStyle`, `exitStyle` | No effect: animate the scenes with `useTransitionProgress()` |
| `pushCut()` | `cutProgress` (5/11), `outgoingScale` (1.04), `incomingStartScale` (1.04), `incomingEndScale` (1.07), `transformOrigin`, `flashColor` (`'#f5f2ed'`), `flashOpacity` (0.2), `flashFrames` (2); outer/inner enter/exit styles | A hard cut with a short punch-in and a flash at the cut |

They render the same markup as Remotion's. A custom presentation is `{ component, props }`: the component gets `presentationProgress`, `presentationDirection` (`'entering'` / `'exiting'`), `passedProps`, `presentationDurationInFrames`, `bothEnteringAndExiting` and the scene as `children`. Remotion's canvas presentations (`blurSlide`, `crossZoom`, `dissolve`, `ripple`, … and `makeHtmlInCanvasPresentation`) are not available: they draw the scenes through the experimental HTML-in-canvas API. Wrong options throw.

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

### Particles

`<Particles>` is a particle emitter, and `getParticles(options & { frame, fps })` the pure function behind it: build bursts, sparkles, confetti rains and trails from the same parts. Time is in **seconds** and motion in **px per second**, so an emitter looks the same at any fps; `startFrame` is the frame of the first birth. All randomness comes from `random(seed, …)`.

```tsx
// burst
<Particles seed="win" origin={{ x: 540, y: 900 }} count={80} lifetime={[0.6, 1.2]}
  speed={[400, 1200]} drag={2} gravity={900} size={[10, 18]} shape="star"
  colors={['#ffd700', '#ff4d6d', '#4dd2ff']} rotation={[0, 360]} spin={[-360, 360]} />

// confetti rain: born along the top edge over 3 s
<Particles seed="rain" origin={{ x: 540, y: -20 }} area={{ width: 1080, height: 0 }} count={150}
  emitDuration={3} lifetime={4} speed={[50, 150]} angle={90} spread={40} gravity={300} drag={0.8}
  size={[8, 14]} shape="square" rotation={[0, 360]} spin={[-540, 540]} fadeOut={false} />

// trail: the origin follows a moving object; each particle is born where it was
<Particles seed="trail" origin={(f) => getPointAtLength(d, Math.min(f / 60, 1) * length)!} count={120}
  emitDuration={2} lifetime={0.5} speed={[0, 40]} size={[4, 10]} />
```

| Option | Unit / default | Meaning |
|--------|----------------|---------|
| `seed` | required | Same seed, same particles |
| `origin` | px, required | `{ x, y }`, or a function of the birth frame (moving emitters) |
| `area` | px, `0 × 0` | `{ width, height }` around the origin to be born in |
| `startFrame` | frames, `0` | Frame of the first birth |
| `count` | required | Number of particles |
| `emitDuration` | s, `0` | Births spread evenly over this time (`0`: a burst) |
| `lifetime` | s, required | Life of each particle |
| `speed` | px/s, required | Initial speed |
| `angle`, `spread` | deg, `-90`, `360` | Emission direction (0 right, 90 down) and cone width |
| `gravity` | px/s², `0` | Downward acceleration |
| `drag` | 1/s, `0` | Velocity decays as e^(−drag·t) (towards `gravity / drag`) |
| `size` | px, required | Width and height |
| `colors` | `['#ffffff']` | One per particle |
| `rotation`, `spin` | deg, deg/s, `0` | Initial rotation and its speed |
| `fadeOut` | `true` | Opacity from 1 at birth to 0 at the end of life |
| `shape` | `'circle'` | `'circle'`, `'square'`, `'triangle'`, `'star'` (component only) |
| `render` | — | `(particle) => ReactNode` instead of the default element (component only) |

Number options marked as ranges (`lifetime`, `speed`, `size`, `rotation`, `spin`) take a value or `[min, max]`, picked per particle. Each particle has `{ index, x, y, vx, vy, size, rotation, color, opacity, age, lifetime, progress }`. Wrong values throw.

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

// Remotion-style easings: a base curve, composed with in / out / inOut
Easing.in(Easing.cubic)        // as is
Easing.out(Easing.cubic)       // mirrored: 1 - f(1 - t)
Easing.inOut(Easing.back(2))   // in for the first half, out for the second
// bases: linear, ease, quad, cubic, poly(n), sin, circle, exp,
//        elastic(bounciness = 1), back(s = 1.70158), bounce, bezier(x1, y1, x2, y2),
//        step0 (1 for t > 0), step1 (1 for t >= 1),
//        spring({ damping?, mass?, stiffness?, overshootClamping?, allowTail?, durationRestThreshold? })

// Named curves
Easing.easeInQuad, Easing.easeOutQuad, Easing.easeInOutQuad
Easing.easeInCubic, Easing.easeOutCubic, Easing.easeInOutCubic
// ... Quart, Quint, Sine, Expo, Circ, Back, Elastic, Bounce
```

The base curves and `in` / `out` / `inOut` follow Remotion's definitions. Every easing returns exactly 0 at 0 and 1 at 1 (Remotion's `exp` starts at 2⁻¹⁰ and some curves miss 1 by a rounding error; here the end points are exact).

`Easing.spring(config)` is the `spring()` motion from 0 to 1 on a 30 fps clock, stretched so that it settles (to within `durationRestThreshold`) at t = 1; from t = 1 on it is exactly 1. With `allowTail: true`, t = 1 is the natural settle time (`durationRestThreshold`, default 0.005) and the motion goes on after it: `interpolate()` lets it run past the end of its segment even with `extrapolateRight: 'clamp'`, and adds the tail of an earlier segment on top of the following ones, as in Remotion.

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
| `Loop.useLoop()` | Inside a `Loop`: `{ iteration, durationInFrames }`; `null` outside |
| `useSpring(config)` | Creates spring-based animations |
| `useInterpolate(inputRange, outputRange, options)` | Interpolates values with easing |

### Utility Functions

| Function | Description |
|----------|-------------|
| `spring({ frame, fps, config?, from?, to?, durationInFrames?, durationRestThreshold?, delay?, reverse? })` | Remotion's `spring()`, with the same values (the same stepped simulation, frame by frame). `config`: `damping` (default 10), `mass` (1), `stiffness` (100), `overshootClamping`; a damping ratio `damping / (2·√(stiffness·mass))` of 1 or more is critically damped, so `damping: 200` is a fast spring without bounce. With `durationInFrames` the motion is stretched so that its natural settle time (`measureSpring` with `durationRestThreshold`) becomes `durationInFrames`: at that frame it is within the threshold of `to`, after it exactly `to`. `delay` (frames) releases it later. `reverse` plays the motion backwards in time: it starts near `to` and comes to rest at `from` after `durationInFrames`, or after its natural settle time |
| `measureSpring({ fps, config?, threshold? })` | Remotion's `measureSpring()`: frames until a spring has settled to within `threshold` (default 0.005) of its target and stays there for the next 20 frames |
| `interpolate(input, inputRange, outputRange, options)` | Map values between ranges, as in Remotion. `inputRange` is ascending (a zero-length segment is a step at its end) with finite numbers; with one element the result is `outputRange[0]`. `extrapolateLeft` / `extrapolateRight`: `'extend'` (default, as in Remotion), `'clamp'`, `'identity'` or `'wrap'` (repeats the whole range). `easing`: one function, or an array with one per segment (`inputRange.length - 1`). `posterize`: the input is first rounded down to a multiple of it (e.g. `posterize: 5` steps every 5 frames) |
| `interpolateColors(input, inputRange, outputRange, options?)` | Colors between the colors of `outputRange`, as in Remotion: the end colors hold outside the range; result `rgba(r, g, b, a)` (integer channels, alpha to 3 decimals), mixed in sRGB. Reads `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, CSS named colors (and `transparent`), `rgb()` / `rgba()`, `hsl()` / `hsla()` (comma or space syntax with `/ alpha`), `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`. `options`: `easing`, `posterize`. Anything else throws |
| `random(seed)` | Deterministic random number generator |
| `noise2D(seed, x, y)`, `noise3D(seed, x, y, z)`, `noise4D(seed, x, y, z, w)` | Simplex noise in [-1, 1] with the signatures of `@remotion/noise`: smooth in the coordinates, the same for the same seed (a number seed and its string are the same seed). The values differ from Remotion's (another permutation table per seed) |

### Transforms and style interpolation

As in `@remotion/animation-utils`: `makeTransform([...])` joins transform functions into one CSS `transform`. Numbers get px (lengths) or deg (angles); a string must carry a CSS unit. Functions: `translate`, `translateX`, `translateY`, `translateZ`, `translate3d`, `scale` (`scale(x)` scales both axes), `scaleX`, `scaleY`, `scaleZ`, `scale3d`, `rotate`, `rotateX`, `rotateY`, `rotateZ`, `rotate3d`, `skew`, `skewX`, `skewY`, `perspective`, `matrix`, `matrix3d`. Wrong arguments throw.

```tsx
import { interpolateStyles, makeTransform, translateY, rotate, scale } from 'motionforge';

const style = interpolateStyles(frame, [0, 30, 60], [
  { opacity: 0, transform: makeTransform([translateY(-50), scale(0.8)]), color: 'red' },
  { opacity: 1, transform: makeTransform([translateY(0), scale(1)]), color: 'blue' },
  { opacity: 0, transform: makeTransform([translateY(50), scale(1)]), color: 'blue' },
]);
// makeTransform([translateX('50%'), rotate(45)]) === 'translateX(50%) rotate(45deg)'
```

`interpolateStyles(input, inputRange, outputStylesRange, options?)` interpolates every number in each value (units must match, except a unitless 0), mixes colors like `interpolateColors()`, and interpolates functions (`translateY(...)`, `drop-shadow(...)`) argument by argument; keywords must be equal. `inputRange` is strictly increasing with at least 2 values; `options` as for `interpolate()` (default `'extend'`). A property the end style lacks keeps its start value; a value that is a plain number comes back as a number.

## ✏️ SVG paths

The functions of `@remotion/paths`, in the main entry. They need no DOM, so they work during SSR and in Node, and give the same numbers everywhere. They read `M L H V C S Q T A Z`, absolute and relative; path data that does not parse throws, naming the position (a path must start with `M` or `m`).

| Function | Returns |
|----------|---------|
| `getLength(d)` | Length of the path (moves do not count), like `getTotalLength()` |
| `getPointAtLength(d, length)` | `{ x, y }` at `length`; `null` when `length` is greater than the length of the path |
| `getTangentAtLength(d, length)` | Unit vector `{ x, y }` of the direction of travel; `null` past the end, `{ x: 0, y: 0 }` for a path without length |
| `getInstructionIndexAtLength(d, length)` | `{ lengthIntoInstruction, index }`: `index` into `parsePath(d)` of the last instruction that ends before `length` (0 at the start), as in Remotion; throws past the end |
| `evolvePath(progress, d)` | `{ strokeDasharray, strokeDashoffset }` that draw `progress` (0–1) of the path (at 0 the dash is 1.5 × the length, so no dot shows) |
| `parsePath(d)` | `Instruction[]`: one per command; relative commands stay relative (`{ type: 'l', dx, dy }`), arc flags are booleans, extra pairs after `M` are `L` |
| `serializeInstructions(instructions)` | The path data again (`'M 0 0 L 10 0 Z'`); throws for an instruction with missing or non-finite values |
| `normalizePath(d)` | The same path with absolute commands only |
| `reduceInstructions(instructions)` | `ReducedInstruction[]`: only absolute `M`, `L`, `C`, `Z` (arcs become cubic curves) |
| `getBoundingBox(d)` | `{ x1, y1, x2, y2, width, height, viewBox }` of the drawn path (curves to their extrema) |
| `translatePath(d, x, y)` | Moved by `x`, `y` (relative commands stay relative) |
| `scalePath(d, scaleX, scaleY)` | Scaled around the top left corner of its bounding box (result: `M L C Z`) |
| `resetPath(d)` | Moved so its bounding box starts at 0, 0 |
| `centerPath(d, { x, y }?)` | Moved so the center of its bounding box is at the point (default 0, 0) |
| `reversePath(d)` | The same path drawn from the end to the start |
| `getSubpaths(d)` | The subpaths (split at each `M` / `m`), each starting with an absolute `M` |
| `cutPath(d, length)` | The first `length` of the path |
| `warpPath(d, ({ x, y }) => ({ x, y }), { interpolationThreshold? })` | Every point remapped; lines and curves are first split into pieces no longer than the threshold (default 1% of the larger side of the bounding box), so straight lines bend too |
| `interpolatePath(value, from, to)` | The path between two paths (0: `from`, 1: `to`); they may have different numbers of points |
| `interpolatePaths(input, inputRange, outputRange, options?)` | Like `interpolate()` over several paths: `easing`, `posterize`, `extrapolateLeft` / `extrapolateRight` (`'extend'` default, `'clamp'`, `'wrap'`) |
| `extendViewBox(viewBox, scale)` | The viewBox widened around its center by `scale` |
| `pathFromPoints(points, { cornerRadius?, closed? })` | A polyline (or polygon) through the points, corners rounded with circular arcs; a radius that does not fit in half of each edge shrinks to fit (MotionForge's own) |

Types: `Instruction`, `AbsoluteInstruction`, `ReducedInstruction`, `BoundingBox`, `WarpPathFn`, `CenterPathTarget`, `InterpolatePathsOptions`, `Point`.

```tsx
const d = pathFromPoints([{ x: 80, y: 400 }, { x: 300, y: 260 }, { x: 520, y: 400 }], { cornerRadius: 40 });
const length = getLength(d);
const progress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: 'clamp' });
const tip = getPointAtLength(d, progress * length)!;
const { x, y } = getTangentAtLength(d, progress * length)!;

<svg>
  <path d={d} stroke="#fff" strokeWidth={8} fill="none" {...evolvePath(progress, d)} />
</svg>
// a finger tracing the stroke: positioned at the tip, turned along the path
<img src="/finger.png" style={{ position: 'absolute', left: tip.x, top: tip.y, transform: `rotate(${Math.atan2(y, x)}rad)` }} />

// a star morphing into a heart (makeStar and makeHeart from 'motionforge/shapes')
const morph = interpolatePaths(frame, [0, 30], [makeStar({ points: 5, innerRadius: 60, outerRadius: 120 }).path, makeHeart({ height: 240 }).path]);
```

`parsePath`, `serializeInstructions`, `normalizePath`, `reduceInstructions`, `getBoundingBox`, `translatePath`, `scalePath`, `resetPath`, `centerPath`, `reversePath`, `getSubpaths`, `warpPath`, `interpolatePath`, `interpolatePaths` and `extendViewBox` return the same as Remotion's, to the last digit. Lengths, points and tangents on curves and arcs (and so `cutPath` inside a curve) are measured exactly (Gauss-Legendre quadrature) and can differ from Remotion's where Remotion approximates: in the fourth digit usually, by up to 1.5% on a curve with a sharp turn. Tangents on arcs point along the direction of travel (Remotion's point backwards on some arcs), and a zero-length segment at the start does not give a `NaN` tangent. Wrong input throws: a non-finite or negative length, non-finite coordinates, an `interpolationThreshold` ≤ 0.

## 🔷 Shapes

`motionforge/shapes` is `@remotion/shapes`. Each `make*()` function returns `{ path, width, height, transformOrigin, instructions }`; each component renders its own `<svg width height viewBox="0 0 width height">` with one `<path>`.

```tsx
import { Star, makeHeart } from 'motionforge/shapes';

<Star points={5} innerRadius={60} outerRadius={120} cornerRadius={8} fill="#ffd700" style={{ transform: `scale(${pop})` }} />

const { path, width, height } = makeHeart({ height: 200 });
<svg viewBox={`0 0 ${width} ${height}`}><path d={path} fill="red" {...evolvePath(progress, path)} /></svg>
```

| Function / component | Options (defaults) |
|----------------------|--------------------|
| `makeRect` / `<Rect>` | `width`, `height`, `cornerRadius` (0), `edgeRoundness` (`null`) |
| `makeCircle` / `<Circle>` | `radius` |
| `makeEllipse` / `<Ellipse>` | `rx`, `ry` |
| `makeTriangle` / `<Triangle>` | `length`, `direction` (`'up'`, `'down'`, `'left'`, `'right'`), `cornerRadius`, `edgeRoundness` |
| `makeStar` / `<Star>` | `points` (≥ 3), `innerRadius`, `outerRadius`, `cornerRadius`, `edgeRoundness` |
| `makePolygon` / `<Polygon>` | `points` (≥ 3), `radius`, `cornerRadius`, `edgeRoundness` |
| `makePie` / `<Pie>` | `radius`, `progress` (0–1, clamped), `closePath` (`true`), `counterClockwise` (`false`), `rotation` (0, radians) |
| `makeHeart` / `<Heart>` | `height`, `aspectRatio` (1.1), `bottomRoundnessAdjustment` (0), `depthAdjustment` (0) |
| `makeArrow` / `<Arrow>` | `length` (300), `headWidth` (185), `headLength` (120), `shaftWidth` (80), `direction` (`'right'`), `cornerRadius` (0) |
| `makeSpark` / `<Spark>` | `width`, `height`, `edgeRoundness` (1), `cornerRadius` (0) |
| `makeCallout` / `<Callout>` | `width` (500), `height` (200), `pointerLength` (40), `pointerBaseWidth` (60), `pointerPosition` (0.5), `pointerDirection` (`'down'`), `cornerRadius`, `edgeRoundness` |

- `cornerRadius` rounds the corners like CSS `border-radius`; `edgeRoundness` bends the edges into curves (0 straight, ~0.5 soft, 1 round); not both at once.
- Component props besides the options: `style` goes on the `<svg>` (merged after `overflow: visible`); `pathStyle` and every other SVG attribute (`fill`, `stroke`, `strokeWidth`, …) on the `<path>`, with `transform-origin` at the shape's center and `transform-box: fill-box`, as in Remotion, so CSS transforms in `pathStyle` apply around the center. `debug` draws the control points of the curves.
- The paths are the same as Remotion's, to the last digit. Remotion's `<Sequence>` props on a shape (`from`, `durationInFrames`, `premountFor`, …) and `effects` throw: wrap the shape in a `<Sequence>` instead. Wrong options throw (negative sizes, `points` < 3, both `cornerRadius` and `edgeRoundness`, an unknown direction).

## 🎞️ Video and Audio

`Video` and `Audio` follow Remotion's `<Html5Video>` / `<Html5Audio>` props and seek the element to the frame's time on every frame (`Video` holds the render gate until it has seeked; a load error cancels the render).

| Prop | Default | Meaning |
|------|---------|---------|
| `src` | required | URL (a `prefetch()`ed one plays from memory) |
| `trimBefore` | `0` | Media frames cut from the start: frame 0 shows media frame `trimBefore` |
| `trimAfter` | - | Media frame to end at; the element unmounts once it is reached (unless `loop`) |
| `durationInFrames` | - | Media frames to play from `trimBefore` (the earlier of this and `trimAfter` wins) |
| `playbackRate` | `1` | Speed (> 0): frame `f` shows media frame `trimBefore + f × playbackRate` |
| `loop` | `false` | Repeat the range from `trimBefore` to `trimAfter` (or to the end of the media) |
| `volume` | `1` | `0..1`, or `(frame) => number` (frame from the start of the media, per iteration with `loop`); a media element plays at most at 1 |
| `muted` | `false` | |
| `objectFit` (`Video`) | `'contain'` | CSS `object-fit` of the picture (`'contain'`, `'cover'`, `'fill'`, `'none'`, `'scale-down'`); `style.objectFit` works too, both disagreeing throws |
| `style`, `className`, other `<video>` / `<audio>` attributes | | Passed to the element. `Video` has no default size: give it one, e.g. `style={{ width: '100%', height: '100%' }}` |

Without `loop`, past the end of the media the last frame shows. Wrong values (negative `trimBefore`, `trimAfter` not after `trimBefore`, `playbackRate <= 0`, a negative `volume`) throw.

## 🧊 3D: `ThreeCanvas`

`<ThreeCanvas>` from `motionforge/three` is Remotion's `@remotion/three` canvas: a React Three Fiber `<Canvas>` driven by the frame.

```tsx
import { ThreeCanvas } from 'motionforge/three';
import { interpolate, useCurrentFrame, useVideoConfig } from 'motionforge';

const Cube = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ fov: 75, position: [0, 0, 470] }}>
      <ambientLight intensity={0.15} />
      <pointLight args={[undefined, 0.4]} position={[200, 200, 0]} />
      <mesh rotation={[frame * 0.03, frame * 0.035, 0]} scale={interpolate(frame, [0, 30], [0.5, 1])}>
        <boxGeometry args={[100, 100, 100]} />
        <meshStandardMaterial color="#10b981" />
      </mesh>
    </ThreeCanvas>
  );
};
```

- `width` and `height` (positive integers, px) are required: the scene renders at that size whatever CSS scaling the page applies. All other `<Canvas>` props pass through.
- R3F renders in a separate React root; `ThreeCanvas` provides the frame context, the render gate and the sequence context again inside, so `useCurrentFrame()`, `useVideoConfig()` and `useDelayRender()` work in the scene.
- Deterministic: `frameloop` is always `'never'` (other values throw). The scene is drawn once per frame with `advance(frame / fps)`, so `state.clock.elapsedTime` is the frame's time in seconds. Animate with `useCurrentFrame()`, not `useFrame()`.
- It holds the render gate until the renderer is created (the canvas needs a non-zero size), suspended content (`useLoader`, drei's `useTexture` / `useGLTF`) has loaded, and the frame is drawn. An error in the canvas (no WebGL, a throwing scene component) goes to `cancelRender()`.
- Remotion's `<Sequence>` props on the canvas (`from`, `durationInFrames`, `premountFor`, …) throw: put the canvas inside `<Sequence layout="none">` instead. Inside the canvas, `<Sequence>` needs `layout="none"` too (a `<div>` is not allowed in a three.js scene).

## 📏 Text measurement

`motionforge/layout-utils` has Remotion's `@remotion/layout-utils` functions. They measure with the browser's layout (an off-screen `<span>`), so they run in the browser only.

| Function | Returns |
|----------|---------|
| `measureText({ text, fontFamily, fontSize, fontWeight?, letterSpacing?, fontVariantNumeric?, textTransform?, additionalStyles?, validateFontIsLoaded? })` | `{ width, height }` of the text on one line |
| `fitText({ text, withinWidth, fontFamily, … })` | `{ fontSize }` at which the text is `withinWidth` px wide (throws for a text of width 0) |
| `fitTextOnNLines({ text, maxLines, maxBoxWidth, fontFamily, …, maxFontSize? })` | `{ fontSize, lines }`: the largest size (0.01 px steps, up to `maxFontSize`, default 2000) at which the words fit on `maxLines` lines |
| `fillTextBox({ maxBoxWidth, maxLines })` | `{ add(word) }`; `add` returns `{ exceedsBox, newLine }` |

**Load the fonts first.** A measurement taken while the font is loading uses the fallback font, and the layout changes once the font arrives. Measure only after the font is loaded, and hold the frame until then: `usePreloadAssets()` does both.

```tsx
import { usePreloadAssets } from 'motionforge';
import { fitText } from 'motionforge/layout-utils';

const Title = ({ text }: { text: string }) => {
  // holds the render gate until Inter 800 is loaded
  const ready = usePreloadAssets([{ type: 'font', family: 'Inter', weight: 800 }]);
  if (!ready) return null;
  const { fontSize } = fitText({ text, withinWidth: 900, fontFamily: 'Inter', fontWeight: 800 });
  return <h1 style={{ fontFamily: 'Inter', fontWeight: 800, fontSize }}>{text}</h1>;
};
```

Results are cached only when `document.fonts.check()` says every face the text needs is loaded, so a measurement with a fallback font is never reused later. `validateFontIsLoaded: true` also takes a measurement with the fallback font and throws when both match. Wrong input throws.

## 💨 Motion blur

`motionforge/motion-blur` has Remotion's `@remotion/motion-blur` components. Both render their children several times at other frames through `<Freeze>`, so the children must be absolutely positioned (e.g. an `AbsoluteFill`).

```tsx
import { CameraMotionBlur, Trail } from 'motionforge/motion-blur';

// film-camera blur: 10 sub-frame samples over half a frame
<CameraMotionBlur shutterAngle={180} samples={10}>
  <AbsoluteFill><Ball /></AbsoluteFill>
</CameraMotionBlur>

// a trail of 6 copies, each 2 frames further back and fainter
<Trail layers={6} lagInFrames={2} trailOpacity={0.6}>
  <AbsoluteFill><Ball /></AbsoluteFill>
</Trail>
```

- `Trail { layers, lagInFrames, trailOpacity }`: `layers` copies below the content, layer `i` (0 = oldest) at frame `frame - lagInFrames × (layers - i)` with opacity `trailOpacity - (layers - i) / layers × trailOpacity`. `lagInFrames` may be a fraction.
- `CameraMotionBlur { shutterAngle = 180, samples = 10 }`: `samples` copies at sub-frames `frame + 1 - shutterAngle / 360 × k / samples`, each at `1 / samples` opacity, added with `mix-blend-mode: plus-lighter`. Near frame 0 it uses fewer samples so none falls before 0. The blend changes colours slightly: keep `samples` low (5–10).
- Inside them `useCurrentFrame()` returns fractional frames. Wrong values throw (`layers`, `samples` non-negative integers, `shutterAngle` 0–360).

## 🎞 Animated images

`AnimatedImage` (from `motionforge`, as in Remotion core) and `Gif` (from `motionforge/gif`, as `@remotion/gif`) draw an animated image on a `<canvas>` at the frame's time, `frame / fps × playbackRate`.

```tsx
import { AnimatedImage } from 'motionforge';
import { Gif, getGifDurationInSeconds } from 'motionforge/gif';

<AnimatedImage src="/sticker.webp" width={300} height={300} fit="contain" />
<Gif src="/reaction.gif" width={480} height={270} fit="cover" loopBehavior="pause-after-finish" />

const seconds = await getGifDurationInSeconds('/reaction.gif'); // e.g. to size a Sequence
```

| Prop | Default | Meaning |
|------|---------|---------|
| `src` | — | URL; a remote one must allow CORS |
| `width`, `height` | the image's size | Canvas size in px |
| `fit` | `'fill'` | `'fill'` (stretched), `'contain'` or `'cover'` |
| `playbackRate` | `1` | Speed (a positive number) |
| `loopBehavior` | `'loop'` | `'loop'`, `'pause-after-finish'` (last frame), and `'clear-after-finish'` (`AnimatedImage`: empty canvas) or `'unmount-after-finish'` (`Gif`: renders nothing) |
| `onError` | — | Called with a load or decode error instead of `cancelRender()` |
| `requestInit` | — | Passed to `fetch()` (credentials, headers) |
| `style`, `id` | — | On the canvas (`AnimatedImage` takes the other canvas attributes too) |
| `onLoad` | — | `Gif` only: `{ width, height, delays, frames }` once decoded |
| `ref` | — | The `<canvas>` element |

- Frame-exact: a frame is shown for its whole interval in the file (from its start time up to the next frame's).
- Both hold the render gate while the image loads and until the frame is drawn.
- `AnimatedImage` decodes GIF, APNG, AVIF and WebP with the WebCodecs `ImageDecoder` (Chromium-based browsers and Firefox; not Safari): without it the render fails with an error that says so. It decodes every frame once on load to learn the frame times.
- `Gif` decodes in JavaScript with [omggif](https://github.com/deanm/omggif) (MIT), so it works in every browser and gives the same pixels everywhere. Frames are composed with their disposal method; a delay of 0 is shown for 100 ms (as FFmpeg and Remotion do). `getGifDurationInSeconds(src, { requestInit? })` sums the delays; it parses only the frame headers (no pixels) and shares the download with `<Gif>`.
- Remotion's `<Sequence>` props (`from`, `durationInFrames`, `premountFor`, `loop`, …), crop props and `effects` throw: wrap the component in a `<Sequence>` instead. `Gif`'s `delayRenderTimeoutInMilliseconds` throws too: the host sets the timeout with `gate.waitUntilReady({ timeoutMs })`.

## 🔊 Media utilities

`motionforge/media-utils` has Remotion's `@remotion/media-utils` functions.

| Function | Returns |
|----------|---------|
| `getVideoMetadata(src)` | `Promise<{ durationInSeconds, width, height, aspectRatio, isRemote }>` (an invisible `<video>`) |
| `getImageDimensions(src)` | `Promise<{ width, height }>` (natural size) |
| `getAudioDurationInSeconds(src)` | `Promise<number>` (an invisible `<audio>`) |
| `getAudioData(src, { sampleRate?, requestInit? })` | `Promise<MediaUtilsAudioData>`: `{ channelWaveforms, sampleRate, durationInSeconds, numberOfChannels, resultId, isRemote }`, decoded with the Web Audio API at `sampleRate` (default 48000) |
| `useAudioData(src, { sampleRate?, requestInit? })` | The audio data, or `null` while loading; holds the render gate until the data has rendered |
| `useWindowedAudioData({ src, frame, fps, windowInSeconds, channelIndex?, requestInit? })` | `{ audioData, dataOffsetInSeconds }`: one channel, the window the frame is in and its neighbours; holds the render gate while loading |
| `visualizeAudio({ audioData, frame, fps, numberOfSamples, optimizeFor?, dataOffsetInSeconds?, smoothing? })` | `numberOfSamples` (a power of two) frequency bars of the first channel at the frame, about 0–1, low frequencies first |
| `visualizeAudioWaveform({ audioData, frame, fps, windowInSeconds, numberOfSamples, channel?, dataOffsetInSeconds?, normalize? })` | `numberOfSamples` amplitudes of the window centred on the frame, alternately negative and positive |
| `createSmoothSvgPath({ points })` | An SVG path `d` through the points, joined by cubic curves |

```tsx
import { useCurrentFrame, useVideoConfig } from 'motionforge';
import { useAudioData, visualizeAudio } from 'motionforge/media-utils';

const Spectrum = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData('/music.mp3');
  if (!audioData) return null;
  const bars = visualizeAudio({ audioData, frame, fps, numberOfSamples: 32 });
  return <>{bars.map((v, i) => <div key={i} style={{ height: 300 * v }} />)}</>;
};
```

- The getters are browser only and cache their result per source (a failure is not cached). Their errors name the source.
- `visualizeAudio`, `visualizeAudioWaveform` and `createSmoothSvgPath` are pure functions with Remotion's arithmetic (same FFT, smoothing and windows), so the same input gives the same output everywhere. `resultId` depends only on the source and options.
- `useWindowedAudioData` decodes the whole file once (48 kHz) and cuts the windows from it; pass its `dataOffsetInSeconds` to the visualize functions.

## 🎭 Using Lottie in MotionForge

MotionForge provides first-class, production-grade Lottie support. Animations are synchronized with the frame system for deterministic, frame-perfect rendering.

### Basic Usage

```tsx
import { AbsoluteFill } from 'motionforge';
import { Lottie, LottieAnimationData } from 'motionforge/lottie';
import animationData from './animation.json';

const MyComposition = () => {
  return (
    <AbsoluteFill>
      <Lottie animationData={animationData as LottieAnimationData} width={400} height={400} />
    </AbsoluteFill>
  );
};
```

As in `@remotion/lottie`, the data is an object: to use a URL, fetch the JSON (holding the frame with `useDelayRender()`) and pass the result. `getLottieMetadata(animationData)` returns `{ fps, durationInFrames, durationInSeconds, width, height }`, or `null` when the data lacks one of them.

### Advanced Configuration

The `Lottie` component supports several props to control playback and appearance:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animationData` | `object` | - | The animation JSON; compared by content, so a new object with the same data does not reload |
| `direction` | `'forward' \| 'backward'` | `'forward'` | `'backward'` plays the frames from the end |
| `loop` | `boolean` | `false` | Whether to loop the animation (otherwise it holds its last frame) |
| `playbackRate` | `number` | `1` | Speed (> 0); composition frame `f` shows the Lottie at time `f / fps × playbackRate` |
| `renderer` | `'svg' \| 'canvas' \| 'html'` | `'svg'` | lottie-web renderer |
| `preserveAspectRatio` | `string` | - | SVG preserveAspectRatio for the svg and canvas renderers, e.g. `'xMidYMid slice'` |
| `assetsPath` | `string` | - | Base path of the images the animation references |
| `onAnimationLoaded` | `(animation) => void` | - | Called with the lottie-web `AnimationItem` each time new data is loaded |
| `frameStart` | `number` | `0` | Lottie frame (on the animation's own timeline) to start from |
| `frameEnd` | `number` | - | Lottie frame to stop at (default: its last frame) |
| `width` | `number \| string` | `100%` | Width of the container |
| `height` | `number \| string` | `100%` | Height of the container |
| `style`, `className` | | | Of the container |

Unlike `@remotion/lottie`, which shows Lottie frame `n` at composition frame `n`, MotionForge maps by time, so a 60 fps Lottie plays at its speed in a 30 fps composition.

### Syncing with Sequences

Inside a `Sequence`, `useCurrentFrame()` (and so `Lottie`) counts from the sequence start.

```tsx
<Sequence from={30} durationInFrames={120}>
  <Lottie
    animationData={myAnimationData}
    playbackRate={1.5}
    loop
  />
</Sequence>
```

### Performance Tips

1. **Data**: the JSON is passed as an object, so Lottie initializes without a request; images it references load from `assetsPath`.
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
