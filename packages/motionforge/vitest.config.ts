import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'node',
    // zzfx (a test reference for the vendored ZzFX) ships ES module syntax without "type": "module".
    server: { deps: { inline: ['zzfx'] } },
  },
  esbuild: { jsx: 'automatic' },
});
