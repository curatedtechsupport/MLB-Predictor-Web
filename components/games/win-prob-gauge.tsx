import { num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A semicircular dual-arc gauge. The away team fills the left half (counter-
 * clockwise from 9 o'clock to 12 o'clock), the home team fills the right
 * (12 o'clock to 3). Numbers stay tabular and large.
 *
 *  width / height ratio is locked to 2:1 (semicircle) — gauge is responsive
 *  via SVG viewBox.
 *
 *  M6.5: when `liveHomePct` / `liveAwayPct` are provided, the gauge reads
 *  those values instead of the static prediction and a small "LIVE" pill
 *  appears above the percentage. The arcs animate (CSS transition on
 *  `stroke-dasharray`) over 600ms so consecutive ticks feel continuous,
 *  not jumpy.
 */
export function WinProbGauge({
  homeAbbr,
  awayAbbr,
  homePct,
  awayPct,
  liveHomePct,
  liveAwayPct,
  isLive = false,
  className,
}: {
  homeAbbr: string;
  awayAbbr: string;
  homePct: number | string;
  awayPct: number | string;
  /** When provided, overrides homePct for the rendered arc. */
  liveHomePct?: number | string | null;
  /** When provided, overrides awayPct for the rendered arc. */
  liveAwayPct?: number | string | null;
  /** When true, displays the LIVE indicator chip. */
  isLive?: boolean;
  className?: string;
}) {
  const liveHome =
    liveHomePct !== undefined && liveHomePct !== null
      ? num(liveHomePct)
      : null;
  const liveAway =
    liveAwayPct !== undefined && liveAwayPct !== null
      ? num(liveAwayPct)
      : null;

  const home = Math.max(
    0,
    Math.min(100, liveHome !== null ? liveHome : num(homePct)),
  );
  const away = Math.max(
    0,
    Math.min(100, liveAway !== null ? liveAway : num(awayPct)),
  );

  const dominantSide = home >= away ? "home" : "away";
  const dominantAbbr = dominantSide === "home" ? homeAbbr : awayAbbr;
  const dominantPct = dominantSide === "home" ? home : away;

  // Arc geometry. We draw two strokes that together form a semicircle.
  // Each side is a quarter-arc (90deg) at 100%; we scale to actual %.
  const r = 80;
  const cx = 100;
  const cy = 100;
  // Path length of a half-circle of radius r
  const halfCircumference = Math.PI * r;
  // Each side gets at most halfCircumference/2 (a quarter arc)
  const quarter = halfCircumference / 2;
  const awayLen = (away / 100) * quarter;
  const homeLen = (home / 100) * quarter;

  // Slightly faster transition than the bar (600ms) — feels right for the
  // larger geometric change as the gauge swings between two values.
  const arcTransition = "stroke-dasharray 600ms ease-out";

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {isLive ? (
        <span
          className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-red-500"
          aria-live="polite"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
          </span>
          Live
        </span>
      ) : null}

      <svg
        viewBox="0 0 200 110"
        className="h-auto w-full max-w-md"
        role="img"
        aria-label={`${awayAbbr} ${away.toFixed(1)}%, ${homeAbbr} ${home.toFixed(1)}%`}
      >
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={14}
          strokeLinecap="round"
        />
        {/* Away arc — left side, drawn from center to 9 o'clock */}
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx - r} ${cy}`}
          fill="none"
          stroke="hsl(var(--away))"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${awayLen} ${quarter}`}
          // Fill direction: from center outward = path start is center
          pathLength={quarter}
          style={{ transition: arcTransition }}
        />
        {/* Home arc — right side, drawn from center to 3 o'clock */}
        <path
          d={`M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="hsl(var(--home))"
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={`${homeLen} ${quarter}`}
          pathLength={quarter}
          style={{ transition: arcTransition }}
        />
        {/* Center hairline */}
        <line
          x1={cx}
          y1={cy - r - 6}
          x2={cx}
          y2={cy - r + 6}
          stroke="hsl(var(--foreground))"
          strokeWidth={1}
          strokeOpacity={0.4}
        />
        {/* Big % readout */}
        <text
          x={cx}
          y={cy - 30}
          textAnchor="middle"
          className={cn(
            "font-display tabular",
            dominantSide === "home" ? "fill-home" : "fill-away",
          )}
          style={{ fontSize: 26, fontWeight: 600 }}
        >
          {dominantPct.toFixed(1)}%
        </text>
        <text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          className="fill-muted-foreground font-mono"
          style={{ fontSize: 8, letterSpacing: 1.4 }}
        >
          {dominantAbbr.toUpperCase()} TO WIN
        </text>
      </svg>
      <div className="-mt-2 flex w-full max-w-md justify-between font-mono text-xs">
        <span className="text-away tabular">
          {awayAbbr} · {pct(away)}
        </span>
        <span className="text-home tabular">
          {homeAbbr} · {pct(home)}
        </span>
      </div>
    </div>
  );
}
