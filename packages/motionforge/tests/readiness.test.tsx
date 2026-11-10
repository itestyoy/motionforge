// @vitest-environment happy-dom
import React, { act, useEffect, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { DelayRenderApi, useDelayRender } from '../src/core/delay-render';
import { usePreloadAssets } from '../src/core/preload';
import { prefetch } from '../src/core/prefetch';
import { Img } from '../src/components/Media';

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
  vi.unstubAllGlobals();
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

describe('delayRender()', () => {
  it("explains what to write instead of Remotion's useState(() => delayRender())", () => {
    const RemotionStyle = () => {
      const { delayRender } = useDelayRender();
      const [handle] = useState(() => delayRender('data'));
      return <i>{handle}</i>;
    };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <RemotionStyle />, createRenderGate())).toThrow(
      /called during render[\s\S]*useState\(\) initializer[\s\S]*handle\.current = delayRender\(label\)/,
    );
  });

  it('cancels the render when a handle outlives its timeoutInMilliseconds', async () => {
    const gate = createRenderGate();
    const api: { current: DelayRenderApi | null; fast?: number } = { current: null };
    const Holder = () => {
      const delay = useDelayRender();
      useEffect(() => {
        api.current = delay;
        delay.delayRender('slow', { timeoutInMilliseconds: 30 });
        api.fast = delay.delayRender('fast', { timeoutInMilliseconds: 30 });
      }, []);
      return null;
    };
    renderAt(0, <Holder />, gate);
    act(() => api.current!.continueRender(api.fast!));
    await expect(gate.waitUntilReady({ timeoutMs: 1000 })).rejects.toThrow(
      'A delayRender() "slow" was called but not continued after 30 ms',
    );
  });

  it('does not cancel a handle continued in time', async () => {
    const gate = createRenderGate();
    const Holder = () => {
      const { delayRender, continueRender } = useDelayRender();
      useEffect(() => {
        const handle = delayRender('quick', { timeoutInMilliseconds: 20 });
        continueRender(handle);
      }, []);
      return null;
    };
    renderAt(0, <Holder />, gate);
    await new Promise((resolve) => setTimeout(resolve, 40));
    expect(gate.error).toBeNull();
    await expect(gate.waitUntilReady()).resolves.toBeUndefined();
  });

  it('checks its options', () => {
    const api: { current: DelayRenderApi | null } = { current: null };
    const Holder = () => {
      api.current = useDelayRender();
      return null;
    };
    renderAt(0, <Holder />, createRenderGate());
    act(() => {
      // @ts-expect-error not supported
      expect(() => api.current!.delayRender('x', { retries: 1 })).toThrow(/retries are not supported/);
      expect(() => api.current!.delayRender('x', { timeoutInMilliseconds: 0 })).toThrow(
        /timeoutInMilliseconds must be a positive number/,
      );
    });
  });
});

