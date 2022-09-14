import * as Tonal from "@tonaljs/tonal"

export const TEMPOS = ['64m', '32m', '16m', '12m', '8m', '6m', '5m', '4m', '3m', '2m', '1m', '2n', '3n', '4n', '6n', '8n', '12n', '16n', '24n', '32n', '64n', '128n']
export const ARPS = ['up', 'down', 'shuffle', 'repeat']
export const OSCILLATORS = ['[]', 'fm', 'am', 'fat']
export const WAVES = ['sine', 'square', 'sawtooth', 'triangle']
export const CHORDS = Tonal.ChordType.names()
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
