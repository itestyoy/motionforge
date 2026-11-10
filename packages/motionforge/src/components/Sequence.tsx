'use client';

import React, { ReactNode, createContext, useContext, useMemo } from 'react';
import { FrameContext, useCurrentFrame } from '../core/context';

// Sequence Context
interface SequenceContextValue {
  relativeFrom: number;
  durationInFrames?: number;
  isActive: boolean;
  startFrame: number;
  endFrame: number;
}

const SequenceContext = createContext<SequenceContextValue>({
  relativeFrom: 0,
  isActive: true,
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
}

// Sequence Component - renders children only during specified frame range
export const Sequence: React.FC<SequenceProps> = ({
  from,
  durationInFrames,
  offset = 0,
  name,
  children,
  layout = 'absolute-fill',
}) => {
  const currentFrame = useCurrentFrame();
  const parent = useContext(FrameContext);
  const startFrame = from + offset;
  const endFrame = durationInFrames !== undefined ? startFrame + durationInFrames : Infinity;
  
  // Calculate relative frame
  const relativeFrame = currentFrame - startFrame;
  
  // Check if sequence is active
  const isActive = currentFrame >= startFrame && currentFrame < endFrame;
  
  const contextValue: SequenceContextValue = {
    relativeFrom: startFrame,
    durationInFrames,
    isActive,
    startFrame,
    endFrame,
  };

  // Don't render children if not active (optimization)
  if (!isActive) {
    return null;
  }

  // Inside the sequence useVideoConfig().durationInFrames is the sequence's
  // own length; without one it runs to the end of the parent.
  const localDuration =
    durationInFrames ?? (parent ? parent.durationInFrames - startFrame : undefined);

  const content = (
    <SequenceFrameProvider relativeFrame={relativeFrame} durationInFrames={localDuration}>
      {children}
    </SequenceFrameProvider>
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
  durationInFrames: number;
  times?: number;
  children: ReactNode;
  name?: string;
}

export const Loop: React.FC<LoopProps> = ({
  durationInFrames,
  times = Infinity,
  children,
  name,
}) => {
  const currentFrame = useCurrentFrame();
  
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

// Freeze Component - freezes a frame for specified duration
interface FreezeProps {
  frame: number;
  durationInFrames: number;
  children: ReactNode;
  name?: string;
}

export const Freeze: React.FC<FreezeProps> = ({
  frame: freezeFrame,
  durationInFrames,
  children,
}) => {
  const currentFrame = useCurrentFrame();
  
  // Hold `frame` for exactly `durationInFrames` frames, then continue from the
  // frame after it.
  const displayFrame =
    currentFrame < durationInFrames ? freezeFrame : currentFrame - durationInFrames + freezeFrame + 1;

  return (
    <SequenceFrameProvider relativeFrame={displayFrame}>
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
  name?: string;
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
  durationInFrames: number;
}

export const Reverse: React.FC<ReverseProps> = ({
  children,
  durationInFrames,
}) => {
  const currentFrame = useCurrentFrame();
  const reversedFrame = durationInFrames - 1 - (currentFrame % durationInFrames);

  return (
    <SequenceFrameProvider relativeFrame={reversedFrame}>
      {children}
    </SequenceFrameProvider>
  );
};

// Series Component - plays sequences in series
interface SeriesProps {
  children: ReactNode;
}

export const Series: React.FC<SeriesProps> = ({ children }) => {
  const currentFrame = useCurrentFrame();
  
  // Calculate cumulative frames for each child
  let accumulatedFrames = 0;
  let activeChildIndex = -1;
  let activeDuration = 0;
  let relativeFrame = currentFrame;

  const childArray = React.Children.toArray(children);
  
  for (let i = 0; i < childArray.length; i++) {
    const child = childArray[i];
    if (React.isValidElement<{ durationInFrames?: number }>(child) && child.props.durationInFrames) {
      const childDuration = child.props.durationInFrames;
      
      if (currentFrame >= accumulatedFrames && currentFrame < accumulatedFrames + childDuration) {
        activeChildIndex = i;
        activeDuration = childDuration;
        relativeFrame = currentFrame - accumulatedFrames;
        break;
      }
      
      accumulatedFrames += childDuration;
    }
  }

  if (activeChildIndex === -1) {
    return null;
  }

  const activeChild = childArray[activeChildIndex];
  
  return (
    <SequenceFrameProvider relativeFrame={relativeFrame} durationInFrames={activeDuration}>
      {activeChild}
    </SequenceFrameProvider>
  );
};

export { SequenceContext };
