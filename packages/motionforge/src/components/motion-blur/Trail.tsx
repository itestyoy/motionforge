'use client';

import React from 'react';
import { useCurrentFrame } from '../../core/context';
import { AbsoluteFill } from '../Media';
import { Freeze } from '../Sequence';
import { checkNumber } from './validate';

export interface TrailProps {
  children: React.ReactNode;
  /** How many layers are added below the content (an integer >= 0). */
  layers: number;
  /** How many frames each layer lags behind the next one; fractions are allowed. */
  lagInFrames: number;
  /** The opacity of the layer closest to the content; older layers fade linearly to 0. */
  trailOpacity: number;
}

/**
 * Remotion's `<Trail>` (`@remotion/motion-blur`): renders the children again
 * below themselves at earlier frames, each layer `lagInFrames` further back
 * in time (through `<Freeze>`) and more transparent. The children must be
 * absolutely positioned (e.g. an `AbsoluteFill`), since every layer is a full
 * copy laid over the others.
 */
export const Trail: React.FC<TrailProps> = ({ children, layers, lagInFrames, trailOpacity }) => {
  const frame = useCurrentFrame();
  checkNumber('<Trail>', 'layers', layers, true);
  checkNumber('<Trail>', 'lagInFrames', lagInFrames);
  checkNumber('<Trail>', 'trailOpacity', trailOpacity);

  return (
    <AbsoluteFill>
      {Array.from({ length: layers }, (_, i) => (
        <AbsoluteFill
          key={`frame-${i}`}
          style={{ opacity: trailOpacity - ((layers - i) / layers) * trailOpacity }}
        >
          <Freeze frame={frame - lagInFrames * (layers - i)}>{children}</Freeze>
        </AbsoluteFill>
      ))}
      {children}
    </AbsoluteFill>
  );
};
