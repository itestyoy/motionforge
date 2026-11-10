/**
 * Text layout helpers, as in `@remotion/layout-utils`. They measure with the
 * browser's layout, so they run in the browser only, and the fonts must be
 * loaded before they are called:
 *
 *   import { fitText } from 'motionforge/layout-utils';
 */
export { measureText } from './utils/layout/measure-text';
export type { Dimensions, TextTransform, ModifyableCSSProperties, Word } from './utils/layout/measure-text';
export { fitText } from './utils/layout/fit-text';
export { fitTextOnNLines } from './utils/layout/fit-text-on-n-lines';
export { fillTextBox } from './utils/layout/fill-text-box';
