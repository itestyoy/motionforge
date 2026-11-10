/**
 * Runs against the built package (`bun run build` first): the subpath entries
 * must share one frame context with the main entry, and the main entry must
 * stay free of three.js and lottie-web.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
// @ts-expect-error — built output, no types needed here
import * as main from '../dist/index.js';
// @ts-expect-error — built output
import * as three from '../dist/three/index.js';
// @ts-expect-error — built output
import * as lottie from '../dist/lottie/index.js';

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

  it('keeps three.js and lottie out of the main entry', () => {
    expect(main).not.toHaveProperty('DepthGallery3D');
    expect(main).not.toHaveProperty('Lottie');
    const source = readFileSync(fileURLToPath(new URL('../dist/index.js', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/from ['"](three|@react-three\/fiber|@react-three\/drei|lottie-web)['"]/);
    expect(three).toHaveProperty('DepthGallery3D');
    expect(lottie).toHaveProperty('Lottie');
  });

  it('exposes no player or renderer', () => {
    for (const name of ['Player', 'PlayerProvider', 'renderVideo', 'VideoExportManager', 'useTimelineState']) {
      expect(main).not.toHaveProperty(name);
    }
  });
});
