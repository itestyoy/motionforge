'use client';

import React, { ReactNode } from 'react';
import { useCurrentFrame, useVideoConfig } from '../../core/context';
import { rejectProps } from '../../utils/fetch-asset';
import { Sequence, type SequenceLayoutProps, describeChild, flattenChildren } from '../Sequence';
import { WrapInEnteringProgress, WrapInExitingProgress } from './context';
import { slide } from './presentations/slide';
import type {
  TransitionPresentation,
  TransitionSeriesOverlayProps,
  TransitionSeriesTransitionProps,
  TransitionTiming,
} from './types';

type AbsoluteFillLayout = Exclude<SequenceLayoutProps, { layout: 'none' }>;

/** Props of `<TransitionSeries>`: a `<Sequence>` (absolutely positioned) around the scenes. */
export type TransitionSeriesProps = {
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
export type TransitionSeriesSequenceProps = {
  /** Length of the scene in frames (a positive integer). */
  durationInFrames: number;
  /** Shifts this scene's start (and the ones after it): negative overlaps, positive leaves a gap. */
  offset?: number;
  name?: string;
  children?: ReactNode;
} & AbsoluteFillLayout;

const layoutNoneError = (component: string) =>
  `${component} must be absolutely positioned (layout="absolute-fill", the default), as transitions overlap the scenes; got layout="none"`;

// <Sequence> props of Remotion's TransitionSeries.Sequence that MotionForge's <Sequence> does not have.
const UNSUPPORTED_SEQUENCE_PROPS: Record<string, string> = {
  playbackRate: 'put a <Retiming> inside the scene instead',
  trimBefore: 'put a <Sequence from={-n}> inside the scene instead',
  freeze: 'put a <Freeze> inside the scene instead',
  loop: 'put a looping <Loop> inside the scene instead',
  hidden: 'leave the scene out instead',
  showInTimeline: 'there is no timeline',
};

const SeriesSequence: React.FC<TransitionSeriesSequenceProps> = () => {
  throw new Error('<TransitionSeries.Sequence> must be a direct child of <TransitionSeries>');
};

const SeriesTransition = <PresentationProps extends Record<string, unknown>>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _props: TransitionSeriesTransitionProps<PresentationProps>,
): React.ReactNode => {
  throw new Error('<TransitionSeries.Transition> must be a direct child of <TransitionSeries>');
};

const SeriesOverlay: React.FC<TransitionSeriesOverlayProps> = () => {
  throw new Error('<TransitionSeries.Overlay> must be a direct child of <TransitionSeries>');
};

type Kind = 'sequence' | 'transition' | 'overlay';

type Item = { key: string; index: number; kind: Kind; props: Record<string, unknown> };

const KIND_NAMES: Record<Kind, string> = {
  sequence: '<TransitionSeries.Sequence>',
  transition: '<TransitionSeries.Transition>',
  overlay: '<TransitionSeries.Overlay>',
};

const kindOf = (child: ReactNode, index: number): Kind => {
  if (React.isValidElement(child)) {
    if (child.type === SeriesSequence) return 'sequence';
    if (child.type === SeriesTransition) return 'transition';
    if (child.type === SeriesOverlay) return 'overlay';
  }
  throw new Error(
    `TransitionSeries: children must be <TransitionSeries.Sequence>, <TransitionSeries.Transition> or <TransitionSeries.Overlay> elements, got ${describeChild(child)} at index ${index}`,
  );
};

const checkInteger = (component: string, name: string, value: unknown, index: number, positive: boolean) => {
  if (!Number.isInteger(value) || (positive && (value as number) <= 0)) {
    throw new Error(
      `${component}: ${name} must be ${positive ? 'a positive' : 'an'} integer, got ${JSON.stringify(value)} at index ${index}`,
    );
  }
};

type ResolvedTransition = {
  timing: TransitionTiming;
  presentation: TransitionPresentation<Record<string, unknown>>;
  durationInFrames: number;
};

const resolveTransition = (props: Record<string, unknown>, fps: number, index: number): ResolvedTransition => {
  const component = KIND_NAMES.transition;
  const timing = props.timing as TransitionTiming | undefined;
  if (
    typeof timing !== 'object' ||
    timing === null ||
    typeof timing.getDurationInFrames !== 'function' ||
    typeof timing.getProgress !== 'function'
  ) {
    throw new Error(
      `${component}: timing must be a timing such as linearTiming({ durationInFrames }) or springTiming(), got ${JSON.stringify(timing)} at index ${index}`,
    );
  }
  const presentation = (props.presentation ?? slide()) as TransitionPresentation<Record<string, unknown>>;
  if (typeof presentation !== 'object' || presentation === null || typeof presentation.component !== 'function') {
    throw new Error(
      `${component}: presentation must be a presentation such as fade() or slide(), got ${JSON.stringify(presentation)} at index ${index}`,
    );
  }
  const durationInFrames = timing.getDurationInFrames({ fps });
  if (!Number.isInteger(durationInFrames) || durationInFrames < 0) {
    throw new Error(
      `${component}: timing.getDurationInFrames() must return a non-negative integer, got ${durationInFrames} at index ${index}`,
    );
  }
  return { timing, presentation, durationInFrames };
};

