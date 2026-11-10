/**
 * collectAudioTracks() under plain Node: no DOM, no Web Audio, no Tone.js, no
 * WebGL. A realistic 300-frame creative must give its whole manifest fast.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useCurrentFrame, useVideoConfig } from '../src/core/context';
import { collectAudioTracks } from '../src/core/collect-audio-tracks';
import { useIsCollectingAudio } from '../src/core/audio-track';
import { useInputEvents } from '../src/core/input';
import { AbsoluteFill, Audio, Img, Video } from '../src/components/Media';
import { Loop, Sequence, Series } from '../src/components/Sequence';
import { Particles } from '../src/components/Particles';
import { AnimatedImage } from '../src/components/animated-image/AnimatedImage';
import { Lottie } from '../src/components/Lottie';
import { Gif } from '../src/components/gif/Gif';
import { ThreeCanvas } from '../src/components/three/ThreeCanvas';
import { TransitionSeries } from '../src/components/transitions/TransitionSeries';
import { linearTiming } from '../src/components/transitions/timings';
import { fade } from '../src/components/transitions/presentations/fade';
import { Sfx, ToneAudio, renderZzfx } from '../src/audio';
import { interpolate, spring } from '../src/utils/animation';

// Nothing may be loaded or rendered: Tone.js and the WebGL canvas fail if touched.
vi.mock('tone', () => {
  throw new Error('collectAudioTracks() must not load Tone.js');
});
vi.mock('@react-three/fiber', () => ({
  Canvas: () => {
    throw new Error('collectAudioTracks() must not render the WebGL canvas');
  },
  useThree: () => {
    throw new Error('collectAudioTracks() must not render the WebGL canvas');
  },
}));

const POP = [1.2, 0, 500, 0.01, 0.05, 0.1, 1] as const;
const WHOOSH = [0.6, 0, 200, 0.05, 0.2, 0.3, 4, 1, 3] as const;

const Title = ({ text }: { text: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 12 } });
  const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
      <h1 style={{ transform: `scale(${scale})`, opacity, fontSize: 96, color: '#fff' }}>{text}</h1>
    </AbsoluteFill>
  );
};

type Tap = { frame: number; type: 'tap'; cell: number };

// The playable part: 36 spinning cells; a tap fills a cell and pops.
const Board = () => {
  const frame = useCurrentFrame();
  const taps = useInputEvents<Tap>();
  return (
    <AbsoluteFill>
      {Array.from({ length: 36 }, (_, cell) => (
        <div
          key={cell}
          style={{
            position: 'absolute',
            left: (cell % 6) * 180,
            top: Math.floor(cell / 6) * 180,
            width: 170,
            height: 170,
            transform: `rotate(${(frame * 3 + cell * 10) % 360}deg)`,
            background: taps.some((tap) => tap.cell === cell) ? '#10b981' : '#333',
          }}
        />
      ))}
      {taps.map((tap, index) => (
        <Sfx key={index} at={tap.frame} zzfx={POP} name="pop" />
      ))}
    </AbsoluteFill>
  );
};

const jingle = (Tone: any, { framesToSeconds }: { framesToSeconds: (frames: number) => number }) => {
  const synth = new Tone.PolySynth(Tone.Synth).toDestination();
  ['C5', 'E5', 'G5'].forEach((note, i) => synth.triggerAttackRelease(note, '8n', framesToSeconds(i * 8)));
};

const Creative = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Loop durationInFrames={60}>
      <Audio src="music.mp3" trimAfter={60} name="music" volume={(f) => interpolate(f, [0, 10], [0, 0.8], { extrapolateRight: 'clamp' })} />
    </Loop>
    <Series>
      <Series.Sequence durationInFrames={90} premountFor={15}>
        <Video src="intro.mp4" style={{ width: '100%', height: '100%' }} />
        <Title text="Match the colors" />
        <Sfx at={10} zzfx={WHOOSH} name="whoosh" />
      </Series.Sequence>
      <Series.Sequence durationInFrames={120} premountFor={15}>
        <Board />
        <Particles seed="burst" origin={{ x: 540, y: 960 }} count={80} lifetime={[0.6, 1.2]} speed={[300, 900]} gravity={1200} size={[8, 16]} />
        <Lottie animationData={{ fr: 30, w: 10, h: 10, op: 30 }} />
        <ThreeCanvas width={200} height={200}>
          <mesh />
        </ThreeCanvas>
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <TransitionSeries>
          <TransitionSeries.Sequence durationInFrames={50}>
            <Img src="win.png" />
            <AnimatedImage src="confetti.webp" />
            <ToneAudio durationInFrames={45} render={jingle} name="jingle" />
          </TransitionSeries.Sequence>
          <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 10 })} presentation={fade()} />
          <TransitionSeries.Sequence durationInFrames={50}>
            <Gif src="cta.gif" width={100} height={100} />
            <Title text="Install now" />
          </TransitionSeries.Sequence>
        </TransitionSeries>
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);

const TAPS: Tap[] = [
  { frame: 100, type: 'tap', cell: 3 },
  { frame: 130, type: 'tap', cell: 8 },
  { frame: 150, type: 'tap', cell: 21 },
];

const OPTIONS = { fps: 30, durationInFrames: 300, width: 1080, height: 1920, input: TAPS };

describe('collectAudioTracks()', () => {
  it('collects the whole manifest of a 300-frame creative without a DOM, Web Audio, Tone.js or WebGL, in well under a few seconds', async () => {
    expect(typeof document).toBe('undefined');
    const started = performance.now();
    const tracks = await collectAudioTracks(<Creative />, OPTIONS);
    const elapsed = performance.now() - started;
    console.log(`collectAudioTracks: 300 frames in ${elapsed.toFixed(0)} ms`);
    expect(elapsed).toBeLessThan(3000);

    const summary = tracks.map((t) => [t.name, t.src ?? t.generated!.kind, t.from, t.startFrame, t.endFrame]);
    const pop = Math.ceil((renderZzfx(POP).length / 44100) * 30 - 1e-9);
    const whoosh = Math.ceil((renderZzfx(WHOOSH).length / 44100) * 30 - 1e-9);
    // Ordered by startFrame (then id, so the two tracks at 0 in either order).
    expect(summary.slice(0, 2)).toEqual(
      expect.arrayContaining([
        ['music', 'music.mp3', 0, 0, 60],
        [null, 'intro.mp4', 0, 0, 90],
      ]),
    );
    expect(summary.slice(2)).toEqual([
      ['whoosh', 'zzfx', 10, 10, 10 + whoosh],
      ['music', 'music.mp3', 60, 60, 120],
      ['pop', 'zzfx', 100, 100, 100 + pop],
      ['music', 'music.mp3', 120, 120, 180],
      ['pop', 'zzfx', 130, 130, 130 + pop],
      ['pop', 'zzfx', 150, 150, 150 + pop],
      ['music', 'music.mp3', 180, 180, 240],
      ['jingle', 'tone', 210, 210, 255],
      ['music', 'music.mp3', 240, 240, 300],
    ]);
    // Generated tracks are described, not rendered: the host renders them when it needs them.
    for (const track of tracks.filter((t) => t.generated)) expect(track.generated!.buffer).toBeNull();
    expect(JSON.parse(tracks.find((t) => t.name === 'whoosh')!.generated!.key)).toEqual(['zzfx', [...WHOOSH], 44100, 0]);
    expect(tracks.find((t) => t.name === 'music')!.volume).toHaveLength(60);
  });

  it('collects the tracks of the input log it is given', async () => {
    const tracks = await collectAudioTracks(
      <Sequence from={0} durationInFrames={60}>
        <Board />
      </Sequence>,
      { durationInFrames: 60, width: 100, height: 100, input: [{ frame: 5, type: 'tap', cell: 0 }] },
    );
    expect(tracks.map((t) => [t.name, t.startFrame])).toEqual([['pop', 5]]);
    expect(await collectAudioTracks(<Board />, { durationInFrames: 60, width: 100, height: 100 })).toEqual([]);
  });

  it('lets components ask whether they are being collected', async () => {
    const seen = new Set<boolean>();
    const Probe = () => {
      seen.add(useIsCollectingAudio());
      return null;
    };
    await collectAudioTracks(<Probe />, { durationInFrames: 2, width: 10, height: 10 });
    expect([...seen]).toEqual([true]);
  });

  it('names the frame that failed, and checks its options', async () => {
    const Breaks = () => {
      if (useCurrentFrame() === 7) throw new Error('document is not defined');
      return null;
    };
    await expect(collectAudioTracks(<Breaks />, { durationInFrames: 10, width: 10, height: 10 })).rejects.toThrow(
      'collectAudioTracks: rendering frame 7 failed: document is not defined',
    );
    // @ts-expect-error durationInFrames missing
    await expect(collectAudioTracks(null, { width: 10, height: 10 })).rejects.toThrow(/durationInFrames must be a positive integer/);
    // @ts-expect-error an unknown option
    await expect(collectAudioTracks(null, { durationInFrames: 1, width: 10, height: 10, audio: {} })).rejects.toThrow(
      /unknown option "audio"/,
    );
    await expect(collectAudioTracks(null, { durationInFrames: 1, width: 0, height: 10 })).rejects.toThrow(
      /width and height must be positive numbers/,
    );
  });
});
