import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileImage, ShieldCheck, Scale } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { UserMenu } from "../components/auth/UserMenu";
import { CaptureSlot } from "../components/screening/CaptureSlot";
import { CameraModal } from "../components/screening/CameraModal";
import logo from "../assets/logo.png";
import firstPhoto from "../assets/first1.jpeg";
import lastPhoto from "../assets/last1.jpeg";
import { PatientFile } from "./PatientFile";
import type { PatientForm, ScreeningPhoto } from "./screeningTypes";
import { detectCaries } from "../lib/detectionApi";
import type { CariesDetection } from "../lib/detectionApi";
import "./NewScreening.css";

const ANGLES = [
  { key: "front", label: "Front bite", hint: "Teeth together, straight-on", required: false },
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

function createPatientCode() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(7, "0");
  return `PT-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${random}`;
}

const EMPTY_FORM = (): PatientForm => ({ code: createPatientCode() });

type ScreeningStage = "form" | "analyzing" | "file";

export function NewScreening() {
  const { token } = useAuth();
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [shots, setShots] = useState<ShotMap>(EMPTY_SHOTS);
  const [resultShots, setResultShots] = useState<ShotMap>(EMPTY_RESULTS);
  const [activeCamera, setActiveCamera] = useState<AngleKey | null>(null);
  const [stage, setStage] = useState<ScreeningStage>("form");
  const [detections, setDetections] = useState<CariesDetection[] | null>(null);
  const [detectionsByAngle, setDetectionsByAngle] = useState<Partial<Record<AngleKey, CariesDetection[]>>>({});
  const [detectionSource, setDetectionSource] = useState<"live" | "demo" | null>(null);
  const [guardianConsentConfirmed, setGuardianConsentConfirmed] = useState(false);

  const formValid = form.code.length > 0;

  const capturedCount = ANGLES.filter((angle) => shots[angle.key]).length;
  const canSubmit = formValid && guardianConsentConfirmed && capturedCount > 0;

  useEffect(() => {
    if (stage !== "analyzing") return;

    let cancelled = false;
    const minDisplayTime = new Promise((resolve) => window.setTimeout(resolve, 2200));

    async function runAnalysis() {
      const selectedAngles = ANGLES.filter((angle) => shots[angle.key]);
      const results = await Promise.allSettled(
        selectedAngles.map(async (angle) => ({
          angle: angle.key,
          result: await detectCaries(shots[angle.key] as string, token ?? ""),
        })),
      );

      await minDisplayTime;
      if (cancelled) return;

      const nextDetections: Partial<Record<AngleKey, CariesDetection[]>> = {};
      for (const result of results) {
        if (result.status === "fulfilled") {
          nextDetections[result.value.angle] = result.value.result.detections;
        } else {
          console.warn("Live detection failed for one screening photo:", result.reason);
        }
      }

      const liveCount = Object.keys(nextDetections).length;
      setDetectionsByAngle(nextDetections);
      setDetections(nextDetections.front ?? Object.values(nextDetections)[0] ?? null);
      setDetectionSource(liveCount > 0 ? "live" : "demo");
      setStage("file");
    }

    runAnalysis();
    return () => {
      cancelled = true;
    };
  }, [stage, shots, token]);

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
    if (!canSubmit) return;

    setDetections(null);
    setDetectionsByAngle({});
    setDetectionSource(null);
    setGuardianConsentConfirmed(false);
    setStage("analyzing");
  }

  function handleStartAnother() {
    setForm(EMPTY_FORM());
    setShots(EMPTY_SHOTS);
    setResultShots(EMPTY_RESULTS);
    setDetections(null);
    setDetectionsByAngle({});
    setDetectionSource(null);
    setStage("form");
  }

  const screeningPhotos: ScreeningPhoto[] = ANGLES.filter((angle) => shots[angle.key]).map((angle) => ({
    angle: angle.key,
    label: angle.label,
    image: shots[angle.key] as string,
    resultImage: resultShots[angle.key] ?? undefined,
    detections: detectionsByAngle[angle.key],
  }));

  const activeAngle = ANGLES.find((angle) => angle.key === activeCamera);

  if (stage === "file") {
    return (
      <PatientFile
        patient={form}
        photos={screeningPhotos}
        detections={detections}
        detectionSource={detectionSource}
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
              <img src={logo} alt="SpotEarly logo" className="brand-logo" />
              <span className="brand-name">SpotEarly</span>
            </div>
            <span className="analysis-header-status">Screening in progress</span>
          </div>
        </header>
        <main className="analysis-main" aria-live="polite">
          <div className="analysis-orbit"><span /></div>
          <p className="screening-eyebrow">AI-assisted review</p>
          <h1>Analyzing screening {form.code}</h1>
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
            <img src={logo} alt="SpotEarly logo" className="brand-logo" />
            <span className="brand-name">SpotEarly</span>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="screening-main">
        <div className="screening-intro">
          <p className="screening-eyebrow">New screening</p>
          <h1>Create an anonymous screening record</h1>
          <p className="screening-sub">
            A non-identifying patient code is generated automatically. Then capture or upload one
            or more clear photos of the child's teeth.
          </p>

          <div className="step-pills">
            <span className="step-pill step-pill-active">
              <span className="step-pill-index">1</span> Anonymous code
            </span>
            <span className="step-pill">
              <span className="step-pill-index">2</span> Capture photos
            </span>
          </div>
        </div>

        <form className="screening-form" onSubmit={handleSubmit}>
          <section className="form-card">
            <h2 className="form-card-title">Anonymous patient code</h2>

            <div className="form-grid">
              <label className="field field-span-2">
                <span className="field-label">
                  <ShieldCheck size={15} /> Patient code
                </span>
                <input
                  type="text"
                  className="field-input"
                  value={form.code}
                  readOnly
                />
                <small className="auth-field-hint">This code contains no name, age, or government/student identity information.</small>
              </label>
            </div>
          </section>

          <section className="consent-card" aria-labelledby="consent-title">
            <div className="consent-card-head">
              <span className="consent-icon"><Scale size={20} /></span>
              <div>
                <p className="screening-eyebrow">Required before capture</p>
                <h2 id="consent-title">Parent or guardian authorisation</h2>
              </div>
            </div>
            <p className="consent-intro">This school screening involves a minor&apos;s health-related images. Do not capture or upload a photo until the required authorisation has been verified.</p>
            <div className="consent-details">
              <div><strong>Purpose</strong><span>AI-assisted screening and review by an authorised dental professional. It is not an automated diagnosis.</span></div>
              <div><strong>Data minimisation</strong><span>The record uses an anonymous patient code; no name, age, national ID, or student ID is collected in this form.</span></div>
              <div><strong>Retention</strong><span>Images, findings, and consent metadata are retained for 12 months for clinical follow-up, then automatically deleted.</span></div>
              <div><strong>Your rights</strong><span>Consent may be withdrawn before screening. Access, correction, and deletion requests can be sent to the platform administrator.</span></div>
            </div>
            <p className="consent-legal">Tunisia: Organic Law No. 2004-63 of 27 July 2004 and the INPDP framework apply. For a child&apos;s personal and health data, guardian consent and any required family-judge authorisation must be obtained before processing.</p>
            <label className="consent-check">
              <input type="checkbox" checked={guardianConsentConfirmed} onChange={(event) => setGuardianConsentConfirmed(event.target.checked)} />
              <span>I confirm that the parent or legal guardian has given informed authorisation for this screening, that any required legal authorisation has been obtained, and that the information above was provided.</span>
            </label>
          </section>

          <section className="form-card photos-card">
            <div className="photos-card-head">
              <h2 className="form-card-title">Teeth photos</h2>
              <p className="photos-card-sub">
                Capture at least the front bite. More angles help the AI model give a more
                complete read.
              </p>
              <button type="button" className="demo-images-btn" onClick={handleLoadDemoImages} disabled={!guardianConsentConfirmed}>
                <FileImage size={15} /> Load demo images
              </button>
            </div>

            <div className="capture-grid">
              {ANGLES.map((angle) => (
                <CaptureSlot
                  key={angle.key}
                  label={angle.label}
                  hint={angle.hint}
                  required={angle.required}
                  disabled={!guardianConsentConfirmed}
                  image={shots[angle.key]}
                  onOpenCamera={() => guardianConsentConfirmed && setActiveCamera(angle.key)}
                  onUpload={(file) => { if (guardianConsentConfirmed) handleUpload(angle.key, file); }}
                  onRemove={() => handleRemove(angle.key)}
                />
              ))}
            </div>
          </section>

          <div className="screening-actionbar">
            <p className="screening-progress-text">
              {capturedCount} of {ANGLES.length} angles captured
            </p>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
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
