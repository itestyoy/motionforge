import { random } from './animation';

/**
 * Particle emitter as a pure function of the frame: bursts, sparkles,
 * confetti rains, trails. Time quantities are in seconds and motion in px per
 * second, so the same emitter looks the same at any fps; `startFrame` is the
 * timeline position of the first birth. All randomness comes from
 * random(seed, ...).
 */

/** A fixed value, or [min, max] to pick per particle (uniformly, from the seed). */
export type ParticleRange = number | readonly [number, number];

export interface ParticlePoint {
  x: number;
  y: number;
}

export interface ParticleEmitterOptions {
  /** Seed of all randomness: the same seed gives the same particles. */
  seed: string | number;
  /**
   * Where particles are born, in px. A function gets the birth frame (it may
   * be fractional) and lets the emitter move, e.g. for trails.
   */
  origin: ParticlePoint | ((frame: number) => ParticlePoint);
  /** Particles are born anywhere in a width x height rectangle centred on the origin (default 0 x 0). */
  area?: { width: number; height: number };
  /** Frame of the first birth (default 0). */
  startFrame?: number;
  /** Number of particles (a non-negative integer). */
  count: number;
  /** Seconds over which the births are spread evenly (default 0: all at once, a burst). */
  emitDuration?: number;
  /** Seconds each particle lives (> 0). */
  lifetime: ParticleRange;
  /** Initial speed in px per second (>= 0). */
  speed: ParticleRange;
  /** Direction of emission in degrees: 0 right, 90 down, -90 up (default -90). */
  angle?: number;
  /** Width of the emission cone in degrees, centred on `angle`, 0 to 360 (default 360). */
  spread?: number;
  /** Acceleration in px per second² along +y (down; default 0). */
  gravity?: number;
  /** Air drag in 1/s: velocity decays as e^(-drag·t) towards the fall speed (default 0). */
  drag?: number;
  /** Size in px (>= 0). */
  size: ParticleRange;
  /** Colors; each particle gets one (default ['#ffffff']). */
  colors?: readonly string[];
  /** Initial rotation in degrees (default 0). */
  rotation?: ParticleRange;
  /** Rotation speed in degrees per second (default 0). */
  spin?: ParticleRange;
  /** Opacity goes linearly from 1 at birth to 0 at the end of the life (default true). */
  fadeOut?: boolean;
}

