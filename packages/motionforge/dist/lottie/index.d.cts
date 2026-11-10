import React from 'react';

interface LottieProps {
    /**
     * Source of the Lottie animation. Can be a URL to a JSON file or an imported JSON object.
     */
    src: string | object;
    /**
     * The frame at which the Lottie animation should start playing.
     * Default is 0.
     */
    frameStart?: number;
    /**
     * The frame at which the Lottie animation should end playing.
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
 * Synchronizes with the MotionForge frame system instead of using time-based playback.
 */
declare const Lottie: React.FC<LottieProps>;

export { Lottie, type LottieProps };
