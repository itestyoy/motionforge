'use client';

import React from 'react';
import { useCurrentFrame } from '../../core/context';
import { AbsoluteFill } from '../Media';
import { Freeze } from '../Sequence';
import { checkNumber } from './validate';

export interface CameraMotionBlurProps {
  children: React.ReactNode;
  /**
   * The share of a frame the shutter is open, in degrees (0 to 360, default
   * 180): 360 blurs over the whole frame interval, 0 renders one sharp sample.
   */
  shutterAngle?: number;
  /** How many sub-frame samples are averaged (an integer, default 10; 5–10 recommended). */
  samples?: number;
}

/**
 * Fewer samples near the start, so that no sample lands before frame 0
 * (Remotion's rule).
 */
const getNumberOfSamples = (shutterFraction: number, samples: number, currentFrame: number): number => {
  const maxOffset = shutterFraction * samples;
  // A shutter angle of 0 means no blur: one sample.
  if (maxOffset === 0) return 1;
  const maxTimeReverse = currentFrame - maxOffset;
  const factor = Math.min(1, Math.max(0, maxTimeReverse / maxOffset + 1));
  return Math.max(1, Math.round(Math.min(factor * samples, samples)));
};

/**
 * Remotion's `<CameraMotionBlur>` (`@remotion/motion-blur`): film-camera
 * motion blur. The children are rendered `samples` times at sub-frames
 * spread over the open shutter (through `<Freeze>`), each layer at
 * `1 / samples` opacity, added up with `mix-blend-mode: plus-lighter`. The
 * children must be absolutely positioned (e.g. an `AbsoluteFill`). The blend
 * changes colours slightly: keep `samples` low.
 */
export const CameraMotionBlur: React.FC<CameraMotionBlurProps> = ({
  children,
  shutterAngle = 180,
  samples = 10,
}) => {
  const currentFrame = useCurrentFrame();
  checkNumber('<CameraMotionBlur>', 'samples', samples, true);
  checkNumber('<CameraMotionBlur>', 'shutterAngle', shutterAngle);
  if (shutterAngle < 0 || shutterAngle > 360) {
    throw new TypeError(`<CameraMotionBlur>: "shutterAngle" must be between 0 and 360, got ${shutterAngle}`);
  }

  const shutterFraction = shutterAngle / 360;
  const actualSamples = getNumberOfSamples(shutterFraction, samples, currentFrame);

  return (
    <AbsoluteFill style={{ isolation: 'isolate' }}>
      {Array.from({ length: actualSamples }, (_, i) => {
        const sampleFrameOffset = shutterFraction * ((i + 1) / actualSamples);
        return (
          <AbsoluteFill
            key={`frame-${i}`}
            style={{ mixBlendMode: 'plus-lighter', filter: `opacity(${1 / actualSamples})` }}
          >
            <Freeze frame={currentFrame - sampleFrameOffset + 1}>{children}</Freeze>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
