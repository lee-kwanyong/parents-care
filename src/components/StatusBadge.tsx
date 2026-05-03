type StatusBadgeProps = {
  label: string;
  tone?: "safe" | "warn" | "danger" | "neutral";
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const className = tone === "safe" ? "badge" : `badge ${tone}`;
  return <span className={className}>{label}</span>;
}
