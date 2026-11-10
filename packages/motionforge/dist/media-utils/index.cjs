'use client';'use strict';

var chunk5SQGQMYR_cjs = require('../chunk-5SQGQMYR.cjs');
var chunkNS6WDBHG_cjs = require('../chunk-NS6WDBHG.cjs');
var react = require('react');

// src/media-utils/shared.ts
var requireBrowser = (fn, what) => {
  if (typeof document === "undefined") {
    throw new Error(`${fn} needs a browser (${what}); call it in the browser, not on the server`);
  }
};
var isRemoteAsset = (src) => {
  if (/^(data|blob):/i.test(src)) return false;
  if (typeof document === "undefined") return true;
  try {
    return new URL(src, document.baseURI).origin !== new URL(document.baseURI).origin;
  } catch {
    return true;
  }
};
var MEDIA_ERROR_NAMES = {
  1: "MEDIA_ERR_ABORTED",
  2: "MEDIA_ERR_NETWORK",
  3: "MEDIA_ERR_DECODE",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED: the file is missing or its format is not supported"
};
var mediaError = (fn, src, error) => {
  const detail = error ? `${MEDIA_ERROR_NAMES[error.code] ?? `media error code ${error.code}`}${error.message ? ` (${error.message})` : ""}` : "unknown media error";
  return new Error(`${fn} could not load ${src}: ${detail}`);
};
var createCache = () => {
  const entries = /* @__PURE__ */ new Map();
  return (key, load) => {
    const cached5 = entries.get(key);
    if (cached5) return cached5;
    const loading = Promise.resolve().then(load);
    entries.set(key, loading);
    loading.catch(() => {
      if (entries.get(key) === loading) entries.delete(key);
    });
    return loading;
  };
};

// src/media-utils/get-video-metadata.ts
var cached = createCache();
var getVideoMetadata = (src) => {
  chunk5SQGQMYR_cjs.checkSrc("getVideoMetadata()", src);
  return cached(src, () => {
    requireBrowser("getVideoMetadata()", "a <video> element");
    const video = document.createElement("video");
    video.preload = "metadata";
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        video.removeEventListener("loadedmetadata", onLoadedMetadata);
        video.removeEventListener("error", onError);
        video.removeAttribute("src");
        video.load();
      };
      const onError = () => {
        const error = mediaError("getVideoMetadata()", src, video.error);
        cleanup();
        reject(error);
      };
      const onLoadedMetadata = () => {
        const { videoWidth: width, videoHeight: height, duration } = video;
        cleanup();
        if (width * height === 0) {
          reject(new Error(`getVideoMetadata(): ${src} has no video picture (width or height is 0)`));
        } else if (!Number.isFinite(duration)) {
          reject(new Error(`getVideoMetadata(): the duration of ${src} is ${duration}; re-encoding the video may fix it`));
        } else {
          resolve({ durationInSeconds: duration, width, height, aspectRatio: width / height, isRemote: isRemoteAsset(src) });
        }
      };
      video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
      video.addEventListener("error", onError, { once: true });
      video.src = src;
    });
  });
};

// src/media-utils/get-image-dimensions.ts
var cached2 = createCache();
var getImageDimensions = (src) => {
  chunk5SQGQMYR_cjs.checkSrc("getImageDimensions()", src);
  return cached2(src, () => {
    requireBrowser("getImageDimensions()", "an Image element");
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error(`getImageDimensions() could not load ${src}`));
      image.src = src;
    });
  });
};

// src/media-utils/get-audio-duration-in-seconds.ts
var cached3 = createCache();
var getAudioDurationInSeconds = (src) => {
  chunk5SQGQMYR_cjs.checkSrc("getAudioDurationInSeconds()", src);
  return cached3(src, () => {
    requireBrowser("getAudioDurationInSeconds()", "an <audio> element");
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    return new Promise((resolve, reject) => {
      const cleanup = () => {
        audio.removeEventListener("loadedmetadata", onLoadedMetadata);
        audio.removeEventListener("error", onError);
        audio.removeAttribute("src");
        audio.load();
      };
      const onError = () => {
        const error = mediaError("getAudioDurationInSeconds()", src, audio.error);
        cleanup();
        reject(error);
      };
      const onLoadedMetadata = () => {
        const { duration } = audio;
        cleanup();
        if (Number.isFinite(duration)) resolve(duration);
        else reject(new Error(`getAudioDurationInSeconds(): the duration of ${src} is ${duration}; re-encoding the file may fix it`));
      };
      audio.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
      audio.addEventListener("error", onError, { once: true });
      audio.src = src;
    });
  });
};

