import { useCallback, useEffect, useRef, useState } from "react";
import type { DrumKit } from "./audio/DrumKit";
import { SynthKit } from "./audio/SynthKit";
import { KEY_LABELS, listenKeyboard } from "./input/keyboard";
import { DRUMS } from "./types";
import type { DrumName } from "./types";

export default function App() {
  const [started, setStarted] = useState(false)
  const [active, setActive] = useState<Set<DrumName>>(new Set())
  const kitRef = useRef<DrumKit | null>(null)
  const timers = useRef<Partial<Record<DrumName, number>>>({})

  async function start() {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    await ctx.resume();

    const kit = new SynthKit(ctx);
    await kit.load();

    kitRef.current = kit;
    setStarted(true);
  }

  // One place for every hit: play the sound, then flash the pad
  const hit = useCallback((drum: DrumName, strength: number) => {
    kitRef.current?.play(drum, strength)

    setActive((prev) => new Set(prev).add(drum))

    window.clearTimeout(timers.current[drum])
    timers.current[drum] = window.setTimeout(() => {
      setActive((prev) => {
        const next = new Set(prev)
        next.delete(drum)
        return next
      })
    }, 100)
  }, [])

  useEffect(() => {
    if (!started) return
    return listenKeyboard(hit)
  }, [started, hit])

  if (!started) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-900 text-neutral-100">
        <h1 className="text-5xl font-bold">Air Drums</h1>
        <button
          className="cursor-pointer rounded-lg border-2 border-amber-400 px-10 py-3 text-xl text-amber-400 hover:bg-amber-400 hover:text-neutral-900"
          onClick={start}
        >
          Start
        </button>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-900 text-neutral-100">
      <div className="flex gap-4">
        {DRUMS.map((drum) => (
          <button
            key={drum}
            className={
              "flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 transition-transform duration-75 " +
              (active.has(drum)
                ? "scale-95 border-amber-400 bg-amber-400 text-neutral-900"
                : "border-neutral-600")
            }
            onPointerDown={() => hit(drum, 0.8)}
          >
            <span className="text-lg capitalize">{drum}</span>
            <span className="text-xs opacity-70">{KEY_LABELS[drum]}</span>
          </button>
        ))}
      </div>
    </main>
  )
}