// @vitest-environment happy-dom
import React, { act, Component, use } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider, useCurrentFrame, useVideoConfig } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { useSequence } from '../src/components/Sequence';
import { ThreeCanvas } from '../src/three';
import { Audio } from '../src/components/Media';
import { collectAudioTracks } from '../src/core/collect-audio-tracks';

// A stand-in for React Three Fiber: like the real one it renders the scene in
// a separate React root (here without any context bridge), after the outer
// tree has committed, and calls onCreated once.
const { fiber } = vi.hoisted(() => ({
  fiber: {
    advance: null as unknown as ReturnType<typeof vi.fn>,
    setSize: null as unknown as ReturnType<typeof vi.fn>,
    store: {} as Record<string, unknown>,
    containers: [] as HTMLElement[],
    frameloops: [] as unknown[],
  },
}));
vi.mock('@react-three/fiber', async () => {
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const Canvas = ({
    children,
    onCreated,
    frameloop,
    ...props
  }: {
    children: React.ReactNode;
    onCreated?: (state: unknown) => void;
    frameloop?: string;
    'data-fail'?: boolean;
  }) => {
    if (props['data-fail']) throw new Error('WebGL is not available');
    fiber.frameloops.push(frameloop);
    const root = React.useRef<ReturnType<typeof createRoot> | null>(null);
    React.useLayoutEffect(() => {
      if (!root.current) {
        const container = document.createElement('div');
        fiber.containers.push(container);
        root.current = createRoot(container);
        onCreated?.(fiber.store);
      }
      root.current.render(children);
    });
    React.useLayoutEffect(() => {
      const current = root.current;
      return () => {
        queueMicrotask(() => current?.unmount());
      };
    }, []);
    return <canvas data-canvas="" />;
  };
  const useThree = (selector?: (state: Record<string, unknown>) => unknown) =>
    selector ? selector(fiber.store) : fiber.store;
  return { Canvas, useThree };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  fiber.advance = vi.fn();
  fiber.setSize = vi.fn();
  fiber.store = {
    advance: fiber.advance,
    setSize: fiber.setSize,
    set: (partial: Record<string, unknown>) => Object.assign(fiber.store, partial),
  };
  fiber.containers.length = 0;
  fiber.frameloops.length = 0;
});

