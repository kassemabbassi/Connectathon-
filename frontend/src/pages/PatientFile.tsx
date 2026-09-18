import { useState } from "react";
import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Save,
    ShieldCheck,
} from "lucide-react";
import { DetectionOverlay } from "../components/screening/DetectionOverlay";
import { PriorityBadge } from "../components/patient/PriorityBadge";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";
import type { CariesDetection } from "../lib/detectionApi";
import { ScreeningApiError, saveScreening } from "../lib/screeningApi";
import "./NewScreening.css";
import "./PatientFile.css";

type PatientForm = { code: string };

type ScreeningPhoto = {
    angle: string;
    label: string;
    image: string;
    resultImage?: string;
    detections?: CariesDetection[];
};

type PatientFileProps = {
    patient: PatientForm;
    photos: ScreeningPhoto[];
    detections: CariesDetection[] | null;
    detectionSource: "live" | "demo" | null;
    onBack: () => void;
    onStartAnother: () => void;
};

export function PatientFile({
    patient,
    photos,
    detections,
    detectionSource,
    onBack,
    onStartAnother,
}: PatientFileProps) {
    const { t } = useLanguage();
    void detections;
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState(false);
    const [savePending, setSavePending] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const createdAt = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date());

    const isLive = detectionSource === "live" || photos.some((photo) => photo.detections !== undefined);
    const findings = isLive ? photos.flatMap((photo) => photo.detections ?? []) : [];

    const priority: "clear" | "watch" | "urgent" = !isLive
        ? "watch"
        : findings.length === 0
            ? "clear"
            : findings.some((f) => f.confidence >= 0.5)
                ? "urgent"
                : "watch";

    const resultTitle = !isLive
        ? "Needs dentist review"
        : priority === "clear"
            ? "No visible decay detected"
            : priority === "urgent"
                ? "Needs dentist review"
                : "Possible early signs — monitor";

    async function handleSave() {
        setSaveError(null);
        setSavePending(true);
        try {
            await saveScreening({
                patient,
                photos,
                notes,
                result: resultTitle,
                flaggedAreas: findings.length,
                guardianConsentConfirmed: true,
            });
            setSaved(true);
        } catch (error) {
            if (error instanceof ScreeningApiError) {
                setSaveError(error.message);
            } else {
                setSaveError("Unable to save this file. Check that the backend and Supabase storage are running.");
            }
        } finally {
            setSavePending(false);
        }
    }

    return (
        <div className="patient-file-page">
            <header className="screening-header">
                <div className="screening-header-inner patient-file-header">
                    <button type="button" className="screening-back patient-file-back" onClick={onBack}>
                        <ArrowLeft size={16} /> Back to screening
                    </button>
                    <span className="patient-file-status">
                        <CheckCircle2 size={15} /> Analysis complete
                    </span>
                    <LanguageSwitcher />
                </div>
            </header>

            <main className="patient-file-main">
                <div className="patient-file-heading">
                    <div className="patient-file-title-group">
                        <p className="screening-eyebrow">Patient file</p>
                        <h1>{patient.code}</h1>
                        <p className="patient-file-sub">Screening record created {createdAt}</p>
                    </div>
                    <div className="patient-file-actions">
                        <button type="button" className={`btn ${saved ? "btn-saved" : "btn-primary"}`} onClick={() => void handleSave()} disabled={savePending || saved}>
                            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            {saved ? t("File saved") : savePending ? t("Saving…") : t("Save patient file")}
                        </button>
                        <button type="button" className="btn btn-ghost-navy" onClick={onStartAnother}>
                            New screening
                        </button>
                    </div>
                </div>
                {saveError && <p className="patient-file-error">{saveError}</p>}

                <section className="patient-file-summary" aria-label="Patient details">
                    <div className="patient-summary-item">
                        <ShieldCheck size={18} />
                        <span><b>Patient code</b>{patient.code}</span>
                    </div>
                </section>

                <div className="patient-file-grid">
                    <section className="patient-file-card patient-file-results">
                        <div className="patient-file-card-head">
                            <div>
                                <p className="patient-file-kicker">
                                    {isLive ? "AI screening result" : "AI screening result (demo)"}
                                </p>
                                <h2>{resultTitle}</h2>
                            </div>
                            <PriorityBadge priority={priority} />
                        </div>

                        <div className="screening-results-list">
                            {photos.map((photo) => {
                                const photoFindings = photo.detections ?? [];
                                const photoIsLive = photo.detections !== undefined;

                                return (
                                    <article className="screening-result-item" key={photo.angle}>
                                        <div className="screening-result-item-head">
                                            <div>
                                                <p className="patient-file-kicker">Analyzed image</p>
                                                <h3>{photo.label}</h3>
                                            </div>
                                            <span className="screening-result-state">
                                                {photoIsLive ? "AI complete" : "Review image"}
                                            </span>
                                        </div>
                                        <div className="result-photo">
                                            {photoIsLive ? (
                                                <DetectionOverlay
                                                    imageSrc={photo.image}
                                                    detections={photoFindings}
                                                    alt={`${photo.label} AI result`}
                                                />
                                            ) : (
                                                <img src={photo.resultImage ?? photo.image} alt={`${photo.label} AI result`} />
                                            )}
                                            <span>
                                                <ImageIcon size={14} />
                                                {photoIsLive ? "Live model result" : "Image requires review"}
                                            </span>
                                        </div>
                                        <div className="finding-list">
                                            {photoIsLive && photoFindings.length > 0 ? (
                                                photoFindings.map((finding, index) => (
                                                    <div className="finding-row" key={`${photo.angle}-${index}`}>
                                                        <span>{finding.label === "caries" ? "Caries" : "Cavity"}</span>
                                                        <strong>{Math.round(finding.confidence * 100)}% confidence</strong>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="finding-row">
                                                    <span>Model result</span>
                                                    <strong>{photoIsLive ? "No decay detected" : "Analysis unavailable"}</strong>
                                                </div>
                                            )}
                                        </div>
                                    </article>
                                );
                            })}
                        </div>

                        <div className="result-notice">
                            <CheckCircle2 size={20} />
                            <p>Visible areas of concern were flagged for a licensed dentist. This is not a diagnosis.</p>
                        </div>

                        <div className="finding-list finding-next-step">
                            <div className="finding-row"><span>Next step</span><strong>Clinical validation</strong></div>
                        </div>
                    </section>

                    <section className="patient-file-card notes-card">
                        <div className="patient-file-card-head">
                            <div>
                                <p className="patient-file-kicker">Clinical follow-up</p>
                                <h2>Doctor notes</h2>
                            </div>
                            <FileText size={20} className="notes-icon" />
                        </div>
                        <textarea
                            value={notes}
                            onChange={(event) => setNotes(event.target.value)}
                            placeholder="Add observations, recommendations, or follow-up details..."
                            aria-label="Doctor notes"
                        />
                        <p className="notes-hint">Staff observations are stored with the file. The partner dentist can add clinical notes from the dashboard.</p>
                    </section>
                </div>

                <section className="patient-file-card evidence-card">
                    <div className="patient-file-card-head">
                        <div>
                            <p className="patient-file-kicker">Evidence</p>
                            <h2>Captured photos <span>{photos.length}</span></h2>
                        </div>
                        <ImageIcon size={20} className="notes-icon" />
                    </div>
                    <div className="evidence-grid">
                        {photos.map((photo) => (
                            <figure className="evidence-photo" key={photo.angle}>
                                <div className="evidence-image-wrap">
                                    {photo.detections !== undefined ? (
                                        <DetectionOverlay imageSrc={photo.image} detections={photo.detections} alt={photo.label} />
                                    ) : (
                                        <img src={photo.image} alt={photo.label} />
                                    )}
                                </div>
                                <figcaption><strong>{photo.label}</strong><span>{photo.detections !== undefined ? "Live model result" : photo.resultImage ? "Input + AI result" : photo.angle === "front" ? "Primary view" : "Additional view"}</span></figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
