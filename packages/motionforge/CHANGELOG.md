# Changelog

All notable changes to MotionForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `interpolate()`: `posterize` option; a one-element `inputRange` returns `outputRange[0]`.
- `Easing.step0`, `Easing.step1`, `Easing.spring({ damping, mass, stiffness, overshootClamping, allowTail, durationRestThreshold })`; a spring easing with `allowTail` continues past its segment, also when clamped.
- `interpolateColors()`: CSS named colors and `transparent`, `hsl()`/`hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()` (comma and space/slash syntax); options `{ easing, posterize }`.
- `noise3D(seed, x, y, z)` and `noise4D(seed, x, y, z, w)` (simplex; dependency `simplex-noise` 4.0.1).
- `makeTransform()` with `translate*`, `scale*`, `rotate*`, `skew*`, `perspective`, `matrix`, `matrix3d`, and `interpolateStyles()` (as in `@remotion/animation-utils`).
- `Sequence`: `style`, `className`, `width`, `height`, `postmountFor`, `styleWhilePremounted`, `styleWhilePostmounted`; `useSequence().isPostmounted`. `Series.Sequence` passes the layout props through. `Loop`: `layout`, `style`, `className`, `name`, and `Loop.useLoop()`.
- `Video`/`Audio`: `durationInFrames`, `loop`; `Video`: `objectFit`.
- `Lottie`: `direction`, `renderer`, `preserveAspectRatio`, `assetsPath`, `onAnimationLoaded`; `getLottieMetadata()` in `motionforge/lottie`.
- `delayRender(label, { timeoutInMilliseconds })`.
- `prefetch(src, options) → { free, waitUntilDone }`; `Img`, `Video` and `Audio` use the prefetched copy.
- `loadFont({ family, url, ... })`: holds every gate until the font is loaded and fails them if it cannot load.
- `ThreeCanvas` in `motionforge/three` (as `@remotion/three`): an R3F `<Canvas>` drawn once per frame (`frameloop: 'never'`, `advance(frame / fps)`); frame, config, gate and sequence contexts work inside; holds the render gate until the renderer exists, suspended content has loaded and the frame is drawn; canvas errors go to `cancelRender()`.
- `motionforge/layout-utils` (as `@remotion/layout-utils`): `measureText`, `fitText`, `fitTextOnNLines`, `fillTextBox`.
- `motionforge/motion-blur` (as `@remotion/motion-blur`): `Trail { layers, lagInFrames, trailOpacity }` and `CameraMotionBlur { shutterAngle = 180, samples = 10 }`.
- `AnimatedImage`: animated GIF/APNG/AVIF/WebP via WebCodecs `ImageDecoder`, frame-exact by time; holds the render gate.
- `motionforge/gif` (as `@remotion/gif`): `Gif` and `getGifDurationInSeconds`, decoded in JavaScript (dependency `omggif` 1.0.10).
- `motionforge/media-utils` (as `@remotion/media-utils`): `getVideoMetadata`, `getImageDimensions`, `getAudioDurationInSeconds`, `getAudioData`, `useAudioData`, `useWindowedAudioData`, `visualizeAudio`, `visualizeAudioWaveform`, `createSmoothSvgPath`; the hooks hold the render gate.
- `bun run typecheck` also type-checks `tests/`.
- `motionforge/transitions` (as `@remotion/transitions`): `TransitionSeries` with `.Sequence`, `.Transition` and `.Overlay`, `linearTiming()`, `springTiming()`, `useTransitionProgress()`, and the presentations `fade`, `slide`, `wipe`, `flip`, `clockWipe`, `iris`, `cube`, `none`, `pushCut`, each from its own entry (`motionforge/transitions/fade`, …); they render the same markup as Remotion's. Scenes keep their own frames and length while they overlap and work with `premountFor` and the render gate.
- SVG path functions of `@remotion/paths` in the main entry: `parsePath`, `serializeInstructions`, `normalizePath`, `reduceInstructions`, `getInstructionIndexAtLength`, `getBoundingBox`, `translatePath`, `scalePath`, `resetPath`, `centerPath`, `reversePath`, `getSubpaths`, `cutPath`, `warpPath`, `interpolatePath`, `interpolatePaths`, `extendViewBox`, and the types `Instruction`, `AbsoluteInstruction`, `ReducedInstruction`, `BoundingBox`, `WarpPathFn`, `CenterPathTarget`, `InterpolatePathsOptions`.
- `motionforge/shapes` (as `@remotion/shapes`): `makeRect`, `makeCircle`, `makeEllipse`, `makeTriangle`, `makeStar`, `makePolygon`, `makePie`, `makeHeart`, `makeArrow`, `makeSpark`, `makeCallout` and the components `Rect`, `Circle`, `Ellipse`, `Triangle`, `Star`, `Polygon`, `Pie`, `Heart`, `Arrow`, `Spark`, `Callout`, with the same paths as Remotion's.

