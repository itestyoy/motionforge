import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.cjs';

type ClockWipeProps = {
    /** Width of the scene in px (e.g. useVideoConfig().width). */
    width: number;
    /** Height of the scene in px. */
    height: number;
    outerEnterStyle?: React.CSSProperties;
    outerExitStyle?: React.CSSProperties;
    innerEnterStyle?: React.CSSProperties;
    innerExitStyle?: React.CSSProperties;
};
/** The entering scene is revealed by a hand sweeping around the clock (Remotion's clockWipe()). */
declare const clockWipe: (props: ClockWipeProps) => TransitionPresentation<ClockWipeProps>;

export { type ClockWipeProps, clockWipe };
