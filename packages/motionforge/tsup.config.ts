import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'tsup';

const USE_CLIENT = "'use client';";

// Every module of the SDK is a client module (hooks, context), but the
// 'use client' directives of the sources do not survive bundling, and an
// esbuild `banner` is dropped too: the rollup pass behind `treeshake` removes
// module-level directives. So the directive is written in front of every
// built file (entries and shared chunks, ESM and CJS) after the build. It goes
// on the first line, ahead of a CJS "use strict", so source maps stay aligned
// line by line.
const prependUseClient = async (dir: string): Promise<void> => {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await prependUseClient(path);
    } else if (/\.c?js$/.test(entry.name)) {
      const source = await readFile(path, 'utf8');
      if (!source.startsWith(USE_CLIENT)) await writeFile(path, USE_CLIENT + source);
    }
  }
};

// One build for every entry point: with code splitting the entries share one
// copy of the core (frame context, hooks), so components from
// 'motionforge/three' and 'motionforge/lottie' see the frame set by the
// FrameProvider from 'motionforge'.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'three/index': 'src/three.ts',
    'lottie/index': 'src/lottie.ts',
    'motion-blur/index': 'src/motion-blur.ts',
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
  onSuccess: () => prependUseClient('dist'),
});