### Changed (breaking)
- `interpolate()` and `useInterpolate()`: `extrapolateLeft`/`extrapolateRight` default to `'extend'` (was `'clamp'`); ranges must contain finite numbers.
- `interpolateColors()` always returns `rgba(r, g, b, a)` (was hex for opaque colors).
- `noise2D(x, y)` is now `noise2D(seed, x, y)`: simplex noise in [-1, 1] (was value noise in [0, 1)).
- `Video`/`Audio`: `trimBefore`/`trimAfter` replace `startFrom`/`endAt`; the element unmounts at the end unless `loop`; `muted` defaults to `false`; `Video` has no default size and `object-fit` defaults to `contain`; `playbackRate` must be > 0 and `volume` ≥ 0.
- `Lottie`: `animationData` (an object) replaces `src`; URLs are no longer accepted.
- `Loop` renders each iteration in an absolute-fill wrapper (use `layout="none"` for none); `times` may be 0.
- `Sequence` with `layout="none"` throws on `style`, `className` and the mounting props.
- `usePreloadAssets()` font assets are `{ type: 'font', family, weight?, style? }`.
- `ImageProps` is now `ImgProps`; `CompositionProps`, `SequenceProps`, `VideoProps`, `AudioProps` and `TextProps` are the components' real props.
- `delayRender()` throws on unknown options; calling it during render throws an error that shows the effect-based code to write instead.
- `Freeze` accepts sub-frames (any finite `frame`), as Remotion does.
- `getPointAtLength()` and `getTangentAtLength()` return `null` past the end of the path (they clamped the length) and throw for a negative length, as Remotion's; `getTangentAtLength()` returns `{ x: 0, y: 0 }` for a path without length (it threw).
- `evolvePath(0, d)` returns a dash of 1.5 times the length, as Remotion's, so no dot of the stroke shows.
- Path parse errors start with `parsePath:` and say "the path" instead of "d".

### Fixed
- Fonts split by `unicode-range` (Google Fonts, @fontsource) load all their subsets in `usePreloadAssets()`, so Cyrillic is ready when the frame is captured.
- `useFade()` clamps explicitly instead of relying on `interpolate()`'s default.

### Removed
- `preloadImage`, `preloadVideo`, `preloadAudio`, `preloadFont` (use `prefetch()`, `usePreloadAssets()` or `loadFont()`).
- `useLoopInfo()` (use `Loop.useLoop()`), the `useConfig` alias and `Composition`'s duplicate `useVideoConfig`.
- `Video`'s `pauseOnFrame`, `Sequence`'s unused `showInTimeline`, the `LayerProps` type.
- `Trail` from the main entry (it rendered identical copies); use `Trail` from `motionforge/motion-blur`.
- The transition helpers `fade`, `slide`, `scaleTransition`, `rotateTransition`, `zoom`, `wipe`, `blur`, `glitch`, `shakeTransition`, `pulseTransition`, `bounce`, `flash`, `slideWithFade`, `flip`, `combine`, `transitions` and the types `TransitionConfig`, `TransitionName` from the main entry: their names clash with Remotion's presentations. Use `TransitionSeries` and the presentations from `motionforge/transitions`.
- The SVG element wrappers `Rect` and `Circle` from the main entry: their names clash with Remotion's shapes. Use `<rect>` / `<circle>`, or the shapes from `motionforge/shapes`.

