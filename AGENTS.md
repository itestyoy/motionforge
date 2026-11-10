# Agent guidelines

- The only code in this repo is the SDK in `packages/motionforge`. `src/` is the source of truth; `dist/` is committed build output — regenerate it with `bun run build` after source changes.
- Headless: no player, no clock, no UI. `FrameProvider` / `Composition` take the frame from the host app.
- Deterministic: everything a scene renders is derived from `useCurrentFrame()` / `useVideoConfig()` and props. No `Date.now()`, `Math.random()`, timers or CSS transitions/animations; use `random(seed)`.
- Inside `Sequence` (and `Loop`, `Freeze`, `Retiming`, `Reverse`, `Series`) `useCurrentFrame()` is local to that sequence.
- three.js components go to `motionforge/three`, Lottie to `motionforge/lottie`, Tone.js (an optional peer dependency, imported dynamically) to `motionforge/audio`; the main entry must not import them.
- Every fix comes with a test in `packages/motionforge/tests` (vitest, run under Node).
