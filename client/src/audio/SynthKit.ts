import type {DrumName} from "../types"
import type { DrumKit } from "./DrumKit"

export class SynthKit implements DrumKit{
    private ctx: AudioContext

    constructor(ctx: AudioContext) {
        this.ctx = ctx
    }
    async load(): Promise<void> {

    }
    play(drum: DrumName, strength:number): void {
        const t = this.ctx.currentTime
        const volume = Math.min(1, Math.max(0.05, strength))

        switch(drum) {
            case "kick":
                this.kick(t, volume)
                break
            default:
                // For the custom drum kit in future
                break
        }
    }
    private kick(t: number, volume:number) :void{
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        // Pitch drop
        osc.type = "sine"
        osc.frequency.setValueAtTime(150, t)
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.35)

        // Volume Fade out
        gain.gain.setValueAtTime(volume, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)

        osc.connect(gain)
        gain.connect(this.ctx.destination)

        osc.start(t)
        osc.stop(t + 0.35)
    }
}