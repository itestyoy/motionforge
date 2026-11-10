# Changelog

All notable changes to MotionForge will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- `Player`, `FrameProvider` and `PlayerProvider` play in real time: the frame is derived from the elapsed wall-clock time instead of advancing one frame per repaint (a 30 fps video played at ~20 fps on a 60 Hz screen).
- `Sequence`, `Loop`, `Freeze`, `Retiming`, `Reverse` and `Series` shift `useCurrentFrame()` for their children; nested sequences compose.
- `Player` from `motionforge/player` works with hooks from `motionforge` (all entries are built together and share one frame context).
- `motionforge/styles.css` is built and shipped (the `Player` controls were unstyled without Tailwind in the host app).
- `spring()` returns `from` for frames before the start instead of diverging.
- `interpolate()` with `extrapolateRight: 'extend'` continues the last segment, not the first.
- `interpolateColors()` holds the end colors outside the input range, keeps alpha of `rgba()` / `#rrggbbaa`, and throws on colors it cannot parse instead of returning black.
- `random()` gives unrelated values for neighbouring seeds.

### Changed (breaking)
- 3D components (`DepthGallery3D`, `ShaderImageReveal`, `DitheringEffect`) moved to `motionforge/three`, `Lottie` to `motionforge/lottie`; the main entry no longer imports three.js or lottie-web. `three` and the `@react-three/*` peers are optional.
- `framer-motion` is no longer a peer dependency (nothing used it).
- Code inside a `Sequence` that computed its own offset from the absolute frame must use the local frame now.

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
