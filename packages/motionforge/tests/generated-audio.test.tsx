// @vitest-environment happy-dom
import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FrameProvider } from '../src/core/context';
import { createRenderGate, RenderGate } from '../src/core/render-gate';
import { AudioCollector, createAudioCollector } from '../src/core/audio-collector';
import { Sequence } from '../src/components/Sequence';
import { ToneAudio, Sfx, renderZzfx, usePrepareAudio } from '../src/audio';
import { useInputEvents } from '../src/core/input';
import { InputEvent } from '../src/core/input-log';
import { collectAudioTracks } from '../src/core/collect-audio-tracks';
import { seededRandom } from '../src/components/audio/seeded-random';

/* eslint-disable @typescript-eslint/no-explicit-any */

// A stand-in for Tone.js with the parts that matter here: one global
// context, an offline context whose render ticks a clock (yielding to the
// event loop between blocks, as Tone's does) and whose output is what the
// scene's code wrote, and Noise with Tone's page-wide noise buffers filled
// from Math.random the first time noise plays.
const fake = vi.hoisted(() => {
  const state = { contexts: 0, renders: 0, noiseCache: {} as Record<string, number[]>, current: null as any };
  class OfflineContext {
    written: number[] = [];
    listeners: Array<(block: number) => void> = [];
    constructor(public channels: number, public duration: number, public sampleRate: number) {
      state.contexts += 1;
    }
    on(_event: 'tick', callback: (block: number) => void) {
      this.listeners.push(callback);
      return this;
    }
    emit(_event: 'tick', block: number) {
      this.listeners.forEach((callback) => callback(block));
      return this;
    }
    async render() {
      state.renders += 1;
      const blocks = Math.ceil((this.duration * this.sampleRate) / 128);
      for (let block = 0; block < blocks; block++) {
        this.emit('tick', block);
        if (block % 4 === 3) await new Promise((resolve) => setTimeout(resolve, 1));
      }
      const data = Float32Array.from(this.written);
      return {
        get: () => ({
          length: data.length,
          sampleRate: this.sampleRate,
          numberOfChannels: 1,
          duration: data.length / this.sampleRate,
          getChannelData: () => data,
        }),
      };
    }
  }
  class Noise {
    context = state.current;
    connected = false;
    constructor(public type = 'white') {}
    toDestination() {
      this.connected = true;
      return this;
    }
    start() {
      const buffer = (state.noiseCache[this.type] ??= Array.from({ length: 6 }, () => Math.random()));
      const offset = Math.random();
      if (this.connected) this.context.written.push(...buffer, offset);
      return this;
    }
    dispose() {}
  }
  const tone = {
    OfflineContext,
    Noise,
    getContext: () => (state.current ??= { name: 'realtime' }),
    setContext: (context: unknown) => {
      state.current = context;
    },
    loaded: () => Promise.resolve(),
  };
  return { state, tone };
});
vi.mock('tone', () => fake.tone);

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// Web Audio's AudioBuffer, enough for Sfx.
class FakeAudioBuffer {
  length: number;
  sampleRate: number;
  numberOfChannels: number;
  private channels: Float32Array[];
  constructor({ length, numberOfChannels, sampleRate }: { length: number; numberOfChannels: number; sampleRate: number }) {
    this.length = length;
    this.sampleRate = sampleRate;
    this.numberOfChannels = numberOfChannels;
    this.channels = Array.from({ length: numberOfChannels }, () => new Float32Array(length));
  }
  getChannelData(index: number) {
    return this.channels[index];
  }
}
beforeAll(() => vi.stubGlobal('AudioBuffer', FakeAudioBuffer));
afterAll(() => vi.unstubAllGlobals());

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

const renderAt = (frame: number, node: React.ReactNode, audio?: AudioCollector, gate?: RenderGate, input?: readonly InputEvent[]) =>
  act(() =>
    root.render(
      <FrameProvider frame={frame} fps={30} durationInFrames={300} width={100} height={100} audio={audio} gate={gate} input={input}>
        {node}
      </FrameProvider>,
    ),
  );

// Waits for the gate in short act() scopes: one act() around the whole wait
// would hold back the update that ends the render until the wait is over.
const waitReady = async (gate: RenderGate, frame: number, input?: readonly InputEvent[]) => {
  let settled = false;
  let failure: unknown = null;
  gate.waitUntilReady({ frame, input, timeoutMs: 5000 }).then(
    () => (settled = true),
    (error) => {
      failure = error;
      settled = true;
    },
  );
  while (!settled) await act(() => new Promise((resolve) => setTimeout(resolve, 2)));
  if (failure) throw failure;
};

