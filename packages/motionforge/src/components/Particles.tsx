'use client';

import React from 'react';
import { useCurrentFrame, useVideoConfig } from '../core/context';
import { getParticles, Particle, ParticleEmitterOptions } from '../utils/particles';

const SHAPES = {
  circle: undefined,
  square: undefined,
  triangle: 'polygon(50% 0%, 100% 100%, 0% 100%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
} as const;

export interface ParticlesProps extends ParticleEmitterOptions {
  /** Shape of the default particle element (default 'circle'). */
  shape?: keyof typeof SHAPES;
  /** Draws one particle instead of the default element (position it yourself, e.g. at particle.x / particle.y). */
  render?: (particle: Particle) => React.ReactNode;
  /** Style of the container: an absolutely positioned layer over the parent. */
  style?: React.CSSProperties;
  className?: string;
}

/**
 * Particle emitter: the particles of getParticles() at the current frame,
 * drawn in a layer over the parent (positions in px from its top left).
 *
 *   <Particles seed="burst" origin={{ x: 540, y: 960 }} count={60}
 *     lifetime={[0.6, 1.2]} speed={[300, 900]} gravity={1200} drag={1.5}
 *     size={[8, 16]} colors={['#ffd700', '#ff4d6d']} shape="star" />
 */
export const Particles: React.FC<ParticlesProps> = ({ shape = 'circle', render, style, className, ...options }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (!(shape in SHAPES)) {
    throw new Error(`Particles: shape must be one of ${Object.keys(SHAPES).join(', ')}, got ${JSON.stringify(shape)}`);
  }
  if (render !== undefined && typeof render !== 'function') {
    throw new Error('Particles: render must be a function of the particle');
  }
  const particles = getParticles({ ...options, frame, fps });

  return (
    <div className={className} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...style }}>
      {particles.map((particle) =>
        render ? (
          <React.Fragment key={particle.index}>{render(particle)}</React.Fragment>
        ) : (
          <div
            key={particle.index}
            style={{
              position: 'absolute',
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: shape === 'circle' ? '50%' : undefined,
              clipPath: SHAPES[shape],
              opacity: particle.opacity,
              transform: `translate(-50%, -50%) rotate(${particle.rotation}deg)`,
            }}
          />
        ),
      )}
    </div>
  );
};
