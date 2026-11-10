'use client';

import React, { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FrameContext, GateContext, TimelineContext, TimelineContextValue, TimelinePlacement, useCurrentFrame } from '../core/context';
import { GateScope, getGateInternals } from '../core/render-gate';

// Sequence Context
interface SequenceContextValue {
  relativeFrom: number;
  durationInFrames?: number;
  isActive: boolean;
  /** True while the sequence is premounted (before its start, invisible). */
  isPremounted: boolean;
  /** True while the sequence is postmounted (after its end, invisible). */
  isPostmounted: boolean;
  startFrame: number;
  endFrame: number;
}

const SequenceContext = createContext<SequenceContextValue>({
  relativeFrom: 0,
  isActive: true,
  isPremounted: false,
  isPostmounted: false,
  startFrame: 0,
  endFrame: Infinity,
});

export const useSequence = () => useContext(SequenceContext);

/**
 * The wrapper of a Sequence, as in Remotion: by default an absolutely
 * positioned element filling the parent (`layout: 'absolute-fill'`), which
 * takes `style` and `className` and can premount and postmount the children;
 * with `layout: 'none'` no element is rendered.
 */
export type SequenceLayoutProps =
  | {
      layout?: 'absolute-fill';
      style?: React.CSSProperties;
      className?: string;
      /**
       * Mount the children this many frames before the start, invisible
       * (opacity 0, no pointer events) and at their frame 0, so images, video
       * and fonts load in time. Their delayRender() handles hold the frame
       * only once the sequence has started.
       */
      premountFor?: number;
      /**
       * Keep the children mounted this many frames after the end, invisible
       * and at their last frame. Their handles do not hold the frame then.
       */
      postmountFor?: number;
      /** Merged over the style while premounted (after opacity 0 and pointer-events none). */
      styleWhilePremounted?: React.CSSProperties;
      /** Merged over the style while postmounted. */
      styleWhilePostmounted?: React.CSSProperties;
    }
  | {
      layout: 'none';
    };

export type SequenceProps = {
  /** The frame the sequence starts at, in the parent's frames (an integer, default 0). */
  from?: number;
  /** Length in frames (a positive integer); without it the sequence runs to the end of the parent. */
  durationInFrames?: number;
  /** Shifts the start by this many frames (an integer). */
  offset?: number;
  name?: string;
  /** Width the children see in useVideoConfig(), and the wrapper's width (positive, px). */
  width?: number;
  /** Height the children see in useVideoConfig(), and the wrapper's height (positive, px). */
  height?: number;
  children?: ReactNode;
} & SequenceLayoutProps;

