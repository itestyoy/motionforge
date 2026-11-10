// @vitest-environment happy-dom
import React, { act, StrictMode, useEffect, useRef } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider, useCurrentFrame } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { useDelayRender, DelayRenderApi } from '../src/core/delay-render';
import { usePreloadAssets, preloadFont } from '../src/core/preload';
import { Sequence } from '../src/components/Sequence';
import { Img, Video } from '../src/components/Media';
import { Composition } from '../src/components/Composition';

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

const renderAt = (frame: number, node: React.ReactNode, gate?: RenderGate) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100} gate={gate}>
        {node}
      </FrameProvider>,
    ),
  );

// Where a promise stands after pending microtasks and timers of 0 ms have run.
const stateOf = async (promise: Promise<unknown>): Promise<'pending' | 'resolved' | 'rejected'> => {
  let state: 'pending' | 'resolved' | 'rejected' = 'pending';
  promise.then(
    () => (state = 'resolved'),
    () => (state = 'rejected'),
  );
  await new Promise((resolve) => setTimeout(resolve, 0));
  return state;
};

// Holds the frame from its effect and hands the API out.
const Holder = ({ label, api }: { label?: string; api: { current: DelayRenderApi | null; handle?: number } }) => {
  const delay = useDelayRender();
  useEffect(() => {
    api.current = delay;
    api.handle = delay.delayRender(label);
  }, []);
  return null;
};