## [2.0.0] - 2026-11-10

MotionForge is now a headless SDK: scenes are pure functions of the frame, and the host app renders them, owns time and provides playback, seeking and export.

### Added
- Render readiness: `createRenderGate()` and `FrameProvider gate` (also on `Composition`); `gate.waitUntilReady({ frame, timeoutMs })` resolves when the frame is committed and nothing holds it, and rejects on timeout (listing the pending labels) or with the `cancelRender()` error. Scenes use `useDelayRender()` → `{ delayRender, continueRender, cancelRender }`; handles are per gate, released on unmount, and `delayRender()` throws during render. Without a gate, `cancelRender()` errors are thrown to the nearest error boundary.
- `Img`, `Video` and `Lottie` hold the frame until the image is decoded, the video has seeked to the frame, or the Lottie data is loaded and the frame set; their load errors go to `cancelRender()`.
- `preloadImage`, `preloadVideo`, `preloadAudio`, `preloadFont` and `usePreloadAssets(assets)`.
- SVG path helpers that need no DOM: `getLength`, `getPointAtLength`, `getTangentAtLength`, `evolvePath`, and `pathFromPoints(points, { cornerRadius, closed })` (corners rounded with circular arcs). They read `M L H V C S Q T A Z`, absolute and relative.
- Remotion's easing composition: `Easing.in(f)`, `Easing.out(f)`, `Easing.inOut(f)` and the bases `ease`, `quad`, `cubic`, `poly(n)`, `sin`, `circle`, `exp`, `elastic(bounciness)`, `back(s)`, `bounce` (next to `linear` and `bezier`).
- Particle emitter: `<Particles>` and the pure `getParticles()`; time in seconds, motion in px per second, randomness from the seed; per-particle birth, lifetime and fade; gravity and drag in closed form; moving origins for trails.
- `spring({ delay, reverse })`: `delay` in frames; `reverse` plays the motion backwards in time over `durationInFrames` or the natural settle time, holding `to` before it starts (Remotion semantics, not a swap of `from` and `to`).
- `interpolate()`: `extrapolateLeft` / `extrapolateRight: 'wrap'`, and `easing` as an array with one easing per segment.
- `Sequence premountFor`: children mount that many frames early, invisible and at their frame 0; their handles hold the frame only once the sequence has started. `useSequence().isPremounted` tells them.

### Removed (breaking)
- `Player`, `PlayerProvider`, `usePlayer`, `PlayerComposition`, `useTimelineState`, `CompositionManagerProvider`, and the playback state of the frame context (`playing`, `playbackRate`, `setFrame`, `setPlaying`, `setPlaybackRate`).
- The renderer and export API (`renderVideo`, `VideoExportManager`, `CanvasRenderer`, `WebMEncoder`, `FrameCache`, ffmpeg helpers, …), icons, and the `motionforge/renderer`, `motionforge/player`, `motionforge/icons` and `motionforge/styles.css` entries.
- `usePerformanceMonitor`, `useThrottledFrame`, `useBatchFrameProcessor` and `useRenderPriority`: they returned constants or ignored their arguments.

