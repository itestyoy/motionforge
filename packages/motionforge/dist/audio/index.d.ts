import React from 'react';
import * as ToneModule from 'tone';
import { A as AudioVolume } from '../audio-track-BYBIAGke.js';

/** Tone.js itself: what `import * as Tone from 'tone'` gives. */
type Tone = typeof ToneModule;
/** The second argument of ToneAudio's `render`. */
interface ToneRenderContext {
    /** The offline context the sound renders in (also `Tone.getContext()` during `render`); its transport is `context.transport`. */
    context: ToneModule.OfflineContext;
    /** Frames per second of the composition. */
    fps: number;
    /** Length of the render in seconds (`durationInFrames / fps`). */
    durationInSeconds: number;
    /** Seconds of `frames` composition frames, for Tone's times: `framesToSeconds(15)`. */
    framesToSeconds: (frames: number) => number;
}
interface ToneAudioProps {
    /** Length of the sound in frames (a positive integer): the offline render is this long. */
    durationInFrames: number;
    /**
     * Ordinary Tone.js code: build the graph and schedule notes, e.g.
     * `(Tone) => { new Tone.Synth().toDestination().triggerAttackRelease('C4', '8n', 0) }`.
     * It runs inside an offline context, synchronously (async work and
     * `await` are not allowed; samples loaded by Tone are awaited before the
     * render, so start them from the transport). It must be a pure function
     * of its source and `deps`: the result is cached by them.
     */
    render: (tone: Tone, context: ToneRenderContext) => void;
    /** JSON data `render` reads from outside (props, notes): part of the cache key, like useMemo's deps. */
    deps?: readonly unknown[];
    /** Seed of Math.random during the render (an integer, default 0). */
    seed?: number;
    /** Sample rate of the render (default 48000; fixed, so the samples do not depend on the device). */
    sampleRate?: number;
    /** 1 or 2 (default 2). */
    channels?: 1 | 2;
    /** Gain ≥ 0, or a function of the frame counted from the start of the sound. */
    volume?: AudioVolume;
    muted?: boolean;
    /** A label for the audio track. */
    name?: string;
}
/**
 * A sound written with Tone.js, rendered offline (an OfflineAudioContext,
 * faster than real time) into an AudioBuffer and registered as an audio
 * track at the start of the enclosing sequence. The track is registered at
 * once (`track.generated` describes the sound); while the samples render the
 * component holds the render gate. The result is cached by the source of
 * `render`, `deps` and the options (see toneKey). Renders nothing.
 *
 *   <ToneAudio durationInFrames={60} render={(Tone, { framesToSeconds }) => {
 *     const synth = new Tone.Synth().toDestination();
 *     synth.triggerAttackRelease('C5', '16n', 0);
 *     synth.triggerAttackRelease('G5', '16n', framesToSeconds(8));
 *   }} />
 */
declare const ToneAudio: React.FC<ToneAudioProps>;

/**
 * ZzFX parameters, as the ZzFX designer (https://killedbyapixel.github.io/ZzFX/)
 * copies them: `[volume, randomness, frequency, attack, sustain, release,
 * shape, shapeCurve, slide, deltaSlide, pitchJump, pitchJumpTime, repeatTime,
 * noise, modulation, bitCrush, delay, sustainVolume, decay, tremolo, filter]`.
 * Holes and `undefined` take ZzFX's defaults.
 */
type ZzfxParams = ReadonlyArray<number | undefined>;
/**
 * The samples of a ZzFX sound, at the loudness `zzfx()` plays them (ZzFX's
 * master volume 0.3 applied). Pure: ZzFX's randomness (parameter 1) draws
 * from a generator seeded with `seed`, so the same arguments always give the
 * same samples. Needs no Web Audio.
 *
 *   const samples = renderZzfx([, , 925, 0.04, 0.3, 0.6, 1, 0.3, , 6.27, -184, 0.09, 0.17]);
 */
declare const renderZzfx: (params: ZzfxParams, sampleRate?: number, seed?: number) => Float32Array;
interface SfxProps {
    /** ZzFX parameters (see ZzfxParams). */
    zzfx: ZzfxParams;
    /** The frame the sound starts at, in the frames of the enclosing sequence (an integer ≥ 0, default 0). */
    at?: number;
    /** Seed of ZzFX's randomness (an integer, default 0). */
    seed?: number;
    /** Sample rate of the samples (default 44100, as ZzFX's). */
    sampleRate?: number;
    /** Gain ≥ 0, or a function of the frame counted from `at`. */
    volume?: AudioVolume;
    muted?: boolean;
    /** A label for the audio track. */
    name?: string;
}
/**
 * A ZzFX sound effect as an audio track: `<Sfx at={12} zzfx={[...]} />`
 * plays the sound at frame 12 of the enclosing sequence. The samples are
 * computed when the component mounts (no gate needed) and handed to the
 * host as an AudioBuffer (`track.generated`); renders nothing.
 */
declare const Sfx: React.FC<SfxProps>;

/**
 * A generated sound to render ahead of use: the props of `<Sfx>` or
 * `<ToneAudio>` that make up its cache key (where and how it plays, `at`,
 * `volume`, `muted`, `name`, is not part of it).
 */
type PreparedSound = {
    type: 'sfx';
    zzfx: ZzfxParams;
    seed?: number;
    sampleRate?: number;
} | {
    type: 'tone';
    durationInFrames: number;
    render: ToneAudioProps['render'];
    deps?: readonly unknown[];
    seed?: number;
    sampleRate?: number;
    channels?: 1 | 2;
};
/**
 * Renders generated sounds before they play: a sound that starts on input
 * (a tap, whose frame is not known in advance) then plays at once. Holds the
 * render gate until every sound is rendered and cached (inside a premounted
 * sequence it does not), and returns whether they are. A `<Sfx>` or
 * `<ToneAudio>` mounted later with the same key (see PreparedSound) uses the
 * cached samples: it holds nothing and its track has `generated.buffer` set
 * when it registers. A failed render goes to cancelRender(). Without an
 * audio collector on the FrameProvider, and in collectAudioTracks(), nothing
 * is rendered and it returns true.
 *
 *   usePrepareAudio([
 *     { type: 'sfx', zzfx: POP },
 *     { type: 'tone', durationInFrames: 30, render: chime },
 *   ]);
 */
declare const usePrepareAudio: (sounds: readonly PreparedSound[]) => boolean;

export { type PreparedSound, Sfx, type SfxProps, type Tone, ToneAudio, type ToneAudioProps, type ToneRenderContext, type ZzfxParams, renderZzfx, usePrepareAudio };
