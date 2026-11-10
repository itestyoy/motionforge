import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.cjs';

type FadeProps = {
    enterStyle?: React.CSSProperties;
    exitStyle?: React.CSSProperties;
    /** Also fade the exiting scene out (default false: it stays opaque under the entering one). */
    shouldFadeOutExitingScene?: boolean;
};
/** The entering scene fades in over the exiting one (Remotion's fade()). */
declare const fade: (props?: FadeProps) => TransitionPresentation<FadeProps>;

export { type FadeProps, fade };
