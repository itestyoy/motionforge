import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrameProvider, useCurrentFrame } from '../src/core/context';
import { CameraMotionBlur, Trail } from '../src/motion-blur';
import * as entry from '../src/index';

const ShowFrame = () => <i data-frame="">{useCurrentFrame()}</i>;

const renderAt = (frame: number, node: React.ReactNode) =>
  renderToStaticMarkup(
    <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100}>
      {node}
    </FrameProvider>,
  );

const framesOf = (html: string) => [...html.matchAll(/data-frame="">([^<]*)</g)].map((m) => Number(m[1]));
const opacitiesOf = (html: string) =>
  [...html.matchAll(/opacity:\s*([-\d.e]+)/g)].map((m) => Number(m[1]));

describe('Trail', () => {
  it('renders the children at earlier frames below the content (Remotion formula)', () => {
    const html = renderAt(20, <Trail layers={4} lagInFrames={1.5} trailOpacity={0.8}><ShowFrame /></Trail>);
    // Oldest layer first, the content itself last.
    expect(framesOf(html)).toEqual([14, 15.5, 17, 18.5, 20]);
    // trailOpacity - ((layers - i) / layers) * trailOpacity
    const opacities = opacitiesOf(html);
    expect(opacities).toHaveLength(4);
    [0, 0.2, 0.4, 0.6].forEach((expected, i) => expect(opacities[i]).toBeCloseTo(expected, 10));
  });

  it('renders only the content with 0 layers', () => {
    expect(framesOf(renderAt(5, <Trail layers={0} lagInFrames={1} trailOpacity={1}><ShowFrame /></Trail>))).toEqual([5]);
  });

  it('checks its props', () => {
    const render = (props: Partial<React.ComponentProps<typeof Trail>>) => () =>
      renderAt(0, <Trail layers={2} lagInFrames={1} trailOpacity={1} {...props}><ShowFrame /></Trail>);
    expect(render({ layers: 1.5 })).toThrow(/"layers" must be a non-negative integer, got 1.5/);
    expect(render({ layers: -1 })).toThrow(/"layers" must be a non-negative integer/);
    expect(render({ lagInFrames: Number.NaN })).toThrow(/"lagInFrames" must be a finite number/);
    // @ts-expect-error not a number
    expect(render({ trailOpacity: '1' })).toThrow(/"trailOpacity" must be a finite number/);
  });

  it('is the only Trail: the main entry has none', () => {
    expect(entry).not.toHaveProperty('Trail');
  });
});

describe('CameraMotionBlur', () => {
  it('averages samples at sub-frames over the open shutter', () => {
    const html = renderAt(30, <CameraMotionBlur shutterAngle={180} samples={4}><ShowFrame /></CameraMotionBlur>);
    // currentFrame - shutterFraction * (sample / samples) + 1
    expect(framesOf(html)).toEqual([30.875, 30.75, 30.625, 30.5]);
    expect(html.match(/opacity\(0\.25\)/g)).toHaveLength(4);
    expect(html).toContain('mix-blend-mode:plus-lighter');
    expect(html).toContain('isolation:isolate');
  });

  it('uses fewer samples near frame 0 and one sample for shutterAngle 0', () => {
    // factor = clamp((frame - fraction * samples) / (fraction * samples) + 1, 0, 1)
    expect(framesOf(renderAt(0, <CameraMotionBlur samples={10}><ShowFrame /></CameraMotionBlur>))).toEqual([0.5]);
    expect(framesOf(renderAt(2, <CameraMotionBlur samples={10}><ShowFrame /></CameraMotionBlur>))).toHaveLength(4);
    expect(framesOf(renderAt(9, <CameraMotionBlur shutterAngle={0}><ShowFrame /></CameraMotionBlur>))).toEqual([10]);
  });

  it('defaults to 180 degrees and 10 samples', () => {
    expect(framesOf(renderAt(100, <CameraMotionBlur><ShowFrame /></CameraMotionBlur>))).toHaveLength(10);
  });

  it('checks its props', () => {
    const render = (props: Partial<React.ComponentProps<typeof CameraMotionBlur>>) => () =>
      renderAt(0, <CameraMotionBlur {...props}><ShowFrame /></CameraMotionBlur>);
    expect(render({ shutterAngle: 400 })).toThrow(/"shutterAngle" must be between 0 and 360, got 400/);
    expect(render({ samples: 2.5 })).toThrow(/"samples" must be a non-negative integer/);
    expect(render({ samples: Number.NaN })).toThrow(/"samples" must be a finite number/);
  });
});
