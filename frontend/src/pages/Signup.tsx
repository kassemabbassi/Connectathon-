import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthApiError, fetchInstitutions, type Institution } from "../lib/authApi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import "./Auth.css";

type SignupRole = "staff" | "dentist";

export function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [institutionsError, setInstitutionsError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<SignupRole>("staff");
  const [institutionId, setInstitutionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadInstitutions() {
      try {
        const items = await fetchInstitutions();
        if (cancelled) return;
        setInstitutions(items);
      } catch {
        if (cancelled) return;
        setInstitutionsError("Unable to load institutions. Make sure the backend and database are running.");
      }
    }

    void loadInstitutions();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!institutionId) {
      setError(
        role === "dentist"
          ? "Select the school this dentist works with."
          : "Select the school this staff account belongs to.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        institution_id: institutionId,
      });
      navigate("/pending", { replace: true });
    } catch (caught) {
      if (caught instanceof AuthApiError) {
        if (caught.status === 409) {
          setError(
            "This email is already registered. Use a different email for the dentist account, or sign in with the existing account.",
          );
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

        <h1>Create an account</h1>
        <p className="auth-lede">
          Register as school staff or a partner dentist. Your account stays pending until our team validates it.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <p className="auth-error">{error}</p>}
          {institutionsError && <p className="auth-error">{institutionsError}</p>}

          <label className="auth-field">
            <span>Full name</span>
            <input
              type="text"
              required
              minLength={2}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="e.g. Amira Ben Salah"
            />
          </label>

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

          <div className="auth-field">
            <span>Role</span>
            <div className="auth-role-group">
              <label className={`auth-role-option ${role === "staff" ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="staff"
                  checked={role === "staff"}
                  onChange={() => setRole("staff")}
                />
                <strong>School staff</strong>
                <small>Capture screenings at your institution.</small>
              </label>
              <label className={`auth-role-option ${role === "dentist" ? "is-selected" : ""}`}>
                <input
                  type="radio"
                  name="role"
                  value="dentist"
                  checked={role === "dentist"}
                  onChange={() => setRole("dentist")}
                />
                <strong>Dentist</strong>
                <small>Review cases from your institution.</small>
              </label>
            </div>
          </div>

          <label className="auth-field">
            <span>{role === "dentist" ? "School this dentist works with" : "School / institution"}</span>
            <select
              required
              value={institutionId}
              onChange={(event) => setInstitutionId(event.target.value)}
              disabled={institutions.length === 0}
            >
              <option value="">
                {institutions.length === 0 ? "No school available" : "Select a school"}
              </option>
              {institutions.map((institution) => (
                <option key={institution.id} value={institution.id}>
                  {institution.name}
                </option>
              ))}
            </select>
            <small className="auth-field-hint">
              {role === "dentist"
                ? "The dentist will only see screening files created by staff of this school."
                : "Staff screenings will be stored under this school for partner dentists to review."}
            </small>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={isSubmitting || institutions.length === 0}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-footer-link">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </section>

      <aside className="auth-visual" aria-hidden="true">
        <div className="auth-visual-copy">
          <h2>Accounts are validated before access</h2>
          <p>
            We manually approve each staff and dentist account to protect children&apos;s health data
            and ensure only authorized personnel can access screening records.
          </p>
        </div>
      </aside>
    </div>
  );
}
