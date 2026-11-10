import { c as TransitionPresentation } from '../types-Db4OISap.js';
import 'react';

type CubeDirection = 'from-left' | 'from-right' | 'from-top' | 'from-bottom';
type CubeProps = {
    direction: CubeDirection;
    /** CSS perspective in px. Default 1000. */
    perspective?: number;
};
/** Both scenes turn as two faces of a 3D cube (Remotion's cube()). */
declare const cube: (props: CubeProps) => TransitionPresentation<CubeProps>;

export { type CubeDirection, type CubeProps, cube };
