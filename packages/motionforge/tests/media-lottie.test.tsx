// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { Audio, Video } from '../src/components/Media';
import { Lottie, getLottieMetadata, LottieAnimationData } from '../src/components/Lottie';

// A stand-in for lottie-web: records listeners and the frames it is sent to.
interface FakeAnimation {
  params: Record<string, unknown>;
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
    loadAnimation: (params: Record<string, unknown>) => {
      const animation: FakeAnimation = {
        params,
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
  vi.restoreAllMocks();
});

const renderAt = (frame: number, node: React.ReactNode, gate?: RenderGate) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100} gate={gate}>
        {node}
      </FrameProvider>,
    ),
  );

describe('Video / Audio', () => {
  it("keeps the internal loaded handler when the caller passes onLoadedData, and maps time with playbackRate", () => {
    const onLoadedData = vi.fn();
    const node = <Video src="a.mp4" trimBefore={30} playbackRate={2} onLoadedData={onLoadedData} />;
    renderAt(45, node);
    const video = container.querySelector('video')!;
    act(() => {
      video.dispatchEvent(new Event('loadeddata'));
    });
    expect(onLoadedData).toHaveBeenCalledTimes(1);
    // (trimBefore + frame * playbackRate) / fps
    expect(video.currentTime).toBeCloseTo((30 + 45 * 2) / 30, 6);
  });

  it('seeks when the element is more than half a frame off', () => {
    const node = <Video src="a.mp4" />;
    renderAt(45, node);
    const video = container.querySelector('video')!;
    act(() => {
      video.dispatchEvent(new Event('loadeddata'));
    });
    expect(video.currentTime).toBeCloseTo(1.5, 6);
    const next = (frame: number, currentTime: number) => {
      video.currentTime = currentTime;
      renderAt(frame, node);
      act(() => {
        video.dispatchEvent(new Event('loadeddata'));
      });
      return video.currentTime;
    };
    // 0.01 s off (0.3 of a frame at 30 fps): no seek.
    expect(next(46, 46 / 30 + 0.01)).toBeCloseTo(46 / 30 + 0.01, 6);
    // 0.03 s off (0.9 of a frame): seeks.
    expect(next(47, 47 / 30 + 0.03)).toBeCloseTo(47 / 30, 6);
  });
});

// Minimal Lottie JSON: 60 fps, 100 × 100, 120 frames.
const lottieData = (extra: Record<string, unknown> = {}): LottieAnimationData => ({ fr: 60, w: 100, h: 100, op: 120, ...extra });

