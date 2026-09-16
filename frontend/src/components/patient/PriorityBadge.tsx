import "./PriorityBadge.css";

type Priority = "clear" | "watch" | "urgent";

const LABELS: Record<Priority, string> = {
  clear: "Clear",
  watch: "Watch",
  urgent: "Urgent",
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`priority-badge priority-${priority}`}>{LABELS[priority]}</span>;
}