describe('render gate', () => {
  it('resolves once nothing is pending', async () => {
    const gate = createRenderGate();
    const api: { current: DelayRenderApi | null; handle?: number } = { current: null };
    renderAt(0, <Holder label="data" api={api} />, gate);
    const ready = gate.waitUntilReady({ timeoutMs: 1000 });
    expect(await stateOf(ready)).toBe('pending');
    expect(gate.getPending()).toEqual([{ handle: api.handle, label: 'data' }]);
    act(() => api.current!.continueRender(api.handle!));
    expect(await stateOf(ready)).toBe('resolved');
    expect(gate.getPending()).toEqual([]);
  });

  it('waits until the frame it is asked for is committed', async () => {
    const gate = createRenderGate();
    const ready = gate.waitUntilReady({ frame: 5, timeoutMs: 1000 });
    renderAt(4, null, gate);
    expect(await stateOf(ready)).toBe('pending');
    renderAt(5, null, gate);
    expect(await stateOf(ready)).toBe('resolved');
  });

  it('rejects on timeout with the pending labels', async () => {
    const gate = createRenderGate();
    renderAt(0, <><Holder label="hero image" api={{ current: null }} /><Holder api={{ current: null }} /></>, gate);
    await expect(gate.waitUntilReady({ timeoutMs: 20 })).rejects.toThrow(
      /not ready after 20 ms: pending: "hero image", delayRender\(\) #2 \(no label\)/,
    );
  });

  it('names a frame that was never committed in the timeout error', async () => {
    const gate = createRenderGate();
    renderAt(3, null, gate);
    await expect(gate.waitUntilReady({ frame: 9, timeoutMs: 20 })).rejects.toThrow(
      /frame 9 was not committed \(FrameProvider is at 3\)/,
    );
  });

  it('rejects with the cancelRender() error, now and later', async () => {
    const gate = createRenderGate();
    const Failing = () => {
      const { cancelRender } = useDelayRender();
      useEffect(() => cancelRender(new Error('font missing')), []);
      return null;
    };
    const ready = gate.waitUntilReady();
    renderAt(0, <Failing />, gate);
    await expect(ready).rejects.toThrow('font missing');
    await expect(gate.waitUntilReady()).rejects.toThrow('font missing');
    expect(gate.error?.message).toBe('font missing');
  });

  it('releases the handles of a component that unmounts', async () => {
    const gate = createRenderGate();
    renderAt(0, <Holder label="x" api={{ current: null }} />, gate);
    expect(gate.getPending()).toHaveLength(1);
    renderAt(1, null, gate);
    expect(gate.getPending()).toEqual([]);
    await expect(gate.waitUntilReady({ frame: 1 })).resolves.toBeUndefined();
  });

  it('does not leak handles under StrictMode double effects', () => {
    const gate = createRenderGate();
    // Cleans up after itself...
    const Tidy = () => {
      const { delayRender, continueRender } = useDelayRender();
      useEffect(() => {
        const handle = delayRender('tidy');
        return () => continueRender(handle);
      }, []);
      return null;
    };
    // ...and forgets to: the hook releases the first handle on the simulated unmount.
    const Forgetful = () => {
      const { delayRender } = useDelayRender();
      useEffect(() => {
        delayRender('forgetful');
      }, []);
      return null;
    };
    act(() =>
      root.render(
        <StrictMode>
          <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={gate}>
            <Tidy />
            <Forgetful />
          </FrameProvider>
        </StrictMode>,
      ),
    );
    // Handles 1 and 2 came from the first effect run and were released.
    expect(gate.getPending()).toEqual([
      { handle: 3, label: 'tidy' },
      { handle: 4, label: 'forgetful' },
    ]);
  });

  it('throws when delayRender() is called during render', () => {
    const DuringRender = () => {
      const { delayRender } = useDelayRender();
      delayRender('too early');
      return null;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <DuringRender />, createRenderGate())).toThrow(/not during render/);
  });

  it('rejects a handle it did not issue', () => {
    const api: { current: DelayRenderApi | null } = { current: null };
    renderAt(0, <Holder api={api} />, createRenderGate());
    expect(() => api.current!.continueRender(42)).toThrow(/not a handle returned by delayRender/);
    // Continuing twice is fine.
    act(() => {
      api.current!.continueRender(1);
      api.current!.continueRender(1);
    });
  });

  it('lets nested FrameProviders without a gate use the outer gate', async () => {
    const gate = createRenderGate();
    const api: { current: DelayRenderApi | null; handle?: number } = { current: null };
    renderAt(
      0,
      <FrameProvider frame={2} durationInFrames={10} width={10} height={10}>
        <Holder label="inner" api={api} />
      </FrameProvider>,
      gate,
    );
    expect(gate.getPending().map((p) => p.label)).toEqual(['inner']);
  });

  it('is passed through by Composition', async () => {
    const gate = createRenderGate();
    const Scene = () => <Holder label="scene" api={{ current: null }} />;
    act(() => root.render(<Composition id="c" component={Scene} frame={3} durationInFrames={10} gate={gate} />));
    expect(gate.getPending().map((p) => p.label)).toEqual(['scene']);
    await expect(gate.waitUntilReady({ frame: 3, timeoutMs: 20 })).rejects.toThrow(/pending: "scene"/);
  });

  it('serves one FrameProvider at a time', () => {
    const gate = createRenderGate();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() =>
      renderAt(
        0,
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={gate}>
          {null}
        </FrameProvider>,
        gate,
      ),
    ).toThrow(/only one FrameProvider at a time/);
  });

  it('checks its arguments', () => {
    const gate = createRenderGate();
    expect(() => gate.waitUntilReady({ timeoutMs: 0 })).toThrow(/timeoutMs must be a positive number/);
    expect(() => gate.waitUntilReady({ frame: -1 })).toThrow(/frame must be a non-negative integer/);
    expect(() =>
      renderToStaticMarkup(
        // @ts-expect-error not a gate
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={{}}>
          {null}
        </FrameProvider>,
      ),
    ).toThrow(/gate must be created with createRenderGate/);
  });
});

