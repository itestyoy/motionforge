/** A volume: a gain ≥ 0, or a function of the track's frame returning one. */
type AudioVolume = number | ((frame: number) => number);
/**
 * True while collectAudioTracks() renders the scene: no effect runs, nothing
 * is loaded and no audio is rendered; only the audio tracks are collected.
 * Components that need the DOM while rendering (measuring text, a canvas)
 * can render nothing then (ThreeCanvas does).
 */
declare const useIsCollectingAudio: () => boolean;

export { type AudioVolume as A, useIsCollectingAudio as u };
