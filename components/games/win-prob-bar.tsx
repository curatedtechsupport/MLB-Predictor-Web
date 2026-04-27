import { num } from "@/lib/format";
import { cn } from "@/lib/utils";

export function WinProbBar({
  homeAbbr,
  awayAbbr,
  homePct,
  awayPct,
  size = "md",
  className,
}: {
  homeAbbr: string;
  awayAbbr: string;
  homePct: number | string;
  awayPct: number | string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const home = Math.max(0, Math.min(100, num(homePct)));
  const away = Math.max(0, Math.min(100, num(awayPct)));
  // Normalize so the two bars together always span 100%.
  const total = home + away || 1;
  const homeW = (home / total) * 100;
  const awayW = (away / total) * 100;

  const heights = { sm: "h-2", md: "h-3", lg: "h-4" };
  const text = { sm: "text-xs", md: "text-sm", lg: "text-base" };

  return (
    <div className={cn("w-full", className)}>
      <div className={cn("flex items-baseline justify-between font-mono", text[size])}>
        <span className="flex items-center gap-2">
          <span className="font-display font-medium not-italic">{awayAbbr}</span>
          <span className="tabular text-away">{away.toFixed(1)}%</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="tabular text-home">{home.toFixed(1)}%</span>
          <span className="font-display font-medium not-italic">{homeAbbr}</span>
        </span>
      </div>
      <div
        className={cn(
          "mt-1.5 flex w-full overflow-hidden rounded-full bg-muted/60",
          heights[size],
        )}
        role="progressbar"
        aria-valuenow={home}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-away transition-[width] duration-700 ease-out"
          style={{ width: `${awayW}%` }}
        />
        <div
          className="h-full bg-home transition-[width] duration-700 ease-out"
          style={{ width: `${homeW}%` }}
        />
      </div>
    </div>
  );
}
