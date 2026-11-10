'use client';

import React, { createContext, useContext, useMemo } from 'react';

const EnteringContext = createContext<{ enteringProgress: number } | null>(null);
const ExitingContext = createContext<{ exitingProgress: number } | null>(null);

export const WrapInEnteringProgress: React.FC<{ progress: number; children: React.ReactNode }> = ({
  progress,
  children,
}) => {
  const value = useMemo(() => ({ enteringProgress: progress }), [progress]);
  return <EnteringContext.Provider value={value}>{children}</EnteringContext.Provider>;
};

export const WrapInExitingProgress: React.FC<{ progress: number; children: React.ReactNode }> = ({
  progress,
  children,
}) => {
  const value = useMemo(() => ({ exitingProgress: progress }), [progress]);
  return <ExitingContext.Provider value={value}>{children}</ExitingContext.Provider>;
};

export type TransitionState = {
  /** Progress of the transition into this scene: 1 once it has entered (and outside a TransitionSeries). */
  entering: number;
  /** Progress of the transition out of this scene: 0 until it starts exiting (and outside a TransitionSeries). */
  exiting: number;
  isInTransitionSeries: boolean;
};

/**
 * Inside a `<TransitionSeries.Sequence>`: how far the transitions into and
 * out of this scene are, to animate its contents along (Remotion's
 * useTransitionProgress()).
 */
export const useTransitionProgress = (): TransitionState => {
  const entering = useContext(EnteringContext);
  const exiting = useContext(ExitingContext);
  if (!entering && !exiting) {
    return { isInTransitionSeries: false, entering: 1, exiting: 0 };
  }
  return {
    isInTransitionSeries: true,
    entering: entering?.enteringProgress ?? 1,
    exiting: exiting?.exitingProgress ?? 0,
  };
};