describe('without a host gate', () => {
  it('delayRender works and cancelRender throws to the error boundary', () => {
    class Boundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
      state = { error: null as Error | null };
      static getDerivedStateFromError(error: Error) {
        return { error };
      }
      render() {
        return this.state.error ? <p data-error="">{this.state.error.message}</p> : this.props.children;
      }
    }
    const api: { current: DelayRenderApi | null; handle?: number } = { current: null };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    act(() =>
      root.render(
        <Boundary>
          <FrameProvider frame={0} durationInFrames={10} width={10} height={10}>
            <Holder api={api} />
          </FrameProvider>
        </Boundary>,
      ),
    );
    act(() => api.current!.continueRender(api.handle!));
    expect(container.querySelector('[data-error]')).toBeNull();
    act(() => api.current!.cancelRender('the data is gone'));
    expect(container.querySelector('[data-error]')?.textContent).toBe('the data is gone');
  });
});

describe('built-in components', () => {
  // happy-dom does not load images: decode() is driven by the test.
  const decodes: Array<{ src: string | null; resolve: () => void; reject: (error: Error) => void }> = [];
  beforeEach(() => {
    decodes.length = 0;
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(function (this: HTMLImageElement) {
      return new Promise<void>((resolve, reject) => decodes.push({ src: this.getAttribute('src'), resolve, reject }));
    });
  });

  it('Img holds the frame until the image is decoded', async () => {
    const gate = createRenderGate();
    renderAt(0, <Img src="hero.png" />, gate);
    expect(gate.getPending().map((p) => p.label)).toEqual(['<Img> hero.png']);
    await act(async () => decodes[0].resolve());
    await expect(gate.waitUntilReady()).resolves.toBeUndefined();
  });

  it('Img reports a broken image through cancelRender', async () => {
    const gate = createRenderGate();
    renderAt(0, <Img src="missing.png" />, gate);
    await act(async () => decodes[0].reject(new Error('EncodingError')));
    await expect(gate.waitUntilReady()).rejects.toThrow('<Img> could not load or decode missing.png');
  });

  it('Video holds the frame until it has seeked to the frame', async () => {
    const gate = createRenderGate();
    renderAt(45, <Video src="clip.mp4" />, gate);
    const video = container.querySelector('video')!;
    expect(gate.getPending().map((p) => p.label)).toEqual(['<Video> clip.mp4 at frame 45']);
    act(() => {
      video.dispatchEvent(new Event('loadeddata'));
    });
    expect(video.currentTime).toBeCloseTo(1.5, 6);
    expect(gate.getPending()).toHaveLength(1);
    act(() => {
      video.dispatchEvent(new Event('seeked'));
    });
    await expect(gate.waitUntilReady({ frame: 45 })).resolves.toBeUndefined();
  });

  it('Img and Video still hand the element to a caller ref (a prop in React 19)', () => {
    const imageRef = React.createRef<HTMLImageElement>();
    const videoRef = React.createRef<HTMLVideoElement>();
    renderAt(
      0,
      <>
        {React.createElement(Img, { src: 'a.png', ref: imageRef } as React.ComponentProps<typeof Img>)}
        {React.createElement(Video, { src: 'a.mp4', ref: videoRef } as React.ComponentProps<typeof Video>)}
      </>,
    );
    expect(imageRef.current).toBe(container.querySelector('img'));
    expect(videoRef.current).toBe(container.querySelector('video'));
  });

  it('Video reports a load error through cancelRender', async () => {
    const gate = createRenderGate();
    renderAt(0, <Video src="broken.mp4" />, gate);
    act(() => {
      container.querySelector('video')!.dispatchEvent(new Event('error'));
    });
    await expect(gate.waitUntilReady()).rejects.toThrow('<Video> could not load broken.mp4');
  });
});