describe('Lottie', () => {
  it('maps composition frames to Lottie frames by time', () => {
    const data = lottieData();
    renderAt(15, <Lottie animationData={data} />);
    act(() => animations[0].emit('DOMLoaded'));
    // 15 frames at 30 fps = 0.5 s = frame 30 of a 60 fps Lottie.
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(30, true);

    renderAt(15, <Lottie animationData={data} playbackRate={0.5} />);
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(15, true);
  });

  it('starts unloaded again when src changes', () => {
    renderAt(0, <Lottie animationData={lottieData({ a: 1 })} />);
    act(() => animations[0].emit('DOMLoaded'));
    expect(container.querySelector('[data-lottie-loaded]')!.getAttribute('data-lottie-loaded')).toBe('true');

    renderAt(0, <Lottie animationData={lottieData({ b: 2 })} />);
    expect(animations).toHaveLength(2);
    expect(animations[0].destroy).toHaveBeenCalled();
    expect(container.querySelector('[data-lottie-loaded]')!.getAttribute('data-lottie-loaded')).toBe('false');
  });

  it('does not reload for a new object with the same data', () => {
    renderAt(0, <Lottie animationData={lottieData({ layers: [1, 2] })} />);
    act(() => animations[0].emit('DOMLoaded'));
    renderAt(1, <Lottie animationData={lottieData({ layers: [1, 2] })} />);
    renderAt(2, <Lottie animationData={JSON.parse('{"fr":60,"w":100,"h":100,"op":120,"layers":[1,2]}')} />);
    expect(animations).toHaveLength(1);
    expect(animations[0].destroy).not.toHaveBeenCalled();
    expect(container.querySelector('[data-lottie-loaded]')!.getAttribute('data-lottie-loaded')).toBe('true');
  });

  it('throws on animationData that is not an object (a URL included)', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error not animation data
    expect(() => renderAt(0, <Lottie animationData={null} />)).toThrow(/animationData must be the animation JSON as an object/);
    // @ts-expect-error a URL is not animation data
    expect(() => renderAt(0, <Lottie animationData="https://example.com/a.json" />)).toThrow(/fetch it and pass the result/);
  });

  it('shows an error when the data fails to load, cancels the render, and recovers with new data', async () => {
    const gate = createRenderGate();
    renderAt(0, <Lottie animationData={lottieData({ broken: true })} />, gate);
    act(() => animations[0].emit('data_failed'));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain('failed to load animation data');
    await expect(gate.waitUntilReady()).rejects.toThrow('<Lottie> failed to load animation data');

    renderAt(0, <Lottie animationData={lottieData({ ok: true })} />, gate);
    expect(animations).toHaveLength(2);
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('holds the frame until the data is loaded and the frame is set', async () => {
    const gate = createRenderGate();
    renderAt(15, <Lottie animationData={lottieData({ layers: [] })} />, gate);
    expect(gate.getPending().map((p) => p.label)).toEqual(['<Lottie> animation data']);
    act(() => animations[0].emit('data_ready'));
    expect(animations[0].goToAndStop).toHaveBeenCalledWith(30, true);
    await expect(gate.waitUntilReady({ frame: 15 })).resolves.toBeUndefined();
  });

  it('cancels the render when frameEnd is not after frameStart', async () => {
    const gate = createRenderGate();
    renderAt(0, <Lottie animationData={lottieData()} frameStart={200} />, gate);
    act(() => animations[0].emit('DOMLoaded'));
    await expect(gate.waitUntilReady()).rejects.toThrow(/frameEnd \(120\) must be greater than frameStart \(200\)/);
  });
});

describe('Video / Audio props (Remotion parity)', () => {
  const loaded = (element: HTMLMediaElement, duration?: number) => {
    if (duration !== undefined) Object.defineProperty(element, 'duration', { value: duration, configurable: true });
    act(() => {
      element.dispatchEvent(new Event('loadeddata'));
    });
  };

  it('unmounts at trimAfter, or at trimBefore + durationInFrames', () => {
    // (60 - 30) / 2 = 15 frames.
    renderAt(14, <Video src="a.mp4" trimBefore={30} trimAfter={60} playbackRate={2} />);
    expect(container.querySelector('video')).not.toBeNull();
    renderAt(15, <Video src="a.mp4" trimBefore={30} trimAfter={60} playbackRate={2} />);
    expect(container.querySelector('video')).toBeNull();
    // The earlier of trimAfter and trimBefore + durationInFrames.
    renderAt(9, <Video src="a.mp4" trimBefore={30} trimAfter={60} durationInFrames={10} />);
    expect(container.querySelector('video')).not.toBeNull();
    renderAt(10, <Video src="a.mp4" trimBefore={30} trimAfter={60} durationInFrames={10} />);
    expect(container.querySelector('video')).toBeNull();
  });

  it('loops the range from trimBefore to the end of the media', () => {
    renderAt(45, <Video src="a.mp4" trimBefore={30} loop />);
    const video = container.querySelector('video')!;
    // 2 s = 60 frames: the loop spans media frames 30..60, frame 45 is 15 into the second round.
    loaded(video, 2);
    expect(video.currentTime).toBeCloseTo(45 / 30, 6);
    // With trimAfter the loop spans trimBefore..trimAfter (and it stays mounted).
    renderAt(100, <Video src="b.mp4" trimBefore={10} trimAfter={20} loop />);
    const other = container.querySelector('video')!;
    loaded(other, 100);
    expect(other.currentTime).toBeCloseTo((10 + (100 % 10)) / 30, 6);
  });

  it('cancels the render when a loop has no finite length', async () => {
    const gate = createRenderGate();
    renderAt(5, <Video src="live.m3u8" loop />, gate);
    loaded(container.querySelector('video')!, Infinity);
    await expect(gate.waitUntilReady()).rejects.toThrow(/loop needs a media with a finite duration/);
  });

  it('mutes the element (its sound is an audio track) and fits the picture with objectFit (default contain)', () => {
    renderAt(0, <Video src="a.mp4" style={{ width: 100 }} />);
    const video = container.querySelector('video')!;
    expect(video.muted).toBe(true);
    expect(video.style.objectFit).toBe('contain');
    expect(video.style.width).toBe('100px');
    renderAt(0, <Video src="a.mp4" objectFit="cover" muted />);
    expect(container.querySelector('video')!.style.objectFit).toBe('cover');
    expect(container.querySelector('video')!.muted).toBe(true);
  });

  it('throws on wrong props', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <Video src="a.mp4" trimBefore={-1} />)).toThrow(/<Video>: trimBefore must be a finite number >= 0/);
    expect(() => renderAt(0, <Video src="a.mp4" trimBefore={10} trimAfter={5} />)).toThrow(/trimAfter \(5\) must be greater than trimBefore \(10\)/);
    expect(() => renderAt(0, <Audio src="a.mp3" playbackRate={0} />)).toThrow(/<Audio>: playbackRate must be a finite number above 0/);
    expect(() => renderAt(0, <Audio src="a.mp3" volume={-1} />)).toThrow(/volume must be a number >= 0/);
    expect(() => renderAt(0, <Video src="a.mp4" objectFit="cover" style={{ objectFit: 'fill' }} />)).toThrow(/disagree/);
  });
});

describe('Lottie props (Remotion parity)', () => {
  it('passes renderer, preserveAspectRatio and assetsPath to lottie-web and reports the animation', () => {
    const onAnimationLoaded = vi.fn();
    renderAt(
      0,
      <Lottie
        animationData={lottieData()}
        renderer="canvas"
        preserveAspectRatio="xMidYMid slice"
        assetsPath="/lottie/images/"
        onAnimationLoaded={onAnimationLoaded}
      />,
    );
    const { params } = animations[0];
    expect(params.renderer).toBe('canvas');
    expect(params.assetsPath).toBe('/lottie/images/');
    expect((params.rendererSettings as Record<string, unknown>).preserveAspectRatio).toBe('xMidYMid slice');
    expect(params.animationData).toEqual(lottieData());
    expect(onAnimationLoaded).toHaveBeenCalledWith(animations[0]);
  });

  it('plays backwards with direction="backward"', () => {
    renderAt(15, <Lottie animationData={lottieData()} direction="backward" />);
    act(() => animations[0].emit('DOMLoaded'));
    // 30 frames into a 120-frame animation, from its end.
    expect(animations[0].goToAndStop).toHaveBeenLastCalledWith(90, true);
  });

  it('getLottieMetadata reads fps, duration and size', () => {
    expect(getLottieMetadata(lottieData({ op: 90.5 }))).toEqual({
      fps: 60,
      durationInFrames: 90,
      durationInSeconds: 90.5 / 60,
      width: 100,
      height: 100,
    });
    expect(getLottieMetadata({ ...lottieData(), w: 0 })).toBeNull();
    // @ts-expect-error not animation data
    expect(() => getLottieMetadata('a.json')).toThrow(/animationData must be the animation JSON/);
  });
});
