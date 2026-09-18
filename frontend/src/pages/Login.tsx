import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthApiError } from "../lib/authApi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./Auth.css";

function homeRouteForRole(role: string) {
  if (role === "dentist" || role === "admin") return "/dashboard";
  return "/new";
}

export function Login() {
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
    <div className="auth-page">
      <section className="auth-panel">
        <Link to="/" className="auth-brand">
          <img src={logo} alt="SpotEarly logo" />
          <span>SpotEarly</span>
        </Link>

        <h1>Sign in</h1>
        <p className="auth-lede">
          Access your institution workspace. Staff members run screenings; dentists review flagged cases.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}

          <label className="auth-field">
            <span>Email</span>
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
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Your password"
            />
          </label>

          <button type="submit" className="btn btn-primary auth-submit" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="auth-footer-link">
          No account yet? <Link to="/signup">Create one</Link>
        </p>
      </section>

      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-copy">
          <h2>Secure access for school screening teams</h2>
          <p>
            Each account is tied to an institution and validated before use. Only authorized staff
            and partner dentists can access patient screening data.
          </p>
        </div>
      </aside>
    </div>
  );
}
