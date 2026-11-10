/** A volume: a gain ≥ 0, or a function of the track's frame returning one. */
type AudioVolume = number | ((frame: number) => number);

export type { AudioVolume as A };
