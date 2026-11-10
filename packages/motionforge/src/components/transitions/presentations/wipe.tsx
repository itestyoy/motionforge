'use client';

import React from 'react';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkDirection, checkOptions } from './validate';

export type WipeDirection =
  | 'from-left'
  | 'from-top-left'
  | 'from-top'
  | 'from-top-right'
  | 'from-right'
  | 'from-bottom-right'
  | 'from-bottom'
  | 'from-bottom-left';

export type WipeProps = {
  /** Where the wipe starts. Default 'from-left'. */
  direction?: WipeDirection;
  outerEnterStyle?: React.CSSProperties;
  outerExitStyle?: React.CSSProperties;
  innerEnterStyle?: React.CSSProperties;
  innerExitStyle?: React.CSSProperties;
};

const DIRECTIONS: readonly WipeDirection[] = [
  'from-left',
  'from-top-left',
  'from-top',
  'from-top-right',
  'from-right',
  'from-bottom-right',
  'from-bottom',
  'from-bottom-left',
];

// The visible part of the entering scene.
const polygonIn = (progress: number, direction: WipeDirection): string => {
  const p = progress * 100;
  switch (direction) {
    case 'from-left':
      return `polygon(0% 0%, ${p}% 0%, ${p}% 100%, 0% 100%)`;
    case 'from-top-left':
      return `polygon(0% 0%, ${p * 2}% 0%, 0% ${p * 2}%)`;
    case 'from-top':
      return `polygon(0% 0%, 100% 0%, 100% ${p}%, 0% ${p}%)`;
    case 'from-top-right':
      return `polygon(100% 0%, ${100 - p * 2}% 0%, 100% ${p * 2}%)`;
    case 'from-right':
      return `polygon(100% 0%, 100% 100%, ${100 - p}% 100%, ${100 - p}% 0%)`;
    case 'from-bottom-right':
      return `polygon(100% 100%, ${100 - p * 2}% 100%, 100% ${100 - p * 2}%)`;
    case 'from-bottom':
      return `polygon(0% 100%, 100% 100%, 100% ${100 - p}%, 0% ${100 - p}%)`;
    case 'from-bottom-left':
      return `polygon(0% 100%, 0% ${100 - p * 2}%, ${p * 2}% 100%)`;
  }
};

// The visible part of the exiting scene.
const polygonOut = (progress: number, direction: WipeDirection): string => {
  const p = progress * 100;
  switch (direction) {
    case 'from-left':
      return `polygon(100% 100%, ${100 - p}% 100%, ${100 - p}% 0%, 100% 0%)`;
    case 'from-top-left':
      return `polygon(100% 100%, ${100 - p * 2}% 100%, 100% ${100 - p * 2}%)`;
    case 'from-top':
      return `polygon(100% 100%, 0% 100%, 0% ${100 - p}%, 100% ${100 - p}%)`;
    case 'from-top-right':
      return `polygon(0% 100%, ${p * 2}% 100%, 0% ${100 - p * 2}%)`;
    case 'from-right':
      return `polygon(0% 0%, ${p}% 0%, ${p}% 100%, 0% 100%)`;
    case 'from-bottom-right':
      return `polygon(0% 0%, ${p * 2}% 0%, 0% ${p * 2}%)`;
    case 'from-bottom':
      return `polygon(100% 0%, 0% 0%, 0% ${p}%, 100% ${p}%)`;
    case 'from-bottom-left':
      return `polygon(100% 0%, ${100 - p * 2}% 0%, 100% ${p * 2}%)`;
  }
};

const WipePresentation: React.FC<TransitionPresentationComponentProps<WipeProps>> = ({
  children,
  presentationProgress,
  presentationDirection,
  passedProps: { direction = 'from-left', innerEnterStyle, innerExitStyle, outerEnterStyle, outerExitStyle },
}) => {
  const isEntering = presentationDirection === 'entering';
  const clipPath = isEntering
    ? polygonIn(presentationProgress, direction)
    : polygonOut(1 - presentationProgress, direction);
  return (
    <AbsoluteFill style={byDirection(isEntering, outerEnterStyle, outerExitStyle)}>
      <AbsoluteFill
        style={{
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          clipPath,
          ...byDirection(isEntering, innerEnterStyle, innerExitStyle),
        }}
      >
        {children}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** The entering scene is revealed over the exiting one by a moving edge (Remotion's wipe()). */
export const wipe = (props?: WipeProps): TransitionPresentation<WipeProps> => {
  const options = checkOptions('wipe', props);
  checkDirection('wipe', options.direction, DIRECTIONS);
  return { component: WipePresentation, props: options };
};
