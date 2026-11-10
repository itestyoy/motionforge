/**
 * GIFs, as in `@remotion/gif` (decoded in JavaScript with omggif):
 *
 *   import { Gif, getGifDurationInSeconds } from 'motionforge/gif';
 */
export { Gif } from './components/gif/Gif';
export type { GifProps, GifFillMode, GifLoopBehavior } from './components/gif/Gif';
export { getGifDurationInSeconds } from './components/gif/parse-gif';
