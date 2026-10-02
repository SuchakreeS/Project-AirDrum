import { useEffect, useRef, useState } from "react";
import type { DrumKit } from "./audio/DrumKit";
import { SynthKit } from "./audio/SynthKit";
import { KEY_LABELS, listenKeyboard } from "./input/keyboard";
import { DRUMS } from "./types";

export default function App() {
  const [started, setStarted] = useState(false)
  const kitRef = useRef<DrumKit | null>(null)

  async function start() {
    const ctx = new AudioContext({ latencyHint: "interactive" });
    await ctx.resume();

    const kit = new SynthKit(ctx);
    await kit.load();

    kitRef.current = kit;
    setStarted(true);
  }

  // Once the game has started, drums can be played from the keyboard
  useEffect(() => {
    if (!started) return
    return listenKeyboard((drum, strength) => {
      kitRef.current?.play(drum, strength)
    })
  }, [started])

  if(!started) {
    return <button onClick={start}>Start</button>
  }

  return(
    <div>
      {DRUMS.map((drum) => (
        <button key={drum} onPointerDown={() => kitRef.current?.play(drum, 0.8)}>
          {drum} ({KEY_LABELS[drum]})
        </button>
      ))}
    </div>
  )
}