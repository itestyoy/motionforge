import type { EasingFunction, SpringConfig } from '../../core/types';
import { interpolate, measureSpring, spring } from '../../utils/animation';
import type { TransitionTiming } from './types';

const checkDuration = (fn: string, value: unknown) => {
  if (!Number.isInteger(value) || (value as number) <= 0) {
    throw new Error(`${fn}: durationInFrames must be a positive integer, got ${JSON.stringify(value)}`);
  }
};

/**
 * A transition of `durationInFrames` frames whose progress goes from 0 to 1
 * linearly, or along `easing` (Remotion's linearTiming()).
 */
export const linearTiming = (options: { durationInFrames: number; easing?: EasingFunction }): TransitionTiming => {
  if (typeof options !== 'object' || options === null) {
    throw new Error(`linearTiming: expected { durationInFrames, easing? }, got ${JSON.stringify(options)}`);
  }
  const { durationInFrames, easing } = options;
  checkDuration('linearTiming', durationInFrames);
  if (easing !== undefined && typeof easing !== 'function') {
    throw new Error(`linearTiming: easing must be a function, got ${JSON.stringify(easing)}`);
  }
  return {
    getDurationInFrames: () => durationInFrames,
    getProgress: ({ frame }) =>
      interpolate(frame, [0, durationInFrames], [0, 1], {
        easing,
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      }),
  };
};

/**
 * A transition whose progress follows `spring()` (Remotion's springTiming()).
 * Without `durationInFrames` it lasts until the spring settles
 * (`measureSpring()` with `durationRestThreshold`); with it, the spring is
 * stretched to that length. `reverse` plays the spring backwards in time.
 */
export const springTiming = (
  options: {
    config?: SpringConfig['config'];
    durationInFrames?: number;
    durationRestThreshold?: number;
    reverse?: boolean;
  } = {},
): TransitionTiming => {
  if (typeof options !== 'object' || options === null) {
    throw new Error(`springTiming: expected an options object, got ${JSON.stringify(options)}`);
  }
  if (options.durationInFrames !== undefined) checkDuration('springTiming', options.durationInFrames);
  if (options.reverse !== undefined && typeof options.reverse !== 'boolean') {
    throw new Error(`springTiming: reverse must be a boolean, got ${JSON.stringify(options.reverse)}`);
  }
  return {
    getDurationInFrames: ({ fps }) =>
      options.durationInFrames ??
      measureSpring({ fps, config: options.config, threshold: options.durationRestThreshold }),
    getProgress: ({ fps, frame }) =>
      spring({
        fps,
        frame,
        from: options.reverse ? 1 : 0,
        to: options.reverse ? 0 : 1,
        config: options.config,
        durationInFrames: options.durationInFrames,
        durationRestThreshold: options.durationRestThreshold,
        reverse: options.reverse,
      }),
  };
};