// Renders until the gate is ready and returns the samples of the only track.
const renderTrack = async (node: React.ReactNode, frame = 0) => {
  const audio = createAudioCollector();
  const gate = createRenderGate();
  renderAt(frame, node, audio, gate);
  await waitReady(gate, frame);
  const [track] = audio.getTracks();
  return { track, samples: Array.from(track.generated!.buffer!.getChannelData(0)) };
};

// Scene code written against the stand-in: random values in the callback,
// noise, and random values on the clock's ticks (as a Tone.Loop callback).
const noisyRender = (Tone: any) => {
  const context = Tone.getContext();
  context.written.push(Math.random(), Math.random());
  new Tone.Noise('pink').toDestination().start(0);
  context.on('tick', (block: number) => {
    if (block % 3 === 0) context.written.push(Math.random());
  });
};

describe('<ToneAudio>', () => {
  // First in the file: the stand-in's noise buffers are still empty.
  it('gives the same samples on every render of the same input, the first one on the page included', async () => {
    const first = await renderTrack(<ToneAudio durationInFrames={30} render={noisyRender} />);
    // deps the callback does not read: another cache key, so it renders again.
    const second = await renderTrack(<ToneAudio durationInFrames={30} render={noisyRender} deps={['again']} />);
    expect(fake.state.renders).toBe(2);
    expect(first.samples.length).toBeGreaterThan(20);
    expect(second.samples).toEqual(first.samples);
    const otherSeed = await renderTrack(<ToneAudio durationInFrames={30} render={noisyRender} seed={7} />);
    expect(otherSeed.samples).not.toEqual(first.samples);
  });

  it('keeps the seeded sequence to itself: code running between the clock ticks neither consumes nor sees it', async () => {
    const clean = await renderTrack(<ToneAudio durationInFrames={30} render={noisyRender} deps={['clean']} />);
    const original = Math.random;
    const seen: number[] = [];
    const interval = setInterval(() => seen.push(Math.random()), 0);
    try {
      const busy = await renderTrack(<ToneAudio durationInFrames={30} render={noisyRender} deps={['busy']} />);
      expect(busy.samples).toEqual(clean.samples);
    } finally {
      clearInterval(interval);
    }
    expect(Math.random).toBe(original);
    // The other code got the page's numbers, not the seeded ones.
    expect(seen.some((value) => clean.samples.includes(Math.fround(value)))).toBe(false);
  });

  it('registers its track at once, at the start of its sequence, and holds the gate while the samples render', async () => {
    const audio = createAudioCollector();
    const gate = createRenderGate();
    renderAt(
      40,
      <Sequence from={40} durationInFrames={100}>
        <ToneAudio durationInFrames={60} render={noisyRender} deps={['gate']} name="jingle" volume={0.5} />
      </Sequence>,
      audio,
      gate,
    );
    expect(gate.getPending().map((p) => p.label)).toEqual(['<ToneAudio> rendering 60 frames offline']);
    expect(audio.getTracks()).toMatchObject([
      { name: 'jingle', src: null, from: 40, startFrame: 40, endFrame: 100, volume: 0.5, trimBefore: 0, loop: false },
    ]);
    const [track] = audio.getTracks();
    // The host knows the sound before it is rendered: what it is made from, and render() to get it.
    expect(track.generated).toMatchObject({ kind: 'tone', buffer: null });
    expect(JSON.parse(track.generated!.key)).toEqual(['tone', String(noisyRender), ['gate'], 60, 30, 48000, 2, 0]);
    await waitReady(gate, 40);
    expect(track.generated!.buffer!.sampleRate).toBe(48000);
    await expect(track.generated!.render()).resolves.toBe(track.generated!.buffer);
  });

  it('renders each sound once and reuses it without holding the gate', async () => {
    const node = <ToneAudio durationInFrames={10} render={noisyRender} deps={['cached']} />;
    const renders = fake.state.renders;
    const { track } = await renderTrack(node);
    const again = await renderTrack(node, 5);
    expect(fake.state.renders - renders).toBe(1);
    expect(again.track.generated!.buffer).toBe(track.generated!.buffer);
    const gate = createRenderGate();
    act(() => root.unmount());
    root = createRoot(container);
    renderAt(0, node, createAudioCollector(), gate);
    expect(gate.getPending()).toEqual([]);
  });

  it('does not hold the frame while premounted', () => {
    const gate = createRenderGate();
    renderAt(
      10,
      <Sequence from={30} premountFor={20}>
        <ToneAudio durationInFrames={10} render={noisyRender} deps={['premount']} />
      </Sequence>,
      createAudioCollector(),
      gate,
    );
    expect(gate.getPending()).toEqual([]);
  });

  it('renders nothing without a collector', () => {
    const contexts = fake.state.contexts;
    renderAt(0, <ToneAudio durationInFrames={10} render={noisyRender} deps={['unheard']} />);
    expect(fake.state.contexts).toBe(contexts);
  });

  it('fails the render for an async callback and throws on wrong props', async () => {
    const gate = createRenderGate();
    renderAt(0, <ToneAudio durationInFrames={10} render={async () => {}} />, createAudioCollector(), gate);
    await expect(gate.waitUntilReady({ timeoutMs: 5000 })).rejects.toThrow(/render must be synchronous/);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(0, <ToneAudio durationInFrames={1.5} render={() => {}} />)).toThrow(/durationInFrames must be a positive integer/);
    expect(() => renderAt(0, <ToneAudio durationInFrames={10} render={() => {}} deps={[() => 1]} />)).toThrow(
      /deps\.0 must be JSON data .* got a function/,
    );
    // @ts-expect-error 1 or 2
    expect(() => renderAt(0, <ToneAudio durationInFrames={10} render={() => {}} channels={6} />)).toThrow(/channels must be 1 or 2/);
  });
});

