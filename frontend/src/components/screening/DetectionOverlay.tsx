import type { CariesDetection } from "../../lib/detectionApi";
import "./DetectionOverlay.css";

type DetectionOverlayProps = {
  imageSrc: string;
  detections: CariesDetection[];
  alt?: string;
};

export function DetectionOverlay({ imageSrc, detections, alt }: DetectionOverlayProps) {
  return (
    <div className="detection-overlay">
      <img src={imageSrc} alt={alt ?? "Analyzed teeth photo"} />
      {detections.map((box, index) => (
        <div
          key={`${box.label}-${index}`}
          className={`detection-box detection-box-${box.label}`}
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.width * 100}%`,
            height: `${box.height * 100}%`,
          }}
        />
      ))}
    </div>
  );
}