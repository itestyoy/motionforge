# Changelog

All notable changes to MotionForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

MotionForge is now a headless SDK: scenes are pure functions of the frame, and the host app renders them, owns time and provides playback, seeking and export.

### Added
- Render readiness: `createRenderGate()` and `FrameProvider gate`; `gate.waitUntilReady({ frame, timeoutMs })` resolves when the frame is committed and nothing holds it, and rejects on timeout (listing the pending labels) or with the `cancelRender()` error. Scenes use `useDelayRender()` → `{ delayRender, continueRender, cancelRender }`; handles are per gate, released on unmount, and `delayRender()` throws during render. Without a gate, `cancelRender()` errors are thrown to the nearest error boundary.
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
- Inside `Sequence`, `Loop` and `Series.Sequence`, `useVideoConfig().durationInFrames` is the length of the sequence (`Sequence`: its `durationInFrames`, or the rest of the parent when it has none; `Loop`: one iteration; `Series.Sequence`: its own).
- The `Loop` context hook is exported as `useLoopInfo()` (it was unreachable: `useLoop` is the frame-modulo hook from `hooks/animation`).
- `Retiming` with a function `playbackRate` advances by the rate on each frame: the content frame is `floor(Σ playbackRate(i) for i < frame)`, so speed ramps no longer jump or run backwards.
- `useFade()` without `endFrame` fades out to 0 on the last frame (`durationInFrames - 1`).

### Fixed
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
