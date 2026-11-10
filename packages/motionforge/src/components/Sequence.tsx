'use client';

import React, { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react';
import { FrameContext, GateContext, useCurrentFrame } from '../core/context';
import { GateScope, getGateInternals } from '../core/render-gate';

// Sequence Context
interface SequenceContextValue {
  relativeFrom: number;
  durationInFrames?: number;
  isActive: boolean;
  /** True while the sequence is premounted (before its start, invisible). */
  isPremounted: boolean;
  startFrame: number;
  endFrame: number;
}

const SequenceContext = createContext<SequenceContextValue>({
  relativeFrom: 0,
  isActive: true,
  isPremounted: false,
  startFrame: 0,
  endFrame: Infinity,
});

export const useSequence = () => useContext(SequenceContext);

interface SequenceProps {
  from: number;
  durationInFrames?: number;
  offset?: number;
  name?: string;
  children: ReactNode;
  showInTimeline?: boolean;
  layout?: 'absolute-fill' | 'none';
  /**
   * Mount the children this many frames before the start, invisible (opacity
   * 0, no pointer events) and at their frame 0, so images, video and fonts
   * load in time. Their delayRender() handles hold the frame only once the
   * sequence has started. Needs layout 'absolute-fill'.
   */
  premountFor?: number;
}

// Sequence Component - renders children only during specified frame range
export const Sequence: React.FC<SequenceProps> = ({
  from,
  durationInFrames,
  offset = 0,
  name,
  children,
  layout = 'absolute-fill',
  premountFor = 0,
}) => {
  const currentFrame = useCurrentFrame();
  const parent = useContext(FrameContext);
  const parentGate = useContext(GateContext);
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
  if (!Number.isInteger(premountFor) || premountFor < 0) {
    throw new Error(`Sequence: premountFor must be a non-negative integer, got ${premountFor}`);
  }
  if (premountFor > 0 && layout === 'none') {
    throw new Error('Sequence: premountFor needs layout="absolute-fill" (the wrapper hides the premounted content)');
  }
  const startFrame = from + offset;
  const endFrame = durationInFrames !== undefined ? startFrame + durationInFrames : Infinity;

  // Check if sequence is active
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;
  const isPremounted = !isActive && currentFrame >= startFrame - premountFor && currentFrame < startFrame;

  // Premounted content renders at its frame 0.
  const relativeFrame = isPremounted ? 0 : currentFrame - startFrame;

  // Handles registered by premounted children count once the sequence starts.
  const [scope] = useState<GateScope>(() => ({ visible: !isPremounted, parent: parentGate?.scope ?? null }));
  useEffect(() => {
    if (!parentGate || scope.visible === !isPremounted) return;
    scope.visible = !isPremounted;
    getGateInternals(parentGate.gate).changed();
  }, [isPremounted, parentGate, scope]);
  const gateValue = useMemo(
    () => (parentGate && premountFor > 0 ? { gate: parentGate.gate, scope } : parentGate),
    [parentGate, premountFor, scope],
  );

  const contextValue: SequenceContextValue = {
    relativeFrom: startFrame,
    durationInFrames,
    isActive,
    isPremounted,
    startFrame,
    endFrame,
  };

  // Don't render children if not active (optimization)
  if (!isActive && !isPremounted) {
    return null;
  }

  // Inside the sequence useVideoConfig().durationInFrames is the sequence's
  // own length; without one it runs to the end of the parent.
  const localDuration =
    durationInFrames ?? (parent ? parent.durationInFrames - startFrame : undefined);

  // The element tree is the same while premounted and while active, so the
  // children stay mounted when the sequence starts.
  const content = (
    <GateContext.Provider value={gateValue}>
      <SequenceFrameProvider relativeFrame={relativeFrame} durationInFrames={localDuration}>
        {children}
      </SequenceFrameProvider>
    </GateContext.Provider>
  );

  if (layout === 'none') {
    return <SequenceContext.Provider value={contextValue}>{content}</SequenceContext.Provider>;
  }

  return (
    <SequenceContext.Provider value={contextValue}>
      <div
        data-sequence-name={name}
        data-sequence-from={startFrame}
        data-sequence-duration={durationInFrames}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          ...(isPremounted ? { opacity: 0, pointerEvents: 'none' as const } : null),
        }}
      >
        {content}
      </div>
    </SequenceContext.Provider>
  );
};

// Frame provider for sequences: children read the shifted frame from
// useCurrentFrame(), so nested sequences and time remapping compose.
// `durationInFrames`, when given, replaces the parent's in useVideoConfig().
interface SequenceFrameProviderProps {
  relativeFrame: number;
  durationInFrames?: number;
  children: ReactNode;
}