const progressOf = (transition: ResolvedTransition, frame: number, fps: number, index: number): number => {
  const progress = transition.timing.getProgress({ frame, fps });
  if (typeof progress !== 'number' || !Number.isFinite(progress)) {
    throw new Error(
      `${KIND_NAMES.transition}: timing.getProgress() must return a finite number, got ${progress} at frame ${frame} (index ${index})`,
    );
  }
  return progress;
};

const TransitionSeriesChildren: React.FC<{ children?: ReactNode }> = ({ children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const items: Item[] = [];
  flattenChildren(children).forEach(({ key, child }, index) => {
    if (child === null || child === undefined || typeof child === 'boolean') return;
    if (typeof child === 'string' && child.trim() === '') return;
    const kind = kindOf(child, index);
    items.push({ key, index, kind, props: (child as React.ReactElement<Record<string, unknown>>).props });
  });

  // The rules of Remotion's TransitionSeries: a transition or an overlay sits
  // next to sequences only, never next to another transition or overlay.
  items.forEach((item, i) => {
    if (item.kind === 'sequence') return;
    const previous = items[i - 1];
    const next = items[i + 1];
    if (previous && previous.kind !== 'sequence') {
      throw new Error(
        `TransitionSeries: a ${KIND_NAMES[previous.kind]} must not be followed by a ${KIND_NAMES[item.kind]} (children ${previous.index} and ${item.index}); put a <TransitionSeries.Sequence> between them`,
      );
    }
    if (!previous && !next) {
      throw new Error(`TransitionSeries: a ${KIND_NAMES[item.kind]} needs a <TransitionSeries.Sequence> before or after it`);
    }
  });

  const transitions = new Map<number, ResolvedTransition>();
  items.forEach((item, i) => {
    if (item.kind === 'transition') transitions.set(i, resolveTransition(item.props, fps, item.index));
  });

  const sequences: ReactNode[] = [];
  const overlays: ReactNode[] = [];
  // As in Remotion: `startFrame` is where the next scene would start without
  // transitions, `transitionOffsets` the frames transitions have taken off.
  let startFrame = 0;
  let transitionOffsets = 0;
  const sequenceDurations: number[] = [];
  let pendingOverlay: { framesAfterCut: number } | null = null;

  items.forEach((item, i) => {
    if (item.kind === 'transition') return;

    if (item.kind === 'overlay') {
      const component = KIND_NAMES.overlay;
      const props = item.props as unknown as TransitionSeriesOverlayProps;
      rejectProps(component, props, { hidden: 'leave the overlay out instead' });
      checkInteger(component, 'durationInFrames', props.durationInFrames, item.index, true);
      const offset = props.offset ?? 0;
      checkInteger(component, 'offset', offset, item.index, false);
      const cutPoint = startFrame + transitionOffsets;
      const halfDuration = props.durationInFrames / 2;
      const overlayFrom = cutPoint - halfDuration + offset;
      if (overlayFrom < 0) {
        throw new Error(
          `${component} extends before frame 0: it starts at frame ${overlayFrom}. Reduce the duration or adjust the offset.`,
        );
      }
      const previousDuration = sequenceDurations[sequenceDurations.length - 1];
      if (previousDuration !== undefined && halfDuration - offset > previousDuration) {
        throw new Error(
          `${component} extends beyond the previous sequence: it needs ${halfDuration - offset} frames before the cut, but the previous sequence is only ${previousDuration} frames long.`,
        );
      }
      pendingOverlay = { framesAfterCut: halfDuration + offset };
      overlays.push(
        <Sequence
          key={`overlay-${item.key}`}
          from={Math.round(overlayFrom)}
          durationInFrames={props.durationInFrames}
          name="<TS.Overlay>"
          premountFor={props.premountFor}
          postmountFor={props.postmountFor}
          styleWhilePremounted={props.styleWhilePremounted}
          styleWhilePostmounted={props.styleWhilePostmounted}
        >
          {props.children}
        </Sequence>,
      );
      return;
    }

    const component = KIND_NAMES.sequence;
    const { durationInFrames, offset = 0, name, children: content, ...layoutProps } =
      item.props as unknown as TransitionSeriesSequenceProps;
    if ((layoutProps as { layout?: unknown }).layout === 'none') throw new Error(layoutNoneError(component));
    rejectProps(component, layoutProps, UNSUPPORTED_SEQUENCE_PROPS);
    checkInteger(component, 'durationInFrames', durationInFrames, item.index, true);
    checkInteger(component, 'offset', offset, item.index, false);

    const prev = items[i - 1]?.kind === 'transition' ? (transitions.get(i - 1) as ResolvedTransition) : null;
    const next = items[i + 1]?.kind === 'transition' ? (transitions.get(i + 1) as ResolvedTransition) : null;
    for (const [transition, side] of [
      [prev, 'previous'],
      [next, 'next'],
    ] as const) {
      if (transition && durationInFrames < transition.durationInFrames) {
        throw new Error(
          `${component}: a sequence must not be shorter than the ${side} <TransitionSeries.Transition>: the transition is ${transition.durationInFrames} frames long, but the sequence is only ${durationInFrames} frames long (index ${item.index})`,
        );
      }
    }

    if (prev) transitionOffsets -= prev.durationInFrames;
    let actualStart = startFrame + offset + transitionOffsets;
    startFrame += durationInFrames + offset;
    // A transition before the first sequence (an entrance) starts at frame 0.
    if (actualStart < 0) {
      startFrame -= actualStart;
      actualStart = 0;
    }
    sequenceDurations.push(durationInFrames);
    if (pendingOverlay) {
      if (pendingOverlay.framesAfterCut > durationInFrames) {
        throw new Error(
          `${KIND_NAMES.overlay} extends beyond the next sequence: it needs ${pendingOverlay.framesAfterCut} frames after the cut, but the next sequence is only ${durationInFrames} frames long.`,
        );
      }
      pendingOverlay = null;
    }

    // The same element tree on every frame, so the scene stays mounted.
    let node: ReactNode = content;
    if (prev) {
      const progress = progressOf(prev, frame - actualStart, fps, items[i - 1].index);
      const Presentation = prev.presentation.component as React.ComponentType<Record<string, unknown>>;
      node = (
        <Presentation
          passedProps={prev.presentation.props ?? {}}
          presentationDirection="entering"
          presentationProgress={progress}
          presentationDurationInFrames={prev.durationInFrames}
          bothEnteringAndExiting={Boolean(next)}
        >
          <WrapInEnteringProgress progress={progress}>{node}</WrapInEnteringProgress>
        </Presentation>
      );
    }
    if (next) {
      const progress = progressOf(next, frame - actualStart - durationInFrames + next.durationInFrames, fps, items[i + 1].index);
      const Presentation = next.presentation.component as React.ComponentType<Record<string, unknown>>;
      node = (
        <Presentation
          passedProps={next.presentation.props ?? {}}
          presentationDirection="exiting"
          presentationProgress={progress}
          presentationDurationInFrames={next.durationInFrames}
          bothEnteringAndExiting={Boolean(prev)}
        >
          <WrapInExitingProgress progress={progress}>{node}</WrapInExitingProgress>
        </Presentation>
      );
    }
    sequences.push(
      <Sequence
        key={item.key}
        {...(layoutProps as AbsoluteFillLayout)}
        name={name ?? '<TS.Sequence>'}
        from={actualStart}
        durationInFrames={durationInFrames}
      >
        {node}
      </Sequence>,
    );
  });

  // Overlays render on top of every scene.
  return (
    <>
      {sequences}
      {overlays}
    </>
  );
};

/**
 * Scenes one after another, like `<Series>`, with
 * `<TransitionSeries.Transition>` (both scenes overlap and a presentation
 * animates between them; the series gets shorter by its length) or
 * `<TransitionSeries.Overlay>` (rendered on top of the cut; lengths stay)
 * between them, as in `@remotion/transitions`. A transition first or last
 * animates the entrance or exit of the scene next to it.
 *
 * Inside each `<TransitionSeries.Sequence>`, useCurrentFrame() counts from the
 * scene's start and useVideoConfig().durationInFrames is its length, also
 * while it overlaps a neighbour; useTransitionProgress() tells how far the
 * transitions into and out of the scene are.
 */
const TransitionSeriesRoot: React.FC<TransitionSeriesProps> = (props) => {
  if ((props as { layout?: unknown }).layout === 'none') throw new Error(layoutNoneError('<TransitionSeries>'));
  const { children, name, ...sequenceProps } = props;
  return (
    <Sequence {...sequenceProps} name={name ?? '<TransitionSeries>'}>
      <TransitionSeriesChildren>{children}</TransitionSeriesChildren>
    </Sequence>
  );
};

export const TransitionSeries = Object.assign(TransitionSeriesRoot, {
  Sequence: SeriesSequence,
  Transition: SeriesTransition,
  Overlay: SeriesOverlay,
});
