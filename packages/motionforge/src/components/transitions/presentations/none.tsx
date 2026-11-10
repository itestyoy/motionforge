'use client';

import React from 'react';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkOptions } from './validate';

export type NoneProps = {
  enterStyle?: React.CSSProperties;
  exitStyle?: React.CSSProperties;
};

const NonePresentation: React.FC<TransitionPresentationComponentProps<NoneProps>> = ({
  children,
  presentationDirection,
  passedProps,
}) => (
  <AbsoluteFill style={{ ...byDirection(presentationDirection === 'entering', passedProps.enterStyle, passedProps.exitStyle) }}>
    {children}
  </AbsoluteFill>
);

/**
 * Both scenes overlap without an effect; animate them yourself with
 * useTransitionProgress() (Remotion's none()).
 */
export const none = (props?: NoneProps): TransitionPresentation<NoneProps> => ({
  component: NonePresentation,
  props: checkOptions('none', props),
});
