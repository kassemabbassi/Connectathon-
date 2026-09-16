import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Camera,
  ScanLine,
  Stethoscope,
  ShieldCheck,
  ClipboardList,
  Database,
} from "lucide-react";
import dentsXray from "../assets/dents.png";
import "./Landing.css";
import logo from "../assets/logo.png";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#safety", label: "Safety" },
];

const STATS = [
  { value: "43.9%", label: "Primary school children with decay", source: "Sousse, Ghali et al. 2025" },
  { value: "28.7%", label: "Early childhood caries, Tunis", source: "2025, Eur Arch Paediatr Dent" },
  { value: "45%", label: "Prevalence in hardest-hit regions", source: "Regional disparity, 2025" },
];

const BUILD_STEPS = [
  {
    icon: Camera,
    title: "Capture",
    body: "School staff take a guided, standardized photo of the child's teeth in seconds — no dental training required.",
  },
  {
    icon: ScanLine,
    title: "Analyze",
    body: "An AI model flags visible signs of decay and assigns a clear priority level for review.",
  },
  {
    icon: Stethoscope,
    title: "Validate",
    body: "A partner dentist reviews every flagged case before any decision reaches a family.",
  },
];

const CAPABILITIES = [
  {
    icon: ScanLine,
    title: "Decay Detection",
    body: "AI-powered object detection trained to identify visible signs of tooth decay in intraoral photos.",
    accent: "magenta",
  },
  {
    icon: ClipboardList,
    title: "Priority Triage",
    body: "Every case is scored and queued so dentists spend limited time where it matters most.",
    accent: "cyan",
  },
  {
    icon: Database,
    title: "Patient Records",
    body: "Each screening becomes a structured, auditable file — image, findings, and follow-up in one place.",
    accent: "lime",
  },
] as const;

const DIFFERENT_POINTS = [
  {
    icon: ShieldCheck,
    title: "Clinically Guided",
    body: "Priority thresholds and messages are validated by a partner dentist before deployment.",
  },
  {
    icon: Stethoscope,
    title: "Human in the Loop",
    body: "No diagnosis is ever issued automatically. The AI flags, a professional decides.",
  },
  {
    icon: Database,
    title: "Real Data Only",
    body: "Built and tested on real, consented screening images — never simulated data.",
  },
  {
    icon: ClipboardList,
    title: "Auditable by Design",
    body: "Every capture, detection, and validation is logged and traceable end to end.",
  },
];

export function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing">
      <div className="topbar">
        <span className="topbar-item">
          <MapPin size={14} /> Monastir, Tunisia
        </span>
        <span className="topbar-item">
          <Mail size={14} /> contact@spotearly.tn
        </span>
      </div>

      <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
        <div className="header-inner">
          <div className="brand">
  <img src={logo} alt="DentalScreen logo" className="brand-logo" />
  <span className="brand-name">SpotEarly</span>
</div>
          <nav className="header-nav">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <Link to="/new" className="btn btn-primary">
            Start Screening
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <span className="eyebrow-pill reveal reveal-1">
              <span className="eyebrow-dot" /> AI-assisted screening for Tunisian schools
            </span>
            <h1 className="reveal reveal-2">
              Catching tooth decay <br /> before it hurts.
            </h1>
            <p className="hero-lede reveal reveal-3">
              A phone photo becomes a reviewed dental record.
            </p>
            <p className="hero-sub reveal reveal-3">
              SpotEarly brings AI-assisted screening into Tunisian schools —
              flagging children who may need a dentist, with every result
              checked by a licensed professional.
            </p>
            <div className="hero-actions reveal reveal-4">
              <Link to="/new" className="btn btn-primary">
                Start Screening
              </Link>
              <a href="#how-it-works" className="btn btn-outline">
                See how it works
              </a>
            </div>
          </div>

          <div className="hero-visual reveal reveal-3">
            <div className="hero-frame">
              <span className="scan-line" aria-hidden="true" />
              <img src={dentsXray} alt="AI-detected dental anomalies on an X-ray" />
              
              
            </div>
          </div>
        </div>

        <div className="stats">
          {STATS.map((s) => (
            <div key={s.label} className="stat">
              <p className="stat-value tabular-nums">{s.value}</p>
              <p className="stat-label">{s.label}</p>
              <p className="stat-source">{s.source}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="section section-light">
        <div className="section-head">
          <h2>From photo to follow-up</h2>
          <p className="section-sub">
            A simple, repeatable workflow that fits into a normal school day.
          </p>
        </div>

        <div className="process-track">
          {BUILD_STEPS.map((step, i) => (
            <div key={step.title} className="process-step">
              <span className="step-frame">
                <span className="corner corner-tl" />
                <span className="corner corner-tr" />
                <span className="corner corner-bl" />
                <span className="corner corner-br" />
                <span className="step-index">{i + 1}</span>
                <step.icon size={22} strokeWidth={1.75} />
              </span>
              <h3>{step.title}</h3>
              <p className="text-muted">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="capabilities" className="section section-light section-alt">
        <div className="section-head">
          <h2>AI-powered school screening</h2>
          <p className="section-sub">
            Purpose-built for early detection, structured records, and real clinical
            follow-up.
          </p>
        </div>
        <div className="card-grid">
          {CAPABILITIES.map((cap) => (
            <div key={cap.title} className={`capability-card accent-${cap.accent}`}>
              <cap.icon size={26} strokeWidth={1.75} className="capability-icon" />
              <h3>{cap.title}</h3>
              <p className="text-muted">{cap.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="safety" className="section section-navy">
        <div className="section-head">
          <h2 className="on-navy">The AI flags. Only a dentist decides.</h2>
          <p className="section-sub on-navy-muted">
            Every screening reaches a family only after a licensed dentist reviews it.
          </p>
        </div>
        <div className="card-grid card-grid-4">
          {DIFFERENT_POINTS.map((point) => (
            <div key={point.title} className="different-card">
              <point.icon size={20} strokeWidth={1.75} className="different-icon" />
              <h3 className="on-navy">{point.title}</h3>
              <p className="on-navy-muted">{point.body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <p>SpotEarly — Future Health Connectathon 2026</p>
      </footer>
    </div>
  );
}