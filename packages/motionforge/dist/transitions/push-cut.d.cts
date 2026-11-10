import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.cjs';

type PushCutProps = {
    /** Where in the transition the cut happens (0 < cutProgress < 1). Default 5 / 11. */
    cutProgress?: number;
    /** Scale the exiting scene punches in to before the cut. Default 1.04. */
    outgoingScale?: number;
    /** Scale of the entering scene at the cut. Default 1.04. */
    incomingStartScale?: number;
    /** Scale of the entering scene at the end. Default 1.07. */
    incomingEndScale?: number;
    /** Default '50% 50%'. */
    transformOrigin?: React.CSSProperties['transformOrigin'];
    /** Color of the flash at the cut. Default '#f5f2ed'. */
    flashColor?: string;
    /** Peak opacity of the flash, 0 to 1. Default 0.2. */
    flashOpacity?: number;
    /** Frames the flash takes to fade after the cut. Default 2. */
    flashFrames?: number;
    outerEnterStyle?: React.CSSProperties;
    outerExitStyle?: React.CSSProperties;
    innerEnterStyle?: React.CSSProperties;
    innerExitStyle?: React.CSSProperties;
};
/**
 * A hard editorial cut: both scenes punch in slightly, with a short flash at
 * the cut (Remotion's pushCut()).
 */
declare const pushCut: (props?: PushCutProps) => TransitionPresentation<PushCutProps>;

export { type PushCutProps, pushCut };
