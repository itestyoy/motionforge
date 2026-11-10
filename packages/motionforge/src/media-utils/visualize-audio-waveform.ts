import type { MediaUtilsAudioData } from './types';

export type VisualizeAudioWaveformOptions = {
  audioData: MediaUtilsAudioData;
  frame: number;
  fps: number;
  /** Length of audio shown, centred on the frame's time. */
  windowInSeconds: number;
  /** Number of values returned. */
  numberOfSamples: number;
  /** Channel to read (default 0). */
  channel?: number;
  /** Start of `audioData` in the source, in seconds (from useWindowedAudioData()). */
  dataOffsetInSeconds?: number;
  /** Scale so that the loudest value is 1 (default false). */
  normalize?: boolean;
};

const checkChannel = (channel: unknown, numberOfChannels: number) => {
  if (typeof channel !== 'number' || !Number.isInteger(channel) || channel < 0) {
    throw new TypeError(`visualizeAudioWaveform(): channel must be a non-negative integer, got ${JSON.stringify(channel)}`);
  }
  if (channel > numberOfChannels - 1) {
    throw new TypeError(
      `visualizeAudioWaveform(): channel must be ${numberOfChannels - 1} or lower; the audio has ${numberOfChannels} channel(s)`,
    );
  }
};

// Mean absolute amplitude per block; in 'minus-one-to-one' every other value is negated.
const getWaveformSamples = (audioBuffer: Float32Array, numberOfSamples: number, normalize: boolean): number[] => {
  const blockSize = Math.floor(audioBuffer.length / numberOfSamples);
  if (blockSize === 0) return [];
  let values: number[] = [];
  for (let i = 0; i < numberOfSamples; i++) {
    let sum = 0;
    for (let j = 0; j < blockSize; j++) sum += Math.abs(audioBuffer[blockSize * i + j]);
    values.push(sum / blockSize);
  }
  if (normalize) {
    let max = -Infinity;
    for (const value of values) if (value > max) max = value;
    const multiplier = max === 0 ? 0 : max ** -1;
    values = values.map((n) => n * multiplier);
  }
  return values.map((n, i) => (i % 2 === 0 ? n * -1 : n));
};

/**
 * Remotion's `visualizeAudioWaveform()` (`@remotion/media-utils`): the
 * waveform of `windowInSeconds` of audio centred on the frame's time, as
 * `numberOfSamples` amplitudes, alternately negative and positive (draw them
 * as bars around a centre line, or through createSmoothSvgPath()). Time
 * outside the audio counts as silence. A pure function of its arguments.
 */
export const visualizeAudioWaveform = ({
  audioData,
  frame,
  fps,
  windowInSeconds,
  numberOfSamples,
  channel = 0,
  dataOffsetInSeconds = 0,
  normalize = false,
}: VisualizeAudioWaveformOptions): number[] => {
  if (!audioData || !Array.isArray(audioData.channelWaveforms)) {
    throw new TypeError('visualizeAudioWaveform(): audioData must come from getAudioData(), useAudioData() or useWindowedAudioData()');
  }
  for (const [name, value] of [['fps', fps], ['windowInSeconds', windowInSeconds]] as const) {
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
      throw new TypeError(`visualizeAudioWaveform(): ${name} must be a positive number, got ${JSON.stringify(value)}`);
    }
  }
  if (!Number.isInteger(numberOfSamples) || numberOfSamples < 1) {
    throw new TypeError(`visualizeAudioWaveform(): numberOfSamples must be a positive integer, got ${JSON.stringify(numberOfSamples)}`);
  }
  if (windowInSeconds * audioData.sampleRate < numberOfSamples) {
    throw new TypeError(
      `visualizeAudioWaveform(): ${windowInSeconds}s of audio do not have ${numberOfSamples} samples; increase windowInSeconds or decrease numberOfSamples`,
    );
  }
  checkChannel(channel, audioData.numberOfChannels);

  const waveform = audioData.channelWaveforms[channel];
  const startTimeInSeconds = frame / fps - windowInSeconds / 2 - dataOffsetInSeconds;
  const startSample = Math.floor(startTimeInSeconds * audioData.sampleRate);
  const endSample = Math.floor((startTimeInSeconds + windowInSeconds) * audioData.sampleRate);
  // Pad only the part of the window outside the audio with silence.
  const padStart = Math.max(0, Math.min(endSample, 0) - startSample);
  const padEnd = Math.max(0, endSample - Math.max(startSample, waveform.length));
  const clampedStart = Math.min(Math.max(startSample, 0), waveform.length);
  const clampedEnd = Math.min(Math.max(endSample, 0), waveform.length);
  const slice = waveform.subarray(clampedStart, clampedEnd);
  const buffer = new Float32Array(padStart + slice.length + padEnd);
  buffer.set(slice, padStart);
  return getWaveformSamples(buffer, numberOfSamples, normalize);
};
