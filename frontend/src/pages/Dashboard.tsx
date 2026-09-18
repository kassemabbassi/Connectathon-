import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Activity,
    ArrowRight, ClipboardList,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Save,
    Search,
    ShieldCheck,
    Trash2,
    User,
    X,
} from "lucide-react";
import logo from "../assets/logo.png";
import { UserMenu } from "../components/auth/UserMenu";
import { DetectionOverlay } from "../components/screening/DetectionOverlay";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
    listScreenings,
    deleteScreening,
    updateScreeningNotes,
    updateScreeningValidation,
} from "../lib/screeningApi";
import type { SavedScreening } from "./screeningTypes";
import "./Dashboard.css";

function formatDate(value: string, language: "en" | "ar") {
    return new Intl.DateTimeFormat(language === "ar" ? "ar-TN" : "en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export function Dashboard() {
    const { token, user } = useAuth();
    const { language, t } = useLanguage();
    const [records, setRecords] = useState<SavedScreening[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draftNotes, setDraftNotes] = useState("");
    const [notesSaved, setNotesSaved] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [validatedImages, setValidatedImages] = useState<Record<string, boolean>>({});
    const [deletePending, setDeletePending] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            if (!token) {
                setIsLoading(false);
                return;
            }
            try {
                const items = await listScreenings(token);
                if (!cancelled) {
                    setRecords(items);
                    setLoadError(null);
                }
            } catch {
                if (!cancelled) {
                    setLoadError("Unable to load screening files for this institution.");
                }
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        }

        void load();
        return () => {
            cancelled = true;
        };
    }, [token]);

    const filteredRecords = records.filter((record) => {
        const searchable = record.patient.code.toLowerCase();
        return searchable.includes(query.toLowerCase().trim());
    });
    const selectedRecord = records.find((record) => record.id === selectedId) ?? filteredRecords[0];
    const reviewedCount = records.filter((record) => record.result === "Needs dentist review").length;

    useEffect(() => {
        setDraftNotes(selectedRecord?.notes ?? "");
        setNotesSaved(false);
        setSelectedPhotoIndex(null);
        setValidatedImages(Object.fromEntries((selectedRecord?.validatedAngles ?? []).map((angle) => [`${selectedRecord?.id}-${angle}`, true])));
    }, [selectedRecord?.id]);

    useEffect(() => {
        function closeOnEscape(event: KeyboardEvent) {
            if (event.key === "Escape") setSelectedPhotoIndex(null);
        }
        window.addEventListener("keydown", closeOnEscape);
        return () => window.removeEventListener("keydown", closeOnEscape);
    }, []);

    async function saveNotes() {
        if (!selectedRecord || !token) return;
        const updatedRecord = await updateScreeningNotes(token, selectedRecord.id, draftNotes);
        setRecords((current) => current.map((record) => record.id === selectedRecord.id ? updatedRecord : record));
        setNotesSaved(true);
    }

    async function toggleValidation(photoAngle: string) {
        if (!selectedRecord || !token) return;
        const imageKey = `${selectedRecord.id}-${photoAngle}`;
        const isValidated = validatedImages[imageKey] ?? false;
        const validatedAngles = new Set(selectedRecord.validatedAngles ?? []);
        if (isValidated) validatedAngles.delete(photoAngle);
        else validatedAngles.add(photoAngle);
        const updatedRecord = await updateScreeningValidation(token, selectedRecord.id, [...validatedAngles]);
        setRecords((current) => current.map((record) => record.id === selectedRecord.id ? updatedRecord : record));
        setValidatedImages((current) => ({ ...current, [imageKey]: !isValidated }));
    }

    async function handleDelete() {
        if (!selectedRecord || !token || user?.role !== "dentist") return;
        const confirmed = window.confirm(t("Delete this patient file? This permanently removes the file and its images."));
        if (!confirmed) return;

        setDeleteError(null);
        setDeletePending(true);
        try {
            await deleteScreening(token, selectedRecord.id);
            setRecords((current) => current.filter((record) => record.id !== selectedRecord.id));
            setSelectedId(null);
        } catch (error) {
            setDeleteError(error instanceof Error ? error.message : t("Unable to delete this patient file."));
        } finally {
            setDeletePending(false);
        }
    }

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <Link to="/" className="dashboard-brand">
                        <img src={logo} alt="SpotEarly logo" />
                        <span>SpotEarly</span>
                    </Link>
                    <UserMenu />
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-heading">
                    <div>
                        <p className="screening-eyebrow">Clinical workspace</p>
                        <h1>Screening dashboard</h1>
                        <p>Review patient files created by staff of your institution, then add clinical notes.</p>
                    </div>
                    <span className="dashboard-live"><Activity size={15} /> Live records</span>
                </div>

                <section className="dashboard-stats" aria-label="Screening overview">
                    <div><span className="dashboard-stat-icon blue"><ClipboardList size={18} /></span><span><b>{records.length}</b><small>Total files</small></span></div>
                    <div><span className="dashboard-stat-icon amber"><ShieldCheck size={18} /></span><span><b>{reviewedCount}</b><small>Need review</small></span></div>
                    <div><span className="dashboard-stat-icon green"><FileText size={18} /></span><span><b>{records.filter((record) => record.notes.trim()).length}</b><small>With doctor notes</small></span></div>
                </section>

                <div className="dashboard-layout">
                    <section className="dashboard-list-panel">
                        <div className="dashboard-panel-head">
                            <div><p className="dashboard-kicker">Saved records</p><h2>Patient files</h2></div>
                            <label className="dashboard-search"><Search size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search patients" /></label>
                        </div>
                        {filteredRecords.length === 0 ? (
                            <div className="dashboard-empty"><ClipboardList size={28} /><h3>{records.length ? "No matching files" : isLoading ? "Loading files…" : "No saved files yet"}</h3><p>{loadError ?? (records.length ? "Try another patient name or ID." : "Files saved by school staff of your institution will appear here.")}</p></div>
                        ) : (
                            <div className="record-list">
                                {filteredRecords.map((record) => (
                                    <button type="button" key={record.id} className={`record-row ${selectedRecord?.id === record.id ? "is-selected" : ""}`} onClick={() => setSelectedId(record.id)}>
                                        <span className="record-avatar"><User size={17} /></span>
                                        <span className="record-main"><strong>{record.patient.code}</strong><small>Anonymous patient record</small></span>
                                        <span className="record-meta"><b>{record.photos.length} photos</b><small>{record.notes.trim() ? "Notes added" : "No notes"}</small></span>
                                        <ArrowRight size={16} className="record-arrow" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {selectedRecord ? (
                        <section className="dashboard-detail-panel">
                            <div className="dashboard-detail-head"><div><p className="dashboard-kicker">Patient file</p><h2>{selectedRecord.patient.code}</h2><span>Saved {formatDate(selectedRecord.savedAt, language)}</span></div><div className="dashboard-detail-actions"><span className="dashboard-review-badge">{selectedRecord.result}</span>{user?.role === "dentist" && <button type="button" className="dashboard-delete-button" onClick={() => void handleDelete()} disabled={deletePending}><Trash2 size={15} />{deletePending ? t("Deleting…") : t("Delete file")}</button>}</div></div>
                            {deleteError && <p className="dashboard-delete-error">{deleteError}</p>}
                            <div className="dashboard-detail-fields"><div><small>Privacy</small><strong>Anonymous record</strong></div><div><small>Patient code</small><strong>{selectedRecord.patient.code}</strong></div></div>
                            <div className="dashboard-detail-section">
                                <div className="dashboard-section-title"><ImageIcon size={16} /><h3>Images</h3><span>{selectedRecord.photos.length} · Click to inspect</span></div>
                                <div className="dashboard-image-grid">
                                    {selectedRecord.photos.map((photo, index) => (
                                        <button
                                            type="button"
                                            key={photo.angle}
                                            className="dashboard-image-item"
                                            onClick={() => setSelectedPhotoIndex(index)}
                                            aria-label={`Inspect ${photo.label} image`}
                                        >
                                            {photo.detections !== undefined ? (
                                                <DetectionOverlay imageSrc={photo.image} detections={photo.detections} alt={photo.label} />
                                            ) : (
                                                <img src={photo.resultImage ?? photo.image} alt={photo.label} />
                                            )}
                                            <span>{photo.detections !== undefined ? "Live model result" : photo.resultImage ? "AI result" : photo.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="dashboard-detail-section dashboard-notes-section">
                                <div className="dashboard-section-title"><FileText size={16} /><h3>Doctor notes</h3><span>{draftNotes.trim() ? "Clinical note" : "Pending"}</span></div>
                                <textarea className="dashboard-notes-editor" value={draftNotes} onChange={(event) => { setDraftNotes(event.target.value); setNotesSaved(false); }} placeholder="Add observations, recommendations, or follow-up details..." aria-label={`Doctor notes for ${selectedRecord.patient.code}`} />
                                <div className="dashboard-notes-footer"><span>{draftNotes.length} characters</span><button type="button" className={`dashboard-notes-save ${notesSaved ? "is-saved" : ""}`} onClick={() => void saveNotes()}>{notesSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}{notesSaved ? "Notes saved" : "Save notes"}</button></div>
                            </div>
                        </section>
                    ) : <section className="dashboard-detail-panel dashboard-detail-empty"><ClipboardList size={30} /><h2>Select a patient file</h2><p>Choose a saved record to review its full details.</p></section>}
                </div>
            </main>
            {selectedRecord && selectedPhotoIndex !== null && selectedRecord.photos[selectedPhotoIndex] && (() => {
                const photo = selectedRecord.photos[selectedPhotoIndex];
                const imageKey = `${selectedRecord.id}-${photo.angle}`;
                const isValidated = validatedImages[imageKey] ?? false;
                return (
                    <div className="image-review-backdrop" role="dialog" aria-modal="true" aria-label={`Review ${photo.label}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPhotoIndex(null); }}>
                        <div className="image-review-modal">
                            <div className="image-review-header"><div><p className="dashboard-kicker">Image review</p><h2>{photo.label}</h2><span>{selectedRecord.patient.code}</span></div><button type="button" className="image-review-close" onClick={() => setSelectedPhotoIndex(null)} aria-label="Close image review"><X size={19} /></button></div>
                            <div className="image-review-body">
                                <div className="image-review-visual">
                                    {photo.detections !== undefined ? (
                                        <DetectionOverlay imageSrc={photo.image} detections={photo.detections} alt={`${photo.label} enlarged`} />
                                    ) : (
                                        <img src={photo.resultImage ?? photo.image} alt={`${photo.label} enlarged`} />
                                    )}
                                    <span>{photo.detections !== undefined ? "Live model result" : photo.resultImage ? "AI result image" : "Captured image"}</span>
                                </div>
                                <aside className="image-review-sidebar">
                                    <div className="image-review-status"><ShieldCheck size={18} /><div><strong>{isValidated ? "Validated by doctor" : "Awaiting validation"}</strong><p>{isValidated ? "This image has been reviewed." : "Confirm the image before closing the file."}</p></div></div>
                                    <button type="button" className={`image-review-validate ${isValidated ? "is-validated" : ""}`} onClick={() => void toggleValidation(photo.angle)}>{isValidated ? <><CheckCircle2 size={16} /> Image validated</> : <><ShieldCheck size={16} /> Mark as validated</>}</button>
                                    <label className="image-review-notes"><span><FileText size={15} /> Doctor notes</span><textarea value={draftNotes} onChange={(event) => { setDraftNotes(event.target.value); setNotesSaved(false); }} placeholder="Add observations for this review..." /></label>
                                    <button type="button" className={`dashboard-notes-save image-review-save ${notesSaved ? "is-saved" : ""}`} onClick={() => void saveNotes()}>{notesSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}{notesSaved ? "Notes saved" : "Save notes"}</button>
                                </aside>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
