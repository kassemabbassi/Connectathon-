import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2, FileImage, Lock, User } from "lucide-react";
import { CaptureSlot } from "../components/screening/CaptureSlot";
import { CameraModal } from "../components/screening/CameraModal";
import logo from "../assets/logo.png";
import firstPhoto from "../assets/first1.jpeg";
import lastPhoto from "../assets/last1.jpeg";
import { PatientFile } from "./PatientFile";
import type { PatientForm, ScreeningPhoto } from "./screeningTypes";
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
const EMPTY_RESULTS: ShotMap = { front: null, upper: null, lower: null, left: null, right: null };

const RESULT_ASSETS = import.meta.glob("../assets/last*.jpeg", {
  eager: true,
  import: "default",
  query: "?url",
}) as Record<string, string>;

const EMPTY_FORM: PatientForm = { fullName: "", age: "", identity: "" };

type ScreeningStage = "form" | "analyzing" | "file";

export function NewScreening() {
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [attempted, setAttempted] = useState(false);
  const [shots, setShots] = useState<ShotMap>(EMPTY_SHOTS);
  const [resultShots, setResultShots] = useState<ShotMap>(EMPTY_RESULTS);
  const [activeCamera, setActiveCamera] = useState<AngleKey | null>(null);
  const [stage, setStage] = useState<ScreeningStage>("form");

  const ageNumber = Number(form.age);
  const isAgeValid = form.age.trim() !== "" && Number.isFinite(ageNumber) && ageNumber >= 3 && ageNumber <= 18;
  const formValid = form.fullName.trim().length > 1 && isAgeValid && form.identity.trim().length > 0;

  const capturedCount = ANGLES.filter((angle) => shots[angle.key]).length;
  const canSubmit = formValid && !!shots.front;

  useEffect(() => {
    if (stage !== "analyzing") return;
    const timer = window.setTimeout(() => setStage("file"), 5200);
    return () => window.clearTimeout(timer);
  }, [stage]);

  function updateField(field: keyof PatientForm) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  function handleUpload(angle: AngleKey, file: File) {
    const resultImage = findResultImage(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setShots((prev) => ({ ...prev, [angle]: reader.result as string }));
        setResultShots((prev) => ({ ...prev, [angle]: resultImage }));
      }
    };
    reader.readAsDataURL(file);
  }

  function findResultImage(fileName: string) {
    const match = fileName.match(/^first(\d+)\.jpeg$/i);
    if (!match) return null;
    const resultName = `last${match[1]}.jpeg`;
    const resultEntry = Object.entries(RESULT_ASSETS).find(([assetPath]) =>
      assetPath.toLowerCase().endsWith(`/assets/${resultName.toLowerCase()}`),
    );
    return resultEntry?.[1] ?? null;
  }

  function handleCaptured(dataUrl: string) {
    if (activeCamera) {
      setShots((prev) => ({ ...prev, [activeCamera]: dataUrl }));
      setResultShots((prev) => ({ ...prev, [activeCamera]: null }));
    }
    setActiveCamera(null);
  }

  function handleRemove(angle: AngleKey) {
    setShots((prev) => ({ ...prev, [angle]: null }));
    setResultShots((prev) => ({ ...prev, [angle]: null }));
  }

  function handleLoadDemoImages() {
    setShots((prev) => ({ ...prev, front: firstPhoto }));
    setResultShots((prev) => ({ ...prev, front: lastPhoto }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    if (!canSubmit) return;

    setStage("analyzing");
  }

  function handleStartAnother() {
    setForm(EMPTY_FORM);
    setShots(EMPTY_SHOTS);
    setResultShots(EMPTY_RESULTS);
    setAttempted(false);
    setStage("form");
  }

  const screeningPhotos: ScreeningPhoto[] = ANGLES.filter((angle) => shots[angle.key]).map((angle) => ({
    angle: angle.key,
    label: angle.label,
    image: shots[angle.key] as string,
    resultImage: resultShots[angle.key] ?? undefined,
  }));

  const activeAngle = ANGLES.find((angle) => angle.key === activeCamera);

  if (stage === "file") {
    return (
      <PatientFile
        patient={form}
        photos={screeningPhotos}
        onBack={() => setStage("form")}
        onStartAnother={handleStartAnother}
      />
    );
  }

  if (stage === "analyzing") {
    return (
      <div className="screening-page analysis-page">
        <header className="screening-header">
          <div className="screening-header-inner">
            <div className="brand">
              <img src={logo} alt="DentalScreen logo" className="brand-logo" />
              <span className="brand-name">DentalScreen</span>
            </div>
            <span className="analysis-header-status">Screening in progress</span>
          </div>
        </header>
        <main className="analysis-main" aria-live="polite">
          <div className="analysis-orbit"><span /></div>
          <p className="screening-eyebrow">AI-assisted review</p>
          <h1>Analyzing {form.fullName}&apos;s screening</h1>
          <p className="analysis-sub">Our prototype is checking the captured images for visible areas that may need clinical review.</p>
          <div className="analysis-steps">
            <span className="analysis-step is-done"><CheckCircle2 size={17} /> Images received</span>
            <span className="analysis-step is-active"><span className="analysis-spinner" /> Detecting possible caries</span>
            <span className="analysis-step"><FileImage size={17} /> Preparing patient file</span>
          </div>
          <div className="analysis-progress"><span /></div>
          <p className="analysis-disclaimer">This demo simulates the AI processing step.</p>
        </main>
      </div>
    );
  }

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
              <button type="button" className="demo-images-btn" onClick={handleLoadDemoImages} disabled={!formValid}>
                <FileImage size={15} /> Load demo images
              </button>
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

          <div className="screening-actionbar">
            <p className="screening-progress-text">
              {capturedCount} of {ANGLES.length} angles captured
            </p>
            <button type="submit" className="btn btn-primary">
              Start screening
            </button>
          </div>
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