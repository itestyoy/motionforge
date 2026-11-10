import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.cjs';

type WipeDirection = 'from-left' | 'from-top-left' | 'from-top' | 'from-top-right' | 'from-right' | 'from-bottom-right' | 'from-bottom' | 'from-bottom-left';
type WipeProps = {
    /** Where the wipe starts. Default 'from-left'. */
    direction?: WipeDirection;
    outerEnterStyle?: React.CSSProperties;
    outerExitStyle?: React.CSSProperties;
    innerEnterStyle?: React.CSSProperties;
    innerExitStyle?: React.CSSProperties;
};
/** The entering scene is revealed over the exiting one by a moving edge (Remotion's wipe()). */
declare const wipe: (props?: WipeProps) => TransitionPresentation<WipeProps>;

export { type WipeDirection, type WipeProps, wipe };
