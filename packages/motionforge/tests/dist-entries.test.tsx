/**
 * Runs against the built package (`bun run build` first): the subpath entries
 * must share one frame context with the main entry, and the main entry must
 * stay free of three.js and lottie-web.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — built output, no types needed here
import * as main from '../dist/index.js';
// @ts-expect-error — built output
import * as three from '../dist/three/index.js';
// @ts-expect-error — built output
import * as lottie from '../dist/lottie/index.js';

const packageDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(packageDir, 'dist');

// Every file the module imports, directly or through other relative imports.
const relativeImportClosure = (entry: string): string[] => {
  const seen = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/(?:from|import|require)\s*\(?\s*['"](\.{1,2}\/[^'"]+)['"]/g)) {
      visit(join(dirname(file), match[1]));
    }
  };
  visit(entry);
  return [...seen];
};

const jsFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return jsFiles(path);
    return /\.c?js$/.test(name) ? [path] : [];
  });

describe('built entries', () => {
  it('renders a scene at the frame the host passes in', () => {
    const Scene = () => <b data-frame="x">{main.useCurrentFrame()}</b>;
    const html = renderToStaticMarkup(
      <main.FrameProvider frame={42} durationInFrames={100} width={100} height={100}>
        <Scene />
      </main.FrameProvider>,
    );
    expect(html).toContain('data-frame="x">42<');
  });

  it('lets components from motionforge/lottie read the frame of FrameProvider from motionforge', () => {
    const render = () =>
      renderToStaticMarkup(
        <main.FrameProvider frame={3} durationInFrames={100} width={100} height={100}>
          <lottie.Lottie src={{}} />
        </main.FrameProvider>,
      );
    expect(render).not.toThrow();
  });

  it('keeps three.js and lottie out of the main entry and the chunks it imports', () => {
    expect(main).not.toHaveProperty('DepthGallery3D');
    expect(main).not.toHaveProperty('Lottie');
    for (const entry of ['index.js', 'index.cjs']) {
      const files = relativeImportClosure(join(distDir, entry));
      expect(files.length).toBeGreaterThan(1); // it does import shared chunks
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        expect(source, relative(distDir, file)).not.toMatch(
          /(?:from|import|require)\s*\(?\s*['"](three|@react-three\/fiber|@react-three\/drei|lottie-web)['"]/,
        );
      }
    }
    expect(three).toHaveProperty('DepthGallery3D');
    expect(lottie).toHaveProperty('Lottie');
  });

  it("starts every built file with the 'use client' directive", () => {
    const files = jsFiles(distDir);
    expect(files.length).toBeGreaterThan(6);
    for (const file of files) {
      expect(readFileSync(file, 'utf8').startsWith("'use client';"), relative(distDir, file)).toBe(true);
    }
  });

  it('points require to the CommonJS types and import to the ESM types', () => {
    const pkg = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
    for (const [subpath, base] of [['.', 'index'], ['./three', 'three/index'], ['./lottie', 'lottie/index']]) {
      expect(pkg.exports[subpath]).toEqual({
        import: { types: `./dist/${base}.d.ts`, default: `./dist/${base}.js` },
        require: { types: `./dist/${base}.d.cts`, default: `./dist/${base}.cjs` },
      });
      for (const target of [`${base}.d.ts`, `${base}.js`, `${base}.d.cts`, `${base}.cjs`]) {
        expect(existsSync(join(distDir, target)), target).toBe(true);
      }
    }
  });

  it('exposes no player or renderer', () => {
    for (const name of ['Player', 'PlayerProvider', 'renderVideo', 'VideoExportManager', 'useTimelineState']) {
      expect(main).not.toHaveProperty(name);
    }
  });
});
