import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.js';

type IrisProps = {
    /** Width of the scene in px (e.g. useVideoConfig().width). */
    width: number;
    /** Height of the scene in px. */
    height: number;
    outerEnterStyle?: React.CSSProperties;
    outerExitStyle?: React.CSSProperties;
    innerEnterStyle?: React.CSSProperties;
    innerExitStyle?: React.CSSProperties;
};
/** The entering scene is revealed through a circle growing from the center (Remotion's iris()). */
declare const iris: (props: IrisProps) => TransitionPresentation<IrisProps>;

export { type IrisProps, iris };