describe('usePreloadAssets fonts', () => {
  // A FontFaceSet with faces split by unicode-range, as Google Fonts and @fontsource declare them.
  const fakeFace = (family: string, weight: string, unicodeRange: string) => {
    let resolve: () => void = () => {};
    const face = {
      family,
      weight,
      style: 'normal',
      unicodeRange,
      load: vi.fn(() => new Promise<unknown>((r) => (resolve = () => r(face)))),
      finish: () => resolve(),
    };
    return face;
  };

  it('loads every unicode-range subset of the family, so Cyrillic is ready too', async () => {
    const latin = fakeFace('"Inter"', '900', 'U+0000-00FF');
    const cyrillic = fakeFace('Inter', '900', 'U+0400-045F');
    const regular = fakeFace('Inter', '400', 'U+0000-00FF');
    const variable = fakeFace('Other', '100 900', 'U+0000-00FF');
    const faces = [latin, cyrillic, regular, variable];
    Object.defineProperty(document, 'fonts', {
      value: { forEach: (fn: (face: unknown) => void) => faces.forEach(fn) },
      configurable: true,
    });
    const Scene = () => <i data-ready="">{String(usePreloadAssets([{ type: 'font', family: 'Inter', weight: 900 }]))}</i>;
    const gate = createRenderGate();
    renderAt(0, <Scene />, gate);
    await act(async () => {});
    expect(latin.load).toHaveBeenCalled();
    expect(cyrillic.load).toHaveBeenCalled();
    expect(regular.load).not.toHaveBeenCalled();
    expect(variable.load).not.toHaveBeenCalled();

    await act(async () => latin.finish());
    expect(container.querySelector('[data-ready]')!.textContent).toBe('false');
    expect(await stateOf(gate.waitUntilReady())).toBe('pending');
    await act(async () => cyrillic.finish());
    expect(container.querySelector('[data-ready]')!.textContent).toBe('true');
    await expect(gate.waitUntilReady()).resolves.toBeUndefined();
  });

  it('matches variable weight ranges and fails when no face matches', async () => {
    const variable = fakeFace('Roboto Flex', '100 1000', 'U+0000-00FF');
    Object.defineProperty(document, 'fonts', {
      value: { forEach: (fn: (face: unknown) => void) => [variable].forEach(fn) },
      configurable: true,
    });
    const Scene = ({ family }: { family: string }) => {
      usePreloadAssets([{ type: 'font', family, weight: 'bold' }]);
      return null;
    };
    renderAt(0, <Scene family="Roboto Flex" />, createRenderGate());
    await act(async () => {});
    expect(variable.load).toHaveBeenCalled();

    const gate = createRenderGate();
    act(() => root.unmount());
    root = createRoot(container);
    renderAt(0, <Scene family="Missing" />, gate);
    await act(async () => {});
    await expect(gate.waitUntilReady()).rejects.toThrow(/no font face matches Missing bold; declare it with @font-face or load it with loadFont\(\)/);
  });
});

describe('prefetch()', () => {
  const fakeFetch = (bytes: number[], init: { status?: number } = {}) => {
    const chunks = [new Uint8Array(bytes.slice(0, 2)), new Uint8Array(bytes.slice(2))];
    return vi.fn(async () => ({
      ok: (init.status ?? 200) < 300,
      status: init.status ?? 200,
      headers: { get: (name: string) => ({ 'content-type': 'image/png', 'content-length': String(bytes.length) })[name.toLowerCase()] ?? null },
      body: {
        getReader: () => ({
          read: async () => (chunks.length ? { done: false, value: chunks.shift()! } : { done: true, value: undefined }),
        }),
      },
    }));
  };

  beforeEach(() => {
    Object.defineProperty(URL, 'createObjectURL', { value: vi.fn(() => 'blob:mf/1'), configurable: true, writable: true });
    Object.defineProperty(URL, 'revokeObjectURL', { value: vi.fn(), configurable: true, writable: true });
  });

  it('downloads the asset, reports progress, and Img shows it from memory until free()', async () => {
    vi.stubGlobal('fetch', fakeFetch([1, 2, 3, 4, 5]));
    vi.spyOn(HTMLImageElement.prototype, 'decode').mockImplementation(() => Promise.resolve());
    const onProgress = vi.fn();
    renderAt(0, <Img src="/hero.png#crop" />);
    expect(container.querySelector('img')!.getAttribute('src')).toBe('/hero.png#crop');

    const { free, waitUntilDone } = prefetch('/hero.png', { onProgress });
    await act(async () => {
      await expect(waitUntilDone()).resolves.toBe('blob:mf/1');
    });
    expect(onProgress).toHaveBeenLastCalledWith({ loadedBytes: 5, totalBytes: 5 });
    expect(container.querySelector('img')!.getAttribute('src')).toBe('blob:mf/1#crop');

    act(() => free());
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mf/1');
    expect(container.querySelector('img')!.getAttribute('src')).toBe('/hero.png#crop');
  });

  it('rejects waitUntilDone() on an HTTP error or when freed before it is done', async () => {
    vi.stubGlobal('fetch', fakeFetch([1], { status: 404 }));
    await expect(prefetch('/missing.png').waitUntilDone()).rejects.toThrow('prefetch: /missing.png returned HTTP 404');

    vi.stubGlobal('fetch', fakeFetch([1, 2, 3]));
    const early = prefetch('/a.png');
    early.free();
    await expect(early.waitUntilDone()).rejects.toThrow(/free\(\) was called before \/a.png was downloaded/);
    expect(() => prefetch('')).toThrow(/src must be a non-empty string/);
  });
});
