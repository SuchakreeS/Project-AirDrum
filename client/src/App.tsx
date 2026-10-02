import { useRef, useState } from "react";
import type { DrumKit } from "./audio/DrumKit";
import { SynthKit } from "./audio/SynthKit";

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

  if(!started) {
    return <button onClick={start}>Start</button>
  }

  return(
    <button onPointerDown={() => kitRef.current?.play("kick", 0.8)}>
      Kick
    </button>
  )
}