export const DRUMS = ["hihat", "snare", "tom", "crash", "kick"] as const

export type DrumName = (typeof DRUMS[number])