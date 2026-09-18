import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./Auth.css";

export function Unauthorized() {
  const { user, logout } = useAuth();

  const homeHref = user?.role === "admin" ? "/admin" : user?.role === "dentist" ? "/dashboard" : "/new";

  return (
    <div className="status-page">
      <div className="status-card">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="SpotEarly logo" />
          <span>SpotEarly</span>
        </Link>
        <h1>Access not allowed</h1>
        <p>
          Your account role does not include access to this page. Staff run screenings, dentists review cases, and administrators manage institutions and accounts.
        </p>
        <div className="status-actions">
          <Link to={homeHref} className="btn btn-primary">
            Go to your workspace
          </Link>
          <button type="button" className="btn btn-ghost-navy" onClick={logout}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
