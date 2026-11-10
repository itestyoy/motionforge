import React from 'react';
import { AnimationItem } from 'lottie-web';

/** Lottie JSON, as in @remotion/lottie: frame rate `fr`, size `w` × `h`, out point `op`. */
type LottieAnimationData = {
    fr: number;
    w: number;
    h: number;
    op: number;
} & Record<string | number | symbol, unknown>;
type AspectRatioConstraint = 'none' | 'xMinYMin' | 'xMidYMin' | 'xMaxYMin' | 'xMinYMid' | 'xMidYMid' | 'xMaxYMid' | 'xMinYMax' | 'xMidYMax' | 'xMaxYMax';
interface LottieProps {
    /**
     * The animation JSON as an object (import it, or fetch it and pass the
     * result). It is compared by content: a new object with the same JSON does
     * not reload.
     */
    animationData: LottieAnimationData;
    /** 'forward' (default) or 'backward': plays the frames from the end. */
    direction?: 'forward' | 'backward';
    /** Repeat the animation (default false: it holds its last frame). */
    loop?: boolean;
    /** Speed (> 0, default 1). */
    playbackRate?: number;
    /** lottie-web renderer (default 'svg'). */
    renderer?: 'svg' | 'canvas' | 'html';
    /** For the svg and canvas renderers: SVG preserveAspectRatio, e.g. 'xMidYMid slice'. */
    preserveAspectRatio?: AspectRatioConstraint | `${AspectRatioConstraint} ${'slice' | 'meet'}`;
    /** Base path of the images the animation references. */
    assetsPath?: string;
    /** Called with the lottie-web AnimationItem each time new animation data is loaded. */
    onAnimationLoaded?: (animation: AnimationItem) => void;
    /** The Lottie frame (on the animation's own timeline) to start from (default 0). */
    frameStart?: number;
    /** The Lottie frame to stop at (default: the last frame of the animation). */
    frameEnd?: number;
    /** Width of the container (default 100%). */
    width?: number | string;
    /** Height of the container (default 100%). */
    height?: number | string;
    /** Style of the container. */
    style?: React.CSSProperties;
    /** CSS class of the container. */
    className?: string;
}
/**
 * Basic metadata of a Lottie animation (as in @remotion/lottie): its frame
 * rate, duration and size, or null when the data lacks one of them.
 */
declare const getLottieMetadata: (animationData: LottieAnimationData) => {
    fps: number;
    durationInSeconds: number;
    durationInFrames: number;
    width: number;
    height: number;
} | null;
/**
 * Lottie animation synced to the frame, with the props of @remotion/lottie.
 *
 * Composition frame `f` shows the Lottie at time f / fps (times
 * `playbackRate`), whatever the Lottie's own frame rate. It holds the render
 * gate (delayRender) until the data is loaded and the frame is set. If the
 * animation cannot be loaded, the error goes to cancelRender() and the
 * component shows it.
 */
declare const Lottie: React.FC<LottieProps>;

export { Lottie, type LottieAnimationData, type LottieProps, getLottieMetadata };
