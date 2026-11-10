import React from 'react';

interface LottieProps {
    /**
     * Source of the Lottie animation. Can be a URL to a JSON file or an imported JSON object.
     * An object is compared by content: a new object with the same JSON does not reload.
     */
    src: string | object;
    /**
     * The Lottie frame (on the animation's own timeline) to start from.
     * Default is 0.
     */
    frameStart?: number;
    /**
     * The Lottie frame (on the animation's own timeline) to stop at.
     * Default is the last frame of the Lottie animation.
     */
    frameEnd?: number;
    /**
     * Playback rate of the Lottie animation.
     * Default is 1.
     */
    playbackRate?: number;
    /**
     * Whether the Lottie animation should loop.
     * Default is false.
     */
    loop?: boolean;
    /**
     * Width of the Lottie container.
     */
    width?: number | string;
    /**
     * Height of the Lottie container.
     */
    height?: number | string;
    /**
     * Style overrides for the Lottie container.
     */
    style?: React.CSSProperties;
    /**
     * CSS class name for the Lottie container.
     */
    className?: string;
}
/**
 * Lottie Component for MotionForge.
 *
 * Provides production-grade Lottie support with deterministic frame synchronization.
 * Synchronizes with the MotionForge frame system instead of using time-based playback:
 * composition frame `f` shows the Lottie at time f / fps (times `playbackRate`),
 * whatever the Lottie's own frame rate. It holds the render gate
 * (delayRender) until the data is loaded and the first frame is set. If the
 * animation data cannot be loaded, the error goes to cancelRender() and the
 * component shows it instead of rendering nothing.
 */
declare const Lottie: React.FC<LottieProps>;

export { Lottie, type LottieProps };
