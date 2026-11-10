// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate } from '../src/core/render-gate';
import { createAudioCollector } from '../src/core/audio-collector';
import { ToneAudio } from '../src/audio';

// As if the optional peer dependency were not installed.
vi.mock('tone', () => {
  throw new Error('Cannot find package "tone"');
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

it('fails the render with a clear error when tone is not installed', async () => {
  const gate = createRenderGate();
  const root = createRoot(document.createElement('div'));
  act(() =>
    root.render(
      <FrameProvider frame={0} durationInFrames={30} width={10} height={10} gate={gate} audio={createAudioCollector()}>
        <ToneAudio durationInFrames={10} render={() => {}} />
      </FrameProvider>,
    ),
  );
  await expect(gate.waitUntilReady({ timeoutMs: 5000 })).rejects.toThrow(
    /<ToneAudio> needs Tone.js, an optional peer dependency of motionforge: install it \(npm install tone@15\)/,
  );
  act(() => root.unmount());
});
