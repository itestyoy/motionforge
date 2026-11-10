'use client';

import React, { Component, Suspense, useCallback, useContext, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useThree, type CanvasProps, type RootState } from '@react-three/fiber';
import { FrameContext, GateContext, HostContext, TimelineContext, useCurrentFrame, useVideoConfig } from '../../core/context';
import { useDelayRender } from '../../core/delay-render';
import { SequenceContext } from '../Sequence';

export type ThreeCanvasProps = Omit<CanvasProps, 'frameloop' | 'children'> & {
  /** Width of the canvas in px (a positive integer); the scene renders at this size. */
  width: number;
  /** Height of the canvas in px (a positive integer). */
  height: number;
  /**
   * Always `'never'`: the canvas is drawn once per frame, when the frame
   * changes. Other values throw.
   */
  frameloop?: 'never';
  children: React.ReactNode;
};

// Props Remotion's <ThreeCanvas> takes from <Sequence>; here the canvas goes
// inside a <Sequence layout="none"> instead.
const SEQUENCE_PROPS = [
  'from',
  'durationInFrames',
  'trimBefore',
  'playbackRate',
  'loop',
  'freeze',
  'hidden',
  'name',
  'showInTimeline',
  'premountFor',
  'postmountFor',
  'styleWhilePremounted',
  'styleWhilePostmounted',
];

const validateDimension = (value: unknown, name: string) => {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new TypeError(`<ThreeCanvas>: "${name}" must be a positive integer (px), got ${JSON.stringify(value)}`);
  }
};

// Sizes the renderer to width x height and ignores the size R3F measures from
// the element, so a CSS transform or scaling of the page changes nothing.
const Scale: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const set = useThree((state) => state.set);
  const threeSetSize = useThree((state) => state.setSize);
  // R3F's own setSize, kept before it is replaced below.
  const [initialSetSize] = useState(() => threeSetSize);
  useLayoutEffect(() => {
    initialSetSize(width, height);
    set({ setSize: () => null });
    return () => set({ setSize: initialSetSize });
  }, [initialSetSize, width, height, set]);
  return null;
};

// Last in the scene: after every commit of the R3F tree it draws the scene
// once, with the clock at the frame's time in seconds, and reports the frame.
const FrameRenderer: React.FC<{ onRendered: (frame: number) => void }> = ({ onRendered }) => {
  const advance = useThree((state) => state.advance);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  useLayoutEffect(() => {
    advance(frame / fps);
    onRendered(frame);
  });
  return null;
};

// Shown while scene content suspends (useLoader, drei's useTexture/useGLTF, ...).
const SuspenseHold: React.FC = () => {
  const { delayRender, continueRender } = useDelayRender();
  useLayoutEffect(() => {
    const handle = delayRender('<ThreeCanvas> waiting for suspended scene content (textures, models) to load');
    return () => continueRender(handle);
  }, [delayRender, continueRender]);
  return null;
};

