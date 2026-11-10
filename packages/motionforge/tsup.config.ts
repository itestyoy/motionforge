import { defineConfig } from 'tsup';

// One build for every entry point: with code splitting the entries share one
// copy of the core (frame context, hooks), so components from
// 'motionforge/three' and 'motionforge/lottie' see the frame set by the
// FrameProvider from 'motionforge'.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'three/index': 'src/three.ts',
    'lottie/index': 'src/lottie.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
