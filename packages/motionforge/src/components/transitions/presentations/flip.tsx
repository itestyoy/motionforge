'use client';

import React from 'react';
import { interpolate } from '../../../utils/animation';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkDirection, checkOptions, checkPositive } from './validate';

export type FlipDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';

export type FlipProps = {
  /** Default 'from-left'. */
  direction?: FlipDirection;
  /** CSS perspective in px. Default 1000. */
  perspective?: number;
  outerEnterStyle?: React.CSSProperties;
  outerExitStyle?: React.CSSProperties;
  innerEnterStyle?: React.CSSProperties;
  innerExitStyle?: React.CSSProperties;
};

const DIRECTIONS: readonly FlipDirection[] = ['from-left', 'from-right', 'from-top', 'from-bottom'];

const FlipPresentation: React.FC<TransitionPresentationComponentProps<FlipProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps: { direction = 'from-left', perspective = 1000, innerEnterStyle, innerExitStyle, outerEnterStyle, outerExitStyle },
}) => {
  const isEntering = presentationDirection === 'entering';
  const forwards = direction === 'from-right' || direction === 'from-top';
  const rotation = isEntering
    ? interpolate(presentationProgress, [0, 1], [forwards ? 180 : -180, 0])
    : interpolate(presentationProgress, [0, 1], [0, forwards ? -180 : 180]);
  const rotateProperty = direction === 'from-top' || direction === 'from-bottom' ? 'rotateX' : 'rotateY';
  return (
    <AbsoluteFill
      style={{
        perspective,
        // The children's back faces stay hidden too.
        transformStyle: 'preserve-3d',
        ...byDirection(isEntering, outerEnterStyle, outerExitStyle),
      }}
    >
      <AbsoluteFill
        style={{
          width: '100%',
          height: '100%',
          transform: `${rotateProperty}(${rotation}deg)`,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          ...byDirection(isEntering, innerEnterStyle, innerExitStyle),
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The exiting scene flips over and shows the entering one on its back (Remotion's flip()). */
export const flip = (props?: FlipProps): TransitionPresentation<FlipProps> => {
  const options = checkOptions('flip', props);
  checkDirection('flip', options.direction, DIRECTIONS);
  checkPositive('flip', 'perspective', options.perspective);
  return { component: FlipPresentation, props: options };
};
