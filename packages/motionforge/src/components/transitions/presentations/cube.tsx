'use client';

// The geometry follows Remotion's cube() presentation (MIT, Copyright 2023
// Mohit Yadav, Copyright (c) 2026 Remotion AG).
import React from 'react';
import { interpolate } from '../../../utils/animation';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { checkDirection, checkOptions, checkPositive } from './validate';

export type CubeDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';

export type CubeProps = {
  direction: CubeDirection;
  /** CSS perspective in px. Default 1000. */
  perspective?: number;
};

const DIRECTIONS: readonly CubeDirection[] = ['from-left', 'from-right', 'from-top', 'from-bottom'];

const CubePresentation: React.FC<TransitionPresentationComponentProps<CubeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps: { direction, perspective = 1000 },
}) => {
  const isEntering = presentationDirection === 'entering';
  const turnsForward = direction === 'from-right' || direction === 'from-top';
  const startsAfter = direction === 'from-right' || direction === 'from-bottom';
  const vertical = direction === 'from-top' || direction === 'from-bottom';

  const rotation = isEntering
    ? interpolate(presentationProgress, [0, 1], [turnsForward ? 90 : -90, 0])
    : interpolate(presentationProgress, [0, 1], [0, turnsForward ? -90 : 90]);
  const position = isEntering
    ? interpolate(presentationProgress, [0, 1], [startsAfter ? 100 : -100, 0])
    : interpolate(presentationProgress, [0, 1], [0, startsAfter ? -100 : 100]);
  const transformOrigin = isEntering
    ? { 'from-left': 'right', 'from-bottom': 'top', 'from-top': 'bottom', 'from-right': 'left' }[direction]
    : { 'from-left': 'left', 'from-bottom': 'bottom', 'from-top': 'top', 'from-right': 'right' }[direction];

  return (
    <AbsoluteFill style={{ perspective, transformStyle: 'preserve-3d' }}>
      <AbsoluteFill
        style={{
          width: '100%',
          height: '100%',
          transformOrigin,
          transform: `${vertical ? 'translateY' : 'translateX'}(${position}%) ${vertical ? 'rotateX' : 'rotateY'}(${rotation}deg)`,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Both scenes turn as two faces of a 3D cube (Remotion's cube()). */
export const cube = (props: CubeProps): TransitionPresentation<CubeProps> => {
  const options = checkOptions('cube', props, true);
  checkDirection('cube', options.direction, DIRECTIONS, true);
  checkPositive('cube', 'perspective', options.perspective);
  return { component: CubePresentation, props: options };
};
