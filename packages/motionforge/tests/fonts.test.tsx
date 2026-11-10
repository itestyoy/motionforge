// @vitest-environment happy-dom
// loadFont() is page-wide: a failed font fails every gate for the rest of
// the page, so the failure is the last test of this file.
import React, { act, useEffect } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate } from '../src/core/render-gate';
import { loadFont } from '../src/core/fonts';
import { usePreloadAssets } from '../src/core/preload';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A FontFace whose load() the test settles; like the real one, load() starts
// the load once and returns the same promise on every call.
const created: Array<{ family: string; source: string; descriptors: Record<string, string>; settle: (ok: boolean) => void }> = [];
class FakeFontFace {
  weight: string;
  style: string;
  private loading: Promise<FakeFontFace> | null = null;
  constructor(
    public family: string,
    public source: string,
    public descriptors: Record<string, string>,
  ) {
    this.weight = descriptors.weight ?? 'normal';
    this.style = descriptors.style ?? 'normal';
  }
  load() {
    this.loading ??= new Promise<FakeFontFace>((resolve, reject) => {
      created.push({
        family: this.family,
        source: this.source,
        descriptors: this.descriptors,
        settle: (ok) => (ok ? resolve(this) : reject(new Error('network error'))),
      });
    });
    return this.loading;
  }
}

// document.fonts: the faces of the page.
const faces = new Set<FakeFontFace>();
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('FontFace', FakeFontFace);
  Object.defineProperty(document, 'fonts', {
    value: {
      add: (face: FakeFontFace) => faces.add(face),
      delete: (face: FakeFontFace) => faces.delete(face),
      forEach: (fn: (face: FakeFontFace) => void) => faces.forEach(fn),
    },
    configurable: true,
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const familiesInDocument = () => [...faces].map((face) => face.family);

const flush = () => act(async () => {});

describe('loadFont()', () => {
  it('adds the face to document.fonts at once and holds every gate until it is loaded', async () => {
    const gate = createRenderGate();
    act(() =>
      root.render(
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={gate}>
          {null}
        </FrameProvider>,
      ),
    );
    const loading = loadFont({ family: 'Bangers', url: '/fonts/bangers.woff2', format: 'woff2', weight: '400', display: 'block' });
    await flush();
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({
      family: 'Bangers',
      source: 'url("/fonts/bangers.woff2") format("woff2")',
      descriptors: { weight: '400', display: 'block' },
    });
    expect(gate.getPending()).toEqual([{ handle: -1, label: 'loadFont() Bangers from /fonts/bangers.woff2' }]);
    // In document.fonts while it loads, so usePreloadAssets() finds it.
    expect(familiesInDocument()).toEqual(['Bangers']);
    // A gate created later waits for it too: fonts belong to the page.
    expect(createRenderGate().getPending()).toHaveLength(1);
    // The same options load once.
    expect(loadFont({ family: 'Bangers', url: '/fonts/bangers.woff2', format: 'woff2', weight: '400', display: 'block' })).toBe(loading);

    await act(async () => created[0].settle(true));
    await expect(loading).resolves.toBeUndefined();
    expect(familiesInDocument()).toEqual(['Bangers']);
    await expect(gate.waitUntilReady()).resolves.toBeUndefined();
  });

  // The README's pattern: loadFont() and usePreloadAssets() for the same
  // family, before the font has loaded.
  const Ready = ({ family }: { family: string }) => (
    <i data-ready="">{String(usePreloadAssets([{ type: 'font', family, weight: 900 }]))}</i>
  );

  it('lets usePreloadAssets() in the same commit wait for a loadFont() that is still loading', async () => {
    const gate = createRenderGate();
    // At the top of a module: called before the scene renders.
    const loading = loadFont({ family: 'Black Ops', url: '/fonts/black-ops.woff2', weight: '900' });
    act(() =>
      root.render(
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={gate}>
          <Ready family="Black Ops" />
        </FrameProvider>,
      ),
    );
    await flush();
    // One load: usePreloadAssets() waits for loadFont()'s own (no "no font face matches").
    expect(created.filter((c) => c.family === 'Black Ops')).toHaveLength(1);
    expect(gate.error).toBeNull();
    expect(container.querySelector('[data-ready]')!.textContent).toBe('false');
    expect(gate.getPending().map((p) => p.label)).toEqual([
      'usePreloadAssets Black Ops',
      'loadFont() Black Ops from /fonts/black-ops.woff2',
    ]);
    await act(async () => created.find((c) => c.family === 'Black Ops')!.settle(true));
    await loading;
    expect(container.querySelector('[data-ready]')!.textContent).toBe('true');
    await expect(gate.waitUntilReady({ frame: 0, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('lets usePreloadAssets() wait for a loadFont() called from an effect after mount', async () => {
    const gate = createRenderGate();
    // The parent's effect runs after the child's, so usePreloadAssets() starts first.
    const Scene = () => {
      useEffect(() => {
        loadFont({ family: 'Late Face', url: '/fonts/late.woff2', weight: '900' });
      }, []);
      return <Ready family="Late Face" />;
    };
    act(() =>
      root.render(
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={gate}>
          <Scene />
        </FrameProvider>,
      ),
    );
    await flush();
    expect(gate.error).toBeNull();
    expect(familiesInDocument()).toContain('Late Face');
    expect(container.querySelector('[data-ready]')!.textContent).toBe('false');
    await act(async () => created.find((c) => c.family === 'Late Face')!.settle(true));
    expect(container.querySelector('[data-ready]')!.textContent).toBe('true');
    await expect(gate.waitUntilReady({ frame: 0, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('checks its options and rejects without a DOM', async () => {
    // @ts-expect-error not options
    expect(() => loadFont('Bangers')).toThrow(/loadFont: expects an options object/);
    // @ts-expect-error url missing
    expect(() => loadFont({ family: 'Bangers' })).toThrow(/url must be a non-empty string/);
    // @ts-expect-error a number weight
    expect(() => loadFont({ family: 'B', url: '/b.ttf', weight: 700 })).toThrow(/weight must be a string/);
    vi.stubGlobal('FontFace', undefined);
    await expect(loadFont({ family: 'B', url: '/b.ttf' })).rejects.toThrow(/loadFont needs a browser DOM/);
  });

  it('fails every gate when the font cannot be loaded', async () => {
    const gate = createRenderGate();
    act(() =>
      root.render(
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10} gate={gate}>
          {null}
        </FrameProvider>,
      ),
    );
    const ready = expect(gate.waitUntilReady({ timeoutMs: 1000 })).rejects.toThrow(
      'loadFont: could not load Broken from /broken.woff2',
    );
    const loading = loadFont({ family: 'Broken', url: '/broken.woff2' });
    await flush();
    await act(async () => created[created.length - 1].settle(false));
    await expect(loading).rejects.toThrow('loadFont: could not load Broken from /broken.woff2: network error');
    // A face that failed is not left in document.fonts.
    expect(familiesInDocument()).not.toContain('Broken');
    await ready;
    expect(createRenderGate().error?.message).toMatch(/could not load Broken/);
  });
});