describe('renderZzfx / <Sfx>', () => {
  const coin = [, 0.2, 925, 0.04, 0.3, 0.6, 1, 0.3, , 6.27, -184, 0.09, 0.17] as const;

  it("gives ZzFX's own samples (at zzfx()'s master volume) with its randomness drawn from the seed", async () => {
    // ZzFX's module creates an AudioContext when imported.
    vi.stubGlobal('AudioContext', class {});
    // @ts-expect-error zzfx has no type declarations
    const { ZZFX } = (await import('zzfx')) as any;
    // ZzFX draws one random number per sound: give it the seeded one.
    const random = vi.spyOn(Math, 'random').mockReturnValue(seededRandom(3)());
    const reference = Float32Array.from(ZZFX.buildSamples(...coin), (v: number) => Math.fround(v * 0.3));
    random.mockRestore();
    const samples = renderZzfx(coin, 44100, 3);
    expect(samples.length).toBe(reference.length);
    expect(Array.from(samples)).toEqual(Array.from(reference));
    expect(renderZzfx(coin, 44100, 3)).toEqual(samples);
    expect(renderZzfx(coin, 44100, 4)).not.toEqual(samples);
    // Without randomness the seed does not matter.
    const steady = [1, 0, 440, , 0.1];
    expect(renderZzfx(steady, 44100, 1)).toEqual(renderZzfx(steady, 44100, 2));
    expect(() => renderZzfx(['a' as unknown as number])).toThrow(/ZzFX parameter 0 must be a finite number/);
  });

  it('registers the sound at its frame in the enclosing sequence', () => {
    const audio = createAudioCollector();
    renderAt(50, <Sequence from={50} durationInFrames={60}><Sfx at={12} zzfx={coin} name="coin" /></Sequence>, audio);
    const [track] = audio.getTracks();
    const samples = renderZzfx(coin);
    expect(track).toMatchObject({ name: 'coin', src: null, from: 62, startFrame: 62, endFrame: 62 + Math.ceil((samples.length / 44100) * 30 - 1e-9) });
    expect(Array.from(track.generated!.buffer!.getChannelData(0))).toEqual(Array.from(samples));
    expect(track.generated).toMatchObject({ kind: 'zzfx', key: JSON.stringify(['zzfx', [...coin].map((v) => v ?? null), 44100, 0]) });
  });

  it('needs no Web Audio without a collector and throws for a frame after its sequence', () => {
    vi.stubGlobal('AudioBuffer', undefined);
    try {
      expect(() => renderAt(0, <Sfx zzfx={coin} />)).not.toThrow();
    } finally {
      vi.stubGlobal('AudioBuffer', FakeAudioBuffer);
    }
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderAt(10, <Sequence from={10} durationInFrames={20}><Sfx at={20} zzfx={coin} /></Sequence>)).toThrow(
      /at=\{20\} is not before the end of its sequence \(it ends at its frame 20\)/,
    );
    expect(() => renderAt(0, <Sfx at={-1} zzfx={coin} />)).toThrow(/at must be an integer >= 0/);
  });
});

