import { defineConfig } from 'tsup';

// One build for every entry point: with code splitting the entries share one
// copy of the core (frame context, hooks), so `Player` from 'motionforge/player'
// and `useCurrentFrame` from 'motionforge' see the same React context.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'icons/index': 'src/icons/index.tsx',
    'player/Player': 'src/player/Player.tsx',
    'renderer/index': 'src/renderer/index.ts',
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
