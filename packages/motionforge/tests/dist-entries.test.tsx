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
// The built output is used untyped: before a build there are no declarations
// (@ts-ignore, not @ts-expect-error, since after one there are), and a stale
// dist must not fail the type check.
// @ts-ignore
import * as mainEntry from '../dist/index.js';
// @ts-ignore
import * as threeEntry from '../dist/three/index.js';
// @ts-ignore
import * as lottieEntry from '../dist/lottie/index.js';

/* eslint-disable @typescript-eslint/no-explicit-any */
const main: any = mainEntry;
const three: any = threeEntry;
const lottie: any = lottieEntry;
// @ts-ignore
import * as motionBlurEntry from '../dist/motion-blur/index.js';
// @ts-ignore
import * as layoutUtilsEntry from '../dist/layout-utils/index.js';
// @ts-ignore
import * as gifEntry from '../dist/gif/index.js';
// @ts-ignore
import * as mediaUtilsEntry from '../dist/media-utils/index.js';
const motionBlur: any = motionBlurEntry;
const layoutUtils: any = layoutUtilsEntry;
const gif: any = gifEntry;
const mediaUtils: any = mediaUtilsEntry;
// @ts-ignore
import * as shapesEntry from '../dist/shapes/index.js';
const shapes: any = shapesEntry;

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
          <lottie.Lottie animationData={{ fr: 30, w: 10, h: 10, op: 30 }} />
        </main.FrameProvider>,
      );
    expect(render).not.toThrow();
  });

  it('lets motionforge/motion-blur render the children of a FrameProvider from motionforge at earlier frames', () => {
    const Scene = () => <b>{main.useCurrentFrame()}</b>;
    const html = renderToStaticMarkup(
      <main.FrameProvider frame={10} durationInFrames={100} width={100} height={100}>
        <motionBlur.Trail layers={1} lagInFrames={2} trailOpacity={1}>
          <Scene />
        </motionBlur.Trail>
      </main.FrameProvider>,
    );
    expect(html.match(/<b>(\d+)<\/b>/g)).toEqual(['<b>8</b>', '<b>10</b>']);
  });

  it('exports the shapes as in Remotion', () => {
    expect(Object.keys(shapes).sort()).toEqual([
      'Arrow', 'Callout', 'Circle', 'Ellipse', 'Heart', 'Pie', 'Polygon', 'Rect', 'Spark', 'Star', 'Triangle',
      'makeArrow', 'makeCallout', 'makeCircle', 'makeEllipse', 'makeHeart', 'makePie', 'makePolygon', 'makeRect',
      'makeSpark', 'makeStar', 'makeTriangle',
    ]);
    // The old SVG element wrappers are gone from the main entry.
    for (const name of ['Rect', 'Circle']) {
      expect(main, name).not.toHaveProperty(name);
    }
    for (const name of ['parsePath', 'interpolatePath', 'interpolatePaths', 'warpPath', 'getBoundingBox', 'SVG', 'Path', 'G']) {
      expect(main, name).toHaveProperty(name);
    }
  });

  it('keeps three.js, lottie and the GIF decoder out of the main entry and the chunks it imports', () => {
    expect(main).not.toHaveProperty('DepthGallery3D');
    expect(main).not.toHaveProperty('ThreeCanvas');
    expect(main).not.toHaveProperty('Lottie');
    expect(main).not.toHaveProperty('Gif');
    expect(main).toHaveProperty('AnimatedImage');
    for (const entry of ['index.js', 'index.cjs']) {
      const files = relativeImportClosure(join(distDir, entry));
      expect(files.length).toBeGreaterThan(1); // it does import shared chunks
      for (const file of files) {
        const source = readFileSync(file, 'utf8');
        expect(source, relative(distDir, file)).not.toMatch(
          /(?:from|import|require)\s*\(?\s*['"](three|@react-three\/fiber|@react-three\/drei|lottie-web|omggif)['"]/,
        );
      }
    }
    expect(three).toHaveProperty('DepthGallery3D');
    expect(three).toHaveProperty('ThreeCanvas');
    expect(lottie).toHaveProperty('Lottie');
    expect(Object.keys(motionBlur).sort()).toEqual(['CameraMotionBlur', 'Trail']);
    expect(Object.keys(layoutUtils).sort()).toEqual(['fillTextBox', 'fitText', 'fitTextOnNLines', 'measureText']);
    expect(Object.keys(gif).sort()).toEqual(['Gif', 'getGifDurationInSeconds']);
    expect(Object.keys(mediaUtils).sort()).toEqual([
      'createSmoothSvgPath',
      'getAudioData',
      'getAudioDurationInSeconds',
      'getImageDimensions',
      'getVideoMetadata',
      'useAudioData',
      'useWindowedAudioData',
      'visualizeAudio',
      'visualizeAudioWaveform',
    ]);
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
    const entries = [
      ['.', 'index'],
      ['./three', 'three/index'],
      ['./lottie', 'lottie/index'],
      ['./motion-blur', 'motion-blur/index'],
      ['./layout-utils', 'layout-utils/index'],
      ['./gif', 'gif/index'],
      ['./media-utils', 'media-utils/index'],
      ['./shapes', 'shapes/index'],
    ];
    expect(Object.keys(pkg.exports)).toEqual(entries.map(([subpath]) => subpath));
    for (const [subpath, base] of entries) {
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
