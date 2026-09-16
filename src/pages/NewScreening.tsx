import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, Lock, User } from "lucide-react";
import { CaptureSlot } from "../components/screening/CaptureSlot";
import { CameraModal } from "../components/screening/CameraModal";
import logo from "../assets/logo.png";
import "./NewScreening.css";

const ANGLES = [
  { key: "front", label: "Front bite", hint: "Teeth together, straight-on", required: true },
  { key: "upper", label: "Upper arch", hint: "Chin up, upper teeth only", required: false },
  { key: "lower", label: "Lower arch", hint: "Chin down, lower teeth only", required: false },
  { key: "left", label: "Left side", hint: "Left profile, biting down", required: false },
  { key: "right", label: "Right side", hint: "Right profile, biting down", required: false },
] as const;

type AngleKey = (typeof ANGLES)[number]["key"];
type ShotMap = Record<AngleKey, string | null>;

const EMPTY_SHOTS: ShotMap = { front: null, upper: null, lower: null, left: null, right: null };

type PatientForm = {
  fullName: string;
  age: string;
  identity: string;
};

const EMPTY_FORM: PatientForm = { fullName: "", age: "", identity: "" };

export function NewScreening() {
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);
  const [shots, setShots] = useState<ShotMap>(EMPTY_SHOTS);
  const [activeCamera, setActiveCamera] = useState<AngleKey | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const ageNumber = Number(form.age);
  const isAgeValid = form.age.trim() !== "" && Number.isFinite(ageNumber) && ageNumber >= 3 && ageNumber <= 18;
  const formValid = form.fullName.trim().length > 1 && isAgeValid && form.identity.trim().length > 0;

  const capturedCount = ANGLES.filter((angle) => shots[angle.key]).length;
  const canSubmit = formValid && !!shots.front;

  function updateField(field: keyof PatientForm) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleUpload(angle: AngleKey, file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setShots((prev) => ({ ...prev, [angle]: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  function handleCaptured(dataUrl: string) {
    if (activeCamera) {
      setShots((prev) => ({ ...prev, [activeCamera]: dataUrl }));
    }
    setActiveCamera(null);
  }

  function handleRemove(angle: AngleKey) {
    setShots((prev) => ({ ...prev, [angle]: null }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (!canSubmit) return;

    const payload = {
      patient: form,
      photos: ANGLES.filter((angle) => shots[angle.key]).map((angle) => ({
        angle: angle.key,
        label: angle.label,
        image: shots[angle.key],
      })),
    };

    // The screening endpoint and AI model aren't wired up yet — this is
    // where the payload above will be sent for object detection.
    console.log("New screening payload", payload);
    setSubmitted(true);
  }

  function handleStartAnother() {
    setForm(EMPTY_FORM);
    setShots(EMPTY_SHOTS);
    setAttempted(false);
    setSubmitted(false);
  }

  const activeAngle = ANGLES.find((angle) => angle.key === activeCamera);

  return (
    <div className="screening-page">
      <header className="screening-header">
        <div className="screening-header-inner">
          <Link to="/" className="screening-back">
            <ArrowLeft size={16} /> Back to home
          </Link>
          <div className="brand">
            <img src={logo} alt="DentalScreen logo" className="brand-logo" />
            <span className="brand-name">DentalScreen</span>
          </div>
        </div>
      </header>

      <main className="screening-main">
        <div className="screening-intro">
          <p className="screening-eyebrow">New screening</p>
          <h1>Add a child's details and teeth photos</h1>
          <p className="screening-sub">
            Fill in the details below, then capture or upload clear photos of the child's
            teeth. A front photo is required — add more angles for a more complete record.
          </p>

          <div className="step-pills">
            <span className="step-pill step-pill-active">
              <span className="step-pill-index">1</span> Patient details
            </span>
            <span className="step-pill">
              <span className="step-pill-index">2</span> Capture photos
            </span>
          </div>
        </div>

        <form className="screening-form" onSubmit={handleSubmit}>
          <section className="form-card">
            <h2 className="form-card-title">Patient information</h2>

            <div className="form-grid">
              <label className="field field-span-2">
                <span className="field-label">
                  <User size={15} /> Full name
                </span>
                <input
                  type="text"
                  className="field-input"
                  placeholder="e.g. Amira Ben Salah"
                  value={form.fullName}
                  onChange={updateField("fullName")}
                />
                {attempted && form.fullName.trim().length <= 1 && (
                  <span className="field-error">Enter the child's full name.</span>
                )}
              </label>

              <label className="field">
                <span className="field-label">
                  <CalendarDays size={15} /> Age
                </span>
                <input
                  type="number"
                  className="field-input"
                  placeholder="e.g. 9"
                  min={3}
                  max={18}
                  value={form.age}
                  onChange={updateField("age")}
                />
                {attempted && !isAgeValid && (
                  <span className="field-error">Enter an age between 3 and 18.</span>
                )}
              </label>

              <label className="field">
                <span className="field-label">
                  <BadgeCheck size={15} /> Identity / ID number
                </span>
                <input
                  type="text"
                  className="field-input"
                  placeholder="CIN, student ID, or record number"
                  value={form.identity}
                  onChange={updateField("identity")}
                />
                {attempted && form.identity.trim().length === 0 && (
                  <span className="field-error">Enter an identity or ID number.</span>
                )}
              </label>
            </div>
          </section>

          <section className={`form-card photos-card ${!formValid ? "photos-card-locked" : ""}`}>
            <div className="photos-card-head">
              <h2 className="form-card-title">Teeth photos</h2>
              <p className="photos-card-sub">
                Capture at least the front bite. More angles help the AI model give a more
                complete read.
              </p>
            </div>

            {!formValid && (
              <div className="photos-lock-overlay">
                <Lock size={18} />
                <p>Fill in the patient details above to unlock photo capture.</p>
              </div>
            )}

            <div className="capture-grid">
              {ANGLES.map((angle) => (
                <CaptureSlot
                  key={angle.key}
                  label={angle.label}
                  hint={angle.hint}
                  required={angle.required}
                  image={shots[angle.key]}
                  onOpenCamera={() => setActiveCamera(angle.key)}
                  onUpload={(file) => handleUpload(angle.key, file)}
                  onRemove={() => handleRemove(angle.key)}
                />
              ))}
            </div>
          </section>

          {submitted ? (
            <div className="screening-success">
              <CheckCircle2 size={22} />
              <div>
                <p className="screening-success-title">Screening saved locally</p>
                <p className="screening-success-sub">
                  This record will be sent for AI analysis once that step is connected.
                </p>
              </div>
              <button type="button" className="btn btn-ghost-navy" onClick={handleStartAnother}>
                Start another
              </button>
            </div>
          ) : (
            <div className="screening-actionbar">
              <p className="screening-progress-text">
                {capturedCount} of {ANGLES.length} angles captured
              </p>
              <button type="submit" className="btn btn-primary">
                Start screening
              </button>
            </div>
          )}
        </form>
      </main>

      {activeCamera && activeAngle && (
        <CameraModal
          title={`Capture: ${activeAngle.label}`}
          onCapture={handleCaptured}
          onClose={() => setActiveCamera(null)}
        />
      )}
    </div>
  );
}