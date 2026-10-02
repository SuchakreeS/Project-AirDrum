import type {DrumName} from "../types"

export interface DrumKit {
    load(): Promise<void>
    play(drum: DrumName, strength: number): void
}