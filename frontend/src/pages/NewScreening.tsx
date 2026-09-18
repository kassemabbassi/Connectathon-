import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileImage, ShieldCheck, Scale } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
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

const EMPTY_FORM = (): PatientForm => ({ code: "" });

type ScreeningStage = "form" | "analyzing" | "file";

export function NewScreening() {
  const { t } = useLanguage();
  const [form, setForm] = useState<PatientForm>(EMPTY_FORM);
  const [shots, setShots] = useState<ShotMap>(EMPTY_SHOTS);
  const [resultShots, setResultShots] = useState<ShotMap>(EMPTY_RESULTS);
  const [activeCamera, setActiveCamera] = useState<AngleKey | null>(null);
  const [stage, setStage] = useState<ScreeningStage>("form");
  const [detections, setDetections] = useState<CariesDetection[] | null>(null);
  const [detectionsByAngle, setDetectionsByAngle] = useState<Partial<Record<AngleKey, CariesDetection[]>>>({});
  const [detectionSource, setDetectionSource] = useState<"live" | "demo" | null>(null);
  const [guardianConsentConfirmed, setGuardianConsentConfirmed] = useState(false);

  const formValid = form.code.trim().length >= 6;

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
          result: await detectCaries(shots[angle.key] as string),
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
  }, [stage, shots]);

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
    label: t(angle.label),
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
            <span className="analysis-header-status">{t("Screening in progress")}</span>
          </div>
        </header>
        <main className="analysis-main" aria-live="polite">
          <div className="analysis-orbit"><span /></div>
          <p className="screening-eyebrow">{t("AI-assisted review")}</p>
          <h1>{t("Analyzing screening")} {form.code}</h1>
          <p className="analysis-sub">{t("Our prototype is checking the captured images for visible areas that may need clinical review.")}</p>
          <div className="analysis-steps">
            <span className="analysis-step is-done"><CheckCircle2 size={17} /> {t("Images received")}</span>
            <span className="analysis-step is-active"><span className="analysis-spinner" /> {t("Detecting possible caries")}</span>
            <span className="analysis-step"><FileImage size={17} /> {t("Preparing patient file")}</span>
          </div>
          <div className="analysis-progress"><span /></div>
          <p className="analysis-disclaimer">{t("This demo simulates the AI processing step.")}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="screening-page">
      <header className="screening-header">
        <div className="screening-header-inner">
          <Link to="/" className="screening-back">
            <ArrowLeft size={16} /> {t("Back to home")}
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
          <p className="screening-eyebrow">{t("New screening")}</p>
          <h1>{t("Create an anonymous screening record")}</h1>
          <p className="screening-sub">
            {t("Enter the patient's non-identifying code, then capture or upload one or more clear photos of the child's teeth.")}
          </p>

          <div className="step-pills">
            <span className="step-pill step-pill-active">
              <span className="step-pill-index">1</span> {t("Enter patient code")}
            </span>
            <span className="step-pill">
              <span className="step-pill-index">2</span> {t("Capture photos")}
            </span>
          </div>
        </div>

        <form className="screening-form" onSubmit={handleSubmit}>
          <section className="form-card">
            <h2 className="form-card-title">{t("Anonymous patient code")}</h2>

            <div className="form-grid">
              <label className="field field-span-2">
                <span className="field-label">
                  <ShieldCheck size={15} /> {t("Patient code")}
                </span>
                <input
                  type="text"
                  className="field-input"
                  value={form.code}
                  onChange={(event) => setForm({ code: event.target.value })}
                  placeholder={t("Enter the patient's anonymous code")}
                  minLength={6}
                  maxLength={64}
                  required
                  autoComplete="off"
                />
                <small className="auth-field-hint">{t("Enter the code assigned to this patient. It must contain no name, age, or government/student identity information.")}</small>
              </label>
            </div>
          </section>

          <section className="consent-card" aria-labelledby="consent-title">
            <div className="consent-card-head">
              <span className="consent-icon"><Scale size={20} /></span>
              <div>
                <p className="screening-eyebrow">{t("Required before capture")}</p>
                <h2 id="consent-title">{t("Consent and parental authorisation")}</h2>
              </div>
            </div>
            <p className="consent-intro">{t("This school screening involves a minor's health-related images. Do not capture or upload a photo until the required authorisation has been verified.")}</p>
            <div className="consent-details">
              <div><strong>{t("Purpose")}</strong><span>{t("AI-assisted screening and review by an authorised dental professional. It is not an automated diagnosis.")}</span></div>
              <div><strong>{t("Data minimisation")}</strong><span>{t("The record uses an anonymous patient code; no name, age, national ID, or student ID is collected in this form.")}</span></div>
              <div><strong>{t("Informed consent")}</strong><span>{t("The parent or legal guardian must receive the screening information and give their authorisation before any image is captured or processed.")}</span></div>
              <div><strong>{t("Data protection")}</strong><span>{t("Personal and health-related data are handled under the applicable Tunisian data-protection framework.")}</span></div>
            </div>
            <p className="consent-legal">{t("Tunisia: Organic Law No. 2004-63 of 27 July 2004 and the framework of the INPDP (National Authority for the Protection of Personal Data) apply. A minor's personal and health-related data may only be processed after the parent or legal guardian has given informed authorisation.")}</p>
            <label className="consent-check">
              <input type="checkbox" checked={guardianConsentConfirmed} onChange={(event) => setGuardianConsentConfirmed(event.target.checked)} />
              <span>{t("I confirm that the parent or legal guardian has received the required information and has given informed authorisation for this child's screening.")}</span>
            </label>
          </section>

          <section className="form-card photos-card">
            <div className="photos-card-head">
              <h2 className="form-card-title">{t("Teeth photos")}</h2>
              <p className="photos-card-sub">
                {t("Capture at least the front bite. More angles help the AI model give a more complete read.")}
              </p>
              <button type="button" className="demo-images-btn" onClick={handleLoadDemoImages} disabled={!guardianConsentConfirmed}>
                <FileImage size={15} /> {t("Load demo images")}
              </button>
            </div>

            <div className="capture-grid">
              {ANGLES.map((angle) => (
                <CaptureSlot
                  key={angle.key}
                  label={t(angle.label)}
                  hint={t(angle.hint)}
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
              {capturedCount} / {ANGLES.length} {t("angles captured")}
            </p>
            <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
              {t("Start screening")}
            </button>
          </div>
        </form>
      </main>

      {activeCamera && activeAngle && (
        <CameraModal
          title={`${t("Capture")}: ${t(activeAngle.label)}`}
          onCapture={handleCaptured}
          onClose={() => setActiveCamera(null)}
        />
      )}
    </div>
  );
}
