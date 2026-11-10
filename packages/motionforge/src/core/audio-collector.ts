/**
 * The audio manifest: the SDK describes the sound of a scene as tracks, the
 * host plays and mixes them. `<Audio>`, `<Video>` and the generated sounds of
 * `motionforge/audio` register their track with the collector of the
 * FrameProvider they are in.
 */

/**
 * One sound of the scene. All frames are frames of the composition (the fps
 * of the FrameProvider), counted from the start of the composition; media
 * frames (`trimBefore`, `trimAfter`) count the media at that fps too.
 *
 * At an absolute frame `f` in `[startFrame, endFrame)` the track plays media
 * frame `trimBefore + (f - from) × playbackRate`, i.e. media time
 * `(trimBefore + (f - from) × playbackRate) / fps` seconds; with `loop` the
 * range `trimBefore`..`trimAfter` (or the end of the media) repeats.
 */
export interface AudioTrack {
  /**
   * Derived from the description (source, timing, volume, name), so the same
   * track gets the same id whatever frames were rendered and in what order,
   * and manifests of several FrameProviders rendering the same scene merge by
   * id. Identical tracks playing at the same time get `#2`, `#3`, ... appended.
   */
  id: string;
  /** The `name` prop, or null. */
  name: string | null;
  /** URL of the media (`<Audio>`, `<Video>`), or null for generated audio. */
  src: string | null;
  /** The samples of generated audio (`motionforge/audio`), or null for a URL. */
  buffer: AudioBuffer | null;
  /**
   * The frame at which the track's own frame 0 plays (media frame
   * `trimBefore`): the start of the enclosing sequences. It is below
   * `startFrame` when the track starts before the composition or before an
   * enclosing sequence is shown (e.g. `<Sequence from={-30}>`); the host then
   * starts the media `startFrame - from` frames in.
   */
  from: number;
  /** The first frame the track is heard. */
  startFrame: number;
  /**
   * The frame (exclusive) at which it stops: the end of an enclosing sequence,
   * of the composition, or of the trimmed media (without `loop`), whichever
   * comes first. Without `trimAfter` the media may end earlier on its own.
   */
  endFrame: number;
  /** Media frames cut from the start. */
  trimBefore: number;
  /** Media frame (exclusive) to end at: the earlier of `trimAfter` and `trimBefore + durationInFrames`; null for the end of the media. */
  trimAfter: number | null;
  /** Media frames per composition frame (> 0). */
  playbackRate: number;
  /** Repeat `trimBefore`..`trimAfter` (or ..the end of the media) until `endFrame`. */
  loop: boolean;
  /** The track is described but must not be heard. */
  muted: boolean;
  /**
   * Gain (≥ 0; above 1 amplifies). A number when constant; for a volume
   * function, one value per frame from `startFrame` to `endFrame - 1`
   * (`volume[f - startFrame]`).
   */
  volume: number | readonly number[];
}

export interface AudioCollector {
  /**
   * Every track registered so far, ordered by `startFrame`, then `id`. Tracks
   * register when their component mounts (a sequence mounts when it starts,
   * or `premountFor` frames earlier) and stay listed after it unmounts, so
   * after the host has rendered every frame this is the whole manifest. The
   * same array is returned until a track is added.
   */
  getTracks(): readonly AudioTrack[];
  /** Calls `listener` whenever a track is added; returns the unsubscribe function. */
  subscribe(listener: () => void): () => void;
}

export interface AudioCollectorInternals {
  /** Called by the FrameProvider that owns the collector; returns the detach function. */
  attach(): () => void;
  /** A component plays `track` (its id is the key); returns the release function. */
  mount(track: AudioTrack): () => void;
}

const internalsOf = new WeakMap<AudioCollector, AudioCollectorInternals>();

/**
 * Collects the audio tracks of one FrameProvider:
 *
 *   const audio = createAudioCollector();
 *   <FrameProvider audio={audio} frame={n} ...>
 *   audio.getTracks(); audio.subscribe(() => ...);
 */
export const createAudioCollector = (): AudioCollector => {
  // id -> the track, how many components play it now, and the most that
  // ever played it at the same time.
  const entries = new Map<string, { track: AudioTrack; mounted: number; most: number }>();
  const listeners = new Set<() => void>();
  let snapshot: readonly AudioTrack[] = [];
  let attached = false;

  const publish = () => {
    const tracks: AudioTrack[] = [];
    for (const { track, most } of entries.values()) {
      for (let i = 0; i < most; i++) tracks.push(i === 0 ? track : { ...track, id: `${track.id}#${i + 1}` });
    }
    tracks.sort((a, b) => a.startFrame - b.startFrame || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    snapshot = Object.freeze(tracks);
    listeners.forEach((listener) => listener());
  };

  const collector: AudioCollector = {
    getTracks: () => snapshot,
    subscribe(listener) {
      if (typeof listener !== 'function') {
        throw new TypeError(`AudioCollector.subscribe: listener must be a function, got ${JSON.stringify(listener)}`);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };

  internalsOf.set(collector, {
    attach() {
      if (attached) {
        throw new Error(
          'An audio collector can serve only one FrameProvider at a time; create one collector per FrameProvider',
        );
      }
      attached = true;
      return () => {
        attached = false;
      };
    },
    mount(track) {
      let entry = entries.get(track.id);
      if (!entry) {
        entry = { track: Object.freeze({ ...track }), mounted: 0, most: 0 };
        entries.set(track.id, entry);
      }
      const current = entry;
      current.mounted += 1;
      if (current.mounted > current.most) {
        current.most = current.mounted;
        publish();
      }
      let released = false;
      return () => {
        if (released) return;
        released = true;
        current.mounted -= 1;
      };
    },
  });
  return collector;
};

export const isAudioCollector = (value: unknown): value is AudioCollector =>
  typeof value === 'object' && value !== null && internalsOf.has(value as AudioCollector);

export const getAudioCollectorInternals = (collector: AudioCollector): AudioCollectorInternals => {
  const internals = internalsOf.get(collector);
  if (!internals) throw new Error('Not an audio collector: create it with createAudioCollector()');
  return internals;
};

/** A 53-bit string hash (cyrb53), as 14 hex digits: ids that do not depend on the render order. */
export const hashString = (text: string): string => {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0');
};
