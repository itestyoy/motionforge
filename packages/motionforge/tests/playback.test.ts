import { describe, expect, it } from 'vitest';
import { advancePlayback } from '../src/core/playback';

const clock = { baseFrame: 0, fps: 30, playbackRate: 1, durationInFrames: 300, loop: false };

describe('advancePlayback', () => {
  it('follows the wall clock: 1 s of a 30 fps video is 30 frames', () => {
    expect(advancePlayback({ ...clock, elapsedMs: 1000 }).frame).toBe(30);
    expect(advancePlayback({ ...clock, elapsedMs: 1000 / 30 }).frame).toBe(1);
    expect(advancePlayback({ ...clock, elapsedMs: 1000 / 30 - 1 }).frame).toBe(0);
  });

  it('keeps real time on a 60 Hz screen (the old per-repaint counter reached ~20 fps)', () => {
    // Sample the clock at every 60 Hz repaint for 10 s.
    const frames = new Set<number>();
    for (let paint = 0; paint <= 600; paint++) {
      frames.add(advancePlayback({ ...clock, elapsedMs: (paint * 1000) / 60 }).frame);
    }
    expect(Math.max(...frames)).toBe(299);
    expect(frames.size).toBe(300);
  });

  it('starts from the frame playback resumed at and honours the playback rate', () => {
    expect(advancePlayback({ ...clock, baseFrame: 100, elapsedMs: 500 }).frame).toBe(115);
    expect(advancePlayback({ ...clock, playbackRate: 2, elapsedMs: 500 }).frame).toBe(30);
    expect(advancePlayback({ ...clock, playbackRate: 0.5, elapsedMs: 1000 }).frame).toBe(15);
  });

  it('stops on the last frame without loop and wraps with loop', () => {
    expect(advancePlayback({ ...clock, elapsedMs: 20_000 })).toEqual({ frame: 299, ended: true });
    expect(advancePlayback({ ...clock, loop: true, elapsedMs: 11_000 })).toEqual({ frame: 30, ended: false });
  });

  it('treats a timestamp before the start as no time elapsed', () => {
    expect(advancePlayback({ ...clock, baseFrame: 7, elapsedMs: -5 }).frame).toBe(7);
  });
});
