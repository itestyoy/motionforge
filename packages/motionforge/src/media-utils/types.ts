export type MediaUtilsAudioData = {
  /** One array of samples (-1 to 1) per channel. */
  channelWaveforms: Float32Array[];
  sampleRate: number;
  durationInSeconds: number;
  numberOfChannels: number;
  /** Identifies this data (the same source and options give the same id). */
  resultId: string;
  /** Whether the source is on another origin than the page. */
  isRemote: boolean;
};

export type VideoMetadata = {
  durationInSeconds: number;
  width: number;
  height: number;
  aspectRatio: number;
  isRemote: boolean;
};

export type ImageDimensions = { width: number; height: number };
