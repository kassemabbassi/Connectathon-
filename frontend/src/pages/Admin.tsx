import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Building2, UserPlus } from "lucide-react";
import logo from "../assets/logo.png";
import { UserMenu } from "../components/auth/UserMenu";
import { useLanguage } from "../context/LanguageContext";
import {
  AuthApiError,
  createInstitution,
  createUserAccount,
  fetchAdminUsers,
  fetchInstitutions,
  type AuthUser,
  type Institution,
} from "../lib/authApi";
import "./Auth.css";
import "./Admin.css";

export function Admin() {
  const { t } = useLanguage();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [institutionName, setInstitutionName] = useState("");
  const [institutionMessage, setInstitutionMessage] = useState<string | null>(null);
  const [institutionError, setInstitutionError] = useState<string | null>(null);
  const [savingInstitution, setSavingInstitution] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"staff" | "dentist">("staff");
  const [institutionId, setInstitutionId] = useState("");
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [savingUser, setSavingUser] = useState(false);

  async function reload() {
    const [nextInstitutions, nextUsers] = await Promise.all([
      fetchInstitutions(),
      fetchAdminUsers(),
    ]);
    setInstitutions(nextInstitutions);
    setUsers(nextUsers);
    setInstitutionId((current) => {
      if (current && nextInstitutions.some((item) => item.id === current)) return current;
      return nextInstitutions[0]?.id || "";
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        await reload();
        if (!cancelled) setLoadError(null);
      } catch {
        if (!cancelled) setLoadError(t("Unable to load institutions and accounts."));
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInstitutionError(null);
    setInstitutionMessage(null);
    setSavingInstitution(true);
    try {
      const created = await createInstitution(institutionName.trim());
      setInstitutionName("");
      setInstitutions((current) => {
        if (current.some((item) => item.id === created.id)) return current;
        return [...current, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setInstitutionId(created.id);
      setInstitutionMessage(
        `${created.name} was added. Previous institutions are kept — you can work with several schools.`,
      );
      await reload();
      setInstitutionMessage(t("Institution added. Previous institutions are kept, so you can work with several schools."));
    } catch (caught) {
      setInstitutionError(caught instanceof AuthApiError ? caught.message : t("Unable to add this institution."));
    } finally {
      setSavingInstitution(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUserError(null);
    setUserMessage(null);

    if (!institutionId) {
      setUserError(t("Add an institution first, then create the account."));
      return;
    }

    setSavingUser(true);
    try {
      const response = await createUserAccount({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role,
        institution_id: institutionId,
      });
      setFullName("");
      setEmail("");
      setPassword("");
      setUserMessage(`${response.user.full_name} can now sign in as ${response.user.role}.`);
      await reload();
      setUserMessage(t("Account created. The user can now sign in."));
    } catch (caught) {
      setUserError(caught instanceof AuthApiError ? caught.message : t("Unable to create this account."));
    } finally {
      setSavingUser(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-header">
        <div className="admin-header-inner">
          <Link to="/" className="admin-brand">
            <img src={logo} alt="SpotEarly logo" />
            <span>{t("SpotEarly Admin")}</span>
          </Link>
          <UserMenu />
        </div>
      </header>

      <main className="admin-main">
        <div className="admin-heading">
          <p className="screening-eyebrow">{t("Platform administration")}</p>
          <h1>{t("Institutions and accounts")}</h1>
          <p>{t("Only administrators can add schools and create staff or dentist logins. You can add as many institutions as you need; each new school is added to the list and previous ones stay.")}</p>
        </div>

        {loadError && <p className="auth-error">{loadError}</p>}

        <div className="admin-grid">
          <section className="admin-card">
            <div className="admin-card-head">
              <Building2 size={20} />
              <div>
                <p className="dashboard-kicker">{t("Schools")}</p>
                <h2>{t("Add an institution")}</h2>
                <p className="admin-card-note">{t("Saved institutions")}: {institutions.length}. {t("New ones are added, never replaced.")}</p>
              </div>
            </div>
            <form className="auth-form admin-form" onSubmit={handleCreateInstitution}>
              {institutionError && <p className="auth-error">{institutionError}</p>}
              {institutionMessage && <p className="auth-success">{institutionMessage}</p>}
              <label className="auth-field">
                <span>{t("Institution name")}</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={institutionName}
                  onChange={(event) => setInstitutionName(event.target.value)}
                  placeholder={t("e.g. École Pilote Monastir")}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={savingInstitution}>
                {savingInstitution ? t("Adding…") : t("Add institution")}
              </button>
            </form>
            <ul className="admin-list">
              {institutions.length === 0 ? (
                <li className="admin-empty">{t("No institution yet. Add one before creating accounts.")}</li>
              ) : (
                institutions.map((institution) => (
                  <li key={institution.id}>
                    <strong>{institution.name}</strong>
                    <small>{t(institution.status ?? "active")}</small>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="admin-card">
            <div className="admin-card-head">
              <UserPlus size={20} />
              <div>
                <p className="dashboard-kicker">{t("Users")}</p>
                <h2>{t("Create a staff or dentist account")}</h2>
              </div>
            </div>
            <form className="auth-form admin-form" onSubmit={handleCreateUser}>
              {userError && <p className="auth-error">{userError}</p>}
              {userMessage && <p className="auth-success">{userMessage}</p>}
              <label className="auth-field">
                <span>{t("Full name")}</span>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
              <label className="auth-field">
                <span>{t("Email")}</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="user@school.tn"
                />
              </label>
              <label className="auth-field">
                <span>{t("Temporary password")}</span>
                <input
                  type="text"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t("At least 8 characters")}
                />
              </label>
              <div className="auth-field">
                <span>{t("Role")}</span>
                <div className="auth-role-group">
                  <label className={`auth-role-option ${role === "staff" ? "is-selected" : ""}`}>
                    <input type="radio" name="admin-role" checked={role === "staff"} onChange={() => setRole("staff")} />
                    <strong>{t("Staff")}</strong>
                    <small>{t("Runs screenings at the school.")}</small>
                  </label>
                  <label className={`auth-role-option ${role === "dentist" ? "is-selected" : ""}`}>
                    <input type="radio" name="admin-role" checked={role === "dentist"} onChange={() => setRole("dentist")} />
                    <strong>{t("Dentist")}</strong>
                    <small>{t("Reviews that school's files.")}</small>
                  </label>
                </div>
              </div>
              <label className="auth-field">
                <span>{t("Institution")}</span>
                <select
                  required
                  value={institutionId}
                  onChange={(event) => setInstitutionId(event.target.value)}
                  disabled={institutions.length === 0}
                >
                  {institutions.length === 0 ? (
                    <option value="">{t("Add an institution first")}</option>
                  ) : (
                    institutions.map((institution) => (
                      <option key={institution.id} value={institution.id}>
                        {institution.name}
                      </option>
                    ))
                  )}
                </select>
              </label>
              <button type="submit" className="btn btn-primary" disabled={savingUser || institutions.length === 0}>
                {savingUser ? t("Creating…") : t("Create account")}
              </button>
            </form>
            <ul className="admin-list">
              {users.length === 0 ? (
                <li className="admin-empty">{t("No staff or dentist accounts yet.")}</li>
              ) : (
                users.map((account) => (
                  <li key={account.id}>
                    <strong>{account.full_name}</strong>
                    <small>
                      {t(account.role)} · {account.institution_name || t("No institution")} · {account.email}
                    </small>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