// An error inside the canvas (WebGL unavailable, a scene component throwing)
// fails the render through cancelRender() instead of unmounting the page.
class CanvasErrorBoundary extends Component<
  { onError: (error: unknown) => void; children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    this.props.onError(error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Remotion's `<ThreeCanvas>` (`@remotion/three`): a React Three Fiber
 * `<Canvas>` driven by the frame.
 *
 * - `useCurrentFrame()`, `useVideoConfig()`, `useDelayRender()` and the
 *   sequence context work inside: R3F renders in a separate React root, and
 *   the canvas provides them there again.
 * - Deterministic: `frameloop` is `'never'`; the scene is drawn once per frame
 *   with `advance(frame / fps)`, so `state.clock.elapsedTime` is the frame's
 *   time in seconds. Animate with `useCurrentFrame()`, not `useFrame()`.
 * - Holds the render gate until the renderer exists, the frame is drawn, and
 *   suspended content (textures, models) has loaded.
 */
export const ThreeCanvas: React.FC<ThreeCanvasProps> = (props) => {
  for (const name of SEQUENCE_PROPS) {
    if (name in props) {
      throw new Error(
        `<ThreeCanvas> does not take the <Sequence> prop "${name}": put the canvas inside <Sequence layout="none" ${name}={...}> instead`,
      );
    }
  }
  const { children, width, height, style, resize, frameloop, onCreated, ...rest } = props;
  validateDimension(width, 'width');
  validateDimension(height, 'height');
  if (frameloop !== undefined && frameloop !== 'never') {
    throw new Error(
      `<ThreeCanvas>: frameloop must be 'never' or left out, got ${JSON.stringify(frameloop)}: the canvas is drawn once per frame; animate with useCurrentFrame() instead of useFrame()`,
    );
  }

  const frameValue = useContext(FrameContext);
  if (!frameValue) {
    throw new Error('<ThreeCanvas> must be used within a FrameProvider');
  }
  const gateValue = useContext(GateContext);
  const sequenceValue = useContext(SequenceContext);
  const hostValue = useContext(HostContext);
  const timelineValue = useContext(TimelineContext);
  const { frame } = frameValue;
  const { delayRender, continueRender, cancelRender } = useDelayRender();

  // Held from mount until R3F has created the renderer (it waits until the
  // canvas has a size).
  const created = useRef(false);
  const createdHold = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (created.current) return;
    const handle = delayRender('<ThreeCanvas> creating the WebGL renderer (the canvas needs a non-zero size)');
    createdHold.current = handle;
    return () => {
      createdHold.current = null;
      continueRender(handle);
    };
  }, [delayRender, continueRender]);
  const handleCreated = useCallback(
    (state: RootState) => {
      created.current = true;
      if (createdHold.current !== null) {
        continueRender(createdHold.current);
        createdHold.current = null;
      }
      onCreated?.(state);
    },
    [onCreated, continueRender],
  );

  // Held from each new frame until the R3F tree has drawn that frame (it
  // renders after this tree has committed).
  const renderedFrame = useRef<number | null>(null);
  const frameHold = useRef<{ frame: number; handle: number } | null>(null);
  const onRendered = useCallback(
    (renderedAt: number) => {
      renderedFrame.current = renderedAt;
      const hold = frameHold.current;
      if (hold && hold.frame === renderedAt) {
        frameHold.current = null;
        continueRender(hold.handle);
      }
    },
    [continueRender],
  );
  useLayoutEffect(() => {
    if (renderedFrame.current === frame) return;
    const hold = { frame, handle: delayRender(`<ThreeCanvas> drawing frame ${frame}`) };
    frameHold.current = hold;
    return () => {
      if (frameHold.current === hold) frameHold.current = null;
      continueRender(hold.handle);
    };
  }, [frame, delayRender, continueRender]);

  const onError = useCallback(
    (error: unknown) =>
      cancelRender(new Error(`<ThreeCanvas>: ${error instanceof Error ? error.message : String(error)}`)),
    [cancelRender],
  );

  return (
    <CanvasErrorBoundary onError={onError}>
      <Canvas
        style={{ width, height, ...style }}
        {...rest}
        resize={{ offsetSize: true, ...resize }}
        frameloop="never"
        onCreated={handleCreated}
      >
        <FrameContext.Provider value={frameValue}>
          <GateContext.Provider value={gateValue}>
            <HostContext.Provider value={hostValue}>
              <TimelineContext.Provider value={timelineValue}>
                <SequenceContext.Provider value={sequenceValue}>
                  <Scale width={width} height={height} />
                  <Suspense fallback={<SuspenseHold />}>
                    {children}
                    <FrameRenderer onRendered={onRendered} />
                  </Suspense>
                </SequenceContext.Provider>
              </TimelineContext.Provider>
            </HostContext.Provider>
          </GateContext.Provider>
        </FrameContext.Provider>
      </Canvas>
    </CanvasErrorBoundary>
  );
};