describe('Sequence premountFor', () => {
  const mounts: number[] = [];
  const Probe = ({ api }: { api: { current: DelayRenderApi | null; handle?: number } }) => {
    const frame = useCurrentFrame();
    const id = useRef(Math.random());
    const delay = useDelayRender();
    useEffect(() => {
      mounts.push(id.current);
      api.current = delay;
      api.handle = delay.delayRender('asset');
    }, []);
    return <i data-frame="">{frame}</i>;
  };

  it('mounts the children invisibly at frame 0 before the start, without holding the frame', async () => {
    mounts.length = 0;
    const gate = createRenderGate();
    const api: { current: DelayRenderApi | null; handle?: number } = { current: null };
    const scene = <Sequence from={10} premountFor={5}><Probe api={api} /></Sequence>;

    renderAt(4, scene, gate);
    expect(container.querySelector('[data-frame]')).toBeNull();

    renderAt(6, scene, gate);
    const wrapper = container.querySelector('[data-sequence-from]') as HTMLElement;
    expect(wrapper.style.opacity).toBe('0');
    expect(wrapper.style.pointerEvents).toBe('none');
    expect(container.querySelector('[data-frame]')!.textContent).toBe('0');
    expect(gate.getPending()).toEqual([]);
    await expect(gate.waitUntilReady({ frame: 6 })).resolves.toBeUndefined();

    // At the start the same instance is shown and its pending handle counts.
    renderAt(10, scene, gate);
    expect(mounts).toHaveLength(1);
    expect(wrapper.style.opacity).toBe('');
    const ready = gate.waitUntilReady({ frame: 10, timeoutMs: 1000 });
    expect(await stateOf(ready)).toBe('pending');
    act(() => api.current!.continueRender(api.handle!));
    expect(await stateOf(ready)).toBe('resolved');
  });

  it('checks premountFor', () => {
    expect(() => renderAt(0, <Sequence from={10} premountFor={-1}>{null}</Sequence>)).toThrow(
      /premountFor must be a non-negative integer/,
    );
    const noLayout = { from: 10, premountFor: 5, layout: 'none' } as unknown as React.ComponentProps<typeof Sequence>;
    expect(() => renderAt(0, <Sequence {...noLayout}>{null}</Sequence>)).toThrow(
      /layout="none" renders no element, so it takes no premountFor/,
    );
  });
});

describe('usePreloadAssets', () => {
  const Scene = ({ src }: { src: string }) => {
    const ready = usePreloadAssets([{ type: 'image', src }]);
    return <i data-ready="">{String(ready)}</i>;
  };

  it('holds the frame until the assets are loaded, then renders with them', async () => {
    let finish: () => void = () => {};
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(
      () => new Promise<void>((resolve) => (finish = resolve)),
    );
    const gate = createRenderGate();
    renderAt(0, <Scene src="bg.png" />, gate);
    await act(async () => {});
    expect(container.querySelector('[data-ready]')!.textContent).toBe('false');
    expect(gate.getPending().map((p) => p.label)).toEqual(['usePreloadAssets bg.png']);
    await act(async () => finish());
    expect(container.querySelector('[data-ready]')!.textContent).toBe('true');
    await expect(gate.waitUntilReady()).resolves.toBeUndefined();
  });

  it('reports a failed asset through cancelRender', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(() => Promise.reject(new Error('404')));
    const gate = createRenderGate();
    renderAt(0, <Scene src="gone.png" />, gate);
    await act(async () => {});
    await expect(gate.waitUntilReady()).rejects.toThrow('preloadImage: could not load or decode gone.png');
  });

  it('rejects asset lists it does not understand', () => {
    const Bad = () => {
      // @ts-expect-error unknown type
      usePreloadAssets([{ type: 'gif', src: 'a.gif' }]);
      return null;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <Bad />)).toThrow(/assets\[0\] must be/);
  });

  it('preloadFont rejects when no declared face matches', async () => {
    const load = vi.fn(() => Promise.resolve([] as FontFace[]));
    Object.defineProperty(document, 'fonts', { value: { load }, configurable: true });
    await expect(preloadFont('Nope', { weight: 700 })).rejects.toThrow(/no font face matches Nope 700 normal/);
    expect(load).toHaveBeenCalledWith('normal 700 16px "Nope"');
  });
});
