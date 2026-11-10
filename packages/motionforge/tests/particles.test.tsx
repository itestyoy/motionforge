import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { getParticles, ParticleEmitterOptions } from '../src/utils/particles';
import { Particles } from '../src/components/Particles';
import { ParticleSystem } from '../src/components/Effects';

const base: ParticleEmitterOptions = {
  seed: 'test',
  origin: { x: 100, y: 200 },
  count: 20,
  lifetime: 2,
  speed: [100, 300],
  size: [4, 8],
};

// One particle flying right at 100 px/s.
const single: ParticleEmitterOptions = { ...base, count: 1, speed: 100, angle: 0, spread: 0, size: 5 };

describe('getParticles', () => {
  it('is deterministic per seed', () => {
    const a = getParticles({ ...base, frame: 15, fps: 30 });
    expect(getParticles({ ...base, frame: 15, fps: 30 })).toEqual(a);
    expect(getParticles({ ...base, seed: 'other', frame: 15, fps: 30 })).not.toEqual(a);
    expect(a).toHaveLength(20);
  });

  it('moves in px per second, whatever the fps', () => {
    const at30 = getParticles({ ...base, gravity: 500, drag: 1, frame: 15, fps: 30 });
    const at60 = getParticles({ ...base, gravity: 500, drag: 1, frame: 30, fps: 60 });
    at30.forEach((p, i) => {
      expect(at60[i].x).toBeCloseTo(p.x, 9);
      expect(at60[i].y).toBeCloseTo(p.y, 9);
    });
  });

  it('follows speed, gravity and drag', () => {
    const [plain] = getParticles({ ...single, frame: 15, fps: 30 });
    expect(plain.x).toBeCloseTo(150, 9);
    expect(plain.y).toBeCloseTo(200, 9);
    const [falling] = getParticles({ ...single, gravity: 200, frame: 15, fps: 30 });
    expect(falling.y).toBeCloseTo(200 + 0.5 * 200 * 0.25, 9);
    expect(falling.vy).toBeCloseTo(100, 9);
    // v = v0·e^(-kt): x = x0 + v0 (1 - e^(-kt)) / k
    const [dragged] = getParticles({ ...single, drag: 2, frame: 15, fps: 30 });
    expect(dragged.x).toBeCloseTo(100 + (100 * (1 - Math.exp(-1))) / 2, 9);
    expect(dragged.vx).toBeCloseTo(100 * Math.exp(-1), 9);
    // With drag, gravity reaches a fall speed of gravity / drag.
    const [terminal] = getParticles({ ...single, gravity: 300, drag: 3, lifetime: 100, frame: 1500, fps: 30 });
    expect(terminal.vy).toBeCloseTo(100, 9);
  });

  it('emits within the cone', () => {
    const particles = getParticles({ ...base, count: 200, angle: -90, spread: 60, frame: 3, fps: 30 });
    for (const p of particles) {
      const degrees = (Math.atan2(p.vy, p.vx) * 180) / Math.PI;
      expect(degrees).toBeGreaterThanOrEqual(-120);
      expect(degrees).toBeLessThanOrEqual(-60);
    }
  });

  it('gives each particle its own birth, lifetime and fade', () => {
    const options = { ...base, count: 10, emitDuration: 1, lifetime: 0.5, startFrame: 30 };
    expect(getParticles({ ...options, frame: 29, fps: 30 })).toEqual([]);
    expect(getParticles({ ...options, frame: 30, fps: 30 }).map((p) => p.index)).toEqual([0]);
    // 0.45 s in: births at 0, 0.1, ... 0.4 s; none has reached its 0.5 s yet.
    const later = getParticles({ ...options, frame: 30 + 13.5, fps: 30 });
    expect(later.map((p) => p.index)).toEqual([0, 1, 2, 3, 4]);
    expect(later[0].opacity).toBeCloseTo(1 - 0.45 / 0.5, 9);
    expect(later[4].opacity).toBeCloseTo(1 - 0.05 / 0.5, 9);
    // 0.75 s in: particles 0-2 are gone.
    expect(getParticles({ ...options, frame: 30 + 22.5, fps: 30 }).map((p) => p.index)).toEqual([3, 4, 5, 6, 7]);
    expect(getParticles({ ...options, fadeOut: false, frame: 40, fps: 30 })[0].opacity).toBe(1);
  });

  it('picks lifetimes from a range', () => {
    const lifetimes = getParticles({ ...base, count: 50, lifetime: [1, 3], frame: 0, fps: 30 }).map((p) => p.lifetime);
    expect(Math.min(...lifetimes)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...lifetimes)).toBeLessThanOrEqual(3);
    expect(new Set(lifetimes).size).toBeGreaterThan(40);
  });

  it('births particles where a moving origin was at their birth (trails)', () => {
    const trail = getParticles({
      ...single,
      count: 4,
      speed: 0,
      emitDuration: 1,
      origin: (frame) => ({ x: frame * 10, y: 0 }),
      frame: 30,
      fps: 30,
    });
    expect(trail.map((p) => p.x)).toEqual([0, 75, 150, 225]);
  });

  it('spawns inside the area', () => {
    const particles = getParticles({ ...base, count: 100, speed: 0, area: { width: 1080, height: 10 }, frame: 0, fps: 30 });
    for (const p of particles) {
      expect(Math.abs(p.x - 100)).toBeLessThanOrEqual(540);
      expect(Math.abs(p.y - 200)).toBeLessThanOrEqual(5);
    }
    expect(Math.max(...particles.map((p) => p.x)) - Math.min(...particles.map((p) => p.x))).toBeGreaterThan(800);
  });

  it('rotates with spin in degrees per second', () => {
    const [p] = getParticles({ ...single, rotation: 10, spin: 90, frame: 30, fps: 30 });
    expect(p.rotation).toBe(100);
  });

  it('throws on wrong input', () => {
    const frame = { frame: 0, fps: 30 };
    expect(() => getParticles({ ...base, count: -1, ...frame })).toThrow(/count must be a non-negative integer/);
    expect(() => getParticles({ ...base, count: 1.5, ...frame })).toThrow(/count must be a non-negative integer/);
    expect(() => getParticles({ ...base, lifetime: 0, ...frame })).toThrow(/lifetime must be a positive number/);
    expect(() => getParticles({ ...base, speed: [300, 100], ...frame })).toThrow(/speed must be a non-negative number or \[min, max\]/);
    expect(() => getParticles({ ...base, size: Number.NaN, ...frame })).toThrow(/size must be/);
    expect(() => getParticles({ ...base, spread: 400, ...frame })).toThrow(/spread must be between 0 and 360/);
    expect(() => getParticles({ ...base, colors: [], ...frame })).toThrow(/colors must be a non-empty array/);
    expect(() => getParticles({ ...base, drag: -1, ...frame })).toThrow(/drag must be a number >= 0/);
    expect(() => getParticles({ ...base, fps: 0, frame: 0 })).toThrow(/fps must be a positive number/);
    expect(() => getParticles({ ...base, origin: { x: Number.NaN, y: 0 }, ...frame })).toThrow(/origin must be/);
    expect(() => getParticles({ ...base, origin: () => ({ x: 0, y: Number.NaN }), ...frame })).toThrow(
      /origin\(0\) must return \{ x, y \}/,
    );
  });
});

