// @vitest-environment happy-dom
// loadFont() is page-wide: a failed font fails every gate for the rest of
// the page, so the failure is the last test of this file.
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate } from '../src/core/render-gate';
import { loadFont } from '../src/core/fonts';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// A FontFace whose load() the test settles.
const created: Array<{ family: string; source: string; descriptors: Record<string, string>; settle: (ok: boolean) => void }> = [];
class FakeFontFace {
  constructor(
    public family: string,
    public source: string,
    public descriptors: Record<string, string>,
  ) {}
  load() {
    return new Promise<FakeFontFace>((resolve, reject) => {
      created.push({
        family: this.family,
        source: this.source,
        descriptors: this.descriptors,
        settle: (ok) => (ok ? resolve(this) : reject(new Error('network error'))),
      });
    });
  }
}

const added: unknown[] = [];
let root: Root;
let container: HTMLDivElement;

beforeEach(() => {
  vi.stubGlobal('FontFace', FakeFontFace);
  Object.defineProperty(document, 'fonts', { value: { add: (face: unknown) => added.push(face) }, configurable: true });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

const flush = () => act(async () => {});

describe('loadFont()', () => {
  it('holds every gate until the font is loaded, then adds it to document.fonts', async () => {
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
    // A gate created later waits for it too: fonts belong to the page.
    expect(createRenderGate().getPending()).toHaveLength(1);
    // The same options load once.
    expect(loadFont({ family: 'Bangers', url: '/fonts/bangers.woff2', format: 'woff2', weight: '400', display: 'block' })).toBe(loading);

    await act(async () => created[0].settle(true));
    await expect(loading).resolves.toBeUndefined();
    expect(added).toHaveLength(1);
    await expect(gate.waitUntilReady()).resolves.toBeUndefined();
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
    await ready;
    expect(createRenderGate().error?.message).toMatch(/could not load Broken/);
  });
});
