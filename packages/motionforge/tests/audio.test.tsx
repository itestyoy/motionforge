// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider, useCurrentFrame } from '../src/core/context';
import { AudioCollector, AudioTrack, createAudioCollector } from '../src/core/audio-collector';
import { Audio, Video } from '../src/components/Media';
import { Freeze, Loop, Retiming, Reverse, Sequence, Series } from '../src/components/Sequence';
import { TransitionSeries } from '../src/components/transitions/TransitionSeries';
import { linearTiming } from '../src/components/transitions/timings';
import { fade } from '../src/components/transitions/presentations/fade';
import { Trail } from '../src/components/motion-blur/Trail';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
  vi.restoreAllMocks();
});

const DURATION = 300;

const renderAt = (frame: number, node: React.ReactNode, audio?: AudioCollector) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={DURATION} width={100} height={100} audio={audio}>
        {node}
      </FrameProvider>,
    ),
  );

// What the host gets after an export pass: every frame rendered.
const exportPass = (node: React.ReactNode, frames: Iterable<number> = Array.from({ length: DURATION }, (_, i) => i)) => {
  const audio = createAudioCollector();
  for (const frame of frames) renderAt(frame, node, audio);
  return audio.getTracks();
};

const timing = (track: AudioTrack) => ({ src: track.src, from: track.from, startFrame: track.startFrame, endFrame: track.endFrame });