afterEach(async () => {
  // The stand-in unmounts its own root in a microtask.
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const scene = (frame: number, node: React.ReactNode, gate?: RenderGate) => (
  <FrameProvider frame={frame} fps={30} durationInFrames={300} width={1080} height={1920} gate={gate}>
    {node}
  </FrameProvider>
);
const renderAt = (frame: number, node: React.ReactNode, gate?: RenderGate) =>
  act(() => root.render(scene(frame, node, gate)));
// Awaited, so that React follows suspended content.
const renderAtAsync = (frame: number, node: React.ReactNode, gate?: RenderGate) =>
  act(async () => root.render(scene(frame, node, gate)));

const Probe = () => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const { isActive } = useSequence();
  return <i data-probe="">{`${frame} ${fps} ${width} ${isActive}`}</i>;
};
const probe = () => fiber.containers[0]?.querySelector('[data-probe]')?.textContent;

describe('ThreeCanvas', () => {
  it('provides the frame, the config and the gate inside the R3F root and draws the frame once', async () => {
    const gate = createRenderGate();
    renderAt(5, <ThreeCanvas width={540} height={960}><Probe /></ThreeCanvas>, gate);
    expect(probe()).toBe('5 30 1080 true');
    expect(fiber.frameloops.every((f) => f === 'never')).toBe(true);
    expect(fiber.setSize).toHaveBeenCalledWith(540, 960);
    // the clock is the frame's time in seconds
    expect(fiber.advance).toHaveBeenLastCalledWith(5 / 30);
    await expect(gate.waitUntilReady({ frame: 5, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('draws whatever frame the host asks for, in any order', async () => {
    const gate = createRenderGate();
    const scene = <ThreeCanvas width={10} height={10}><Probe /></ThreeCanvas>;
    renderAt(200, scene, gate);
    renderAt(3, scene, gate);
    expect(probe()).toBe('3 30 1080 true');
    expect(fiber.advance).toHaveBeenLastCalledWith(3 / 30);
    await expect(gate.waitUntilReady({ frame: 3, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('holds the frame until the frame is drawn', async () => {
    const gate = createRenderGate();
    const never = new Promise<never>(() => {});
    const Blocked = () => use(never);
    await renderAtAsync(7, <ThreeCanvas width={10} height={10}><Blocked /></ThreeCanvas>, gate);
    expect(gate.getPending().map((p) => p.label)).toEqual([
      '<ThreeCanvas> drawing frame 7',
      '<ThreeCanvas> waiting for suspended scene content (textures, models) to load',
    ]);
    await expect(gate.waitUntilReady({ frame: 7, timeoutMs: 20 })).rejects.toThrow(/drawing frame 7/);
    expect(fiber.advance).not.toHaveBeenCalled();
  });

  it('holds the frame while scene content suspends, then draws it', async () => {
    const gate = createRenderGate();
    let resolve: (value: string) => void = () => {};
    const texture = new Promise<string>((r) => (resolve = r));
    const Textured = () => <b data-texture="">{use(texture)}</b>;
    await renderAtAsync(2, <ThreeCanvas width={10} height={10}><Textured /></ThreeCanvas>, gate);
    expect(gate.getPending().map((p) => p.label)).toContain(
      '<ThreeCanvas> waiting for suspended scene content (textures, models) to load',
    );
    await act(async () => resolve('wood.jpg'));
    expect(fiber.containers[0].querySelector('[data-texture]')!.textContent).toBe('wood.jpg');
    expect(fiber.advance).toHaveBeenLastCalledWith(2 / 30);
    await expect(gate.waitUntilReady({ frame: 2, timeoutMs: 1000 })).resolves.toBeUndefined();
  });

  it('cancels the render when the canvas fails', async () => {
    const gate = createRenderGate();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt(0, <ThreeCanvas width={10} height={10} data-fail><Probe /></ThreeCanvas>, gate);
    await expect(gate.waitUntilReady()).rejects.toThrow('<ThreeCanvas>: WebGL is not available');
  });

  it('renders nothing in collectAudioTracks() and takes no sound inside', async () => {
    await collectAudioTracks(<ThreeCanvas width={10} height={10}><Probe /></ThreeCanvas>, { durationInFrames: 3, width: 10, height: 10 });
    // The canvas was never rendered (the stand-in records every render).
    expect(fiber.frameloops).toEqual([]);
    const errors: string[] = [];
    class Boundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
      state = { failed: false };
      static getDerivedStateFromError() {
        return { failed: true };
      }
      componentDidCatch(error: Error) {
        errors.push(error.message);
      }
      render() {
        return this.state.failed ? null : this.props.children;
      }
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderAt(0, <ThreeCanvas width={10} height={10}><Boundary><Audio src="a.mp3" /></Boundary></ThreeCanvas>);
    expect(errors).toEqual([
      '<Audio> cannot be inside <ThreeCanvas>: the canvas renders in a React root of its own, which collectAudioTracks() does not render. Put the sound outside the canvas.',
    ]);
  });

  it('checks its props', () => {
    const render = (node: React.ReactNode) => () =>
      renderToStaticMarkup(
        <FrameProvider frame={0} durationInFrames={10} width={10} height={10}>
          {node}
        </FrameProvider>,
      );
    expect(render(<ThreeCanvas width={10.5} height={10}>{null}</ThreeCanvas>)).toThrow(
      /"width" must be a positive integer \(px\), got 10.5/,
    );
    // @ts-expect-error missing height
    expect(render(<ThreeCanvas width={10}>{null}</ThreeCanvas>)).toThrow(/"height" must be a positive integer/);
    // @ts-expect-error frameloop is always 'never'
    expect(render(<ThreeCanvas width={10} height={10} frameloop="always">{null}</ThreeCanvas>)).toThrow(
      /frameloop must be 'never' or left out, got "always"/,
    );
    // @ts-expect-error a Sequence prop
    expect(render(<ThreeCanvas width={10} height={10} from={30}>{null}</ThreeCanvas>)).toThrow(
      /does not take the <Sequence> prop "from": put the canvas inside <Sequence layout="none" from=/,
    );
    expect(render(<ThreeCanvas width={10} height={10} frameloop="never">{null}</ThreeCanvas>)).not.toThrow();
  });
});
