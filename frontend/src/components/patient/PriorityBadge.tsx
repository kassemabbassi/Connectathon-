import "./PriorityBadge.css";
import { useLanguage } from "../../context/LanguageContext";

type Priority = "clear" | "watch" | "urgent";

const LABELS: Record<Priority, string> = {
  clear: "Clear",
  watch: "Watch",
  urgent: "Urgent",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useLanguage();
  return <span className={`priority-badge priority-${priority}`}>{t(LABELS[priority])}</span>;
}
