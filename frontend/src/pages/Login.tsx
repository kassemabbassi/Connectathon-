import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AuthApiError } from "../lib/authApi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./Auth.css";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { useLanguage } from "../context/LanguageContext";

function homeRouteForRole(role: string) {
  if (role === "admin") return "/admin";
  if (role === "dentist") return "/dashboard";
  return "/new";
}

export function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login(email.trim(), password);
      navigate(redirectPath ?? homeRouteForRole(user.role), { replace: true });
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        if (caught.status === 403) {
          setError("Your account is not active yet. Please wait for administrator validation.");
        } else if (caught.status === 401) {
          setError("Invalid email or password.");
        } else {
          setError(caught.message);
        }
      } else {
        setError("Unable to reach the server. Check that the backend is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page auth-page-centered">
      <section className="auth-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <Link to="/" className="auth-brand" style={{ marginBottom: 0 }}>
            <img src={logo} alt="SpotEarly logo" />
            <span>SpotEarly</span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}><LanguageSwitcher /><Link to="/" className="auth-back" style={{ marginBottom: 0 }}>
            <ArrowLeft size={16} />
            {t("Back to home")}
          </Link></div>
        </div>

        <h1>{t("Sign in")}</h1>
        <p className="auth-lede">
          {t("Staff and dentists sign in with the account created for their school. Administrators sign in to manage institutions and users.")}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}

          <label className="auth-field">
            <span>{t("Email")}</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@school.tn"
            />
          </label>

          <label className="auth-field">
            <span>{t("Password")}</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("Your password")}
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </section>
    </div>
  );
}
