/**
 * Runs against the built package (`bun run build` first): the subpath entries
 * must share one frame context with the main entry.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
// @ts-expect-error — built output, no types needed here
import * as main from '../dist/index.js';
// @ts-expect-error — built output
import { Player } from '../dist/player/Player.js';
// @ts-expect-error — built output
import * as three from '../dist/three/index.js';
// @ts-expect-error — built output
import * as lottie from '../dist/lottie/index.js';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('built entries', () => {
  it('Player from motionforge/player renders a scene that uses useCurrentFrame from motionforge', () => {
    const Scene = () => <b data-frame="x">{main.useCurrentFrame()}</b>;
    const html = renderToStaticMarkup(
      <Player component={Scene} durationInFrames={10} width={100} height={100} controls={false} />,
    );
    expect(html).toContain('data-frame="x">0<');
  });

  it('keeps three.js and lottie out of the main entry', () => {
    expect(main).not.toHaveProperty('DepthGallery3D');
    expect(main).not.toHaveProperty('Lottie');
    const source = readFileSync(fileURLToPath(new URL('../dist/index.js', import.meta.url)), 'utf8');
    expect(source).not.toMatch(/from ['"](three|@react-three\/fiber|@react-three\/drei|lottie-web)['"]/);
    expect(three).toHaveProperty('DepthGallery3D');
    expect(lottie).toHaveProperty('Lottie');
  });

  it('ships the Player stylesheet', () => {
    const css = fileURLToPath(new URL('../dist/styles.css', import.meta.url));
    expect(existsSync(css)).toBe(true);
    const text = readFileSync(css, 'utf8');
    for (const cls of ['rounded-2xl', 'bg-emerald-950', 'font-mono', 'bg-gradient-to-r']) {
      expect(text).toContain(cls);
    }
    expect(text).not.toContain('box-sizing:border-box;margin:0'); // no preflight
  });
});
