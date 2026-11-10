import React from 'react';

interface TrailProps {
    children: React.ReactNode;
    /** How many layers are added below the content (an integer >= 0). */
    layers: number;
    /** How many frames each layer lags behind the next one; fractions are allowed. */
    lagInFrames: number;
    /** The opacity of the layer closest to the content; older layers fade linearly to 0. */
    trailOpacity: number;
}
/**
 * Remotion's `<Trail>` (`@remotion/motion-blur`): renders the children again
 * below themselves at earlier frames, each layer `lagInFrames` further back
 * in time (through `<Freeze>`) and more transparent. The children must be
 * absolutely positioned (e.g. an `AbsoluteFill`), since every layer is a full
 * copy laid over the others.
 */
declare const Trail: React.FC<TrailProps>;

interface CameraMotionBlurProps {
    children: React.ReactNode;
    /**
     * The share of a frame the shutter is open, in degrees (0 to 360, default
     * 180): 360 blurs over the whole frame interval, 0 renders one sharp sample.
     */
    shutterAngle?: number;
    /** How many sub-frame samples are averaged (an integer, default 10; 5–10 recommended). */
    samples?: number;
}
/**
 * Remotion's `<CameraMotionBlur>` (`@remotion/motion-blur`): film-camera
 * motion blur. The children are rendered `samples` times at sub-frames
 * spread over the open shutter (through `<Freeze>`), each layer at
 * `1 / samples` opacity, added up with `mix-blend-mode: plus-lighter`. The
 * children must be absolutely positioned (e.g. an `AbsoluteFill`). The blend
 * changes colours slightly: keep `samples` low.
 */
declare const CameraMotionBlur: React.FC<CameraMotionBlurProps>;

export { CameraMotionBlur, type CameraMotionBlurProps, Trail, type TrailProps };
