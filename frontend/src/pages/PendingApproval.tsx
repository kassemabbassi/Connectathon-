import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Auth.css";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export function PendingApproval() {
  return (
    <div className="status-page">
      <div className="status-card">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}><LanguageSwitcher /></div>
        <Link to="/" className="auth-brand">
          <img src={logo} alt="SpotEarly logo" />
          <span>SpotEarly</span>
        </Link>
        <h1>Account pending validation</h1>
        <p>
          Your registration was received. A platform administrator must activate your account before
          you can sign in and access screening tools.
        </p>
        <p>
          You will receive access once your institution affiliation has been verified. This usually
          takes a short manual review during the prototype phase.
        </p>
        <div className="status-actions">
          <Link to="/login" className="btn btn-primary">
            Back to sign in
          </Link>
          <Link to="/" className="btn btn-ghost-navy">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
