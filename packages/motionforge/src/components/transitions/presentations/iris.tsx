'use client';

import React from 'react';
import { translatePath } from '../../../utils/path/transform';
import { makeCircle } from '../../shapes/make-shapes';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkOptions, checkPositive } from './validate';

export type IrisProps = {
  /** Width of the scene in px (e.g. useVideoConfig().width). */
  width: number;
  /** Height of the scene in px. */
  height: number;
  outerEnterStyle?: React.CSSProperties;
  outerExitStyle?: React.CSSProperties;
  innerEnterStyle?: React.CSSProperties;
  innerExitStyle?: React.CSSProperties;
};

const IrisPresentation: React.FC<TransitionPresentationComponentProps<IrisProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const isEntering = presentationDirection === 'entering';
  const maxRadius = Math.sqrt(passedProps.width ** 2 + passedProps.height ** 2) / 2;
  // A spring that overshoots would make the radius negative: no circle then.
  const radius = Math.max(0, isEntering ? maxRadius * presentationProgress : maxRadius - maxRadius * presentationProgress);
  const { path } = makeCircle({ radius });
  const clip = translatePath(path, passedProps.width / 2 - radius, passedProps.height / 2 - radius);
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

/** The entering scene is revealed through a circle growing from the center (Remotion's iris()). */
export const iris = (props: IrisProps): TransitionPresentation<IrisProps> => {
  const options = checkOptions('iris', props, true);
  checkPositive('iris', 'width', options.width, true);
  checkPositive('iris', 'height', options.height, true);
  return { component: IrisPresentation, props: options };
};
