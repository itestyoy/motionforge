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
import * as transitionsEntry from '../dist/transitions/index.js';
// @ts-ignore
import * as fadeEntry from '../dist/transitions/fade.js';
// @ts-ignore
import * as shapesEntry from '../dist/shapes/index.js';
// @ts-ignore
import * as audioEntry from '../dist/audio/index.js';
const transitions: any = transitionsEntry;
const fadeModule: any = fadeEntry;
const shapes: any = shapesEntry;
const audioModule: any = audioEntry;
const PRESENTATIONS = ['fade', 'slide', 'wipe', 'flip', 'clock-wipe', 'iris', 'cube', 'none', 'push-cut'];

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

  it('lets motionforge/transitions render scenes of a FrameProvider from motionforge', () => {
    const Scene = ({ id }: { id: string }) => <b data-id={id}>{main.useCurrentFrame()}</b>;
    const html = renderToStaticMarkup(
      <main.FrameProvider frame={25} fps={30} durationInFrames={100} width={100} height={100}>
        <transitions.TransitionSeries>
          <transitions.TransitionSeries.Sequence durationInFrames={40}><Scene id="a" /></transitions.TransitionSeries.Sequence>
          <transitions.TransitionSeries.Transition timing={transitions.linearTiming({ durationInFrames: 30 })} presentation={fadeModule.fade()} />
          <transitions.TransitionSeries.Sequence durationInFrames={60}><Scene id="b" /></transitions.TransitionSeries.Sequence>
        </transitions.TransitionSeries>
      </main.FrameProvider>,
    );
    expect(html).toContain('data-id="a">25<');
    expect(html).toMatch(/opacity:0\.5[^"]*"><b data-id="b">15</);
  });

  it('exports the transitions, presentations and shapes as in Remotion', async () => {
    expect(Object.keys(transitions).sort()).toEqual(['TransitionSeries', 'linearTiming', 'pushCut', 'springTiming', 'useTransitionProgress']);
    for (const name of PRESENTATIONS) {
      const module = await import(`../dist/transitions/${name}.js`);
      const fn = name.replace(/-(.)/g, (_, c: string) => c.toUpperCase());
      expect(Object.keys(module), name).toEqual([fn]);
    }
    expect(Object.keys(shapes).sort()).toEqual([
      'Arrow', 'Callout', 'Circle', 'Ellipse', 'Heart', 'Pie', 'Polygon', 'Rect', 'Spark', 'Star', 'Triangle',
      'makeArrow', 'makeCallout', 'makeCircle', 'makeEllipse', 'makeHeart', 'makePie', 'makePolygon', 'makeRect',
      'makeSpark', 'makeStar', 'makeTriangle',
    ]);
    // The old SVG element wrappers and transition helpers are gone from the main entry.
    for (const name of ['Rect', 'Circle', 'TransitionSeries', 'fade', 'slide', 'wipe', 'flip', 'transitions', 'combine', 'scaleTransition']) {
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
          /(?:from|import|require)\s*\(?\s*['"](three|@react-three\/fiber|@react-three\/drei|lottie-web|omggif|tone)['"]/,
        );
      }
    }
    expect(three).toHaveProperty('DepthGallery3D');
    expect(three).toHaveProperty('ThreeCanvas');
    expect(lottie).toHaveProperty('Lottie');
    expect(Object.keys(motionBlur).sort()).toEqual(['CameraMotionBlur', 'Trail']);
    expect(Object.keys(layoutUtils).sort()).toEqual(['fillTextBox', 'fitText', 'fitTextOnNLines', 'measureText']);
    expect(Object.keys(gif).sort()).toEqual(['Gif', 'getGifDurationInSeconds']);
    expect(Object.keys(audioModule).sort()).toEqual(['Sfx', 'ToneAudio', 'renderZzfx']);
    expect(main).toHaveProperty('createAudioCollector');
    expect(main).toHaveProperty('collectAudioTracks');
    expect(main).toHaveProperty('useIsCollectingAudio');
    for (const name of ['ToneAudio', 'Sfx', 'renderZzfx']) expect(main, name).not.toHaveProperty(name);
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

  it('imports the optional tone only when a ToneAudio renders, also from CommonJS', () => {
    for (const entry of ['audio/index.js', 'audio/index.cjs']) {
      const source = relativeImportClosure(join(distDir, entry)).map((file) => readFileSync(file, 'utf8')).join('\n');
      expect(source, entry).toContain("import('tone')");
      expect(source, entry).not.toMatch(/(?:from\s*|require\s*\(\s*)['"]tone['"]/);
    }
  });

  it('loads the server renderer of collectAudioTracks() only when it is called', () => {
    for (const entry of ['index.js', 'index.cjs']) {
      const source = relativeImportClosure(join(distDir, entry)).map((file) => readFileSync(file, 'utf8')).join('\n');
      expect(source, entry).toMatch(/import\(['"]react-dom\/server['"]\)/);
      expect(source, entry).not.toMatch(/(?:from\s*|require\s*\(\s*)['"]react-dom\/server['"]/);
    }
  });

  it('collects the audio tracks of a scene from the built entries', async () => {
    const tracks = await main.collectAudioTracks(
      <main.Sequence from={10}>
        <main.Audio src="a.mp3" />
        <audioModule.Sfx zzfx={[1, 0, 440, 0, 0.05]} />
      </main.Sequence>,
      { durationInFrames: 30, width: 10, height: 10 },
    );
    expect(tracks.map((t: any) => [t.src ?? t.generated.kind, t.startFrame])).toEqual(
      expect.arrayContaining([['a.mp3', 10], ['zzfx', 10]]),
    );
  });

  it('lets motionforge/audio see the timeline of a FrameProvider from motionforge', () => {
    // Sfx checks its frame against the end of the enclosing Sequence (from the main entry).
    expect(() =>
      renderToStaticMarkup(
        <main.FrameProvider frame={10} durationInFrames={100} width={100} height={100}>
          <main.Sequence from={10} durationInFrames={20}>
            <audioModule.Sfx at={25} zzfx={[1, 0, 440]} />
          </main.Sequence>
        </main.FrameProvider>,
      ),
    ).toThrow(/at=\{25\} is not before the end of its sequence/);
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
      ['./transitions', 'transitions/index'],
      ...PRESENTATIONS.map((name) => [`./transitions/${name}`, `transitions/${name}`]),
      ['./shapes', 'shapes/index'],
      ['./audio', 'audio/index'],
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
