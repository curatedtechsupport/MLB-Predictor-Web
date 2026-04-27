import { Sparkle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ValuePick } from "@/lib/api/types";
import { kelly, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

export function ValuePicksPanel({ picks }: { picks: ValuePick[] }) {
  if (picks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 p-5 text-sm text-muted-foreground">
        No flagged value picks for this game. The model is in line with the market.
      </div>
    );
  }

  // Sort by edge desc
  const sorted = [...picks].sort(
    (a, b) => num(b.edge_pct, 0) - num(a.edge_pct, 0),
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {sorted.map((p) => (
        <ValuePickCard key={p.pick_id} pick={p} />
      ))}
    </div>
  );
}

function ValuePickCard({ pick }: { pick: ValuePick }) {
  const edge = num(pick.edge_pct, 0);
  return (
    <Card className={cn("border-edge/40 bg-edge/5")}>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="label flex items-center gap-1">
            <Sparkle className="h-3 w-3 text-edge" />
            {pick.bet_type ?? "—"}
          </span>
          <Badge variant="edge">+{edge.toFixed(2)}pp edge</Badge>
        </div>
        <div className="font-display text-2xl font-medium tracking-tight">
          {pick.side ?? "—"}
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-xs tabular text-muted-foreground">
          <Stat label="Model" value={pct(pick.model_pct)} />
          <Stat label="Market" value={pct(pick.market_pct)} />
          <Stat label="Kelly" value={kelly(pick.kelly_fraction)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
