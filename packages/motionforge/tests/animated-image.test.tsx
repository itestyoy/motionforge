// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { AnimatedImage } from '../src/index';
import { getAnimatedImageFrameIndex } from '../src/components/animated-image/decoder';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Three frames of 100 ms, 20 x 10 px.
const FRAME_US = 100_000;
const decoders: FakeImageDecoder[] = [];
class FakeImageDecoder {
  static isTypeSupported = vi.fn(async (type: string) => type !== 'image/unknown');
  completed = Promise.resolve();
  tracks = { ready: Promise.resolve(), selectedTrack: { frameCount: 3 } };
  init: { type: string };
  decode = vi.fn(async ({ frameIndex }: { frameIndex: number }) => ({
    image: {
      index: frameIndex,
      timestamp: frameIndex * FRAME_US,
      duration: FRAME_US,
      displayWidth: 20,
      displayHeight: 10,
      close: vi.fn(),
    },
  }));
  close = vi.fn();
  constructor(init: { type: string }) {
    this.init = init;
    decoders.push(this);
  }
}

let context: { drawImage: ReturnType<typeof vi.fn>; clearRect: ReturnType<typeof vi.fn> };
let container: HTMLDivElement;
let root: Root;

const response = (status = 200, type = 'image/webp') => ({
  ok: status >= 200 && status < 300,
  status,
  statusText: status === 404 ? 'Not Found' : 'OK',
  headers: { get: () => type },
  body: 'stream',
  arrayBuffer: async () => new ArrayBuffer(0),
});

beforeEach(() => {
  decoders.length = 0;
  vi.stubGlobal('ImageDecoder', FakeImageDecoder);
  vi.stubGlobal('fetch', vi.fn(async () => response()));
  context = { drawImage: vi.fn(), clearRect: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as never);
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
      <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100} gate={gate}>
        {node}
      </FrameProvider>,
    ),
  );
// Lets the fetch, the decoder and the effects run.
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
const drawnFrame = () => (context.drawImage.mock.lastCall?.[0] as { index: number } | undefined)?.index;

describe('AnimatedImage', () => {
  it('holds the frame while loading, then draws the frame of that time', async () => {
    const gate = createRenderGate();
    renderAt(4, <AnimatedImage src="a.webp" />, gate);
    expect(gate.getPending().map((p) => p.label)).toEqual(['<AnimatedImage> loading a.webp']);
    await settle();
    // 4 / 30 s = 133 ms: the second frame
    expect(drawnFrame()).toBe(1);
    const canvas = container.querySelector('canvas')!;
    expect([canvas.width, canvas.height]).toEqual([20, 10]);
    expect(decoders[0].init.type).toBe('image/webp');
    await expect(gate.waitUntilReady({ frame: 4, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('is frame-exact: a frame is shown for its whole interval', async () => {
    const gate = createRenderGate();
    // 2 / 30 s = 67 ms is still in the first frame (0-100 ms)
    renderAt(2, <AnimatedImage src="b.webp" />, gate);
    await settle();
    expect(drawnFrame()).toBe(0);
    // exactly 100 ms starts the second frame
    renderAt(3, <AnimatedImage src="b.webp" />, gate);
    await settle();
    expect(drawnFrame()).toBe(1);
    await expect(gate.waitUntilReady({ frame: 3, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('draws with fit into the canvas size it is given', async () => {
    renderAt(0, <AnimatedImage src="c.webp" width={40} height={40} fit="contain" />);
    await settle();
    // 20 x 10 contained in 40 x 40: scaled 2x, centred vertically
    expect(context.drawImage.mock.lastCall!.slice(1)).toEqual([0, 0, 20, 10, 0, 10, 40, 20]);
  });

  it('fails with a clear error where ImageDecoder is missing, or calls onError', async () => {
    vi.stubGlobal('ImageDecoder', undefined);
    const gate = createRenderGate();
    renderAt(0, <AnimatedImage src="d.webp" />, gate);
    await settle();
    await expect(gate.waitUntilReady()).rejects.toThrow(/needs the WebCodecs ImageDecoder API/);

    act(() => root.unmount());
    root = createRoot(container);
    const onError = vi.fn();
    const other = createRenderGate();
    renderAt(0, <AnimatedImage src="d.webp" onError={onError} />, other);
    await settle();
    expect(onError.mock.calls[0][0].message).toMatch(/needs the WebCodecs ImageDecoder API/);
    await expect(other.waitUntilReady({ timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('reports an HTTP error and an unsupported type', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => response(404)));
    const gate = createRenderGate();
    renderAt(0, <AnimatedImage src="missing.webp" />, gate);
    await settle();
    await expect(gate.waitUntilReady()).rejects.toThrow(/could not load .*missing.webp: HTTP 404 Not Found/);
  });

  it('checks its props', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error a Sequence prop
    expect(() => renderAt(0, <AnimatedImage src="a.webp" durationInFrames={30} />)).toThrow(
      /does not take "durationInFrames": put it inside <Sequence durationInFrames=/,
    );
    // @ts-expect-error unknown fit
    expect(() => renderAt(0, <AnimatedImage src="a.webp" fit="stretch" />)).toThrow(/fit must be 'fill', 'contain' or 'cover'/);
    expect(() => renderAt(0, <AnimatedImage src="a.webp" playbackRate={0} />)).toThrow(/playbackRate must be a positive number/);
    // @ts-expect-error unknown loop behavior
    expect(() => renderAt(0, <AnimatedImage src="a.webp" loopBehavior="once" />)).toThrow(/loopBehavior must be/);
  });
});

describe('getAnimatedImageFrameIndex', () => {
  const track = { starts: [0, 100_000, 250_000], durationUs: 300_000 };
  it('picks the frame whose interval contains the time', () => {
    expect([0, 0.099, 0.1, 0.2499, 0.25, 0.2999].map((t) => getAnimatedImageFrameIndex(track, t, 'loop'))).toEqual([
      0, 0, 1, 1, 2, 2,
    ]);
  });

  it('applies the loop behavior after the end', () => {
    expect(getAnimatedImageFrameIndex(track, 0.35, 'loop')).toBe(0);
    expect(getAnimatedImageFrameIndex(track, 0.45, 'loop')).toBe(1);
    expect(getAnimatedImageFrameIndex(track, 0.35, 'pause-after-finish')).toBe(2);
    expect(getAnimatedImageFrameIndex(track, 0.3, 'clear-after-finish')).toBeNull();
    expect(getAnimatedImageFrameIndex({ starts: [0], durationUs: null }, 5, 'clear-after-finish')).toBe(0);
  });
});
