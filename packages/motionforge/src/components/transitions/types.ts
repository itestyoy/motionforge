import type React from 'react';

export type PresentationDirection = 'entering' | 'exiting';

/**
 * How long a transition takes and how far it is at a frame, as in
 * `@remotion/transitions`. `getDurationInFrames` must return a non-negative
 * integer; `getProgress` gets the frame since the start of the transition
 * and returns the progress (usually 0 to 1).
 */
export type TransitionTiming = {
  getDurationInFrames: (options: { fps: number }) => number;
  getProgress: (options: { frame: number; fps: number }) => number;
};

/** Props a presentation component receives. */
export type TransitionPresentationComponentProps<PresentationProps extends Record<string, unknown>> = {
  /** Progress of the transition (0 to 1, a spring may overshoot). */
  presentationProgress: number;
  /** The scene. */
  children: React.ReactNode;
  /** 'entering' for the scene after the transition, 'exiting' for the one before. */
  presentationDirection: PresentationDirection;
  /** The options passed to the presentation function. */
  passedProps: PresentationProps;
  /** Length of the transition in frames. */
  presentationDurationInFrames: number;
  /** True when the scene is wrapped by a transition on both sides (this is one of them). */
  bothEnteringAndExiting: boolean;
};

/**
 * What a presentation function (`fade()`, `slide()`, ...) returns: the
 * component that renders both scenes, and its options.
 */
export type TransitionPresentation<PresentationProps extends Record<string, unknown>> = {
  component:
    | React.ComponentType<TransitionPresentationComponentProps<PresentationProps>>
    | ((props: TransitionPresentationComponentProps<PresentationProps>) => React.ReactNode);
  props: PresentationProps;
};

/** Props of `<TransitionSeries.Overlay>`. */
export type TransitionSeriesOverlayProps = {
  /** How long the overlay is visible (a positive integer), centered on the cut. */
  readonly durationInFrames: number;
  /** Shifts the overlay from the center of the cut (an integer; positive: later). Default 0. */
  readonly offset?: number;
  readonly premountFor?: number;
  readonly postmountFor?: number;
  readonly styleWhilePremounted?: React.CSSProperties;
  readonly styleWhilePostmounted?: React.CSSProperties;
  readonly children: React.ReactNode;
};

/** Props of `<TransitionSeries.Transition>`. */
export type TransitionSeriesTransitionProps<PresentationProps extends Record<string, unknown>> = {
  timing: TransitionTiming;
  /** Default slide(). */
  presentation?: TransitionPresentation<PresentationProps>;
};