// src/media-utils/get-audio-data.ts
var cached4 = createCache();
var getAudioData = (src, options) => {
  chunk5SQGQMYR_cjs.checkSrc("getAudioData()", src);
  const sampleRate = options?.sampleRate ?? 48e3;
  if (typeof sampleRate !== "number" || !Number.isInteger(sampleRate) || sampleRate <= 0) {
    throw new TypeError(`getAudioData(): sampleRate must be a positive integer, got ${JSON.stringify(sampleRate)}`);
  }
  const resultId = JSON.stringify([src, sampleRate, chunk5SQGQMYR_cjs.serializeRequestInit(options?.requestInit)]);
  return cached4(resultId, async () => {
    requireBrowser("getAudioData()", "the Web Audio API");
    if (typeof AudioContext === "undefined") {
      throw new Error("getAudioData() needs the Web Audio API (AudioContext), which this environment does not have");
    }
    const response = await chunk5SQGQMYR_cjs.fetchAsset("getAudioData()", src, options?.requestInit);
    const encoded = await response.arrayBuffer();
    const context = new AudioContext({ sampleRate });
    let wave;
    try {
      wave = await context.decodeAudioData(encoded);
    } catch (error) {
      throw new Error(`getAudioData() could not decode ${src}: ${error instanceof Error ? error.message : error}`);
    } finally {
      context.close().catch(() => {
      });
    }
    return {
      channelWaveforms: Array.from({ length: wave.numberOfChannels }, (_, channel) => wave.getChannelData(channel)),
      sampleRate: wave.sampleRate,
      durationInSeconds: wave.duration,
      numberOfChannels: wave.numberOfChannels,
      resultId,
      isRemote: isRemoteAsset(src)
    };
  });
};
var useAudioData = (src, options) => {
  chunk5SQGQMYR_cjs.checkSrc("useAudioData()", src);
  const sampleRate = options?.sampleRate;
  const [requestInit] = react.useState(options?.requestInit);
  const key = JSON.stringify([src, sampleRate ?? null]);
  const [result, setResult] = react.useState(null);
  const { delayRender, continueRender, cancelRender } = chunkNS6WDBHG_cjs.useDelayRender();
  const handle = react.useRef(null);
  react.useEffect(() => {
    const current = delayRender(`useAudioData() loading ${src}`);
    handle.current = current;
    let active = true;
    Promise.resolve().then(() => getAudioData(src, { sampleRate, requestInit })).then(
      (data) => {
        if (active) setResult({ key, data });
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(current);
      }
    );
    return () => {
      active = false;
      handle.current = null;
      continueRender(current);
    };
  }, [key, src, sampleRate, requestInit, delayRender, continueRender, cancelRender]);
  react.useEffect(() => {
    if (result?.key === key && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [result, key, continueRender]);
  return result?.key === key ? result.data : null;
};
var checkPositive = (name, value) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`useWindowedAudioData(): ${name} must be a positive number, got ${JSON.stringify(value)}`);
  }
};
var useWindowedAudioData = ({
  src,
  frame,
  fps,
  windowInSeconds,
  channelIndex = 0,
  requestInit
}) => {
  chunk5SQGQMYR_cjs.checkSrc("useWindowedAudioData()", src);
  checkPositive("fps", fps);
  checkPositive("windowInSeconds", windowInSeconds);
  if (typeof frame !== "number" || !Number.isFinite(frame)) {
    throw new TypeError(`useWindowedAudioData(): frame must be a finite number, got ${JSON.stringify(frame)}`);
  }
  if (!Number.isInteger(channelIndex) || channelIndex < 0) {
    throw new TypeError(`useWindowedAudioData(): channelIndex must be a non-negative integer, got ${JSON.stringify(channelIndex)}`);
  }
  const [initialRequestInit] = react.useState(requestInit);
  const [loaded, setLoaded] = react.useState(null);
  const full = loaded?.src === src ? loaded.data : null;
  const { delayRender, continueRender, cancelRender } = chunkNS6WDBHG_cjs.useDelayRender();
  const handle = react.useRef(null);
  react.useEffect(() => {
    const current = delayRender(`useWindowedAudioData() loading ${src}`);
    handle.current = current;
    let active = true;
    Promise.resolve().then(() => getAudioData(src, { requestInit: initialRequestInit })).then(
      (data) => {
        if (active) setLoaded({ src, data });
      },
      (error) => {
        if (!active) return;
        cancelRender(error);
        continueRender(current);
      }
    );
    return () => {
      active = false;
      handle.current = null;
      continueRender(current);
    };
  }, [src, initialRequestInit, delayRender, continueRender, cancelRender]);
  react.useEffect(() => {
    if (full && handle.current !== null) {
      continueRender(handle.current);
      handle.current = null;
    }
  }, [full, continueRender]);
  if (full && channelIndex >= full.numberOfChannels) {
    throw new Error(
      `useWindowedAudioData(): channelIndex ${channelIndex} does not exist; ${src} has ${full.numberOfChannels} channel(s)`
    );
  }
  const currentTime = frame / fps;
  const currentWindowIndex = Math.floor(currentTime / windowInSeconds);
  const windows = react.useMemo(() => {
    if (!full) return [];
    const maxWindowIndex = Math.floor(full.durationInSeconds / windowInSeconds - 1e-12);
    return [currentWindowIndex - 1, currentWindowIndex, currentWindowIndex + 1].filter(
      (i) => i >= 0 && i <= maxWindowIndex
    );
  }, [full, currentWindowIndex, windowInSeconds]);
  const audioData = react.useMemo(() => {
    if (!full || windows.length === 0) return null;
    const waveform = full.channelWaveforms[channelIndex];
    const start = Math.floor(windows[0] * windowInSeconds * full.sampleRate);
    const end = Math.min(waveform.length, Math.ceil((windows[windows.length - 1] + 1) * windowInSeconds * full.sampleRate));
    return {
      channelWaveforms: [waveform.subarray(start, end)],
      sampleRate: full.sampleRate,
      durationInSeconds: full.durationInSeconds,
      numberOfChannels: 1,
      resultId: `${full.resultId}-channel-${channelIndex}-windows-${windowInSeconds}-${windows.join(",")}`,
      isRemote: full.isRemote
    };
  }, [full, windows, channelIndex, windowInSeconds]);
  const isBeyondAudioDuration = full ? currentTime >= full.durationInSeconds : false;
  return {
    audioData: isBeyondAudioDuration ? null : audioData,
    dataOffsetInSeconds: windows.length > 0 ? windows[0] * windowInSeconds : 0
  };
};

