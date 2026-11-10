import React from 'react';
import { c as TransitionPresentation } from '../types-Db4OISap.js';

type SlideDirection = 'from-left' | 'from-top' | 'from-right' | 'from-bottom';
type SlideProps = {
    /** Where the entering scene comes from. Default 'from-left'. */
    direction?: SlideDirection;
    exitStyle?: React.CSSProperties;
    enterStyle?: React.CSSProperties;
};
/** The entering scene slides in and pushes the exiting one out (Remotion's slide()). */
declare const slide: (props?: SlideProps) => TransitionPresentation<SlideProps>;

export { type SlideDirection, type SlideProps, slide };
