import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.js';

type FlipDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';
type FlipProps = {
    /** Default 'from-left'. */
    direction?: FlipDirection;
    /** CSS perspective in px. Default 1000. */
    perspective?: number;
    outerEnterStyle?: React.CSSProperties;
    outerExitStyle?: React.CSSProperties;
    innerEnterStyle?: React.CSSProperties;
    innerExitStyle?: React.CSSProperties;
};
/** The exiting scene flips over and shows the entering one on its back (Remotion's flip()). */
declare const flip: (props?: FlipProps) => TransitionPresentation<FlipProps>;

export { type FlipDirection, type FlipProps, flip };