// src/media-utils/fft.ts
var exponentCache = /* @__PURE__ */ new Map();
var exponent = (k, n) => {
  let forN = exponentCache.get(n);
  if (!forN) {
    forN = /* @__PURE__ */ new Map();
    exponentCache.set(n, forN);
  }
  let value = forN.get(k);
  if (!value) {
    const x = -2 * Math.PI * (k / n);
    value = [Math.cos(x), Math.sin(x)];
    forN.set(k, value);
  }
  return value;
};
var fftAccurate = (vector) => {
  const n = vector.length;
  if (n === 1) return [[vector[0], 0]];
  const evens = [];
  const odds = [];
  for (let i = 0; i < n; i++) (i % 2 === 0 ? evens : odds).push(vector[i]);
  const xEvens = fftAccurate(evens);
  const xOdds = fftAccurate(odds);
  const result = [];
  for (let k = 0; k < n / 2; k++) {
    const t = xEvens[k];
    const [er, ei] = exponent(k, n);
    const [or, oi] = xOdds[k];
    const e = [er * or - ei * oi, er * oi + ei * or];
    result[k] = [t[0] + e[0], t[1] + e[1]];
    result[k + n / 2] = [t[0] - e[0], t[1] - e[1]];
  }
  return result;
};
var fftFast = (vector) => {
  const n = vector.length;
  if (n <= 1) {
    return Array.from({ length: n }, (_, i) => [vector[i] * 2, 0]);
  }
  const real = new Float64Array(n);
  const imag = new Float64Array(n);
  const halfN = n >> 1;
  let rev = 0;
  for (let i = 0; i < n; i += 2) {
    const v1 = vector[rev];
    const v2 = vector[rev + halfN];
    real[i] = v1 + v2;
    real[i + 1] = v1 - v2;
    let bit = halfN >> 1;
    while (rev & bit) {
      rev ^= bit;
      bit >>= 1;
    }
    rev ^= bit;
  }
  const logN = Math.log2(n);
  for (let s = 2; s <= logN; s++) {
    const m = 1 << s;
    const mHalf = m >> 1;
    const angleIncrement = 2 * Math.PI / m;
    const cosA = Math.cos(angleIncrement);
    const sinA = Math.sin(angleIncrement);
    const m2 = m << 1;
    const butterfly = (k, wr, wi) => {
      const r10 = real[k];
      const r11 = imag[k];
      const r20 = real[k + mHalf];
      const r21 = imag[k + mHalf];
      const tR = wr * r20 - wi * r21;
      const tI = wr * r21 + wi * r20;
      real[k] = r10 + tR;
      imag[k] = r11 + tI;
      real[k + mHalf] = r10 - tR;
      imag[k + mHalf] = r11 - tI;
    };
    const twiddleFree = (k) => {
      const r10 = real[k];
      const r11 = imag[k];
      const r20 = real[k + mHalf];
      const r21 = imag[k + mHalf];
      real[k] = r10 + r20;
      imag[k] = r11 + r21;
      real[k + mHalf] = r10 - r20;
      imag[k + mHalf] = r11 - r21;
    };
    if (s < logN) {
      for (let k = 0; k < n; k += m2) {
        twiddleFree(k);
        twiddleFree(k + m);
      }
    } else {
      twiddleFree(0);
    }
    let omegaReal = cosA;
    let omegaImag = sinA;
    for (let j = 1; j < mHalf; j++) {
      if (s < logN) {
        for (let k = j; k < n; k += m2) {
          butterfly(k, omegaReal, omegaImag);
          butterfly(k + m, omegaReal, omegaImag);
        }
      } else {
        butterfly(j, omegaReal, omegaImag);
      }
      const tempReal = omegaReal * cosA - omegaImag * sinA;
      omegaImag = omegaReal * sinA + omegaImag * cosA;
      omegaReal = tempReal;
    }
  }
  return Array.from({ length: n }, (_, i) => [real[i], imag[i]]);
};
var fftMag = (bins) => bins.slice(0, bins.length / 2).map(([re, im]) => Math.sqrt(re * re + im * im));
var smoothen = (array) => {
  const passes = 3;
  const points = 3;
  let lastArray = array;
  const newArr = [];
  for (let pass = 0; pass < passes; pass++) {
    const sidePoints = Math.floor(points / 2);
    const cn = 1 / (2 * sidePoints + 1);
    for (let i = 0; i < sidePoints; i++) {
      newArr[i] = lastArray[i];
      newArr[lastArray.length - i - 1] = lastArray[lastArray.length - i - 1];
    }
    for (let i = sidePoints; i < lastArray.length - sidePoints; i++) {
      let sum = 0;
      for (let n = -sidePoints; n <= sidePoints; n++) sum += cn * lastArray[i + n] + n;
      newArr[i] = sum;
    }
    lastArray = newArr;
  }
  return newArr;
};
var toInt16 = (x) => x > 0 ? x * 32767 : x * 32768;

