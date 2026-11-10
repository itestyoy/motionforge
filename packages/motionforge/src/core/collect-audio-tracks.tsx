'use client';

import React from 'react';
import { FrameProvider } from './context';
import { AudioTrack, createCollectingCollector } from './audio-collector';
import { InputEvent } from './input-log';
import { StaticFiles } from './static-files';

/** The FrameProvider props collectAudioTracks() renders the scene with. */
export interface CollectAudioTracksOptions {
  /** Frames per second (default 30, as FrameProvider's). */
  fps?: number;
  durationInFrames: number;
  width: number;
  height: number;
  /** The input log of a playable: the tracks of the scene with these events. */
  input?: readonly InputEvent[];
  /** FrameProvider's staticFiles, for scenes that build URLs with useStaticFile(). */
  staticFiles?: StaticFiles;
}

const OPTIONS = ['fps', 'durationInFrames', 'width', 'height', 'input', 'staticFiles'];

const isPositive = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value > 0;

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

/**
 * The audio manifest of a scene without playing or capturing it: renders
 * every frame from 0 to `durationInFrames - 1` to a string (react-dom/server,
 * no DOM needed) inside a `FrameProvider` with these options, and returns
 * the tracks, exactly as a collector of createAudioCollector() lists them
 * after the host has rendered every frame (same tracks, same ids, same
 * order).
 *
 *   const tracks = await collectAudioTracks(<Scene />, { fps: 30, durationInFrames: 300, width: 1080, height: 1920 });
 *
 * While it renders, no effect runs: nothing is loaded (images, video, fonts),
 * no audio is rendered (generated tracks carry `generated`, whose `render()`
 * the host calls when it needs the samples), and the render gate is not
 * used. ThreeCanvas renders nothing; components that need the DOM while
 * rendering can ask useIsCollectingAudio(). An error while rendering a frame
 * rejects with the frame named.
 */
export const collectAudioTracks = async (
  scene: React.ReactNode,
  options: CollectAudioTracksOptions,
): Promise<readonly AudioTrack[]> => {
  if (typeof options !== 'object' || options === null) {
    throw new TypeError(
      `collectAudioTracks: expects the options { fps, durationInFrames, width, height, input?, staticFiles? }, got ${JSON.stringify(options)}`,
    );
  }
  for (const key of Object.keys(options)) {
    if (!OPTIONS.includes(key)) {
      throw new TypeError(`collectAudioTracks: unknown option ${JSON.stringify(key)} (it takes ${OPTIONS.join(', ')})`);
    }
  }
  const { fps = 30, durationInFrames, width, height, input, staticFiles } = options;
  if (!Number.isInteger(durationInFrames) || durationInFrames <= 0) {
    throw new TypeError(`collectAudioTracks: durationInFrames must be a positive integer, got ${JSON.stringify(durationInFrames)}`);
  }
  if (!isPositive(fps)) throw new TypeError(`collectAudioTracks: fps must be a positive number, got ${JSON.stringify(fps)}`);
  if (!isPositive(width) || !isPositive(height)) {
    throw new TypeError(`collectAudioTracks: width and height must be positive numbers, got ${JSON.stringify(width)}x${JSON.stringify(height)}`);
  }

  // Loaded on first use, so the main entry does not pull in the server renderer.
  const { renderToStaticMarkup } = await import('react-dom/server');
  const { collector, beginFrame, endFrame } = createCollectingCollector();
  let lastYield = now();
  for (let frame = 0; frame < durationInFrames; frame++) {
    beginFrame();
    try {
      renderToStaticMarkup(
        <FrameProvider
          frame={frame}
          fps={fps}
          durationInFrames={durationInFrames}
          width={width}
          height={height}
          audio={collector}
          input={input}
          staticFiles={staticFiles}
        >
          {scene}
        </FrameProvider>,
      );
    } catch (cause) {
      const error = new Error(
        `collectAudioTracks: rendering frame ${frame} failed: ${cause instanceof Error ? cause.message : String(cause)}`,
      );
      (error as Error & { cause?: unknown }).cause = cause;
      throw error;
    }
    endFrame();
    // In a browser, give the page a turn now and then.
    if (now() - lastYield > 50) {
      await new Promise((resolve) => setTimeout(resolve, 0));
      lastYield = now();
    }
  }
  return collector.getTracks();
};
