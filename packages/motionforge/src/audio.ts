/**
 * motionforge/audio: generated sounds as audio tracks (see
 * createAudioCollector in 'motionforge'). ToneAudio needs the optional peer
 * dependency `tone`; Sfx and renderZzfx need nothing (ZzFX is vendored).
 */
export { ToneAudio } from './components/audio/ToneAudio';
export type { ToneAudioProps, ToneRenderContext, Tone } from './components/audio/ToneAudio';
export { Sfx, renderZzfx } from './components/audio/Sfx';
export type { SfxProps, ZzfxParams } from './components/audio/Sfx';
export { usePrepareAudio } from './components/audio/prepare';
export type { PreparedSound } from './components/audio/prepare';
