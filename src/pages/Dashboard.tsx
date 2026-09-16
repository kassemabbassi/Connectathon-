import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Activity,
    ArrowRight, ClipboardList,
    CheckCircle2,
    FileText,
    Image as ImageIcon,
    Plus,
    Save,
    Search,
    ShieldCheck,
    User,
    X,
} from "lucide-react";
import logo from "../assets/logo.png";
import type { SavedScreening } from "./screeningTypes";
import "./Dashboard.css";

const RECORD_PREFIX = "dentalscreen-record-";
const RECORDS_EVENT = "dentalscreen-records-updated";

function readRecords(): SavedScreening[] {
    const records: SavedScreening[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (!key?.startsWith(RECORD_PREFIX)) continue;
        try {
            const record = JSON.parse(window.localStorage.getItem(key) ?? "null") as SavedScreening;
            if (record?.patient?.fullName && record.savedAt) {
                records.push({ ...record, id: record.id ?? key, storageKey: key });
            }
        } catch {
            // Ignore an incomplete browser record and keep the dashboard usable.
        }
    }
    return records.sort((first, second) => second.savedAt.localeCompare(first.savedAt));
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export function Dashboard() {
    const [records, setRecords] = useState<SavedScreening[]>(readRecords);
    const [query, setQuery] = useState("");
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [draftNotes, setDraftNotes] = useState("");
    const [notesSaved, setNotesSaved] = useState(false);
    const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
    const [validatedImages, setValidatedImages] = useState<Record<string, boolean>>({});

    useEffect(() => {
        function refresh() {
            setRecords(readRecords());
        }
        window.addEventListener("storage", refresh);
        window.addEventListener(RECORDS_EVENT, refresh);
        return () => {
            window.removeEventListener("storage", refresh);
            window.removeEventListener(RECORDS_EVENT, refresh);
        };
    }, []);

    const filteredRecords = records.filter((record) => {
        const searchable = `${record.patient.fullName} ${record.patient.identity}`.toLowerCase();
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

    function saveNotes() {
        if (!selectedRecord) return;
        const updatedRecord = { ...selectedRecord, notes: draftNotes, notesUpdatedAt: new Date().toISOString() };
        window.localStorage.setItem(selectedRecord.storageKey ?? `${RECORD_PREFIX}${selectedRecord.id}`, JSON.stringify(updatedRecord));
        setRecords((current) => current.map((record) => record.id === selectedRecord.id ? updatedRecord : record));
        window.dispatchEvent(new Event(RECORDS_EVENT));
        setNotesSaved(true);
    }

    function toggleValidation(photoAngle: string) {
        if (!selectedRecord) return;
        const imageKey = `${selectedRecord.id}-${photoAngle}`;
        const isValidated = validatedImages[imageKey] ?? false;
        const validatedAngles = new Set(selectedRecord.validatedAngles ?? []);
        if (isValidated) validatedAngles.delete(photoAngle);
        else validatedAngles.add(photoAngle);
        const updatedRecord = { ...selectedRecord, validatedAngles: [...validatedAngles] };
        window.localStorage.setItem(selectedRecord.storageKey ?? `${RECORD_PREFIX}${selectedRecord.id}`, JSON.stringify(updatedRecord));
        setRecords((current) => current.map((record) => record.id === selectedRecord.id ? updatedRecord : record));
        setValidatedImages((current) => ({ ...current, [imageKey]: !isValidated }));
        window.dispatchEvent(new Event(RECORDS_EVENT));
    }

    return (
        <div className="dashboard-page">
            <header className="dashboard-header">
                <div className="dashboard-header-inner">
                    <Link to="/" className="dashboard-brand">
                        <img src={logo} alt="SpotEarly logo" />
                        <span>SpotEarly</span>
                    </Link>
                    <Link to="/new" className="btn btn-primary dashboard-new-button"><Plus size={16} /> New screening</Link>
                </div>
            </header>

            <main className="dashboard-main">
                <div className="dashboard-heading">
                    <div>
                        <p className="screening-eyebrow">Clinical workspace</p>
                        <h1>Screening dashboard</h1>
                        <p>Review saved patient files, notes, images, and AI triage results in one place.</p>
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
                            <div className="dashboard-empty"><ClipboardList size={28} /><h3>{records.length ? "No matching files" : "No saved files yet"}</h3><p>{records.length ? "Try another patient name or ID." : "Save a completed screening to see it here."}</p></div>
                        ) : (
                            <div className="record-list">
                                {filteredRecords.map((record) => (
                                    <button type="button" key={record.id} className={`record-row ${selectedRecord?.id === record.id ? "is-selected" : ""}`} onClick={() => setSelectedId(record.id)}>
                                        <span className="record-avatar"><User size={17} /></span>
                                        <span className="record-main"><strong>{record.patient.fullName}</strong><small>{record.patient.identity} · Age {record.patient.age}</small></span>
                                        <span className="record-meta"><b>{record.photos.length} photos</b><small>{record.notes.trim() ? "Notes added" : "No notes"}</small></span>
                                        <ArrowRight size={16} className="record-arrow" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </section>

                    {selectedRecord ? (
                        <section className="dashboard-detail-panel">
                            <div className="dashboard-detail-head"><div><p className="dashboard-kicker">Patient file</p><h2>{selectedRecord.patient.fullName}</h2><span>Saved {formatDate(selectedRecord.savedAt)}</span></div><span className="dashboard-review-badge">{selectedRecord.result}</span></div>
                            <div className="dashboard-detail-fields"><div><small>Age</small><strong>{selectedRecord.patient.age} years</strong></div><div><small>Identity / ID</small><strong>{selectedRecord.patient.identity}</strong></div></div>
                            <div className="dashboard-detail-section"><div className="dashboard-section-title"><ImageIcon size={16} /><h3>Images</h3><span>{selectedRecord.photos.length} · Click to inspect</span></div><div className="dashboard-image-grid">{selectedRecord.photos.map((photo, index) => <button type="button" key={photo.angle} className="dashboard-image-item" onClick={() => setSelectedPhotoIndex(index)} aria-label={`Inspect ${photo.label} image`}><img src={photo.resultImage ?? photo.image} alt={photo.label} /><span>{photo.resultImage ? "AI result" : photo.label}</span></button>)}</div></div>
                            <div className="dashboard-detail-section dashboard-notes-section">
                                <div className="dashboard-section-title"><FileText size={16} /><h3>Doctor notes</h3><span>{draftNotes.trim() ? "Clinical note" : "Pending"}</span></div>
                                <textarea className="dashboard-notes-editor" value={draftNotes} onChange={(event) => { setDraftNotes(event.target.value); setNotesSaved(false); }} placeholder="Add observations, recommendations, or follow-up details..." aria-label={`Doctor notes for ${selectedRecord.patient.fullName}`} />
                                <div className="dashboard-notes-footer"><span>{draftNotes.length} characters</span><button type="button" className={`dashboard-notes-save ${notesSaved ? "is-saved" : ""}`} onClick={saveNotes}>{notesSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}{notesSaved ? "Notes saved" : "Save notes"}</button></div>
                            </div>
                            <Link to="/new" className="dashboard-open-link">Create another screening <ArrowRight size={15} /></Link>
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
                            <div className="image-review-header"><div><p className="dashboard-kicker">Image review</p><h2>{photo.label}</h2><span>{selectedRecord.patient.fullName} · {selectedRecord.patient.identity}</span></div><button type="button" className="image-review-close" onClick={() => setSelectedPhotoIndex(null)} aria-label="Close image review"><X size={19} /></button></div>
                            <div className="image-review-body">
                                <div className="image-review-visual"><img src={photo.resultImage ?? photo.image} alt={`${photo.label} enlarged`} /><span>{photo.resultImage ? "AI result image" : "Captured image"}</span></div>
                                <aside className="image-review-sidebar">
                                    <div className="image-review-status"><ShieldCheck size={18} /><div><strong>{isValidated ? "Validated by doctor" : "Awaiting validation"}</strong><p>{isValidated ? "This image has been reviewed." : "Confirm the image before closing the file."}</p></div></div>
                                    <button type="button" className={`image-review-validate ${isValidated ? "is-validated" : ""}`} onClick={() => toggleValidation(photo.angle)}>{isValidated ? <><CheckCircle2 size={16} /> Image validated</> : <><ShieldCheck size={16} /> Mark as validated</>}</button>
                                    <label className="image-review-notes"><span><FileText size={15} /> Doctor notes</span><textarea value={draftNotes} onChange={(event) => { setDraftNotes(event.target.value); setNotesSaved(false); }} placeholder="Add observations for this review..." /></label>
                                    <button type="button" className={`dashboard-notes-save image-review-save ${notesSaved ? "is-saved" : ""}`} onClick={saveNotes}>{notesSaved ? <CheckCircle2 size={14} /> : <Save size={14} />}{notesSaved ? "Notes saved" : "Save notes"}</button>
                                </aside>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
