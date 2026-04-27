import { num } from "@/lib/format";

/**
 * The team-stats endpoint returns a single snapshot row, not a time series.
 * Until the backend exposes daily snapshots, we render a comparative bar
 * chart of season vs last-15 RPG plus league-average for context.
 *
 * MLB league average RPG is ~4.6 (2024). Hard-coding here is fine until the
 * backend exposes a `/teams/league-averages` endpoint.
 */
const LEAGUE_AVG_RPG = 4.6;

export function RollingRPGSparkline({
  seasonRpg,
  last15Rpg,
}: {
  seasonRpg: number | string | null | undefined;
  last15Rpg: number | string | null | undefined;
}) {
  const season = num(seasonRpg, 0);
  const last15 = num(last15Rpg, 0);
  const max = Math.max(season, last15, LEAGUE_AVG_RPG, 1) * 1.1;

  const Bar = ({
    label,
    value,
    accent,
  }: {
    label: string;
    value: number;
    accent?: string;
  }) => {
    const w = (value / max) * 100;
    return (
      <div className="flex items-center gap-3">
        <span className="label w-24 shrink-0">{label}</span>
        <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted/60">
          <div
            className="h-full rounded-full transition-[width] duration-700"
            style={{ width: `${w}%`, background: accent ?? "hsl(var(--primary))" }}
          />
        </div>
        <span className="w-12 text-right font-mono tabular text-sm">
          {value.toFixed(2)}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <Bar label="Season" value={season} accent="hsl(var(--primary))" />
      <Bar label="Last 15" value={last15} accent="hsl(var(--edge))" />
      <Bar
        label="League"
        value={LEAGUE_AVG_RPG}
        accent="hsl(var(--muted-foreground))"
      />
      <p className="pt-1 text-[11px] text-muted-foreground">
        Runs per game. Higher last-15 vs season → trending hot.
      </p>
    </div>
  );
}
