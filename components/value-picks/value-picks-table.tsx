"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ValuePick } from "@/lib/api/types";
import { kelly, num, pct } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "edge" | "kelly" | "model" | "market";
type SortDir = "asc" | "desc";

export function ValuePicksTable({ picks }: { picks: ValuePick[] }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("edge");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const sorted = React.useMemo(() => {
    const valueOf = (p: ValuePick) => {
      switch (sortKey) {
        case "edge":
          return num(p.edge_pct, -Infinity);
        case "kelly":
          return num(p.kelly_fraction, -Infinity);
        case "model":
          return num(p.model_pct, -Infinity);
        case "market":
          return num(p.market_pct, -Infinity);
      }
    };
    const arr = [...picks].sort((a, b) => valueOf(a) - valueOf(b));
    if (sortDir === "desc") arr.reverse();
    return arr;
  }, [picks, sortKey, sortDir]);

  if (picks.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 p-12 text-center">
        <p className="font-display text-lg">No value picks match.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Loosen the minimum-edge filter or wait for tonight&apos;s lines to fully populate.
        </p>
      </div>
    );
  }

  const onSort = (k: SortKey) => {
    if (k === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(k);
      setSortDir("desc");
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Game</TableHead>
          <TableHead>Market</TableHead>
          <TableHead>Side</TableHead>
          <SortableHead
            label="Edge"
            active={sortKey === "edge"}
            dir={sortDir}
            onClick={() => onSort("edge")}
          />
          <SortableHead
            label="Kelly"
            active={sortKey === "kelly"}
            dir={sortDir}
            onClick={() => onSort("kelly")}
          />
          <SortableHead
            label="Model %"
            active={sortKey === "model"}
            dir={sortDir}
            onClick={() => onSort("model")}
          />
          <SortableHead
            label="Market %"
            active={sortKey === "market"}
            dir={sortDir}
            onClick={() => onSort("market")}
          />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((p) => (
          <TableRow key={p.pick_id}>
            <TableCell className="font-mono text-sm tabular">
              <a
                href={`/games/${p.game_id}`}
                className="text-foreground underline-offset-4 hover:text-primary hover:underline"
              >
                #{p.game_id}
              </a>
            </TableCell>
            <TableCell>
              <Badge variant="muted" className="capitalize">
                {p.bet_type ?? "—"}
              </Badge>
            </TableCell>
            <TableCell className="font-medium">{p.side ?? "—"}</TableCell>
            <TableCell className="text-edge tabular font-mono">
              +{num(p.edge_pct, 0).toFixed(2)}pp
            </TableCell>
            <TableCell className="tabular font-mono">
              {kelly(p.kelly_fraction)}
            </TableCell>
            <TableCell className="tabular font-mono text-muted-foreground">
              {pct(p.model_pct, 1)}
            </TableCell>
            <TableCell className="tabular font-mono text-muted-foreground">
              {pct(p.market_pct, 1)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortableHead({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <TableHead>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-1.5 hover:text-foreground transition-colors",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="h-3 w-3 opacity-70" />
      </button>
    </TableHead>
  );
}
