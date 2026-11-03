export function PhaseBadge({ phase, label = "规划中" }: { phase: number; label?: string }) {
  return <span className="phase-badge">PHASE {String(phase).padStart(2, "0")}<span aria-hidden="true">·</span>{label}</span>;
}
