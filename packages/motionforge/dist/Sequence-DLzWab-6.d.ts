import React, { ReactNode } from 'react';

interface VideoConfig {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
}
interface SpringConfig {
    frame: number;
    fps: number;
    config?: {
        damping?: number;
        mass?: number;
        stiffness?: number;
        overshootClamping?: boolean;
    };
    from?: number;
    to?: number;
    durationInFrames?: number;
    durationRestThreshold?: number;
    /** Frames to wait before the spring is released. */
    delay?: number;
    /** Play the motion backwards in time: from `to` back to `from`. */
    reverse?: boolean;
}
type ExtrapolateType = 'clamp' | 'extend' | 'identity' | 'wrap';
interface InterpolateOptions {
    /** Left of the input range (default 'extend', as in Remotion). */
    extrapolateLeft?: ExtrapolateType;
    /** Right of the input range (default 'extend', as in Remotion). */
    extrapolateRight?: ExtrapolateType;
    /** One easing for every segment, or one per segment (length inputRange.length - 1). */
    easing?: EasingFunction | readonly EasingFunction[];
    /** Steps the input: it is rounded down to a multiple of this positive number first. */
    posterize?: number;
}
type EasingFunction = (t: number) => number;
interface Keyframe {
    frame: number;
    value: number | string;
    easing?: EasingFunction;
}
interface AnimationTrack {
    property: string;
    keyframes: Keyframe[];
}
interface FrameContextValue {
    frame: number;
    fps: number;
    durationInFrames: number;
    width: number;
    height: number;
}

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
declare const useSequence: () => SequenceContextValue;
/**
 * The wrapper of a Sequence, as in Remotion: by default an absolutely
 * positioned element filling the parent (`layout: 'absolute-fill'`), which
 * takes `style` and `className` and can premount and postmount the children;
 * with `layout: 'none'` no element is rendered.
 */
type SequenceLayoutProps = {
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
} | {
    layout: 'none';
};
type SequenceProps = {
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
declare const Sequence: React.FC<SequenceProps>;
declare const useRelativeCurrentFrame: () => number | null;
/** Inside a Loop: the index of the current iteration and the length of one. */
interface LoopContextValue {
    iteration: number;
    durationInFrames: number;
}
type LoopProps = {
    /** Length of one iteration (a positive integer). */
    durationInFrames: number;
    /** Number of iterations (a non-negative integer, default Infinity); after them nothing is rendered. */
    times?: number;
    name?: string;
    children?: ReactNode;
} & ({
    layout?: 'absolute-fill';
    style?: React.CSSProperties;
    className?: string;
} | {
    layout: 'none';
});
declare const Loop: React.FC<LoopProps> & {
    useLoop: () => LoopContextValue | null;
};
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
declare const Freeze: React.FC<FreezeProps>;
interface RetimingProps {
    children: ReactNode;
    /**
     * Speed: a number, or a pure function of the parent frame. With a function
     * the content advances by `playbackRate(i)` on each frame `i`, so the
     * content frame at `frame` is floor(sum of playbackRate(i) for i < frame).
     */
    playbackRate: number | ((frame: number) => number);
}
declare const Retiming: React.FC<RetimingProps>;
interface ReverseProps {
    children: ReactNode;
    /** Length of the reversed content (a positive integer); it repeats after that. */
    durationInFrames: number;
}
declare const Reverse: React.FC<ReverseProps>;
type SeriesSequenceProps = {
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
declare const Series: React.FC<{
    children?: ReactNode;
}> & {
    Sequence: React.FC<SeriesSequenceProps>;
};

export { type AnimationTrack as A, type EasingFunction as E, type FrameContextValue as F, type InterpolateOptions as I, type Keyframe as K, Loop as L, Retiming as R, type SpringConfig as S, type VideoConfig as V, type ExtrapolateType as a, Freeze as b, type LoopContextValue as c, type LoopProps as d, Reverse as e, Sequence as f, type SequenceLayoutProps as g, type SequenceProps as h, Series as i, type SeriesSequenceProps as j, useSequence as k, useRelativeCurrentFrame as u };
