import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.js';

type NoneProps = {
    enterStyle?: React.CSSProperties;
    exitStyle?: React.CSSProperties;
};
/**
 * Both scenes overlap without an effect; animate them yourself with
 * useTransitionProgress() (Remotion's none()).
 */
declare const none: (props?: NoneProps) => TransitionPresentation<NoneProps>;

export { type NoneProps, none };
