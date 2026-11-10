// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GifWriter } from 'omggif';
import { FrameProvider } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { Gif, getGifDurationInSeconds } from '../src/gif';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A 2 x 2 GIF with three frames: all red (100 ms); green at (1,1) disposed to
// the background afterwards (delay 0, shown 100 ms); blue at (0,0) (200 ms).
const PALETTE = [0x000000, 0xff0000, 0x00ff00, 0x0000ff];
const makeGif = (): Uint8Array => {
  const buffer = new Uint8Array(1024);
  const writer = new GifWriter(buffer, 2, 2, { palette: PALETTE, loop: 0 });
  writer.addFrame(0, 0, 2, 2, [1, 1, 1, 1], { delay: 10 });
  writer.addFrame(1, 1, 1, 1, [2], { delay: 0, disposal: 2 });
  writer.addFrame(0, 0, 1, 1, [3], { delay: 20, disposal: 1 });
  return buffer.slice(0, writer.end());
};
const R = [255, 0, 0, 255];
const G = [0, 255, 0, 255];
const B = [0, 0, 255, 255];
const T = [0, 0, 0, 0];
const EXPECTED_FRAMES = [
  [...R, ...R, ...R, ...R],
  [...R, ...R, ...R, ...G],
  [...B, ...R, ...R, ...T],
];

if (typeof ImageData === 'undefined') {
  vi.stubGlobal(
    'ImageData',
    class {
      constructor(
        public data: Uint8ClampedArray,
        public width: number,
        public height: number,
      ) {}
    },
  );
}

const bytes = makeGif();
let context: { drawImage: ReturnType<typeof vi.fn>; clearRect: ReturnType<typeof vi.fn>; putImageData: ReturnType<typeof vi.fn> };
let container: HTMLDivElement;
let root: Root;

const respond = (body: Uint8Array, status = 200) => ({
  ok: status === 200,
  status,
  statusText: status === 200 ? 'OK' : 'Not Found',
  headers: { get: () => 'image/gif' },
  arrayBuffer: async () => body.slice().buffer,
});

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async () => respond(bytes)));
  context = { drawImage: vi.fn(), clearRect: vi.fn(), putImageData: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => context as never);
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', undefined);
});

const renderAt = (frame: number, node: React.ReactNode, gate?: RenderGate) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={10} durationInFrames={300} width={100} height={100} gate={gate}>
        {node}
      </FrameProvider>,
    ),
  );
const settle = () => act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
const lastPut = () => Array.from((context.putImageData.mock.lastCall![0] as ImageData).data);

describe('getGifDurationInSeconds', () => {
  it('sums the frame delays, a delay of 0 counting as 100 ms', async () => {
    expect(await getGifDurationInSeconds('https://cdn.test/duration.gif')).toBe(0.4);
  });

  it('rejects a file that is not a GIF', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respond(new TextEncoder().encode('<html>'))));
    await expect(getGifDurationInSeconds('https://cdn.test/page.gif')).rejects.toThrow(/is not a GIF/);
  });
});

describe('Gif', () => {
  it('composes the frames with their disposal and passes them to onLoad', async () => {
    const onLoad = vi.fn();
    renderAt(0, <Gif src="compose.gif" onLoad={onLoad} />);
    await settle();
    const info = onLoad.mock.calls[0][0];
    expect([info.width, info.height, info.delays]).toEqual([2, 2, [100, 100, 200]]);
    expect(info.frames.map((frame: ImageData) => Array.from(frame.data))).toEqual(EXPECTED_FRAMES);
  });

  it('holds the frame until the GIF is drawn and shows the frame of that time', async () => {
    const gate = createRenderGate();
    renderAt(1, <Gif src="timed.gif" />, gate);
    expect(gate.getPending().map((p) => p.label)).toEqual(['<Gif> loading timed.gif']);
    await settle();
    expect(lastPut()).toEqual(EXPECTED_FRAMES[1]); // 100 ms
    await expect(gate.waitUntilReady({ frame: 1, timeoutMs: 1000 })).resolves.toBeUndefined();
    renderAt(3, <Gif src="timed.gif" />, gate); // 300 ms
    expect(lastPut()).toEqual(EXPECTED_FRAMES[2]);
    renderAt(4, <Gif src="timed.gif" />, gate); // 400 ms: loops
    expect(lastPut()).toEqual(EXPECTED_FRAMES[0]);
    const canvas = container.querySelector('canvas')!;
    expect([canvas.width, canvas.height]).toEqual([2, 2]);
  });

  it('pauses or unmounts after the end', async () => {
    renderAt(9, <Gif src="end.gif" loopBehavior="pause-after-finish" />);
    await settle();
    expect(lastPut()).toEqual(EXPECTED_FRAMES[2]);
    renderAt(9, <Gif src="end.gif" loopBehavior="unmount-after-finish" />);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('draws with fit into the canvas size it is given', async () => {
    renderAt(0, <Gif src="fit.gif" width={8} height={4} fit="cover" />);
    await settle();
    // 2 x 2 covering 8 x 4: scaled 4x, centred vertically
    expect(context.drawImage.mock.lastCall!.slice(1)).toEqual([0, 0, 2, 2, 0, -2, 8, 8]);
  });

  it('cancels the render on a load error', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => respond(new Uint8Array(), 404)));
    const gate = createRenderGate();
    renderAt(0, <Gif src="missing.gif" />, gate);
    await settle();
    await expect(gate.waitUntilReady()).rejects.toThrow(/<Gif> could not load .*missing.gif: HTTP 404/);
  });

  it('checks its props', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    // @ts-expect-error Remotion's per-handle timeout
    expect(() => renderAt(0, <Gif src="a.gif" delayRenderTimeoutInMilliseconds={1000} />)).toThrow(
      /does not take "delayRenderTimeoutInMilliseconds": the host sets the timeout/,
    );
    // @ts-expect-error a Sequence prop
    expect(() => renderAt(0, <Gif src="a.gif" loop />)).toThrow(/does not take "loop"/);
    // @ts-expect-error AnimatedImage's behavior, not Gif's
    expect(() => renderAt(0, <Gif src="a.gif" loopBehavior="clear-after-finish" />)).toThrow(/loopBehavior must be/);
    expect(() => renderAt(0, <Gif src="" />)).toThrow(/src must be a non-empty string/);
  });
});
