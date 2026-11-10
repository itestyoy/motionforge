# Changelog

All notable changes to MotionForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

MotionForge is now a headless SDK: scenes are pure functions of the frame, and the host app renders them, owns time and provides playback, seeking and export.

### Removed (breaking)
- `Player`, `PlayerProvider`, `usePlayer`, `PlayerComposition`, `useTimelineState`, `CompositionManagerProvider`, and the playback state of the frame context (`playing`, `playbackRate`, `setFrame`, `setPlaying`, `setPlaybackRate`).
- The renderer and export API (`renderVideo`, `VideoExportManager`, `CanvasRenderer`, `WebMEncoder`, `FrameCache`, ffmpeg helpers, …), icons, and the `motionforge/renderer`, `motionforge/player`, `motionforge/icons` and `motionforge/styles.css` entries.

### Changed (breaking)
- `FrameProvider` and `Composition` are controlled: they take a required `frame` prop and have no clock.
- 3D components (`DepthGallery3D`, `ShaderImageReveal`, `DitheringEffect`) moved to `motionforge/three`, `Lottie` to `motionforge/lottie`; the main entry no longer imports three.js or lottie-web. `three` and the `@react-three/*` peers are optional; `framer-motion` is no longer a peer dependency (nothing used it).
- `Sequence`, `Loop`, `Freeze`, `Retiming`, `Reverse` and `Series` shift `useCurrentFrame()` for their children; nested sequences compose. Code inside a `Sequence` that subtracted the sequence start itself must use the local frame now.
- `interpolateColors()` throws on colors it cannot parse instead of returning black.

### Fixed
- All entries are built together and share one frame context.
- `spring()` returns `from` for frames before the start instead of diverging.
- `interpolate()` with `extrapolateRight: 'extend'` continues the last segment, not the first.
- `interpolateColors()` holds the end colors outside the input range and keeps alpha of `rgba()` / `#rrggbbaa`.
- `random()` gives unrelated values for neighbouring seeds.

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
