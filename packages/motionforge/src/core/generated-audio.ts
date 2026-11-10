/**
 * Generated audio (`motionforge/audio`): a track whose samples are made in
 * code is described by what they are made from, so it can be listed (also by
 * collectAudioTracks(), which renders no audio) before anything is rendered,
 * and rendered once per page, when the scene or the host needs it.
 */

/** The samples of a generated track: what they are made from, and how to get them. */
export interface GeneratedAudio {
  /** `'tone'` for `<ToneAudio>`, `'zzfx'` for `<Sfx>`. */
  readonly kind: 'tone' | 'zzfx';
  /**
   * Everything the samples are made from, as JSON (see the README for each
   * kind): the cache key. Two tracks with the same key play the same samples.
   */
  readonly key: string;
  /** The samples once they are rendered on this page (by the scene, usePrepareAudio() or render()), else null. */
  readonly buffer: AudioBuffer | null;
  /**
   * Renders the samples, once per page and key: later calls (and the scene's
   * components) get the same buffer. Needs the Web Audio API, and Tone.js for
   * `'tone'`; rejects with the error otherwise. A failed render is not kept,
   * so a later call tries again.
   */
  render(): Promise<AudioBuffer>;
}

/** What the components use besides the public interface. */
export interface GeneratedAudioInternal extends GeneratedAudio {
  /** Makes a synchronous kind (ZzFX) now; throws its error. */
  renderNow(): AudioBuffer;
}

class Generated implements GeneratedAudioInternal {
  private rendered: AudioBuffer | null = null;
  private pending: Promise<AudioBuffer> | null = null;

  constructor(
    readonly kind: 'tone' | 'zzfx',
    readonly key: string,
    private readonly make: () => AudioBuffer | Promise<AudioBuffer>,
  ) {}

  get buffer(): AudioBuffer | null {
    return this.rendered;
  }

  render(): Promise<AudioBuffer> {
    if (this.rendered) return Promise.resolve(this.rendered);
    if (this.pending) return this.pending;
    let made: AudioBuffer | Promise<AudioBuffer>;
    try {
      made = this.make();
    } catch (error) {
      return Promise.reject(error);
    }
    if (!(made instanceof Promise)) {
      this.rendered = made;
      return Promise.resolve(made);
    }
    const pending = made.then(
      (buffer) => {
        this.rendered = buffer;
        this.pending = null;
        return buffer;
      },
      (error) => {
        this.pending = null;
        throw error;
      },
    );
    this.pending = pending;
    return pending;
  }

  renderNow(): AudioBuffer {
    if (!this.rendered) {
      const made = this.make();
      if (made instanceof Promise) throw new Error(`renderNow: ${this.kind} audio renders asynchronously`);
      this.rendered = made;
    }
    return this.rendered;
  }
}

/**
 * Descriptors by key, most recently used last: every track, usePrepareAudio()
 * and component with the same key share one, and so one render. Beyond the
 * limit the oldest are dropped (a track keeps its own descriptor).
 */
const LIMIT = 64;
const descriptors = new Map<string, Generated>();

/**
 * The descriptor of the samples `key` stands for; `make` renders them and is
 * used only when no descriptor for `key` exists yet (everything it reads must
 * be in `key`).
 */
export const generatedAudio = (
  kind: 'tone' | 'zzfx',
  key: string,
  make: () => AudioBuffer | Promise<AudioBuffer>,
): GeneratedAudioInternal => {
  let descriptor = descriptors.get(key);
  if (descriptor) {
    descriptors.delete(key);
  } else {
    descriptor = new Generated(kind, key, make);
  }
  descriptors.set(key, descriptor);
  while (descriptors.size > LIMIT) descriptors.delete(descriptors.keys().next().value as string);
  return descriptor;
};
