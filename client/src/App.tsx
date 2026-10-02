import { useCallback, useEffect, useRef, useState } from "react";
import type { DrumKit } from "./audio/DrumKit";
import { SynthKit } from "./audio/SynthKit";
import CameraStage from "./components/CameraStage";
import { KEY_LABELS, listenKeyboard } from "./input/keyboard";
import { DRUMS } from "./types";
import type { DrumName } from "./types";

export default function App() {
  const [started, setStarted] = useState(false)
  const [useCamera, setUseCamera] = useState(false)
  const [active, setActive] = useState<Set<DrumName>>(new Set())
  const kitRef = useRef<DrumKit | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const timers = useRef<Partial<Record<DrumName, number>>>({})

  async function start(withCamera: boolean) {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    await ctx.resume();

    const kit = new SynthKit(ctx);
    await kit.load();

    ctxRef.current = ctx;
    kitRef.current = kit;
    setUseCamera(withCamera);
    setStarted(true);
  }

  function back() {
    // Shut down the audio so we don't leave contexts running
    void ctxRef.current?.close()
    ctxRef.current = null
    kitRef.current = null

    setActive(new Set())
    setStarted(false)
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
    const buttonClass =
      "cursor-pointer rounded-lg border-2 border-amber-400 px-10 py-3 text-xl text-amber-400 hover:bg-amber-400 hover:text-neutral-900"

    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-neutral-900 text-neutral-100">
        <h1 className="text-5xl font-bold">Air Drums</h1>
        <div className="flex gap-4">
          <button className={buttonClass} onClick={() => start(false)}>
            Keyboard
          </button>
          <button className={buttonClass} onClick={() => start(true)}>
            Camera
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-900 p-4 text-neutral-100">
      <button
        className="absolute top-4 left-4 cursor-pointer rounded-lg border-2 border-neutral-600 px-4 py-2 hover:border-amber-400 hover:text-amber-400"
        onClick={back}
      >
        ← Back
      </button>
      {useCamera && <CameraStage />}

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