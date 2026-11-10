// @vitest-environment happy-dom
/**
 * collectAudioTracks() gives exactly the manifest of a live collector after
 * the host has rendered every frame: the same tracks, ids and order.
 */
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createAudioCollector } from '../src/core/audio-collector';
import { collectAudioTracks } from '../src/core/collect-audio-tracks';
import { InputEvent } from '../src/core/input-log';
import { useInputEvents } from '../src/core/input';
import { Audio, Video } from '../src/components/Media';
import { Loop, Sequence, Series } from '../src/components/Sequence';
import { TransitionSeries } from '../src/components/transitions/TransitionSeries';
import { linearTiming } from '../src/components/transitions/timings';
import { fade } from '../src/components/transitions/presentations/fade';
import { Sfx, ToneAudio } from '../src/audio';

// Tone.js with an offline context that renders a short silent buffer.
vi.mock('tone', () => {
  let current: unknown = { name: 'realtime' };
  class OfflineContext {
    constructor(
      public channels: number,
      public duration: number,
      public sampleRate: number,
    ) {}
    async render() {
      const data = new Float32Array(Math.round(this.duration * this.sampleRate));
      return { get: () => ({ length: data.length, sampleRate: this.sampleRate, numberOfChannels: 1, getChannelData: () => data }) };
    }
  }
  return {
    OfflineContext,
    getContext: () => current,
    setContext: (context: unknown) => {
      current = context;
    },
    loaded: () => Promise.resolve(),
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

class FakeAudioBuffer {
  length: number;
  sampleRate: number;
  numberOfChannels: number;
  private channels: Float32Array[];
  constructor({ length, numberOfChannels, sampleRate }: { length: number; numberOfChannels: number; sampleRate: number }) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.numberOfChannels = numberOfChannels;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  getChannelData(index: number) {
    return this.channels[index];
  }
}
beforeAll(() => vi.stubGlobal('AudioBuffer', FakeAudioBuffer));
afterAll(() => vi.unstubAllGlobals());

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const DURATION = 300;
const POP = [1, 0, 600, 0.01, 0.04, 0.08] as const;
const chime = () => {};

const TapSounds = () => (
  <>
    {useInputEvents().map((event, index) => (
      <Sfx key={index} at={event.frame} zzfx={POP} seed={index} name="tap" />
    ))}
  </>
);

const Scene = () => (
  <>
    <Audio src="music.mp3" loop trimAfter={90} volume={(f) => f / 90} name="music" />
    <Series>
      <Series.Sequence durationInFrames={100} premountFor={10}>
        <Video src="intro.mp4" trimBefore={10} volume={0.5} />
        <Loop durationInFrames={25}>
          <Sfx at={5} zzfx={POP} />
        </Loop>
      </Series.Sequence>
      <Series.Sequence durationInFrames={100} premountFor={20}>
        <TapSounds />
        <ToneAudio durationInFrames={30} render={chime} deps={['chime']} name="chime" />
        {/* Two copies playing at the same time: id and id#2. */}
        <Sequence from={50} durationInFrames={20}>
          <Audio src="pop.mp3" />
        </Sequence>
        <Sequence from={50} durationInFrames={20}>
          <Audio src="pop.mp3" />
        </Sequence>
      </Series.Sequence>
    </Series>
    <Sequence from={220}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={40}>
          <Audio src="c.mp3" durationInFrames={30} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} presentation={fade()} />
        <TransitionSeries.Sequence durationInFrames={50}>
          <Loop durationInFrames={20} times={2}>
            <Audio src="d.mp3" />
          </Loop>
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </Sequence>
  </>
);

const INPUT: InputEvent[] = [
  { frame: 120, type: 'tap' },
  { frame: 160, type: 'tap' },
];

// The host's export pass: every frame rendered with a live collector.
const livePass = (frames: number[]) => {
  const audio = createAudioCollector();
  for (const frame of frames) {
    act(() =>
      root.render(
        <FrameProvider frame={frame} fps={30} durationInFrames={DURATION} width={100} height={100} audio={audio} input={INPUT}>
          <Scene />
        </FrameProvider>,
      ),
    );
  }
  return audio.getTracks();
};

describe('collectAudioTracks() and a live collector', () => {
  it('give the same manifest', async () => {
    const frames = Array.from({ length: DURATION }, (_, i) => i);
    const live = livePass(frames);
    const dry = await collectAudioTracks(<Scene />, { fps: 30, durationInFrames: DURATION, width: 100, height: 100, input: INPUT });
    // music, the video, 4 loop iterations of the Sfx, 2 taps, the chime, 2 copies of pop, c and 2 iterations of d.
    expect(live).toHaveLength(14);
    expect(dry).toEqual(live);
    expect(dry.map((t) => t.id)).toEqual(live.map((t) => t.id));
    // The copies, the taps and the generated sounds are all there.
    expect(dry.filter((t) => t.src === 'pop.mp3').map((t) => t.id)).toEqual([live.find((t) => t.src === 'pop.mp3')!.id, expect.stringMatching(/#2$/)]);
    expect(dry.filter((t) => t.name === 'tap').map((t) => t.startFrame)).toEqual([120, 160]);
    expect(dry.find((t) => t.name === 'chime')!.generated!.kind).toBe('tone');
    // Whatever order the host rendered the frames in.
    act(() => root.unmount());
    root = createRoot(container);
    expect(livePass(frames.map((_, i) => (i * 7919) % DURATION))).toEqual(dry);
  });
});
