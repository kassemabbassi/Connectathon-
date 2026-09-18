import { useRef } from "react";
import type { ChangeEvent } from "react";
import { Camera, RotateCcw, Upload, X } from "lucide-react";
import "./CaptureSlot.css";
import { useLanguage } from "../../context/LanguageContext";

type CaptureSlotProps = {
  label: string;
  hint: string;
  required?: boolean;
  image: string | null;
  onOpenCamera: () => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
};

export function CaptureSlot({
  label,
  hint,
  required,
  image,
  onOpenCamera,
  onUpload,
  onRemove,
}: CaptureSlotProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onUpload(file);
    event.target.value = "";
  }

  return (
    <div className={`capture-slot ${image ? "capture-slot-filled" : ""}`}>
      <div className="capture-slot-head">
        <p className="capture-slot-label">{label}</p>
        {required ? (
          <span className="capture-slot-required">{t("Required")}</span>
        ) : (
          <span className="capture-slot-optional">{t("Optional")}</span>
        )}
      </div>

      {image ? (
        <div className="capture-slot-preview">
          <img src={image} alt={`${label} capture`} />
          <button
            type="button"
            className="capture-slot-remove"
            onClick={onRemove}
            aria-label={`Remove ${label} photo`}
          >
            <X size={14} />
          </button>
          <button type="button" className="capture-slot-retake" onClick={onOpenCamera}>
            <RotateCcw size={14} /> {t("Retake")}
          </button>
        </div>
      ) : (
        <div className="capture-slot-empty">
          <p className="capture-slot-hint">{hint}</p>
          <div className="capture-slot-actions">
            <button type="button" className="capture-slot-btn" onClick={onOpenCamera}>
              <Camera size={16} /> {t("Capture")}
            </button>
            <button
              type="button"
              className="capture-slot-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} /> {t("Upload")}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="capture-slot-file-input"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}
