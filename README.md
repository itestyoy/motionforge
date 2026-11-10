# MotionForge (fork)

Headless React SDK for frame-based motion graphics. A scene is a pure function of the frame; the host app renders it at any frame and owns playback, seeking and export.

The package lives in [`packages/motionforge`](packages/motionforge) — see its [README](packages/motionforge/README.md) and [CHANGELOG](packages/motionforge/CHANGELOG.md).

```bash
cd packages/motionforge
bun install
bun run typecheck
bun run build
bun run test   # vitest under Node; tests/dist-entries checks the build
```

Forked from [codedbytahir/motionforge](https://github.com/codedbytahir/motionforge) (MIT).
