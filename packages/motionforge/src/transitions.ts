/**
 * Transitions between scenes, as in `@remotion/transitions`. The
 * presentations have their own entries, as in Remotion:
 *
 *   import { TransitionSeries, linearTiming } from 'motionforge/transitions';
 *   import { fade } from 'motionforge/transitions/fade';
 */
export { TransitionSeries } from './components/transitions/TransitionSeries';
export type {
  TransitionSeriesProps,
  TransitionSeriesSequenceProps,
} from './components/transitions/TransitionSeries';
export { linearTiming, springTiming } from './components/transitions/timings';
export { useTransitionProgress } from './components/transitions/context';
export type { TransitionState } from './components/transitions/context';
export type {
  PresentationDirection,
  TransitionPresentation,
  TransitionPresentationComponentProps,
  TransitionSeriesOverlayProps,
  TransitionSeriesTransitionProps,
  TransitionTiming,
} from './components/transitions/types';
// Remotion exports pushCut from the main entry of @remotion/transitions too.
export { pushCut } from './components/transitions/presentations/push-cut';
export type { PushCutProps } from './components/transitions/presentations/push-cut';
