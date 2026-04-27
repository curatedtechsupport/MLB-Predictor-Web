import { Info } from "lucide-react";

import { Badge } from "@/components/ui/badge";

/**
 * The current backend doesn't expose a `/teams/{id}/bullpen-fatigue` endpoint.
 * Bullpen fatigue is tracked per-reliever in the `bullpen_fatigue` table and
 * factors into game predictions, but isn't surfaced as a team-level read.
 *
 * Surfacing this requires backend work — see M6.5 / tech-debt section in the
 * resume prompt. Until then, this component shows a clear placeholder that
 * tells the user the data isn't yet directly available.
 */
export function BullpenFatigueTable() {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-5">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm">
            Per-reliever bullpen fatigue is tracked server-side and influences
            predictions, but isn&apos;t yet exposed as a team-level read.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pending: <code>GET /api/v1/teams/{`{id}`}/bullpen-fatigue</code>
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Same situation: injuries are stored in the `injuries` table and consumed
 * by the injuries factor, but there's no dedicated read endpoint yet.
 */
export function InjuriesList() {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-5">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm">
            Active injuries are ingested from the MLB transactions API and
            applied to each prediction&apos;s injuries factor.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pending endpoint: <code>GET /api/v1/teams/{`{id}`}/injuries</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export function LastTenResults() {
  return (
    <div className="rounded-md border border-dashed border-border/60 bg-muted/20 p-5">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm">
            Last-10 game results are stored in the <code>games</code> table
            but require a dedicated query endpoint.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Pending: <code>GET /api/v1/teams/{`{id}`}/games?limit=10</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export function StatChip({
  label,
  value,
  variant,
}: {
  label: string;
  value: string;
  variant?: "default" | "muted";
}) {
  return (
    <Badge variant={variant ?? "muted"} className="font-mono tabular text-xs">
      <span className="opacity-70">{label}</span>
      <span className="ml-1">{value}</span>
    </Badge>
  );
}
