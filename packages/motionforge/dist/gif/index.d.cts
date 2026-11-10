import React from 'react';
import { I as ImageFit } from '../image-fit-BNU-zyWh.cjs';

/**
 * Remotion's `getGifDurationInSeconds()` (`@remotion/gif`): the length of one
 * loop of the GIF, the sum of its frame delays (a delay of 0 counts as 100 ms).
 * Reads the frame headers only; also works outside the browser with an
 * absolute URL.
 */
declare const getGifDurationInSeconds: (src: string, options?: {
    requestInit?: RequestInit;
}) => Promise<number>;
type GifLoopBehavior = 'loop' | 'pause-after-finish' | 'unmount-after-finish';

type GifFillMode = ImageFit;
interface GifProps {
    /** URL of the GIF; a remote one must allow CORS. */
    src: string;
    /** Canvas width in px (default: the GIF's width). */
    width?: number;
    /** Canvas height in px (default: the GIF's height). */
    height?: number;
    /** Called once the GIF is decoded, with its size, frame delays (ms) and full-size frames. */
    onLoad?: (info: {
        width: number;
        height: number;
        delays: number[];
        frames: ImageData[];
    }) => void;
    /** Called with a load or decode error instead of failing the render. */
    onError?: (error: Error) => void;
    /** 'fill' (default, stretched), 'contain' or 'cover'. */
    fit?: GifFillMode;
    /** Speed of the animation (default 1). */
    playbackRate?: number;
    style?: React.CSSProperties;
    /** 'loop' (default), 'pause-after-finish' (last frame) or 'unmount-after-finish' (renders nothing). */
    loopBehavior?: GifLoopBehavior;
    id?: string;
    /** Passed to fetch() (credentials, headers). */
    requestInit?: RequestInit;
}
/**
 * Remotion's `<Gif>` (`@remotion/gif`): a GIF drawn on a `<canvas>` at the
 * frame's time (`frame / fps × playbackRate`), frame-exact by the delays in
 * the file. It decodes in JavaScript (omggif), so it works in every browser
 * and gives the same pixels everywhere. Holds the render gate until the GIF is
 * decoded and the frame drawn; an error goes to `onError`, or else to
 * `cancelRender()`.
 */
declare const Gif: React.ForwardRefExoticComponent<GifProps & React.RefAttributes<HTMLCanvasElement>>;

export { Gif, type GifFillMode, type GifLoopBehavior, type GifProps, getGifDurationInSeconds };