// src/media-utils/visualize-audio.ts
var maxMagnitudes = /* @__PURE__ */ new WeakMap();
var getMaxPossibleMagnitude = (waveform) => {
  let max = maxMagnitudes.get(waveform);
  if (max === void 0) {
    max = 0;
    for (let i = 0; i < waveform.length; i++) {
      const value = Math.abs(toInt16(waveform[i]));
      if (value > max) max = value;
    }
    max = max || 1;
    maxMagnitudes.set(waveform, max);
  }
  return max;
};
var visualizeFrame = ({
  audioData,
  frame,
  fps,
  numberOfSamples,
  optimizeFor,
  dataOffsetInSeconds
}) => {
  const sampleSize = numberOfSamples * 2;
  const data = audioData.channelWaveforms[0];
  if (data.length < sampleSize) {
    throw new TypeError(`visualizeAudio(): the audio data is not big enough to provide ${numberOfSamples} bars`);
  }
  const start = Math.floor((frame / fps - dataOffsetInSeconds) * audioData.sampleRate);
  const actualStart = Math.max(0, start - sampleSize / 2);
  const ints = new Int16Array(sampleSize);
  ints.set(data.subarray(actualStart, actualStart + sampleSize).map((x) => toInt16(x)));
  const phasors = (optimizeFor === "accuracy" ? fftAccurate : fftFast)(ints);
  const maxInt = getMaxPossibleMagnitude(data);
  return smoothen(fftMag(phasors)).map((m) => m / (sampleSize / 2) / maxInt);
};
var visualizeAudio = ({
  smoothing = true,
  optimizeFor = "accuracy",
  dataOffsetInSeconds = 0,
  ...parameters
}) => {
  const { audioData, frame, fps, numberOfSamples } = parameters;
  if (!audioData || !Array.isArray(audioData.channelWaveforms) || audioData.channelWaveforms.length === 0) {
    throw new TypeError("visualizeAudio(): audioData must come from getAudioData(), useAudioData() or useWindowedAudioData()");
  }
  if (typeof fps !== "number" || !Number.isFinite(fps) || fps <= 0) {
    throw new TypeError(`visualizeAudio(): fps must be a positive number, got ${JSON.stringify(fps)}`);
  }
  if (typeof frame !== "number" || !Number.isFinite(frame)) {
    throw new TypeError(`visualizeAudio(): frame must be a finite number, got ${JSON.stringify(frame)}`);
  }
  if (!Number.isInteger(numberOfSamples) || numberOfSamples < 1 || (numberOfSamples & numberOfSamples - 1) !== 0) {
    throw new TypeError(`visualizeAudio(): numberOfSamples must be a power of two (e.g. 32, 64, 128), got ${numberOfSamples}`);
  }
  if (optimizeFor !== "accuracy" && optimizeFor !== "speed") {
    throw new TypeError(`visualizeAudio(): optimizeFor must be 'accuracy' or 'speed', got ${JSON.stringify(optimizeFor)}`);
  }
  const options = { ...parameters, optimizeFor, dataOffsetInSeconds };
  if (!smoothing) return visualizeFrame(options);
  const all = [frame - 1, frame, frame + 1].map((f) => visualizeFrame({ ...options, frame: f }));
  return Array.from({ length: numberOfSamples }, (_, i) => (all[0][i] + all[1][i] + all[2][i]) / 3);
};

