/**
 * Media utilities, as in `@remotion/media-utils` (browser only, except the
 * pure visualize functions and createSmoothSvgPath):
 *
 *   import { useAudioData, visualizeAudio } from 'motionforge/media-utils';
 */
export { getVideoMetadata } from './media-utils/get-video-metadata';
export { getImageDimensions } from './media-utils/get-image-dimensions';
export { getAudioDurationInSeconds } from './media-utils/get-audio-duration-in-seconds';
export { getAudioData } from './media-utils/get-audio-data';
export { useAudioData } from './media-utils/use-audio-data';
export type { UseAudioDataOptions } from './media-utils/use-audio-data';
export { useWindowedAudioData } from './media-utils/use-windowed-audio-data';
export type {
  UseWindowedAudioDataOptions,
  UseWindowedAudioDataReturnValue,
} from './media-utils/use-windowed-audio-data';
export { visualizeAudio } from './media-utils/visualize-audio';
export type { VisualizeAudioOptions } from './media-utils/visualize-audio';
export { visualizeAudioWaveform } from './media-utils/visualize-audio-waveform';
export type { VisualizeAudioWaveformOptions } from './media-utils/visualize-audio-waveform';
export { createSmoothSvgPath } from './media-utils/create-smooth-svg-path';
export type { Point } from './media-utils/create-smooth-svg-path';
export type { MediaUtilsAudioData, VideoMetadata, ImageDimensions } from './media-utils/types';
