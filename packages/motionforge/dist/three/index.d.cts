import React from 'react';
import { CanvasProps } from '@react-three/fiber';

type ThreeCanvasProps = Omit<CanvasProps, 'frameloop' | 'children'> & {
    /** Width of the canvas in px (a positive integer); the scene renders at this size. */
    width: number;
    /** Height of the canvas in px (a positive integer). */
    height: number;
    /**
     * Always `'never'`: the canvas is drawn once per frame, when the frame
     * changes. Other values throw.
     */
    frameloop?: 'never';
    children: React.ReactNode;
};
/**
 * Remotion's `<ThreeCanvas>` (`@remotion/three`): a React Three Fiber
 * `<Canvas>` driven by the frame.
 *
 * - `useCurrentFrame()`, `useVideoConfig()`, `useDelayRender()` and the
 *   sequence context work inside: R3F renders in a separate React root, and
 *   the canvas provides them there again.
 * - Deterministic: `frameloop` is `'never'`; the scene is drawn once per frame
 *   with `advance(frame / fps)`, so `state.clock.elapsedTime` is the frame's
 *   time in seconds. Animate with `useCurrentFrame()`, not `useFrame()`.
 * - Holds the render gate until the renderer exists, the frame is drawn, and
 *   suspended content (textures, models) has loaded.
 */
declare const ThreeCanvas: React.FC<ThreeCanvasProps>;

interface DepthGallery3DProps {
    images: string[];
    /** Caption under each image (by index); images without one have no caption. */
    captions?: string[];
    durationInFrames?: number;
    startFrame?: number;
    className?: string;
    style?: React.CSSProperties;
}
declare const DepthGallery3D: React.FC<DepthGallery3DProps>;

interface ShaderImageRevealProps {
    src: string;
    durationInFrames?: number;
    startFrame?: number;
    className?: string;
    style?: React.CSSProperties;
}
declare const ShaderImageReveal: React.FC<ShaderImageRevealProps>;

interface DitheringEffectProps {
    src: string;
    intensity?: number;
    className?: string;
    style?: React.CSSProperties;
}
declare const DitheringEffect: React.FC<DitheringEffectProps>;

export { DepthGallery3D, DitheringEffect, ShaderImageReveal, ThreeCanvas, type ThreeCanvasProps };
