import { useEffect, useRef, useState } from "react";

export default function CameraStage() {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let stream: MediaStream | null = null
        let frame = 0
        let cancelled = false

        const video = document.createElement("video")
        video.playsInline = true
        video.muted = true

        function draw() {
            const canvas = canvasRef.current
            const c = canvas?.getContext("2d")
            if (!canvas || !c) return

            // Match Canvas size
            if (video.videoWidth && canvas.width !== video.videoWidth) {
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
            }

            // Horizontal flip
            c.save()
            c.translate(canvas.width, 0)
            c.scale(-1, 1)
            c.drawImage(video, 0, 0, canvas.width, canvas.height)
            c.restore()

            frame = requestAnimationFrame(draw)
        }

        async function init() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: "user" },
                    audio: false,
                })

                if(cancelled) {
                    stream.getTracks().forEach((track) => track.stop())
                    return
                }

                video.srcObject = stream
                await video.play()
                draw()
            } catch(err) {
                if(cancelled) return
                        console.error(err)
                        setError("Could not open the camera. Check the browser permission.")
            } 
        }
        init()

        return () => {
            cancelled = true
            cancelAnimationFrame(frame)
            stream?.getTracks().forEach((track) => track.stop())
            video.srcObject = null
        }
    }, [])

    if (error) {
        return <p className="text-red-500">{error}</p>
    }

    return(
        <canvas
        ref={canvasRef}
        className="w-full max-w-3xl rounded-xl border-2 border-neutral-600"/>
    )
}