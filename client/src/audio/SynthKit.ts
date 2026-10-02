import type {DrumName} from "../types"
import type { DrumKit } from "./DrumKit"

// Soft-clipping curve: makes quiet parts louder and squashes the peaks (adds punch)
function makeClipCurve(drive: number): Float32Array<ArrayBuffer> {
    const size = 1024
    const curve = new Float32Array(size)
    for (let i = 0; i < size; i++) {
        const x = (i * 2) / (size - 1) - 1
        curve[i] = Math.tanh(x * drive)
    }
    return curve
}

export class SynthKit implements DrumKit {
    private ctx: AudioContext
    private kickBus: WaveShaperNode
    private noise: AudioBuffer
    private hihatGain: GainNode | null = null

    constructor(ctx: AudioContext) {
        this.ctx = ctx

        // Everything the kick makes goes through this before the speakers
        this.kickBus = ctx.createWaveShaper()
        this.kickBus.curve = makeClipCurve(2.5)
        this.kickBus.oversample = "2x"
        this.kickBus.connect(ctx.destination)

        // 2 seconds of white noise, reused by snare, hi-hat and crash
        this.noise = this.makeNoise(2)
    }

    async load(): Promise<void> {

    }

    play(drum: DrumName, strength: number): void {
        const t = this.ctx.currentTime
        const volume = Math.min(1, Math.max(0.05, strength))

        switch(drum) {
            case "kick":
                this.kick(t, volume)
                break
            case "snare":
                this.snare(t, volume)
                break
            case "hihat":
                this.hihat(t, volume)
                break
            case "tom":
                this.tom(t, volume)
                break
            case "crash":
                this.crash(t, volume)
                break
        }
    }

    private kick(t: number, volume: number): void {
        // 1) Body: deep sine, fast pitch drop, short tail
        const body = this.ctx.createOscillator()
        const bodyGain = this.ctx.createGain()

        body.type = "sine"
        body.frequency.setValueAtTime(180, t)
        body.frequency.exponentialRampToValueAtTime(48, t + 0.06)

        bodyGain.gain.setValueAtTime(volume, t)
        bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22)

        body.connect(bodyGain)
        bodyGain.connect(this.kickBus)
        body.start(t)
        body.stop(t + 0.22)

        // 2) Click: very short, high blip = the beater hitting the skin
        const click = this.ctx.createOscillator()
        const clickGain = this.ctx.createGain()

        click.type = "triangle"
        click.frequency.setValueAtTime(2500, t)
        click.frequency.exponentialRampToValueAtTime(150, t + 0.02)

        clickGain.gain.setValueAtTime(volume * 0.6, t)
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.025)

        click.connect(clickGain)
        clickGain.connect(this.kickBus)
        click.start(t)
        click.stop(t + 0.025)
    }

    // Snare = a short tone (the drum skin) + a burst of noise (the snare wires)
    private snare(t: number, volume: number): void {
        this.tone(t, 220, 120, 0.12, volume * 0.5, "triangle")
        this.noiseBurst(t, "highpass", 1500, 0.2, volume * 0.7)
    }

    // Hi-hat = very short, very high noise. A new hit cuts off the previous one.
    private hihat(t: number, volume: number): void {
        if (this.hihatGain) {
            this.hihatGain.gain.cancelScheduledValues(t)
            this.hihatGain.gain.setTargetAtTime(0, t, 0.005)
        }
        this.hihatGain = this.noiseBurst(t, "highpass", 7000, 0.08, volume * 0.5)
    }

    // Tom = like the kick but higher and a bit longer
    private tom(t: number, volume: number): void {
        this.tone(t, 200, 90, 0.3, volume * 0.9)
    }

    // Crash = long noise, a bit lower than the hi-hat so it sounds like metal
    private crash(t: number, volume: number): void {
        this.noiseBurst(t, "highpass", 4000, 1.2, volume * 0.5)
    }

    // A buffer full of random values = white noise
    private makeNoise(seconds: number): AudioBuffer {
        const length = this.ctx.sampleRate * seconds
        const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < length; i++) {
            data[i] = Math.random() * 2 - 1
        }
        return buffer
    }

    // An oscillator whose pitch drops while the volume fades out
    private tone(
        t: number,
        startFreq: number,
        endFreq: number,
        duration: number,
        volume: number,
        type: OscillatorType = "sine"
    ): void {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.type = type
        osc.frequency.setValueAtTime(startFreq, t)
        osc.frequency.exponentialRampToValueAtTime(endFreq, t + duration)

        gain.gain.setValueAtTime(volume, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

        osc.connect(gain)
        gain.connect(this.ctx.destination)
        osc.start(t)
        osc.stop(t + duration)
    }

    // Filtered noise that fades out. Returns the gain so a hit can be cut off.
    private noiseBurst(
        t: number,
        filterType: BiquadFilterType,
        frequency: number,
        duration: number,
        volume: number
    ): GainNode {
        const src = this.ctx.createBufferSource()
        const filter = this.ctx.createBiquadFilter()
        const gain = this.ctx.createGain()

        src.buffer = this.noise
        filter.type = filterType
        filter.frequency.value = frequency

        gain.gain.setValueAtTime(volume, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration)

        src.connect(filter)
        filter.connect(gain)
        gain.connect(this.ctx.destination)

        // Start from a random spot in the noise so every hit sounds a bit different
        src.start(t, Math.random() * 0.5)
        src.stop(t + duration)

        return gain
    }
}