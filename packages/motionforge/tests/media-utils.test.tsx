// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import {
  createSmoothSvgPath,
  getAudioData,
  getVideoMetadata,
  useAudioData,
  useWindowedAudioData,
  visualizeAudio,
  visualizeAudioWaveform,
  type MediaUtilsAudioData,
} from '../src/media-utils';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const audio = (samples: number[] | Float32Array, sampleRate: number, extra?: Partial<MediaUtilsAudioData>): MediaUtilsAudioData => {
  const waveform = Float32Array.from(samples);
  return {
    channelWaveforms: [waveform],
    sampleRate,
    durationInSeconds: waveform.length / sampleRate,
    numberOfChannels: 1,
    resultId: 'test',
    isRemote: false,
    ...extra,
  };
};

describe('createSmoothSvgPath', () => {
  it('joins the points with cubic curves (smoothing 0.2)', () => {
    const d = createSmoothSvgPath({ points: [{ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 20, y: 0 }] });
    const numbers = d.match(/-?[\d.e-]+/g)!.map(Number);
    // M 0,0 C 2,2 6,10 10,10 C 14,10 18,2 20,0
    [0, 0, 2, 2, 6, 10, 10, 10, 14, 10, 18, 2, 20, 0].forEach((expected, i) => expect(numbers[i]).toBeCloseTo(expected, 10));
    expect(d.startsWith('M 0,0 C ')).toBe(true);
    expect(createSmoothSvgPath({ points: [] })).toBe('');
    expect(() => createSmoothSvgPath({ points: [{ x: 0, y: Number.NaN }] })).toThrow(/points\[0\] must be \{ x, y \}/);
  });
});

describe('visualizeAudioWaveform', () => {
  // 10 samples per second, amplitude = index / 100
  const data = audio(Array.from({ length: 100 }, (_, i) => i / 100), 10);

  it('averages blocks of the window centred on the frame, alternating the sign', () => {
    // frame 30 at 30 fps = 1 s; window 0.4 s -> samples 8..11, two blocks of two
    const values = visualizeAudioWaveform({ audioData: data, frame: 30, fps: 30, windowInSeconds: 0.4, numberOfSamples: 2 });
    expect(values).toHaveLength(2);
    expect(values[0]).toBeCloseTo(-(0.08 + 0.09) / 2, 6);
    expect(values[1]).toBeCloseTo((0.1 + 0.11) / 2, 6);
  });

  it('pads time outside the audio with silence and normalizes on request', () => {
    // frame 0: window -0.2..0.2 s -> two silent samples, then samples 0 and 1
    const values = visualizeAudioWaveform({ audioData: data, frame: 0, fps: 30, windowInSeconds: 0.4, numberOfSamples: 2, normalize: true });
    expect(values[0] === 0).toBe(true); // -0
    expect(values[1]).toBeCloseTo(1, 10);
  });

  it('honours dataOffsetInSeconds and checks its input', () => {
    const shifted = visualizeAudioWaveform({ audioData: data, frame: 60, fps: 30, windowInSeconds: 0.4, numberOfSamples: 2, dataOffsetInSeconds: 1 });
    expect(shifted[1]).toBeCloseTo((0.1 + 0.11) / 2, 6);
    expect(() => visualizeAudioWaveform({ audioData: data, frame: 0, fps: 30, windowInSeconds: 0.1, numberOfSamples: 2 })).toThrow(
      /do not have 2 samples/,
    );
    expect(() => visualizeAudioWaveform({ audioData: data, frame: 0, fps: 30, windowInSeconds: 1, numberOfSamples: 2, channel: 1 })).toThrow(
      /channel must be 0 or lower/,
    );
  });
});

describe('visualizeAudio', () => {
  // A 128 Hz sine at 1024 Hz: with 32 bars (64-sample FFT) it lands in bar 8.
  const sine = audio(Array.from({ length: 4096 }, (_, i) => Math.sin((2 * Math.PI * 128 * i) / 1024)), 1024);
  const argmax = (values: number[]) => values.indexOf(Math.max(...values));

  it('puts the energy of a tone into its frequency bar, with both FFTs', () => {
    const accurate = visualizeAudio({ audioData: sine, frame: 30, fps: 30, numberOfSamples: 32 });
    const fast = visualizeAudio({ audioData: sine, frame: 30, fps: 30, numberOfSamples: 32, optimizeFor: 'speed' });
    expect(accurate).toHaveLength(32);
    expect(argmax(accurate)).toBe(8);
    expect(argmax(fast)).toBe(8);
    accurate.forEach((value, i) => expect(fast[i]).toBeCloseTo(value, 6));
    expect(visualizeAudio({ audioData: sine, frame: 30, fps: 30, numberOfSamples: 32 })).toEqual(accurate);
  });

  it('checks its input', () => {
    expect(() => visualizeAudio({ audioData: sine, frame: 0, fps: 30, numberOfSamples: 24 })).toThrow(/must be a power of two/);
    expect(() => visualizeAudio({ audioData: audio([0, 0], 1024), frame: 0, fps: 30, numberOfSamples: 32 })).toThrow(
      /not big enough to provide 32 bars/,
    );
  });
});

// Web Audio and fetch stand-ins: a file decodes to `channels` channels of
// `seconds` seconds at 100 Hz, every sample equal to its time in seconds.
const fetches: string[] = [];
const installAudio = (seconds: number, channels = 2) => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (src: string) => {
      fetches.push(src);
      return { ok: true, status: 200, statusText: 'OK', arrayBuffer: async () => new ArrayBuffer(8) };
    }),
  );
  vi.stubGlobal(
    'AudioContext',
    class {
      async decodeAudioData() {
        const length = seconds * 100;
        return {
          numberOfChannels: channels,
          sampleRate: 100,
          duration: seconds,
          length,
          getChannelData: (channel: number) => Float32Array.from({ length }, (_, i) => i / 100 + channel * 1000),
        };
      }
      async close() {}
    },
  );
};

