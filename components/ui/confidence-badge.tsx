import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { confidenceTone, num, pct } from "@/lib/format";

export function ConfidenceBadge({
  label,
  score,
  className,
}: {
  label?: string | null;
  score?: number | string | null;
  className?: string;
}) {
  const tone = confidenceTone(label);
  const variant =
    tone === "high"
      ? "success"
      : tone === "medium"
        ? "warn"
        : tone === "low"
          ? "muted"
          : "muted";
  const display = label ? label.toUpperCase() : "—";
  const scoreNum = score === null || score === undefined ? null : num(score);
  return (
    <Badge variant={variant} className={cn("uppercase", className)}>
      {display}
      {scoreNum !== null && Number.isFinite(scoreNum) ? (
        <span className="font-mono opacity-80">· {pct(scoreNum, 0)}</span>
      ) : null}
    </Badge>
  );
}