### Changed (breaking)
- `Loop` throws unless `durationInFrames` is a positive integer and `times` a positive integer or `Infinity`, and on a negative current frame; `Reverse` likewise for `durationInFrames` and the frame. `Sequence` throws on a non-integer `from` or `offset` and on a `durationInFrames` that is not a positive integer.
- `Retiming` has no `name` prop (it was never used).
- `Freeze` follows Remotion: `<Freeze frame active?>` shows `frame` while `active` (a boolean or a function of the frame, default `true`) for its whole lifetime. `durationInFrames` (hold, then resume) and the unused `name` prop are removed; `frame` must be an integer.
- `interpolate()` throws on an unknown `extrapolateLeft` / `extrapolateRight` and on an `easing` that is not a function (or an array of them, one per segment).
- `ParticleSystem` has no `direction="explode"` any more (use `<Particles>`), and it throws on an unknown `direction`.
- `Series` takes only `<Series.Sequence durationInFrames offset? name? layout? premountFor?>` children and throws on anything else; children with a `durationInFrames` prop are no longer read. All sequences render in their range, so overlapping ones (negative `offset`) play together; positive `offset` leaves a gap.
- `Lottie` with `frameEnd` not after `frameStart` (or `frameStart` past the end of the animation) cancels the render with an error instead of showing nothing.
- `FrameProvider` and `Composition` are controlled: they take a required `frame` prop and have no clock.
- 3D components (`DepthGallery3D`, `ShaderImageReveal`, `DitheringEffect`) moved to `motionforge/three`, `Lottie` to `motionforge/lottie`; the main entry no longer imports three.js or lottie-web. `three` and the `@react-three/*` peers are optional; `framer-motion` is no longer a peer dependency (nothing used it).
- `Sequence`, `Loop`, `Freeze`, `Retiming`, `Reverse` and `Series` shift `useCurrentFrame()` for their children; nested sequences compose. Code inside a `Sequence` that subtracted the sequence start itself must use the local frame now.
- `interpolateColors()` throws on colors it cannot parse instead of returning black, including malformed hex (`#abcde`, `#zzzzzz`).
- `interpolate()` and `interpolateColors()` throw on a descending `inputRange` or NaN input/ranges; a zero-length segment is a step at its end instead of NaN.
- `spring()` and `measureSpring()` throw on a missing or non-positive `fps`, a NaN `frame`, or a config without `mass > 0`, `stiffness > 0`, `damping >= 0`; `measureSpring()` throws for `damping: 0` (it never settles).
- `spring()` with `durationInFrames` stretches the natural motion (settled to `durationRestThreshold`) over `durationInFrames` and is exactly `to` from that frame on; without it, it follows the physics with no time cutoff (it used to stop at 2 s).
- `noise2D()` is 2D value noise in [0, 1): it depends on both coordinates and is continuous; its values differ from before.
- `Easing.bezier()` throws when `x1` or `x2` is outside [0, 1].
- `Flip3D` no longer takes `children` (it never rendered them; the content is `front` and `back`).
- `FlipImageReveal` shows no built-in copy: the overlay text comes from the new `title` / `description` props and the image alt text from `alt` (default empty). `DepthGallery3D` captions come from the new `captions` prop instead of "Art Piece N".
- `Counter` formats with a fixed locale (`locale`, default `'en-US'`) instead of the host's locale; `format` still overrides it.
- `WordByWord` uses `durationInFrames`: each word animates for `durationInFrames / words` frames (it was always 15).
- `GradientText` animates `backgroundPosition` over a fixed, seamlessly repeating gradient; it throws when `colors` is empty.
- `Lottie` maps composition frames to Lottie frames by time (`frame / fps × Lottie frame rate × playbackRate`), not one to one. Its root is now a wrapper element around the lottie-web container.
- `FrameProvider` and `Composition` throw when `frame` is not an integer from 0 to `durationInFrames - 1`, or when `fps`, `width`, `height` or `durationInFrames` is not positive.
- Inside `Sequence`, `Loop`, `Reverse` and `Series.Sequence`, `useVideoConfig().durationInFrames` is the length of the sequence (`Sequence`: its `durationInFrames`, or the rest of the parent when it has none; `Loop`: one iteration; `Reverse` and `Series.Sequence`: their own).
- The `Loop` context hook is exported as `useLoopInfo()` (it was unreachable: `useLoop` is the frame-modulo hook from `hooks/animation`).
- `Retiming` with a function `playbackRate` advances by the rate on each frame: the content frame is `floor(Σ playbackRate(i) for i < frame)`, so speed ramps no longer jump or run backwards.
- `useFade()` without `endFrame` fades out to 0 on the last frame (`durationInFrames - 1`).