// src/media-utils/visualize-audio-waveform.ts
var checkChannel = (channel, numberOfChannels) => {
  if (typeof channel !== "number" || !Number.isInteger(channel) || channel < 0) {
    throw new TypeError(`visualizeAudioWaveform(): channel must be a non-negative integer, got ${JSON.stringify(channel)}`);
  }
  if (channel > numberOfChannels - 1) {
    throw new TypeError(
      `visualizeAudioWaveform(): channel must be ${numberOfChannels - 1} or lower; the audio has ${numberOfChannels} channel(s)`
    );
  }
};
var getWaveformSamples = (audioBuffer, numberOfSamples, normalize) => {
  const blockSize = Math.floor(audioBuffer.length / numberOfSamples);
  if (blockSize === 0) return [];
  let values = [];
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
  return values.map((n, i) => i % 2 === 0 ? n * -1 : n);
};
var visualizeAudioWaveform = ({
  audioData,
  frame,
  fps,
  windowInSeconds,
  numberOfSamples,
  channel = 0,
  dataOffsetInSeconds = 0,
  normalize = false
}) => {
  if (!audioData || !Array.isArray(audioData.channelWaveforms)) {
    throw new TypeError("visualizeAudioWaveform(): audioData must come from getAudioData(), useAudioData() or useWindowedAudioData()");
  }
  for (const [name, value] of [["fps", fps], ["windowInSeconds", windowInSeconds]]) {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      throw new TypeError(`visualizeAudioWaveform(): ${name} must be a positive number, got ${JSON.stringify(value)}`);
    }
  }
  if (!Number.isInteger(numberOfSamples) || numberOfSamples < 1) {
    throw new TypeError(`visualizeAudioWaveform(): numberOfSamples must be a positive integer, got ${JSON.stringify(numberOfSamples)}`);
  }
  if (windowInSeconds * audioData.sampleRate < numberOfSamples) {
    throw new TypeError(
      `visualizeAudioWaveform(): ${windowInSeconds}s of audio do not have ${numberOfSamples} samples; increase windowInSeconds or decrease numberOfSamples`
    );
  }
  checkChannel(channel, audioData.numberOfChannels);
  const waveform = audioData.channelWaveforms[channel];
  const startTimeInSeconds = frame / fps - windowInSeconds / 2 - dataOffsetInSeconds;
  const startSample = Math.floor(startTimeInSeconds * audioData.sampleRate);
  const endSample = Math.floor((startTimeInSeconds + windowInSeconds) * audioData.sampleRate);
  const padStart = Math.max(0, Math.min(endSample, 0) - startSample);
  const padEnd = Math.max(0, endSample - Math.max(startSample, waveform.length));
  const clampedStart = Math.min(Math.max(startSample, 0), waveform.length);
  const clampedEnd = Math.min(Math.max(endSample, 0), waveform.length);
  const slice = waveform.subarray(clampedStart, clampedEnd);
  const buffer = new Float32Array(padStart + slice.length + padEnd);
  buffer.set(slice, padStart);
  return getWaveformSamples(buffer, numberOfSamples, normalize);
};