const checkFrames = (component: string, name: string, value: unknown) => {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${component}: ${name} must be a non-negative integer, got ${value}`);
  }
};

const checkSize = (name: string, value: unknown) => {
  if (value !== undefined && !(typeof value === 'number' && Number.isFinite(value) && value > 0)) {
    throw new Error(`Sequence: ${name} must be a positive number of pixels, got ${value}`);
  }
};

// Sequence Component - renders children only during specified frame range
export const Sequence: React.FC<SequenceProps> = (props) => {
  const { from = 0, durationInFrames, offset = 0, name, width, height, children } = props;
  const layout = props.layout ?? 'absolute-fill';
  const fill = props.layout === 'none' ? null : props;
  const premountFor = fill?.premountFor ?? 0;
  const postmountFor = fill?.postmountFor ?? 0;

  const currentFrame = useCurrentFrame();
  const parent = useContext(FrameContext);
  const parentGate = useContext(GateContext);
  const parentTimeline = useContext(TimelineContext);
  if (layout !== 'absolute-fill' && layout !== 'none') {
    throw new Error(`Sequence: layout must be "absolute-fill" or "none", got ${JSON.stringify(layout)}`);
  }
  if (!Number.isInteger(from)) {
    throw new Error(`Sequence: from must be an integer, got ${from}`);
  }
  if (!Number.isInteger(offset)) {
    throw new Error(`Sequence: offset must be an integer, got ${offset}`);
  }
  if (durationInFrames !== undefined && (!Number.isInteger(durationInFrames) || durationInFrames <= 0)) {
    throw new Error(
      `Sequence: durationInFrames must be a positive integer (leave it out to run to the end), got ${durationInFrames}`,
    );
  }
  checkSize('width', width);
  checkSize('height', height);
  if (layout === 'none') {
    const rest = props as Record<string, unknown>;
    for (const key of ['style', 'className', 'premountFor', 'postmountFor', 'styleWhilePremounted', 'styleWhilePostmounted']) {
      if (rest[key] !== undefined) {
        throw new Error(
          `Sequence: layout="none" renders no element, so it takes no ${key} (it needs layout="absolute-fill")`,
        );
      }
    }
  }
  checkFrames('Sequence', 'premountFor', premountFor);
  checkFrames('Sequence', 'postmountFor', postmountFor);
  if (postmountFor > 0 && durationInFrames === undefined) {
    throw new Error('Sequence: postmountFor needs durationInFrames (a sequence without one never ends)');
  }
  const startFrame = from + offset;
  const endFrame = durationInFrames !== undefined ? startFrame + durationInFrames : Infinity;

  // The same shift on the composition's timeline (for audio tracks and input events).
  const timelineOffset = (parentTimeline?.offset ?? 0) + startFrame;
  const timelineStart = Math.max(parentTimeline?.start ?? 0, timelineOffset);
  const timelineEnd = Math.min(parentTimeline?.end ?? Infinity, timelineOffset + (durationInFrames ?? Infinity));
  const remappedBy = parentTimeline?.remappedBy ?? null;
  const parentPlacements = parentTimeline?.placements ?? null;
  const timeline = useMemo<TimelineContextValue>(
    () => ({
      offset: timelineOffset,
      start: timelineStart,
      end: timelineEnd,
      remappedBy,
      // Each window of the parent (one per Loop iteration) shifted and cut the same way.
      placements: (parentPlacements ?? [{ offset: 0, start: 0, end: Infinity }]).flatMap((p): TimelinePlacement[] => {
        const offset = p.offset + startFrame;
        const start = Math.max(p.start, offset);
        const end = Math.min(p.end, offset + (durationInFrames ?? Infinity));
        return start < end ? [{ offset, start, end }] : [];
      }),
    }),
    [timelineOffset, timelineStart, timelineEnd, remappedBy, parentPlacements, startFrame, durationInFrames],
  );

  // Check if sequence is active
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;
  const isPremounted = !isActive && currentFrame >= startFrame - premountFor && currentFrame < startFrame;
  const isPostmounted = !isActive && currentFrame >= endFrame && currentFrame < endFrame + postmountFor;
  const hidden = isPremounted || isPostmounted;

  // Premounted content renders at its frame 0, postmounted at its last frame.
  const relativeFrame = isPremounted
    ? 0
    : isPostmounted
      ? (durationInFrames as number) - 1
      : currentFrame - startFrame;

  // Handles registered by hidden children count only while the sequence is shown.
  const [scope] = useState<GateScope>(() => ({ visible: !hidden, parent: parentGate?.scope ?? null }));
  useEffect(() => {
    if (!parentGate || scope.visible === !hidden) return;
    scope.visible = !hidden;
    getGateInternals(parentGate.gate).changed();
  }, [hidden, parentGate, scope]);
  const mounts = premountFor > 0 || postmountFor > 0;
  const gateValue = useMemo(
    () => (parentGate && mounts ? { gate: parentGate.gate, scope } : parentGate),
    [parentGate, mounts, scope],
  );

  const contextValue: SequenceContextValue = {
    relativeFrom: startFrame,
    durationInFrames,
    isActive,
    isPremounted,
    isPostmounted,
    startFrame,
    endFrame,
  };

  // Don't render children if not active (optimization)
  if (!isActive && !hidden) {
    return null;
  }

  // Inside the sequence useVideoConfig().durationInFrames is the sequence's
  // own length; without one it runs to the end of the parent.
  const localDuration =
    durationInFrames ?? (parent ? parent.durationInFrames - startFrame : undefined);

  // The element tree is the same while premounted, active and postmounted,
  // so the children stay mounted.
  const content = (
    <GateContext.Provider value={gateValue}>
      <TimelineContext.Provider value={timeline}>
        <SequenceFrameProvider
          relativeFrame={relativeFrame}
          durationInFrames={localDuration}
          width={width}
          height={height}
        >
          {children}
        </SequenceFrameProvider>
      </TimelineContext.Provider>
    </GateContext.Provider>
  );

  if (fill === null) {
    return <SequenceContext.Provider value={contextValue}>{content}</SequenceContext.Provider>;
  }

  return (
    <SequenceContext.Provider value={contextValue}>
      <div
        data-sequence-name={name}
        data-sequence-from={startFrame}
        data-sequence-duration={durationInFrames}
        className={fill.className}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          ...(width !== undefined ? { width } : null),
          ...(height !== undefined ? { height } : null),
          ...fill.style,
          ...(hidden ? { opacity: 0, pointerEvents: 'none' as const } : null),
          ...(isPremounted ? fill.styleWhilePremounted : null),
          ...(isPostmounted ? fill.styleWhilePostmounted : null),
        }}
      >
        {content}
      </div>
    </SequenceContext.Provider>
  );
};

// Frame provider for sequences: children read the shifted frame from
// useCurrentFrame(), so nested sequences and time remapping compose.
// `durationInFrames`, `width` and `height`, when given, replace the parent's
// in useVideoConfig().
interface SequenceFrameProviderProps {
  relativeFrame: number;
  durationInFrames?: number;
  width?: number;
  height?: number;
  children: ReactNode;
}

const SequenceFrameProvider: React.FC<SequenceFrameProviderProps> = ({
  relativeFrame,
  durationInFrames,
  width,
  height,
  children,
}) => {
  const parent = useContext(FrameContext);
  const frameValue = useMemo(
    () =>
      parent
        ? {
            ...parent,
            frame: relativeFrame,
            durationInFrames: durationInFrames ?? parent.durationInFrames,
            width: width ?? parent.width,
            height: height ?? parent.height,
          }
        : null,
    [parent, relativeFrame, durationInFrames, width, height],
  );
  return (
    <FrameContext.Provider value={frameValue}>
      <RelativeFrameContext.Provider value={relativeFrame}>
        {children}
      </RelativeFrameContext.Provider>
    </FrameContext.Provider>
  );
};

// Relative Frame Context
const RelativeFrameContext = createContext<number | null>(null);

/**
 * Marks the content as remapped in time (Freeze, Retiming, Reverse): its
 * frames no longer run with the composition's, so it cannot hold audio tracks.
 */
const Remapped: React.FC<{ by: string; children: ReactNode }> = ({ by, children }) => {
  const parent = useContext(TimelineContext);
  const value = useMemo(
    () => (parent ? { ...parent, remappedBy: parent.remappedBy ?? by } : null),
    [parent, by],
  );
  return <TimelineContext.Provider value={value}>{children}</TimelineContext.Provider>;
};

export const useRelativeCurrentFrame = () => useContext(RelativeFrameContext);

// Loop and Reverse map the frame with a modulo, which needs frames >= 0.
const checkFrameNotNegative = (component: string, frame: number) => {
  if (frame < 0) {
    throw new Error(`${component}: the current frame must be >= 0, got ${frame} (a parent shifted it below 0)`);
  }
};

/** Inside a Loop: the index of the current iteration and the length of one. */
export interface LoopContextValue {
  iteration: number;
  durationInFrames: number;
}

const LoopContext = createContext<LoopContextValue | null>(null);

/** Remotion's Loop.useLoop(): `{ iteration, durationInFrames }` inside a Loop, `null` outside. */
const useLoop = (): LoopContextValue | null => useContext(LoopContext);

export type LoopProps = {
  /** Length of one iteration (a positive integer). */
  durationInFrames: number;
  /** Number of iterations (a non-negative integer, default Infinity); after them nothing is rendered. */
  times?: number;
  name?: string;
  children?: ReactNode;
} & (
  | { layout?: 'absolute-fill'; style?: React.CSSProperties; className?: string }
  | { layout: 'none' }
);

/**
 * Repeats its children every `durationInFrames` frames, as in Remotion: each
 * iteration is a Sequence (an absolute-fill element with `style` and
 * `className`, or none with `layout="none"`), inside which useCurrentFrame()
 * counts from the start of the iteration. Loop.useLoop() tells the iteration.
 */
const LoopRoot: React.FC<LoopProps> = (props) => {
  const { durationInFrames, times = Infinity, name, children } = props;
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Loop: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  if (times !== Infinity && (!Number.isInteger(times) || times < 0)) {
    throw new Error(`Loop: times must be a non-negative integer or Infinity, got ${times}`);
  }
  checkFrameNotNegative('Loop', currentFrame);

  const iteration = Math.floor(currentFrame / durationInFrames);
  const loopContext = useMemo(() => ({ iteration, durationInFrames }), [iteration, durationInFrames]);

  // The iteration's Sequence places its content in every iteration, not only
  // the current one: each window of the parent is repeated for every
  // iteration that is shown in it, shifted so that the Sequence's `from`
  // (the current iteration's start) lands it there. Audio tracks inside thus
  // register all iterations at once, and the host can schedule them ahead.
  const parentTimeline = useContext(TimelineContext);
  const timeline = useMemo<TimelineContextValue | null>(() => {
    if (!parentTimeline) return null;
    const placements = parentTimeline.placements.flatMap((p) => {
      const count = Math.min(times, Math.ceil((p.end - p.offset) / durationInFrames));
      if (!Number.isFinite(count)) {
        throw new Error('Loop: an endless Loop needs an enclosing timeline that ends (a FrameProvider)');
      }
      const copies: TimelinePlacement[] = [];
      for (let k = Math.max(0, Math.floor((p.start - p.offset) / durationInFrames)); k < count; k++) {
        copies.push({ offset: p.offset + (k - iteration) * durationInFrames, start: p.start, end: p.end });
      }
      return copies;
    });
    return { ...parentTimeline, placements };
  }, [parentTimeline, durationInFrames, times, iteration]);

  // After the last iteration nothing is rendered.
  if (iteration >= times) {
    return null;
  }

  const layoutProps =
    props.layout === 'none'
      ? ({ layout: 'none' } as const)
      : { layout: props.layout, style: props.style, className: props.className };

  // The same element every iteration, so the children stay mounted.
  return (
    <LoopContext.Provider value={loopContext}>
      <TimelineContext.Provider value={timeline}>
        <Sequence from={iteration * durationInFrames} durationInFrames={durationInFrames} name={name} {...layoutProps}>
          {children}
        </Sequence>
      </TimelineContext.Provider>
    </LoopContext.Provider>
  );
};

export const Loop = Object.assign(LoopRoot, { useLoop });

// Freeze: shows its children one frame, as in Remotion.
interface FreezeProps {
  /**
   * The frame the children see while frozen. Sub-frames (fractions) are
   * allowed, as in Remotion: motion blur renders its samples between frames.
   */
  frame: number;
  /**
   * Whether to freeze: a boolean, or a function of the current frame (default
   * true). While inactive the children see the current frame.
   */
  active?: boolean | ((frame: number) => boolean);
  children: ReactNode;
}

export const Freeze: React.FC<FreezeProps> = ({
  frame: frozenFrame,
  active = true,
  children,
}) => {
  const currentFrame = useCurrentFrame();
  if (typeof frozenFrame !== 'number' || !Number.isFinite(frozenFrame)) {
    throw new Error(`Freeze: frame must be a finite number, got ${frozenFrame}`);
  }
  if (typeof active !== 'boolean' && typeof active !== 'function') {
    throw new Error(`Freeze: active must be a boolean or a function of the frame, got ${active}`);
  }
  const isActive = typeof active === 'function' ? active(currentFrame) : active;
  if (typeof isActive !== 'boolean') {
    throw new Error(`Freeze: active(${currentFrame}) must return a boolean, got ${isActive}`);
  }

  // The same element either way, so the children stay mounted when it toggles.
  return (
    <Remapped by="Freeze">
      <SequenceFrameProvider relativeFrame={isActive ? frozenFrame : currentFrame}>
        {children}
      </SequenceFrameProvider>
    </Remapped>
  );
};

// Retiming Component - changes playback speed
interface RetimingProps {
  children: ReactNode;
  /**
   * Speed: a number, or a pure function of the parent frame. With a function
   * the content advances by `playbackRate(i)` on each frame `i`, so the
   * content frame at `frame` is floor(sum of playbackRate(i) for i < frame).
   */
  playbackRate: number | ((frame: number) => number);
}

const checkRate = (rate: number, frame: number): number => {
  if (typeof rate !== 'number' || !Number.isFinite(rate)) {
    throw new Error(`Retiming: playbackRate must be a finite number, got ${rate} at frame ${frame}`);
  }
  return rate;
};

// Running sums of a rate function: table[n] = sum of rate(i) for 0 <= i < n.
// Kept per function, so pass a stable function (defined outside the component
// or memoised) to avoid recomputing it.
const cumulativeTables = new WeakMap<(frame: number) => number, number[]>();

const cumulativeRate = (rate: (frame: number) => number, frame: number): number => {
  const whole = Math.floor(frame);
  const partial = frame - whole === 0 ? 0 : (frame - whole) * checkRate(rate(whole), whole);
  if (whole < 0) {
    let sum = 0;
    for (let i = whole; i < 0; i++) sum -= checkRate(rate(i), i);
    return sum + partial;
  }
  let table = cumulativeTables.get(rate);
  if (!table) {
    table = [0];
    cumulativeTables.set(rate, table);
  }
  for (let n = table.length; n <= whole; n++) {
    table.push(table[n - 1] + checkRate(rate(n - 1), n - 1));
  }
  return table[whole] + partial;
};

export const Retiming: React.FC<RetimingProps> = ({
  children,
  playbackRate,
}) => {
  const currentFrame = useCurrentFrame();

  const retimedFrame =
    typeof playbackRate === 'function'
      ? Math.floor(cumulativeRate(playbackRate, currentFrame))
      : Math.floor(currentFrame * checkRate(playbackRate, currentFrame));

  return (
    <Remapped by="Retiming">
      <SequenceFrameProvider relativeFrame={retimedFrame}>
        {children}
      </SequenceFrameProvider>
    </Remapped>
  );
};

// Reverse Component - plays frames in reverse
interface ReverseProps {
  children: ReactNode;
  /** Length of the reversed content (a positive integer); it repeats after that. */
  durationInFrames: number;
}

export const Reverse: React.FC<ReverseProps> = ({
  children,
  durationInFrames,
}) => {
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Reverse: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  checkFrameNotNegative('Reverse', currentFrame);
  const reversedFrame = durationInFrames - 1 - (currentFrame % durationInFrames);

  return (
    <Remapped by="Reverse">
      <SequenceFrameProvider relativeFrame={reversedFrame} durationInFrames={durationInFrames}>
        {children}
      </SequenceFrameProvider>
    </Remapped>
  );
};

// Series: sequences one after another.
export type SeriesSequenceProps = {
  /** Length of this sequence in frames (a positive integer). */
  durationInFrames: number;
  /**
   * Shift of this sequence's start (and so of all following ones) in frames:
   * negative overlaps the previous sequence, positive leaves a gap.
   */
  offset?: number;
  name?: string;
  children?: ReactNode;
} & SequenceLayoutProps;

const SeriesSequence: React.FC<SeriesSequenceProps> = () => {
  throw new Error('<Series.Sequence> must be a direct child of <Series>');
};

/** How a child is named in errors of Series and TransitionSeries. */
export const describeChild = (child: ReactNode): string => {
  if (typeof child === 'string') return `the string ${JSON.stringify(child)}`;
  if (React.isValidElement(child)) {
    const type = child.type as string | { displayName?: string; name?: string };
    const name = typeof type === 'string' ? type : type.displayName ?? type.name ?? 'Component';
    return `<${name}>`;
  }
  return String(child);
};

// Children with fragments opened up, each keyed by its path.
export const flattenChildren = (children: ReactNode, prefix = ''): Array<{ key: string; child: ReactNode }> =>
  React.Children.toArray(children).flatMap((child, index) => {
    const key = `${prefix}${React.isValidElement(child) && child.key !== null ? child.key : index}`;
    if (React.isValidElement<{ children?: ReactNode }>(child) && child.type === React.Fragment) {
      return flattenChildren(child.props.children, `${key}/`);
    }
    return [{ key, child }];
  });

/**
 * Plays its `<Series.Sequence>` children one after another. Each starts where
 * the previous one ends, shifted by its `offset`; overlapping sequences render
 * at the same time (later ones on top). Inside each, useCurrentFrame() counts
 * from its start and useVideoConfig().durationInFrames is its own length.
 */
const SeriesRoot: React.FC<{ children?: ReactNode }> = ({ children }) => {
  let start = 0;
  const sequences = flattenChildren(children).map(({ key, child }, index) => {
    if (typeof child === 'string' && child.trim() === '') return null;
    if (!React.isValidElement<SeriesSequenceProps>(child) || child.type !== SeriesSequence) {
      throw new Error(`Series: children must be <Series.Sequence> elements, got ${describeChild(child)} at index ${index}`);
    }
    // name and the layout props (layout, style, className, premountFor, ...) go to the Sequence.
    const { durationInFrames, offset = 0, children: content, ...sequenceProps } = child.props;
    if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
      throw new Error(
        `Series.Sequence: durationInFrames must be a positive integer, got ${durationInFrames} at index ${index}`,
      );
    }
    if (!Number.isInteger(offset)) {
      throw new Error(`Series.Sequence: offset must be an integer, got ${offset} at index ${index}`);
    }
    const from = start + offset;
    start = from + durationInFrames;
    return (
      <Sequence key={key} {...sequenceProps} from={from} durationInFrames={durationInFrames}>
        {content}
      </Sequence>
    );
  });
  return <>{sequences}</>;
};

export const Series = Object.assign(SeriesRoot, { Sequence: SeriesSequence });

export { SequenceContext };
