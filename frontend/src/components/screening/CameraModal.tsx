import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Camera, SwitchCamera, X } from "lucide-react";
import "./CameraModal.css";

type FacingMode = "environment" | "user";

type CameraModalProps = {
  title: string;
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
};

export function CameraModal({ title, onCapture, onClose }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function stopStream() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    async function startCamera() {
      setError(null);
      setReady(false);
      stopStream();

      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser doesn't support camera capture. Use upload instead.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setReady(true);
      } catch {
        if (!cancelled) {
          setError("Camera access was blocked or unavailable. Allow camera access or use upload instead.");
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facingMode]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleCapture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !ready) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL("image/jpeg", 0.92));
  }

  return (
    <div className="camera-modal-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <div className="camera-modal">
        <div className="camera-modal-head">
          <p className="camera-modal-title">{title}</p>
          <button type="button" className="camera-modal-close" onClick={onClose} aria-label="Close camera">
            <X size={18} />
          </button>
        </div>

        <div className="camera-viewport">
          {error ? (
            <div className="camera-error">
              <AlertTriangle size={26} />
              <p>{error}</p>
            </div>
          ) : (
            <video ref={videoRef} className="camera-video" playsInline muted />
          )}
          {!error && <span className="camera-guide" aria-hidden="true" />}
        </div>

        <canvas ref={canvasRef} className="camera-canvas-hidden" />

        <div className="camera-modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setFacingMode((mode) => (mode === "environment" ? "user" : "environment"))}
            disabled={!!error}
          >
            <SwitchCamera size={16} /> Switch camera
          </button>
          <button
            type="button"
            className="btn btn-primary camera-shutter"
            onClick={handleCapture}
            disabled={!ready}
          >
            <Camera size={16} /> Capture
          </button>
        </div>
      </div>
    </div>
  );
}