describe('usePrepareAudio()', () => {
  const pop = [1, 0, 600, 0.01, 0.04, 0.08] as const;

  // The "sound on tap" recipe: the sounds are rendered before the first tap,
  // and each tap mounts a sound at its frame.
  const TapGame = () => {
    const ready = usePrepareAudio([
      { type: 'sfx', zzfx: pop },
      { type: 'tone', durationInFrames: 20, render: noisyRender, deps: ['win'] },
    ]);
    const taps = useInputEvents();
    return (
      <>
        <i data-ready="">{String(ready)}</i>
        {taps.map((tap, index) =>
          tap.type === 'tap' ? (
            <Sfx key={index} at={tap.frame} zzfx={pop} volume={0.7} name="pop" />
          ) : (
            <Sequence key={index} from={tap.frame} layout="none">
              <ToneAudio durationInFrames={20} render={noisyRender} deps={['win']} muted name="win" />
            </Sequence>
          ),
        )}
      </>
    );
  };

  it('renders the sounds ahead, holding the gate, so a sound started by a tap plays at once', async () => {
    const audio = createAudioCollector();
    const gate = createRenderGate();
    const renders = fake.state.renders;
    renderAt(0, <TapGame />, audio, gate, []);
    expect(gate.getPending().map((p) => p.label)).toEqual(['usePrepareAudio rendering 2 sounds']);
    expect(container.querySelector('[data-ready]')!.textContent).toBe('false');
    await waitReady(gate, 0, []);
    expect(container.querySelector('[data-ready]')!.textContent).toBe('true');
    expect(fake.state.renders - renders).toBe(1);

    // A tap at frame 40 and a win at 41, appended live: the sounds mount with
    // their samples ready and the frame is ready at once.
    const log: InputEvent[] = [{ frame: 40, type: 'tap' }];
    renderAt(40, <TapGame />, audio, gate, log);
    expect(gate.getPending()).toEqual([]);
    const tapTrack = audio.getTracks().find((t) => t.name === 'pop')!;
    expect(tapTrack).toMatchObject({ startFrame: 40, volume: 0.7 });
    expect(tapTrack.generated!.buffer).not.toBeNull();
    const withWin: InputEvent[] = [...log, { frame: 41, type: 'win' }];
    renderAt(41, <TapGame />, audio, gate, withWin);
    // muted, volume and name are not in the cache key: the prepared samples are used.
    expect(gate.getPending()).toEqual([]);
    expect(audio.getTracks().find((t) => t.name === 'win')).toMatchObject({ startFrame: 41, muted: true });
    expect(audio.getTracks().find((t) => t.name === 'win')!.generated!.buffer).not.toBeNull();
    expect(fake.state.renders - renders).toBe(1);
    await waitReady(gate, 41, withWin);
  });

  it('uses the keys of the components: what is in them and what is not', async () => {
    const audio = createAudioCollector();
    const gate = createRenderGate();
    renderAt(0, <><Sfx zzfx={[, , 300]} seed={2} /><ToneAudio durationInFrames={5} render={noisyRender} deps={['k']} seed={1} channels={1} /></>, audio, gate);
    await waitReady(gate, 0);
    const [sfx, tone] = ['zzfx', 'tone'].map((kind) => audio.getTracks().find((t) => t.generated!.kind === kind)!.generated!);
    // Holes are null; sample rate and seed are in it.
    expect(JSON.parse(sfx.key)).toEqual(['zzfx', [null, null, 300], 44100, 2]);
    // The source of render, deps, length, the composition's fps, sample rate, channels, seed.
    expect(JSON.parse(tone.key)).toEqual(['tone', String(noisyRender), ['k'], 5, 30, 48000, 1, 1]);
  });

  it('renders nothing without a collector or in collectAudioTracks(), and checks the sounds', async () => {
    const contexts = fake.state.contexts;
    const Prepare = () => <i data-ready="">{String(usePrepareAudio([{ type: 'tone', durationInFrames: 9, render: noisyRender, deps: ['none'] }]))}</i>;
    renderAt(0, <Prepare />);
    expect(container.querySelector('[data-ready]')!.textContent).toBe('true');
    await collectAudioTracks(<Prepare />, { durationInFrames: 3, width: 10, height: 10 });
    expect(fake.state.contexts).toBe(contexts);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const audio = createAudioCollector();
    // @ts-expect-error not a sound
    expect(() => renderAt(0, <PrepareWith sounds={[{ type: 'beep' }]} />, audio)).toThrow(/sounds\[0\] must be \{ type: 'sfx', zzfx, \.\.\. \}/);
    // @ts-expect-error where it plays is the component's
    expect(() => renderAt(0, <PrepareWith sounds={[{ type: 'sfx', zzfx: pop, volume: 0.5 }]} />, audio)).toThrow(
      /sounds\[0\]: a sfx sound takes type, zzfx, seed, sampleRate, not "volume"/,
    );
    expect(() => renderAt(0, <PrepareWith sounds={[{ type: 'tone', durationInFrames: 0, render: noisyRender }]} />, audio)).toThrow(
      /usePrepareAudio: sounds\[0\]: durationInFrames must be a positive integer/,
    );
  });
});

const PrepareWith = ({ sounds }: { sounds: Parameters<typeof usePrepareAudio>[0] }) => {
  usePrepareAudio(sounds);
  return null;
};