describe('<Particles>', () => {
  const renderAt = (frame: number, node: React.ReactNode) =>
    renderToStaticMarkup(
      <FrameProvider frame={frame} fps={30} durationInFrames={300} width={1080} height={1920}>
        {node}
      </FrameProvider>,
    );

  it('draws the live particles at the current frame', () => {
    const html = renderAt(15, <Particles {...single} colors={['#ff0000']} shape="star" />);
    expect(html).toContain('left:150px;top:200px;width:5px;height:5px;background-color:#ff0000');
    expect(html).toContain('clip-path:polygon(');
    expect(html).toContain('opacity:0.75');
    expect(renderAt(90, <Particles {...single} />)).toBe(
      '<div style="position:absolute;inset:0;pointer-events:none"></div>',
    );
  });

  it('uses render for each particle', () => {
    const html = renderAt(
      0,
      <Particles {...base} count={3} render={(p) => <b data-index={p.index}>{p.color}</b>} />,
    );
    expect(html.match(/<b data-index/g)).toHaveLength(3);
  });

  it('throws on an unknown shape', () => {
    // @ts-expect-error unknown shape
    expect(() => renderAt(0, <Particles {...base} shape="hexagon" />)).toThrow(/shape must be one of/);
  });
});

describe('ParticleSystem', () => {
  it('has no explode mode any more', () => {
    expect(() =>
      renderToStaticMarkup(
        <FrameProvider frame={0} durationInFrames={10} width={100} height={100}>
          {/* @ts-expect-error removed */}
          <ParticleSystem direction="explode" />
        </FrameProvider>,
      ),
    ).toThrow(/direction must be one of random, up, down, left, right/);
  });
});