describe('<Audio> track manifest', () => {
  it('renders no element and registers its track at the absolute start of the enclosing sequences', () => {
    const audio = createAudioCollector();
    renderAt(
      70,
      <Sequence from={50} durationInFrames={100}>
        <Sequence from={20}>
          <Audio src="voice.mp3" trimBefore={15} playbackRate={1.5} name="voice" />
        </Sequence>
      </Sequence>,
      audio,
    );
    expect(container.innerHTML).not.toContain('audio');
    expect(audio.getTracks()).toEqual([
      {
        id: expect.stringMatching(/^[0-9a-f]{14}$/),
        name: 'voice',
        src: 'voice.mp3',
        buffer: null,
        from: 70,
        startFrame: 70,
        // The outer sequence ends at 150.
        endFrame: 150,
        trimBefore: 15,
        trimAfter: null,
        playbackRate: 1.5,
        loop: false,
        muted: false,
        volume: 1,
      },
    ]);
  });

  it('places tracks in Series, Loop and TransitionSeries', () => {
    const tracks = exportPass(
      <>
        <Series>
          <Series.Sequence durationInFrames={40}>
            <Audio src="a.mp3" />
          </Series.Sequence>
          <Series.Sequence durationInFrames={30} offset={10}>
            <Audio src="b.mp3" />
          </Series.Sequence>
        </Series>
        <Sequence from={100} durationInFrames={50}>
          <Loop durationInFrames={20}>
            <Audio src="tick.mp3" />
          </Loop>
        </Sequence>
        <Sequence from={200}>
          <TransitionSeries>
            <TransitionSeries.Sequence durationInFrames={40}>
              <Audio src="c.mp3" />
            </TransitionSeries.Sequence>
            <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} presentation={fade()} />
            <TransitionSeries.Sequence durationInFrames={40}>
              <Audio src="d.mp3" />
            </TransitionSeries.Sequence>
          </TransitionSeries>
        </Sequence>
      </>,
    );
    expect(tracks.map(timing)).toEqual([
      { src: 'a.mp3', from: 0, startFrame: 0, endFrame: 40 },
      { src: 'b.mp3', from: 50, startFrame: 50, endFrame: 80 },
      // One track per iteration; the last one is cut by the sequence's end.
      { src: 'tick.mp3', from: 100, startFrame: 100, endFrame: 120 },
      { src: 'tick.mp3', from: 120, startFrame: 120, endFrame: 140 },
      { src: 'tick.mp3', from: 140, startFrame: 140, endFrame: 150 },
      { src: 'c.mp3', from: 200, startFrame: 200, endFrame: 240 },
      // The transition overlaps the scenes by 10 frames.
      { src: 'd.mp3', from: 230, startFrame: 230, endFrame: 270 },
    ]);
  });

  it('gives the same manifest whatever order the frames are rendered in', () => {
    const scene = (
      <>
        <Audio src="music.mp3" volume={(f) => Math.min(1, f / 30)} loop trimAfter={90} />
        <Series>
          <Series.Sequence durationInFrames={100}>
            <Audio src="a.mp3" />
          </Series.Sequence>
          <Series.Sequence durationInFrames={100}>
            <Loop durationInFrames={25}>
              <Audio src="b.mp3" volume={0.5} />
            </Loop>
          </Series.Sequence>
        </Series>
      </>
    );
    const forward = exportPass(scene);
    const frames = Array.from({ length: DURATION }, (_, i) => i);
    const backward = exportPass(scene, [...frames].reverse());
    // A fixed shuffle.
    const shuffled = exportPass(scene, frames.map((_, i) => (i * 7919) % DURATION));
    expect(forward).toHaveLength(6);
    expect(backward).toEqual(forward);
    expect(shuffled).toEqual(forward);
  });

  it('ends the track at the trimmed end of the media, the end of the sequence or of the composition', () => {
    const [cut] = exportPass(<Audio src="a.mp3" trimBefore={30} trimAfter={60} playbackRate={2} />, [0]);
    // (60 - 30) / 2 = 15 frames.
    expect(timing(cut)).toEqual({ src: 'a.mp3', from: 0, startFrame: 0, endFrame: 15 });
    expect(cut.trimAfter).toBe(60);
    // The earlier of trimAfter and trimBefore + durationInFrames; a media ending between frames is heard in that frame.
    const [short] = exportPass(<Audio src="a.mp3" trimBefore={30} trimAfter={60} durationInFrames={10} playbackRate={3} />, [0]);
    expect(short.trimAfter).toBe(40);
    expect(short.endFrame).toBe(4);
    // Looping: to the end of the composition.
    const [looped] = exportPass(<Audio src="a.mp3" trimAfter={20} loop />, [0]);
    expect(looped.endFrame).toBe(DURATION);
    expect(looped.loop).toBe(true);
  });

  it('starts a track that begins before the sequence is shown where it is shown', () => {
    const [track] = exportPass(
      <Sequence from={30}>
        <Sequence from={-10}>
          <Audio src="a.mp3" />
        </Sequence>
      </Sequence>,
      [40],
    );
    // Its frame 0 is at 20, the outer sequence shows it from 30: the host starts the media 10 frames in.
    expect(timing(track)).toEqual({ src: 'a.mp3', from: 20, startFrame: 30, endFrame: DURATION });
    const [early] = exportPass(
      <Sequence from={-45}>
        <Audio src="b.mp3" />
      </Sequence>,
      [0],
    );
    expect(timing(early)).toEqual({ src: 'b.mp3', from: -45, startFrame: 0, endFrame: DURATION });
  });

  it('samples a volume function per frame, from the start of the track and per loop iteration', () => {
    const volume = vi.fn((frame: number) => frame / 10);
    // A new function on every frame, as an inline arrow is.
    const Scene = () => {
      useCurrentFrame();
      return <Audio src="a.mp3" trimAfter={3} loop volume={(f) => volume(f)} />;
    };
    const [track] = exportPass(
      <Sequence from={100} durationInFrames={8}>
        <Scene />
      </Sequence>,
      [100, 101, 102, 103, 104, 105, 106, 107],
    );
    expect(track.volume).toEqual([0, 0.1, 0.2, 0, 0.1, 0.2, 0, 0.1]);
    // Sampled once, not on every frame.
    expect(volume).toHaveBeenCalledTimes(8);
    // Above 1 amplifies; a negative or non-finite value throws.
    expect(exportPass(<Audio src="b.mp3" volume={2.5} />, [0])[0].volume).toBe(2.5);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <Audio src="a.mp3" volume={() => -1} />)).toThrow(/<Audio>: volume\(0\) must return a finite number >= 0, got -1/);
    expect(() => renderAt(0, <Audio src="a.mp3" volume={() => NaN} />)).toThrow(/must return a finite number >= 0/);
  });

  it('registers tracks when a sequence mounts, premounted ones early, and tells subscribers', () => {
    const audio = createAudioCollector();
    const listener = vi.fn();
    audio.subscribe(listener);
    const scene = (
      <>
        <Sequence from={60} premountFor={30}>
          <Audio src="early.mp3" />
        </Sequence>
        <Sequence from={90}>
          <Audio src="late.mp3" />
        </Sequence>
      </>
    );
    renderAt(10, scene, audio);
    expect(audio.getTracks()).toEqual([]);
    renderAt(30, scene, audio);
    // Premounted 30 frames before it starts: the host can start it in sync.
    expect(audio.getTracks().map(timing)).toEqual([{ src: 'early.mp3', from: 60, startFrame: 60, endFrame: DURATION }]);
    expect(listener).toHaveBeenCalledTimes(1);
    const first = audio.getTracks();
    renderAt(31, scene, audio);
    // The same array while nothing is added.
    expect(audio.getTracks()).toBe(first);
    renderAt(90, scene, audio);
    expect(audio.getTracks().map((t) => t.src)).toEqual(['early.mp3', 'late.mp3']);
    expect(listener).toHaveBeenCalledTimes(2);
    // Tracks stay listed after their component unmounts.
    renderAt(0, scene, audio);
    expect(audio.getTracks()).toHaveLength(2);
  });

  it('lists identical tracks playing at the same time once per copy', () => {
    const tracks = exportPass(
      <>
        <Sequence from={10} durationInFrames={20}>
          <Audio src="pop.mp3" />
        </Sequence>
        <Sequence from={10} durationInFrames={20}>
          <Audio src="pop.mp3" />
        </Sequence>
      </>,
      [10, 11, 0, 15],
    );
    expect(tracks.map((t) => t.id)).toEqual([tracks[0].id, `${tracks[0].id}#2`]);
  });

  it("gives Video's sound as a track; the element is muted", () => {
    const audio = createAudioCollector();
    renderAt(5, <Sequence from={5}><Video src="clip.mp4" trimBefore={10} volume={0.4} muted /></Sequence>, audio);
    expect(container.querySelector('video')!.muted).toBe(true);
    expect(audio.getTracks()).toMatchObject([
      { src: 'clip.mp4', from: 5, startFrame: 5, trimBefore: 10, volume: 0.4, muted: true },
    ]);
  });

  it('collects nothing without a collector, and serves one FrameProvider per collector', () => {
    renderAt(0, <Audio src="a.mp3" />);
    expect(container.innerHTML).toBe('');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const audio = createAudioCollector();
    expect(() =>
      renderAt(
        0,
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} audio={audio}>
          {null}
        </FrameProvider>,
        audio,
      ),
    ).toThrow(/one FrameProvider at a time/);
    // @ts-expect-error not a collector
    expect(() => renderAt(0, null, { getTracks: () => [] })).toThrow(/audio must be created with createAudioCollector\(\)/);
  });

  it('does not pass the collector to a FrameProvider inside another one', () => {
    const audio = createAudioCollector();
    renderAt(
      0,
      <FrameProvider frame={5} durationInFrames={10} width={10} height={10}>
        <Audio src="inner.mp3" />
      </FrameProvider>,
      audio,
    );
    expect(audio.getTracks()).toEqual([]);
  });

  it('throws inside Freeze, Retiming and Reverse (and the motion blur that renders through Freeze)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const audio = createAudioCollector();
    expect(() => renderAt(0, <Freeze frame={0}><Audio src="a.mp3" /></Freeze>, audio)).toThrow(
      /<Audio> cannot be inside <Freeze>: it remaps time/,
    );
    expect(() => renderAt(0, <Retiming playbackRate={2}><Sequence><Audio src="a.mp3" /></Sequence></Retiming>, audio)).toThrow(
      /cannot be inside <Retiming>/,
    );
    expect(() => renderAt(0, <Reverse durationInFrames={10}><Video src="a.mp4" /></Reverse>, audio)).toThrow(
      /<Video> cannot be inside <Reverse>/,
    );
    expect(() => renderAt(5, <Trail layers={2} lagInFrames={1} trailOpacity={0.5}><Audio src="a.mp3" /></Trail>)).toThrow(
      /cannot be inside <Freeze>/,
    );
  });

  it('throws on wrong props, element attributes included', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <Audio src="" />)).toThrow(/<Audio>: src must be a non-empty string/);
    // @ts-expect-error <Audio> renders no element
    expect(() => renderAt(0, <Audio src="a.mp3" onLoadedData={() => {}} />)).toThrow(/renders no element and takes no "onLoadedData"/);
    // @ts-expect-error a boolean
    expect(() => renderAt(0, <Audio src="a.mp3" muted="yes" />)).toThrow(/muted must be a boolean/);
  });
});
