import { useState } from "react";
import type { CariesDetection } from "../../lib/detectionApi";
import "./DetectionOverlay.css";

type DetectionOverlayProps = {
  imageSrc: string;
  detections: CariesDetection[];
  alt?: string;
};

export function DetectionOverlay({ imageSrc, detections, alt }: DetectionOverlayProps) {
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);

  return (
    <div className="detection-overlay">
      <div
        className="detection-canvas"
        style={imageSize ? { aspectRatio: `${imageSize.width} / ${imageSize.height}` } : undefined}
      >
        <img
          src={imageSrc}
          alt={alt ?? "Analyzed teeth photo"}
          onLoad={(event) => {
            const { naturalWidth, naturalHeight } = event.currentTarget;
            setImageSize({ width: naturalWidth, height: naturalHeight });
          }}
        />
        {detections.map((box, index) => (
          <div
            key={`${box.label}-${index}`}
            className={`detection-box-wrap ${box.x + box.width > 0.78 ? "detection-box-wrap-left" : ""}`}
            style={{
              left: `${box.x * 100}%`,
              top: `${box.y * 100}%`,
              width: `${box.width * 100}%`,
              height: `${box.height * 100}%`,
            }}
          >
            <div className={`detection-box detection-box-${box.label} detection-box-color-${index % 6}`} />
            <span className={`detection-confidence detection-box-color-${index % 6}`}>
              {Math.round(box.confidence * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}