const SequenceFrameProvider: React.FC<SequenceFrameProviderProps> = ({
  relativeFrame,
  durationInFrames,
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
          }
        : null,
    [parent, relativeFrame, durationInFrames],
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

export const useRelativeCurrentFrame = () => useContext(RelativeFrameContext);

// Loop Component - loops a sequence for specified number of times
interface LoopProps {
  /** Length of one iteration (a positive integer). */
  durationInFrames: number;
  /** Number of iterations (a positive integer, default Infinity); after them nothing is rendered. */
  times?: number;
  children: ReactNode;
  name?: string;
}

// Loop and Reverse map the frame with a modulo, which needs frames >= 0.
const checkFrameNotNegative = (component: string, frame: number) => {
  if (frame < 0) {
    throw new Error(`${component}: the current frame must be >= 0, got ${frame} (a parent shifted it below 0)`);
  }
};

export const Loop: React.FC<LoopProps> = ({
  durationInFrames,
  times = Infinity,
  children,
}) => {
  const currentFrame = useCurrentFrame();
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new Error(`Loop: durationInFrames must be a positive integer, got ${durationInFrames}`);
  }
  if (times !== Infinity && (!Number.isInteger(times) || times <= 0)) {
    throw new Error(`Loop: times must be a positive integer or Infinity, got ${times}`);
  }
  checkFrameNotNegative('Loop', currentFrame);

  // Calculate looped frame
  const totalFrames = times === Infinity ? durationInFrames : durationInFrames * times;
  const loopedFrame = currentFrame % durationInFrames;
  const currentLoop = Math.floor(currentFrame / durationInFrames);
  
  // Check if within total duration
  if (times !== Infinity && currentFrame >= totalFrames) {
    return null;
  }

  return (
    <LoopContext.Provider value={{ loopedFrame, currentLoop, durationInFrames }}>
      <SequenceFrameProvider relativeFrame={loopedFrame} durationInFrames={durationInFrames}>
        {children}
      </SequenceFrameProvider>
    </LoopContext.Provider>
  );
};

// Loop Context
const LoopContext = createContext<{
  loopedFrame: number;
  currentLoop: number;
  durationInFrames: number;
}>({
  loopedFrame: 0,
  currentLoop: 0,
  durationInFrames: 0,
});

/** Inside a `Loop`: the frame within the current iteration, the iteration index and the loop length. */
export const useLoopInfo = () => useContext(LoopContext);

// Freeze: shows its children one frame, as in Remotion.
interface FreezeProps {
  /** The frame the children see while frozen (an integer). */
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
  if (!Number.isInteger(frozenFrame)) {
    throw new Error(`Freeze: frame must be an integer, got ${frozenFrame}`);
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
    <SequenceFrameProvider relativeFrame={isActive ? frozenFrame : currentFrame}>
      {children}
    </SequenceFrameProvider>
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
    <SequenceFrameProvider relativeFrame={retimedFrame}>
      {children}
    </SequenceFrameProvider>
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
    <SequenceFrameProvider relativeFrame={reversedFrame} durationInFrames={durationInFrames}>
      {children}
    </SequenceFrameProvider>
  );
};

// Series: sequences one after another.
interface SeriesSequenceProps {
  /** Length of this sequence in frames (a positive integer). */
  durationInFrames: number;
  /**
   * Shift of this sequence's start (and so of all following ones) in frames:
   * negative overlaps the previous sequence, positive leaves a gap.
   */
  offset?: number;
  name?: string;
  layout?: 'absolute-fill' | 'none';
  /** See Sequence premountFor. */
  premountFor?: number;
  children?: ReactNode;
}

const SeriesSequence: React.FC<SeriesSequenceProps> = () => {
  throw new Error('<Series.Sequence> must be a direct child of <Series>');
};

const describeChild = (child: ReactNode): string => {
  if (typeof child === 'string') return `the string ${JSON.stringify(child)}`;
  if (React.isValidElement(child)) {
    const type = child.type as string | { displayName?: string; name?: string };
    const name = typeof type === 'string' ? type : type.displayName ?? type.name ?? 'Component';
    return `<${name}>`;
  }
  return String(child);
};

// Children with fragments opened up, each keyed by its path.
const flattenChildren = (children: ReactNode, prefix = ''): Array<{ key: string; child: ReactNode }> =>
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
    const { durationInFrames, offset = 0, name, layout, premountFor, children: content } = child.props;
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
      <Sequence
        key={key}
        from={from}
        durationInFrames={durationInFrames}
        name={name}
        layout={layout}
        premountFor={premountFor}
      >
        {content}
      </Sequence>
    );
  });
  return <>{sequences}</>;
};

export const Series = Object.assign(SeriesRoot, { Sequence: SeriesSequence });

export { SequenceContext };
