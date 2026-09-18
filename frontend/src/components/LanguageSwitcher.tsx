import { Languages } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./LanguageSwitcher.css";

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  return <div className="language-switcher" role="group" aria-label={t("Language")}><Languages size={16} aria-hidden="true" /><button type="button" className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>EN</button><button type="button" className={language === "ar" ? "active" : ""} onClick={() => setLanguage("ar")}>العربية</button></div>;
}
