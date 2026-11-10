'use client';

import React from 'react';
import { translatePath } from '../../../utils/path/transform';
import { makePie } from '../../shapes/make-shapes';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkOptions, checkPositive } from './validate';

export type ClockWipeProps = {
  /** Width of the scene in px (e.g. useVideoConfig().width). */
  width: number;
  /** Height of the scene in px. */
  height: number;
  outerEnterStyle?: React.CSSProperties;
  outerExitStyle?: React.CSSProperties;
  innerEnterStyle?: React.CSSProperties;
  innerExitStyle?: React.CSSProperties;
};

const ClockWipePresentation: React.FC<TransitionPresentationComponentProps<ClockWipeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const isEntering = presentationDirection === 'entering';
  // A pie large enough to cover the corners, centered on the scene.
  const radius = Math.sqrt(passedProps.width ** 2 + passedProps.height ** 2) / 2;
  const { path } = makePie({ radius, progress: presentationProgress });
  const clip = translatePath(path, -(radius * 2 - passedProps.width) / 2, -(radius * 2 - passedProps.height) / 2);
  return (
    <AbsoluteFill style={byDirection(isEntering, passedProps.outerEnterStyle, passedProps.outerExitStyle)}>
      <AbsoluteFill
        style={{
          width: '100%',
          height: '100%',
          clipPath: isEntering ? `path("${clip}")` : undefined,
          ...byDirection(isEntering, passedProps.innerEnterStyle, passedProps.innerExitStyle),
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The entering scene is revealed by a hand sweeping around the clock (Remotion's clockWipe()). */
export const clockWipe = (props: ClockWipeProps): TransitionPresentation<ClockWipeProps> => {
  const options = checkOptions('clockWipe', props, true);
  checkPositive('clockWipe', 'width', options.width, true);
  checkPositive('clockWipe', 'height', options.height, true);
  return { component: ClockWipePresentation, props: options };
};