### Fixed
- `Lottie` does not reload when `src` is a new object with the same data (it is compared by its JSON); it throws on a `src` that is neither a URL nor an object.
- README Quick Start imports `useVideoConfig`.
- Every easing returns exactly 0 at 0 and 1 at 1 (e.g. `easeInSine(1)` was 0.9999999999999999).
- All entries are built together and share one frame context.
- Every built file starts with `'use client'` (the source directives were lost in bundling).
- `require()` consumers get the CommonJS type declarations (`.d.cts`): each `exports` entry has its own `types` under `import` and `require`.
- `spring()` returns `from` for frames before the start instead of diverging.
- `interpolate()` with `extrapolateRight: 'extend'` continues the last segment, not the first.
- `interpolateColors()` holds the end colors outside the input range and keeps alpha of `rgba()` / `#rrggbbaa`.
- `random()` gives unrelated values for neighbouring seeds.
- `useMemoizedFrame()` keeps the value per component (it used a process-wide cache keyed only by frame and deps, so components read each other's values and the cache never shrank).
- `Sequence layout="none"` renders no wrapper element.
- Overdamped springs start at rest (the coefficients of the closed form did not sum to 1).
- `measureSpring()` returns the frame from which the spring stays within the threshold, not the first zero crossing.
- `interpolateColors()` reads `#rgba` and the space/slash syntax `rgb(255 0 0 / 50%)` with percentage alpha and channels.
- `Easing.bezier()` is accurate for steep curves (Newton with a bisection fallback; it was off by up to 0.06).
- `StickyGridScroll` shows its items (its descending input range made every item transparent) and has no CSS transition; `ProgressBar` has no CSS transition either.
- `Glitch` is deterministic (`random()` seeded by the frame instead of `Math.random()`).
- `transitions.scale.exit` goes from full size to 0 (it was inverted).
- `LetterByLetter`, `WaveText`, `RainbowText`, `KineticTypography` and `Typewriter` split text into graphemes, so emoji and combined characters stay whole.
- `GradientText` stops stay in order and work with one color (no `NaN%`).
- `Video` / `Audio`: a caller's `onLoadedData` no longer replaces the internal handler (it is called after it); they seek when more than half a frame off (was 0.05 s) and map time as `(startFrom + frame × playbackRate) / fps`.
- `Lottie` resets its loaded state when `src` changes and shows an error when the data fails to load (`data_failed`) instead of rendering nothing.
- `useProgress()` and `useTimeline().progress` return 1 instead of NaN for a one-frame composition.

## [1.3.0] - 2024-03-20

### Added
- Full Lottie animation integration with `<Lottie />` component
- Deterministic frame synchronization with MotionForge timeline
- Support for both remote JSON URLs and local JSON objects
- Advanced Lottie controls: `frameStart`, `frameEnd`, `playbackRate`, `loop`
- Automatic relative frame mapping within `<Sequence />`
- Production-grade performance with memoization and instance cleanup
- CLI template updates with Lottie support and examples
- Comprehensive Lottie documentation in README

## [1.2.0] - 2024-01-15

### Added
- Frame caching system with LRU cache and TTL support
- Video export with WebM encoding (MediaRecorder API)
- Canvas-based frame capture renderer
- Performance optimization hooks
- Enhanced render API with job management
- Progress tracking for video exports

### Changed
- Improved performance with memoization
- Better TypeScript type definitions
- Optimized frame rendering pipeline

## [1.1.0] - 2024-01-10

### Added
- 3D Transform effects (Rotate3D, Flip3D, Perspective3D, Cube3D)
- Particle system with multiple shapes and directions
- Text animation effects (LetterByLetter, WordByWord, WaveText, RainbowText, GradientText)
- Additional effects (Blur, Bounce, Pulse, Swing, Confetti)
- 3 new demo compositions
- AI Agent guidelines (GLM AI & Google AI)

### Changed
- Updated theme with emerald green accents
- Improved demo player with better controls
- Enhanced icon library with 50+ icons

## [1.0.0] - 2024-01-01

### Added
- Initial release
- Core video components (AbsoluteFill, Sequence, Loop, Freeze, Retiming, Reverse, Series)
- Spring physics animation system
- 20+ easing functions
- Interpolation utilities for values and colors
- Media components (Video, Audio, Img, SVG)
- Interactive timeline player
- Effect components (Fade, Scale, Slide, Rotate, Typewriter, Counter, etc.)
- Transition effects (fade, slide, wipe, flip, zoom)
- Server-side render API
- Icon library with 50+ icons
- Dark theme with green accents
