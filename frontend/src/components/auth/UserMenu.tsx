import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./UserMenu.css";
import { useLanguage } from "../../context/LanguageContext";
import { LanguageSwitcher } from "../LanguageSwitcher";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  if (!user) return null;

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="user-menu">
      <LanguageSwitcher />
      <div className="user-menu-meta">
        <span className="user-menu-name">{user.full_name}</span>
        <span className="user-menu-role">{user.role}</span>
      </div>
      <button type="button" className="user-menu-logout" onClick={handleLogout}>
        <LogOut size={15} /> {t("Sign out")}
      </button>
    </div>
  );
}