// src/media-utils/create-smooth-svg-path.ts
var line = (a, b) => ({
  length: Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2),
  angle: Math.atan2(b.y - a.y, b.x - a.x)
});
var controlPoint = ({
  current,
  previous,
  next,
  reverse
}) => {
  const smoothing = 0.2;
  const o = line(previous || current, next || current);
  const angle = o.angle + (reverse ? Math.PI : 0);
  const length = o.length * smoothing;
  return { x: current.x + Math.cos(angle) * length, y: current.y + Math.sin(angle) * length };
};
var createSmoothSvgPath = ({ points }) => {
  if (!Array.isArray(points)) {
    throw new TypeError(`createSmoothSvgPath(): points must be an array of { x, y }, got ${JSON.stringify(points)}`);
  }
  points.forEach((point, i) => {
    if (!point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      throw new TypeError(`createSmoothSvgPath(): points[${i}] must be { x, y } with finite numbers, got ${JSON.stringify(point)}`);
    }
  });
  return points.reduce((acc, current, i, a) => {
    if (i === 0) return `M ${current.x},${current.y}`;
    const previous = a[i - 1];
    const cp1 = controlPoint({ current: previous, previous: a[i - 2], next: current, reverse: false });
    const cp2 = controlPoint({ current, previous, next: a[i + 1], reverse: true });
    return `${acc} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${current.x},${current.y}`;
  }, "");
};

exports.createSmoothSvgPath = createSmoothSvgPath;
exports.getAudioData = getAudioData;
exports.getAudioDurationInSeconds = getAudioDurationInSeconds;
exports.getImageDimensions = getImageDimensions;
exports.getVideoMetadata = getVideoMetadata;
exports.useAudioData = useAudioData;
exports.useWindowedAudioData = useWindowedAudioData;
exports.visualizeAudio = visualizeAudio;
exports.visualizeAudioWaveform = visualizeAudioWaveform;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map