let container: HTMLDivElement;
let root: Root;
beforeEach(() => {
  fetches.length = 0;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const renderAt = (frame: number, node: React.ReactNode, gate?: RenderGate) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={900} width={100} height={100} gate={gate}>
        {node}
      </FrameProvider>,
    ),
  );
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

describe('getAudioData', () => {
  it('decodes every channel once per source, with a deterministic resultId', async () => {
    installAudio(2);
    const [a, b] = await Promise.all([getAudioData('https://cdn.test/a.mp3'), getAudioData('https://cdn.test/a.mp3')]);
    expect(a).toBe(b);
    expect(fetches).toEqual(['https://cdn.test/a.mp3']);
    expect([a.numberOfChannels, a.sampleRate, a.durationInSeconds, a.isRemote]).toEqual([2, 100, 2, true]);
    expect(a.channelWaveforms[1][0]).toBe(1000);
    expect(a.resultId).toBe(JSON.stringify(['https://cdn.test/a.mp3', 48000, null]));
  });
});

describe('useAudioData', () => {
  it('holds the frame until the audio data has rendered', async () => {
    installAudio(1);
    const gate = createRenderGate();
    const Bars = () => {
      const data = useAudioData('https://cdn.test/hook.mp3');
      return <i data-channels="">{data ? data.numberOfChannels : 'none'}</i>;
    };
    renderAt(0, <Bars />, gate);
    expect(gate.getPending().map((p) => p.label)).toEqual(['useAudioData() loading https://cdn.test/hook.mp3']);
    await settle();
    expect(container.querySelector('[data-channels]')!.textContent).toBe('2');
    await expect(gate.waitUntilReady({ timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('cancels the render when the audio cannot be loaded', async () => {
    vi.stubGlobal('AudioContext', class {});
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, statusText: 'Not Found' })));
    const gate = createRenderGate();
    const Bars = () => {
      useAudioData('https://cdn.test/missing.mp3');
      return null;
    };
    renderAt(0, <Bars />, gate);
    await settle();
    await expect(gate.waitUntilReady()).rejects.toThrow(/getAudioData\(\) could not load https:\/\/cdn.test\/missing.mp3: HTTP 404/);
  });
});

describe('useWindowedAudioData', () => {
  type Out = { current: ReturnType<typeof useWindowedAudioData> | null };
  const Windowed = ({ out, frame }: { out: Out; frame: number }) => {
    out.current = useWindowedAudioData({ src: 'https://cdn.test/long.mp3', frame, fps: 30, windowInSeconds: 2, channelIndex: 1 });
    return null;
  };

  it('returns the window at the frame and its neighbours, with their offset', async () => {
    installAudio(10);
    const gate = createRenderGate();
    const out: Out = { current: null };
    // 3 s: window 1
    renderAt(90, <Windowed out={out} frame={90} />, gate);
    expect(out.current!.audioData).toBeNull();
    await settle();
    await expect(gate.waitUntilReady({ frame: 90, timeoutMs: 1000 })).resolves.toBeUndefined();
    let { audioData, dataOffsetInSeconds } = out.current!;
    expect(dataOffsetInSeconds).toBe(0);
    expect(audioData!.numberOfChannels).toBe(1);
    expect(audioData!.channelWaveforms[0].length).toBe(600); // windows 0, 1, 2
    expect(audioData!.channelWaveforms[0][0]).toBe(1000); // channel 1

    // 8 s: window 4, the last
    renderAt(240, <Windowed out={out} frame={240} />, gate);
    ({ audioData, dataOffsetInSeconds } = out.current!);
    expect(dataOffsetInSeconds).toBe(6);
    expect(audioData!.channelWaveforms[0].length).toBe(400);
    expect(audioData!.channelWaveforms[0][0]).toBeCloseTo(1006, 3);

    // 10 s: past the end
    renderAt(300, <Windowed out={out} frame={300} />, gate);
    expect(out.current!.audioData).toBeNull();
    expect(fetches).toHaveLength(1);
  });
});

describe('getVideoMetadata', () => {
  it('reads the metadata of an invisible video element', async () => {
    const created: HTMLVideoElement[] = [];
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const element = createElement(tag);
      if (tag === 'video') created.push(element as HTMLVideoElement);
      return element;
    }) as typeof document.createElement);
    const metadata = getVideoMetadata('/clip.mp4');
    await Promise.resolve();
    await Promise.resolve();
    const video = created[0];
    Object.defineProperties(video, {
      videoWidth: { value: 1080 },
      videoHeight: { value: 1920 },
      duration: { value: 12.5 },
    });
    video.dispatchEvent(new Event('loadedmetadata'));
    await expect(metadata).resolves.toEqual({ durationInSeconds: 12.5, width: 1080, height: 1920, aspectRatio: 0.5625, isRemote: false });
  });

  it('rejects with the media error', async () => {
    const created: HTMLVideoElement[] = [];
    const createElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
      const element = createElement(tag);
      if (tag === 'video') created.push(element as HTMLVideoElement);
      return element;
    }) as typeof document.createElement);
    const metadata = getVideoMetadata('/broken.mp4');
    await Promise.resolve();
    await Promise.resolve();
    Object.defineProperty(created[0], 'error', { value: { code: 4, message: '' } });
    created[0].dispatchEvent(new Event('error'));
    await expect(metadata).rejects.toThrow(/getVideoMetadata\(\) could not load \/broken.mp4: MEDIA_ERR_SRC_NOT_SUPPORTED/);
  });
});
