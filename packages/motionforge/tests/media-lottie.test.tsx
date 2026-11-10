// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { Audio, Video } from '../src/components/Media';
import { Lottie } from '../src/components/Lottie';

// A stand-in for lottie-web: records listeners and the frames it is sent to.
interface FakeAnimation {
  frameRate: number;
  totalFrames: number;
  listeners: Record<string, Array<() => void>>;
  goToAndStop: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
  addEventListener: (name: string, callback: () => void) => void;
  emit: (name: string) => void;
}
const { animations } = vi.hoisted(() => ({ animations: [] as FakeAnimation[] }));
vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: () => {
      const animation: FakeAnimation = {
        frameRate: 60,
        totalFrames: 120,
        listeners: {},
        goToAndStop: vi.fn(),
        destroy: vi.fn(),
        addEventListener(name, callback) {
          (this.listeners[name] ??= []).push(callback);
        },
        emit(name) {
          (this.listeners[name] ?? []).forEach((callback) => callback());
        },
      };
      animations.push(animation);
      return animation;
    },
  },
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  animations.length = 0;
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const renderAt = (frame: number, node: React.ReactNode) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100}>
        {node}
      </FrameProvider>,
    ),
  );

describe('Video / Audio', () => {
  it("keeps the internal loaded handler when the caller passes onLoadedData, and maps time with playbackRate", () => {
    const onLoadedData = vi.fn();
    const node = <Video src="a.mp4" startFrom={30} playbackRate={2} onLoadedData={onLoadedData} />;
    renderAt(45, node);
    const video = container.querySelector('video')!;
    act(() => {
      video.dispatchEvent(new Event('loadeddata'));
    });
    expect(onLoadedData).toHaveBeenCalledTimes(1);
    // (startFrom + frame * playbackRate) / fps
    expect(video.currentTime).toBeCloseTo((30 + 45 * 2) / 30, 6);
  });

  it('seeks when the element is more than half a frame off', () => {
    const node = <Audio src="a.mp3" />;
    renderAt(45, node);
    const audio = container.querySelector('audio')!;
    act(() => {
      audio.dispatchEvent(new Event('loadeddata'));
    });
    expect(audio.currentTime).toBeCloseTo(1.5, 6);
    // 0.03 s off (0.9 of a frame at 30 fps) at the next frame.
    audio.currentTime = 46 / 30 + 0.03;
    renderAt(46, node);
    expect(audio.currentTime).toBeCloseTo(46 / 30, 6);
  });
});

describe('Lottie', () => {
  it('maps composition frames to Lottie frames by time', () => {
    const data = {};
    renderAt(15, <Lottie src={data} />);
    act(() => animations[0].emit('DOMLoaded'));
    // 15 frames at 30 fps = 0.5 s = frame 30 of a 60 fps Lottie.
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(30, true);

    renderAt(15, <Lottie src={data} playbackRate={0.5} />);
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(15, true);
  });

  it('starts unloaded again when src changes', () => {
    renderAt(0, <Lottie src={{ a: 1 }} />);
    act(() => animations[0].emit('DOMLoaded'));
    expect(container.querySelector('[data-lottie-loaded]')!.getAttribute('data-lottie-loaded')).toBe('true');

    renderAt(0, <Lottie src={{ b: 2 }} />);
    expect(animations).toHaveLength(2);
    expect(animations[0].destroy).toHaveBeenCalled();
    expect(container.querySelector('[data-lottie-loaded]')!.getAttribute('data-lottie-loaded')).toBe('false');
  });

  it('shows an error when the data fails to load, and recovers with a new src', () => {
    renderAt(0, <Lottie src="https://example.com/missing.json" />);
    act(() => animations[0].emit('data_failed'));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'failed to load animation data from https://example.com/missing.json',
    );

    renderAt(0, <Lottie src={{ ok: true }} />);
    expect(animations).toHaveLength(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });
});
