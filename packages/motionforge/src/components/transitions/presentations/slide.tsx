'use client';

import React from 'react';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkDirection, checkOptions } from './validate';

export type SlideDirection = 'from-left' | 'from-top' | 'from-right' | 'from-bottom';

export type SlideProps = {
  /** Where the entering scene comes from. Default 'from-left'. */
  direction?: SlideDirection;
  exitStyle?: React.CSSProperties;
  enterStyle?: React.CSSProperties;
};

const DIRECTIONS: readonly SlideDirection[] = ['from-left', 'from-top', 'from-right', 'from-bottom'];

// The scenes overlap by this many percent so no line shows between them
// (until the progress is 1).
const EPSILON = 0.01;

const translate = (
  direction: SlideDirection,
  isEntering: boolean,
  progress: number,
): string => {
  const overlapped = progress === 1 ? progress * 100 : progress * 100 - EPSILON;
  if (!isEntering) {
    switch (direction) {
      case 'from-left':
        return `translateX(${overlapped}%)`;
      case 'from-right':
        return `translateX(${-progress * 100}%)`;
      case 'from-top':
        return `translateY(${overlapped}%)`;
      case 'from-bottom':
        return `translateY(${-progress * 100}%)`;
    }
  }
  switch (direction) {
    case 'from-left':
      return `translateX(${-100 + progress * 100}%)`;
    case 'from-right':
      return `translateX(${100 - overlapped}%)`;
    case 'from-top':
      return `translateY(${-100 + progress * 100}%)`;
    case 'from-bottom':
      return `translateY(${100 - overlapped}%)`;
  }
};

const SlidePresentation: React.FC<TransitionPresentationComponentProps<SlideProps>> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = 'from-left', enterStyle, exitStyle },
}) => {
  const isEntering = presentationDirection === 'entering';
  return (
    <AbsoluteFill
      style={{
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        transform: translate(direction, isEntering, presentationProgress),
        ...byDirection(isEntering, enterStyle, exitStyle),
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

/** The entering scene slides in and pushes the exiting one out (Remotion's slide()). */
export const slide = (props?: SlideProps): TransitionPresentation<SlideProps> => {
  const options = checkOptions('slide', props);
  checkDirection('slide', options.direction, DIRECTIONS);
  return { component: SlidePresentation, props: options };
};
