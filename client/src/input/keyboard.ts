import type { DrumName } from "../types";

// Key Mapping
const KEY_MAP: Record<string, DrumName> = {
    KeyD: "hihat",
    KeyF: "snare",
    KeyJ: "tom",
    KeyK: "crash",
    Space: "kick"
}

export const KEY_LABELS: Record<DrumName, string> = {
    hihat: "D",
    snare: "F",
    tom: "J",
    crash: "K",
    kick: "Space"
}

export function listenKeyboard(onHit: (drum: DrumName, strength: number) => void ) {
    const handler = (e: KeyboardEvent) => {
        if (e.repeat){
            return
        }

        const drum = KEY_MAP[e.code]
        if(!drum){
            return
        }

        e.preventDefault()
        onHit(drum, 0.8)
    }

    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
} 