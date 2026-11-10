import { fftAccurate, fftFast, fftMag, smoothen, toInt16 } from './fft';
import type { MediaUtilsAudioData } from './types';

export type VisualizeAudioOptions = {
  audioData: MediaUtilsAudioData;
  frame: number;
  fps: number;
  /** Number of frequency bars (a power of two, e.g. 32, 64, 128). */
  numberOfSamples: number;
  /** 'accuracy' (default) or 'speed': two FFT implementations. */
  optimizeFor?: 'accuracy' | 'speed';
  /** Start of `audioData` in the source, in seconds (from useWindowedAudioData()). */
  dataOffsetInSeconds?: number;
  /** Average with the frames before and after (default true). */
  smoothing?: boolean;
};

// Loudest sample of the first channel, per waveform.
const maxMagnitudes = new WeakMap<Float32Array, number>();
const getMaxPossibleMagnitude = (waveform: Float32Array): number => {
  let max = maxMagnitudes.get(waveform);
  if (max === undefined) {
    max = 0;
    for (let i = 0; i < waveform.length; i++) {
      const value = Math.abs(toInt16(waveform[i]));
      if (value > max) max = value;
    }
    // Silent audio: avoid dividing by 0.
    max = max || 1;
    maxMagnitudes.set(waveform, max);
  }
  return max;
};

const visualizeFrame = ({
  audioData,
  frame,
  fps,
  numberOfSamples,
  optimizeFor,
  dataOffsetInSeconds,
}: Required<Omit<VisualizeAudioOptions, 'smoothing'>>): number[] => {
  const sampleSize = numberOfSamples * 2;
  const data = audioData.channelWaveforms[0];
  if (data.length < sampleSize) {
    throw new TypeError(`visualizeAudio(): the audio data is not big enough to provide ${numberOfSamples} bars`);
  }
  const start = Math.floor((frame / fps - dataOffsetInSeconds) * audioData.sampleRate);
  const actualStart = Math.max(0, start - sampleSize / 2);
  const ints = new Int16Array(sampleSize);
  ints.set(data.subarray(actualStart, actualStart + sampleSize).map((x) => toInt16(x)));
  const phasors = (optimizeFor === 'accuracy' ? fftAccurate : fftFast)(ints);
  const maxInt = getMaxPossibleMagnitude(data);
  return smoothen(fftMag(phasors)).map((m) => m / (sampleSize / 2) / maxInt);
};

/**
 * Remotion's `visualizeAudio()` (`@remotion/media-utils`): the frequency
 * spectrum of the first channel at `frame`, as `numberOfSamples` values
 * (about 0 to 1), low frequencies first. A pure function of its arguments.
 */
export const visualizeAudio = ({
  smoothing = true,
  optimizeFor = 'accuracy',
  dataOffsetInSeconds = 0,
  ...parameters
}: VisualizeAudioOptions): number[] => {
  const { audioData, frame, fps, numberOfSamples } = parameters;
  if (!audioData || !Array.isArray(audioData.channelWaveforms) || audioData.channelWaveforms.length === 0) {
    throw new TypeError('visualizeAudio(): audioData must come from getAudioData(), useAudioData() or useWindowedAudioData()');
  }
  if (typeof fps !== 'number' || !Number.isFinite(fps) || fps <= 0) {
    throw new TypeError(`visualizeAudio(): fps must be a positive number, got ${JSON.stringify(fps)}`);
  }
  if (typeof frame !== 'number' || !Number.isFinite(frame)) {
    throw new TypeError(`visualizeAudio(): frame must be a finite number, got ${JSON.stringify(frame)}`);
  }
  if (!Number.isInteger(numberOfSamples) || numberOfSamples < 1 || (numberOfSamples & (numberOfSamples - 1)) !== 0) {
    throw new TypeError(`visualizeAudio(): numberOfSamples must be a power of two (e.g. 32, 64, 128), got ${numberOfSamples}`);
  }
  if (optimizeFor !== 'accuracy' && optimizeFor !== 'speed') {
    throw new TypeError(`visualizeAudio(): optimizeFor must be 'accuracy' or 'speed', got ${JSON.stringify(optimizeFor)}`);
  }
  const options = { ...parameters, optimizeFor, dataOffsetInSeconds };
  if (!smoothing) return visualizeFrame(options);
  const all = [frame - 1, frame, frame + 1].map((f) => visualizeFrame({ ...options, frame: f }));
  return Array.from({ length: numberOfSamples }, (_, i) => (all[0][i] + all[1][i] + all[2][i]) / 3);
};
