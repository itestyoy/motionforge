import React, { ReactNode } from 'react';
import { g as SequenceLayoutProps, E as EasingFunction, S as SpringConfig } from '../Sequence-DLzWab-6.js';
import { T as TransitionSeriesTransitionProps, a as TransitionSeriesOverlayProps, b as TransitionTiming } from '../types-Db4OISap.js';
export { P as PresentationDirection, c as TransitionPresentation, d as TransitionPresentationComponentProps } from '../types-Db4OISap.js';
export { PushCutProps, pushCut } from './push-cut.js';

type AbsoluteFillLayout = Exclude<SequenceLayoutProps, {
    layout: 'none';
}>;
/** Props of `<TransitionSeries>`: a `<Sequence>` (absolutely positioned) around the scenes. */
type TransitionSeriesProps = {
    /** The frame the series starts at, in the parent's frames (default 0). */
    from?: number;
    /** Limits how long the whole series is shown; the scenes keep their lengths. */
    durationInFrames?: number;
    offset?: number;
    name?: string;
    width?: number;
    height?: number;
    children?: ReactNode;
} & AbsoluteFillLayout;
/** Props of `<TransitionSeries.Sequence>`. */
type TransitionSeriesSequenceProps = {
    /** Length of the scene in frames (a positive integer). */
    durationInFrames: number;
    /** Shifts this scene's start (and the ones after it): negative overlaps, positive leaves a gap. */
    offset?: number;
    name?: string;
    children?: ReactNode;
} & AbsoluteFillLayout;
declare const TransitionSeries: React.FC<TransitionSeriesProps> & {
    Sequence: React.FC<TransitionSeriesSequenceProps>;
    Transition: <PresentationProps extends Record<string, unknown>>(_props: TransitionSeriesTransitionProps<PresentationProps>) => React.ReactNode;
    Overlay: React.FC<TransitionSeriesOverlayProps>;
};

/**
 * A transition of `durationInFrames` frames whose progress goes from 0 to 1
 * linearly, or along `easing` (Remotion's linearTiming()).
 */
declare const linearTiming: (options: {
    durationInFrames: number;
    easing?: EasingFunction;
}) => TransitionTiming;
/**
 * A transition whose progress follows `spring()` (Remotion's springTiming()).
 * Without `durationInFrames` it lasts until the spring settles
 * (`measureSpring()` with `durationRestThreshold`); with it, the spring is
 * stretched to that length. `reverse` plays the spring backwards in time.
 */
declare const springTiming: (options?: {
    config?: SpringConfig["config"];
    durationInFrames?: number;
    durationRestThreshold?: number;
    reverse?: boolean;
}) => TransitionTiming;

type TransitionState = {
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
declare const useTransitionProgress: () => TransitionState;

export { TransitionSeries, TransitionSeriesOverlayProps, type TransitionSeriesProps, type TransitionSeriesSequenceProps, TransitionSeriesTransitionProps, type TransitionState, TransitionTiming, linearTiming, springTiming, useTransitionProgress };
