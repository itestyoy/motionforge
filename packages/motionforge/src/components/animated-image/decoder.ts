import { fetchAsset } from '../../utils/fetch-asset';

export type AnimatedImageLoopBehavior = 'loop' | 'pause-after-finish' | 'clear-after-finish';

/** An animated image opened with the WebCodecs ImageDecoder, with the timing of every frame. */
export interface AnimatedImageTrack {
  frameCount: number;
  /** Start of each frame in microseconds. */
  starts: number[];
  /** Length of the whole animation in microseconds; null for a still image. */
  durationUs: number | null;
  decode(frameIndex: number): Promise<VideoFrame>;
  close(): void;
}

const COMPONENT = '<AnimatedImage>';

/**
 * Fetches and opens `src`, then decodes every frame once to learn its start
 * time and length (ImageDecoder reports them per decoded frame only).
 */
export const openAnimatedImage = async (
  src: string,
  requestInit: RequestInit | undefined,
  signal: AbortSignal,
): Promise<AnimatedImageTrack> => {
  if (typeof ImageDecoder === 'undefined') {
    throw new Error(
      `${COMPONENT} needs the WebCodecs ImageDecoder API, which this browser does not have (Chromium-based browsers and Firefox have it, Safari does not). For a GIF, use <Gif> from 'motionforge/gif', which decodes in JavaScript.`,
    );
  }
  const response = await fetchAsset(COMPONENT, src, requestInit, signal);
  const type = response.headers.get('Content-Type')?.split(';')[0].trim() || 'image/gif';
  if (!(await ImageDecoder.isTypeSupported(type))) {
    throw new Error(`${COMPONENT} cannot decode ${src}: this browser's ImageDecoder does not support "${type}"`);
  }
  const decoder = new ImageDecoder({ data: response.body ?? (await response.arrayBuffer()), type });
  try {
    await Promise.all([decoder.completed, decoder.tracks.ready]);
    const track = decoder.tracks.selectedTrack;
    if (!track || track.frameCount < 1) {
      throw new Error(`${COMPONENT} found no image frames in ${src}`);
    }
    const starts: number[] = [];
    let durationUs: number | null = 0;
    for (let frameIndex = 0; frameIndex < track.frameCount; frameIndex++) {
      const { image } = await decoder.decode({ frameIndex, completeFramesOnly: true });
      starts.push(image.timestamp);
      // A frame without a length: a still image (or an AVIF in Firefox), shown as its first frame.
      if (!image.duration) durationUs = null;
      else if (durationUs !== null) durationUs = image.timestamp + image.duration;
      image.close();
    }
    return {
      frameCount: track.frameCount,
      starts,
      durationUs: track.frameCount > 1 ? durationUs : null,
      decode: (frameIndex) => decoder.decode({ frameIndex, completeFramesOnly: true }).then((result) => result.image),
      close: () => decoder.close(),
    };
  } catch (error) {
    decoder.close();
    if (error instanceof Error && (error.name === 'AbortError' || error.message.startsWith(COMPONENT))) throw error;
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${COMPONENT} could not decode ${src}: ${message}`);
  }
};

/**
 * The frame to show at `timeInSeconds`: the one whose interval
 * [start, start + length) contains the time. null: nothing
 * ('clear-after-finish' after the end).
 */
export const getAnimatedImageFrameIndex = (
  track: Pick<AnimatedImageTrack, 'starts' | 'durationUs'>,
  timeInSeconds: number,
  loopBehavior: AnimatedImageLoopBehavior,
): number | null => {
  const { starts, durationUs } = track;
  if (durationUs === null || starts.length === 1) return 0;
  let time = timeInSeconds * 1e6;
  if (loopBehavior === 'loop') {
    time = ((time % durationUs) + durationUs) % durationUs;
  } else if (time >= durationUs) {
    return loopBehavior === 'pause-after-finish' ? starts.length - 1 : null;
  }
  // Last frame that starts at or before the time.
  let low = 0;
  let high = starts.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (starts[mid] <= time) low = mid;
    else high = mid - 1;
  }
  return low;
};
