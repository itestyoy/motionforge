'use client';

import React from 'react';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkOptions } from './validate';

export type FadeProps = {
  enterStyle?: React.CSSProperties;
  exitStyle?: React.CSSProperties;
  /** Also fade the exiting scene out (default false: it stays opaque under the entering one). */
  shouldFadeOutExitingScene?: boolean;
};

const FadePresentation: React.FC<TransitionPresentationComponentProps<FadeProps>> = ({
  children,
  presentationDirection,
  presentationProgress,
  passedProps,
}) => {
  const isEntering = presentationDirection === 'entering';
  const opacity = isEntering
    ? presentationProgress
    : passedProps.shouldFadeOutExitingScene
      ? 1 - presentationProgress
      : 1;
  return (
    <AbsoluteFill style={{ opacity, ...byDirection(isEntering, passedProps.enterStyle, passedProps.exitStyle) }}>
      {children}
    </AbsoluteFill>
  );
};

/** The entering scene fades in over the exiting one (Remotion's fade()). */
export const fade = (props?: FadeProps): TransitionPresentation<FadeProps> => ({
  component: FadePresentation,
  props: checkOptions('fade', props),
});
