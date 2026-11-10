'use client';

import React from 'react';
import { Easing, interpolate } from '../../../utils/animation';
import { AbsoluteFill } from '../../Media';
import type { TransitionPresentation, TransitionPresentationComponentProps } from '../types';
import { byDirection, checkOptions } from './validate';

export type PushCutProps = {
  /** Where in the transition the cut happens (0 < cutProgress < 1). Default 5 / 11. */
  cutProgress?: number;
  /** Scale the exiting scene punches in to before the cut. Default 1.04. */
  outgoingScale?: number;
  /** Scale of the entering scene at the cut. Default 1.04. */
  incomingStartScale?: number;
  /** Scale of the entering scene at the end. Default 1.07. */
  incomingEndScale?: number;
  /** Default '50% 50%'. */
  transformOrigin?: React.CSSProperties['transformOrigin'];
  /** Color of the flash at the cut. Default '#f5f2ed'. */
  flashColor?: string;
  /** Peak opacity of the flash, 0 to 1. Default 0.2. */
  flashOpacity?: number;
  /** Frames the flash takes to fade after the cut. Default 2. */
  flashFrames?: number;
  outerEnterStyle?: React.CSSProperties;
  outerExitStyle?: React.CSSProperties;
  innerEnterStyle?: React.CSSProperties;
  innerExitStyle?: React.CSSProperties;
};

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

const finite = (name: string, value: number) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`pushCut(): ${name} must be a finite number, got ${JSON.stringify(value)}`);
  }
};

const PushCutPresentation: React.FC<TransitionPresentationComponentProps<PushCutProps>> = ({
  children,
  presentationDirection,
  presentationDurationInFrames,
  presentationProgress,
  passedProps,
}) => {
  const {
    cutProgress = 5 / 11,
    outgoingScale = 1.04,
    incomingStartScale = 1.04,
    incomingEndScale = 1.07,
    transformOrigin = '50% 50%',
    flashColor = '#f5f2ed',
    flashOpacity: peakFlashOpacity = 0.2,
    flashFrames = 2,
    outerEnterStyle,
    outerExitStyle,
    innerEnterStyle,
    innerExitStyle,
  } = passedProps;
  const isEntering = presentationDirection === 'entering';
  const outgoing = interpolate(presentationProgress, [0, cutProgress], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const incoming = interpolate(presentationProgress, [cutProgress, 1], [0, 1], { ...clamp, easing: Easing.out(Easing.quad) });
  const scale = isEntering
    ? interpolate(incoming, [0, 1], [incomingStartScale, incomingEndScale])
    : interpolate(outgoing, [0, 1], [1, outgoingScale]);
  const frames = Math.max(1, presentationDurationInFrames);
  // The flash builds up over the last frame before the cut and fades over flashFrames after it.
  const flashOpacity = isEntering
    ? interpolate(presentationProgress, [cutProgress, cutProgress + flashFrames / frames], [peakFlashOpacity, 0], clamp)
    : interpolate(presentationProgress, [cutProgress - 1 / frames, cutProgress], [0, peakFlashOpacity], clamp);

  return (
    <AbsoluteFill
      style={{
        // The entering scene is hidden until the cut.
        opacity: isEntering && presentationProgress < cutProgress ? 0 : 1,
        overflow: 'hidden',
        ...byDirection(isEntering, outerEnterStyle, outerExitStyle),
      }}
    >
      <AbsoluteFill
        style={{
          transform: `scale(${scale})`,
          transformOrigin,
          willChange: 'transform',
          ...byDirection(isEntering, innerEnterStyle, innerExitStyle),
        }}
      >
        {children}
      </AbsoluteFill>
      {flashOpacity > 0 ? (
        <AbsoluteFill style={{ backgroundColor: flashColor, opacity: flashOpacity, pointerEvents: 'none' }} />
      ) : null}
    </AbsoluteFill>
  );
};

/**
 * A hard editorial cut: both scenes punch in slightly, with a short flash at
 * the cut (Remotion's pushCut()).
 */
export const pushCut = (props?: PushCutProps): TransitionPresentation<PushCutProps> => {
  const options = checkOptions('pushCut', props);
  const cutProgress = options.cutProgress ?? 5 / 11;
  finite('cutProgress', cutProgress);
  if (cutProgress <= 0 || cutProgress >= 1) {
    throw new Error(`pushCut(): cutProgress must be greater than 0 and less than 1, got ${cutProgress}`);
  }
  for (const name of ['outgoingScale', 'incomingStartScale', 'incomingEndScale'] as const) {
    const value = options[name] ?? (name === 'incomingEndScale' ? 1.07 : 1.04);
    finite(name, value);
    if (value <= 0) throw new Error(`pushCut(): ${name} must be greater than 0, got ${value}`);
  }
  const flashOpacity = options.flashOpacity ?? 0.2;
  finite('flashOpacity', flashOpacity);
  if (flashOpacity < 0 || flashOpacity > 1) {
    throw new Error(`pushCut(): flashOpacity must be between 0 and 1, got ${flashOpacity}`);
  }
  const flashFrames = options.flashFrames ?? 2;
  finite('flashFrames', flashFrames);
  if (flashFrames < 0) throw new Error(`pushCut(): flashFrames must be >= 0, got ${flashFrames}`);
  return { component: PushCutPresentation, props: options };
};