export interface Particle {
  /** Stable index of the particle (0 to count - 1). */
  index: number;
  /** Position in px. */
  x: number;
  y: number;
  /** Velocity in px per second. */
  vx: number;
  vy: number;
  size: number;
  /** Rotation in degrees. */
  rotation: number;
  color: string;
  opacity: number;
  /** Seconds since birth. */
  age: number;
  /** Seconds the particle lives. */
  lifetime: number;
  /** age / lifetime, from 0 up to (not including) 1. */
  progress: number;
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const checkRange = (name: string, range: unknown, values: 'positive' | 'non-negative' | 'finite') => {
  const list = Array.isArray(range) ? range : [range];
  const valid = (v: unknown) =>
    finite(v) && (values === 'positive' ? v > 0 : values === 'non-negative' ? v >= 0 : true);
  const ok =
    (typeof range === 'number' || (Array.isArray(range) && range.length === 2)) &&
    list.every(valid) &&
    (list.length === 1 || list[0] <= list[1]);
  if (!ok) {
    throw new Error(
      `getParticles: ${name} must be a ${values} number or [min, max] of them with min <= max, got ${JSON.stringify(range)}`,
    );
  }
};

const pick = (range: ParticleRange, key: string): number =>
  typeof range === 'number' ? range : range[0] + random(key) * (range[1] - range[0]);

const checkOptions = (options: ParticleEmitterOptions & { frame: number; fps: number }) => {
  const { seed, origin, area, startFrame = 0, count, emitDuration = 0, lifetime, speed, angle = -90, spread = 360 } = options;
  const { gravity = 0, drag = 0, size, colors = ['#ffffff'], rotation = 0, spin = 0, fadeOut = true, frame, fps } = options;
  if (!finite(frame)) throw new Error(`getParticles: frame must be a finite number, got ${frame}`);
  if (!finite(fps) || fps <= 0) throw new Error(`getParticles: fps must be a positive number, got ${fps}`);
  if (typeof seed !== 'string' && !finite(seed)) {
    throw new Error(`getParticles: seed must be a string or a finite number, got ${JSON.stringify(seed)}`);
  }
  if (typeof origin !== 'function' && (typeof origin !== 'object' || origin === null || !finite(origin.x) || !finite(origin.y))) {
    throw new Error(`getParticles: origin must be { x, y } or a function of the frame, got ${JSON.stringify(origin)}`);
  }
  if (area !== undefined && (typeof area !== 'object' || !finite(area.width) || !finite(area.height) || area.width < 0 || area.height < 0)) {
    throw new Error(`getParticles: area must be { width, height } with numbers >= 0, got ${JSON.stringify(area)}`);
  }
  if (!finite(startFrame)) throw new Error(`getParticles: startFrame must be a finite number, got ${startFrame}`);
  if (!Number.isInteger(count) || count < 0) {
    throw new Error(`getParticles: count must be a non-negative integer, got ${count}`);
  }
  if (!finite(emitDuration) || emitDuration < 0) {
    throw new Error(`getParticles: emitDuration must be a number of seconds >= 0, got ${emitDuration}`);
  }
  checkRange('lifetime', lifetime, 'positive');
  checkRange('speed', speed, 'non-negative');
  checkRange('size', size, 'non-negative');
  checkRange('rotation', rotation, 'finite');
  checkRange('spin', spin, 'finite');
  if (!finite(angle)) throw new Error(`getParticles: angle must be a finite number of degrees, got ${angle}`);
  if (!finite(spread) || spread < 0 || spread > 360) {
    throw new Error(`getParticles: spread must be between 0 and 360 degrees, got ${spread}`);
  }
  if (!finite(gravity)) throw new Error(`getParticles: gravity must be a finite number, got ${gravity}`);
  if (!finite(drag) || drag < 0) throw new Error(`getParticles: drag must be a number >= 0, got ${drag}`);
  if (!Array.isArray(colors) || colors.length === 0 || colors.some((c) => typeof c !== 'string')) {
    throw new Error(`getParticles: colors must be a non-empty array of strings, got ${JSON.stringify(colors)}`);
  }
  if (typeof fadeOut !== 'boolean') throw new Error(`getParticles: fadeOut must be a boolean, got ${fadeOut}`);
};

/**
 * The particles alive at `frame`, with their position, velocity, size,
 * rotation, color and opacity. Particle `i` is born `emitDuration · i / count`
 * seconds after `startFrame` and lives `lifetime` seconds.
 */
export const getParticles = (options: ParticleEmitterOptions & { frame: number; fps: number }): Particle[] => {
  checkOptions(options);
  const {
    seed,
    origin,
    area = { width: 0, height: 0 },
    startFrame = 0,
    count,
    emitDuration = 0,
    lifetime,
    speed,
    angle = -90,
    spread = 360,
    gravity = 0,
    drag = 0,
    size,
    colors = ['#ffffff'],
    rotation = 0,
    spin = 0,
    fadeOut = true,
    frame,
    fps,
  } = options;

  const now = (frame - startFrame) / fps;
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const key = (name: string) => `${seed}:${i}:${name}`;
    const birth = (emitDuration * i) / count;
    const age = now - birth;
    if (age < 0) continue;
    const life = pick(lifetime, key('lifetime'));
    if (age >= life) continue;

    const birthOrigin = typeof origin === 'function' ? origin(startFrame + birth * fps) : origin;
    if (typeof birthOrigin !== 'object' || birthOrigin === null || !finite(birthOrigin.x) || !finite(birthOrigin.y)) {
      throw new Error(`getParticles: origin(${startFrame + birth * fps}) must return { x, y } with finite numbers, got ${JSON.stringify(birthOrigin)}`);
    }
    const x0 = birthOrigin.x + (random(key('x')) - 0.5) * area.width;
    const y0 = birthOrigin.y + (random(key('y')) - 0.5) * area.height;
    const direction = ((angle + (random(key('angle')) - 0.5) * spread) * Math.PI) / 180;
    const v0 = pick(speed, key('speed'));
    const vx0 = Math.cos(direction) * v0;
    const vy0 = Math.sin(direction) * v0;

    // Closed form of dv/dt = (0, gravity) - drag · v.
    let x: number;
    let y: number;
    let vx: number;
    let vy: number;
    if (drag === 0) {
      x = x0 + vx0 * age;
      y = y0 + vy0 * age + (gravity * age * age) / 2;
      vx = vx0;
      vy = vy0 + gravity * age;
    } else {
      const decay = Math.exp(-drag * age);
      const terminal = gravity / drag;
      x = x0 + (vx0 * (1 - decay)) / drag;
      y = y0 + terminal * age + ((vy0 - terminal) * (1 - decay)) / drag;
      vx = vx0 * decay;
      vy = terminal + (vy0 - terminal) * decay;
    }

    const progress = age / life;
    particles.push({
      index: i,
      x,
      y,
      vx,
      vy,
      size: pick(size, key('size')),
      rotation: pick(rotation, key('rotation')) + pick(spin, key('spin')) * age,
      color: colors[Math.min(colors.length - 1, Math.floor(random(key('color')) * colors.length))],
      opacity: fadeOut ? 1 - progress : 1,
      age,
      lifetime: life,
      progress,
    });
  }
  return particles;
};
