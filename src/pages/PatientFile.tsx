import { useState } from "react";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Save,
    ShieldCheck,
    User,
} from "lucide-react";
import type { PatientForm, ScreeningPhoto } from "./screeningTypes";
import "./NewScreening.css";
import "./PatientFile.css";

type PatientFileProps = {
    patient: PatientForm;
    photos: ScreeningPhoto[];
    onBack: () => void;
    onStartAnother: () => void;
};

export function PatientFile({ patient, photos, onBack, onStartAnother }: PatientFileProps) {
    const [notes, setNotes] = useState("");
    const [saved, setSaved] = useState(false);
    const createdAt = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date());

    function handleSave() {
        const record = {
            patient,
            photos,
            notes,
            result: "Needs dentist review",
            flaggedAreas: 2,
            savedAt: new Date().toISOString(),
        };
        window.localStorage.setItem(`dentalscreen-record-${patient.identity}`, JSON.stringify(record));
        setSaved(true);
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
                </div>
            </header>

            <main className="patient-file-main">
                <div className="patient-file-heading">
                    <div className="patient-file-title-group">
                        <p className="screening-eyebrow">Patient file</p>
                        <h1>{patient.fullName}</h1>
                        <p className="patient-file-sub">Screening record created {createdAt}</p>
                    </div>
                    <div className="patient-file-actions">
                        <button type="button" className={`btn ${saved ? "btn-saved" : "btn-primary"}`} onClick={handleSave}>
                            {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            {saved ? "File saved" : "Save patient file"}
                        </button>
                        <button type="button" className="btn btn-ghost-navy" onClick={onStartAnother}>
                            New screening
                        </button>
                    </div>
                </div>

                <section className="patient-file-summary" aria-label="Patient details">
                    <div className="patient-summary-item">
                        <User size={18} />
                        <span><b>Patient</b>{patient.fullName}</span>
                    </div>
                    <div className="patient-summary-item">
                        <CalendarDays size={18} />
                        <span><b>Age</b>{patient.age} years</span>
                    </div>
                    <div className="patient-summary-item">
                        <ShieldCheck size={18} />
                        <span><b>Identity / ID</b>{patient.identity}</span>
                    </div>
                </section>

                <div className="patient-file-grid">
                    <section className="patient-file-card patient-file-results">
                        <div className="patient-file-card-head">
                            <div>
                                <p className="patient-file-kicker">AI screening result</p>
                                <h2>Needs dentist review</h2>
                            </div>
                            <span className="review-badge">Priority review</span>
                        </div>
                        {photos[0] && (
                            <div className="result-photo">
                                <img src={photos[0].resultImage ?? photos[0].image} alt={`${photos[0].label} AI result`} />
                                <span><ImageIcon size={14} /> {photos[0].resultImage ? "AI result image" : "Primary image analyzed"}</span>
                            </div>
                        )}
                        <div className="result-notice">
                            <CheckCircle2 size={20} />
                            <p>Visible areas of concern were flagged for a licensed dentist. This is not a diagnosis.</p>
                        </div>
                        <div className="finding-list">
                            <div className="finding-row"><span>Flagged areas</span><strong>2 possible caries</strong></div>
                           
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
                        <p className="notes-hint">Notes are saved in this prototype while the page is open.</p>
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
                                <div className="evidence-image-wrap"><img src={photo.image} alt={photo.label} /></div>
                                <figcaption><strong>{photo.label}</strong><span>{photo.resultImage ? "Input + AI result" : photo.angle === "front" ? "Primary view" : "Additional view"}</span></figcaption>
                            </figure>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}
