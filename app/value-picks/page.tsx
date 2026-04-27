"use client";

import * as React from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResponsibleGamblingBanner } from "@/components/responsible-gambling-banner";
import { ValuePicksTable } from "@/components/value-picks/value-picks-table";
import { useValuePicksToday } from "@/lib/api/queries";
import type { ValuePicksFilters } from "@/lib/api/client";
import { Skeleton } from "@/components/ui/atoms";

const BOOKS: { value: string; label: string }[] = [
  { value: "all", label: "All books" },
  { value: "draftkings", label: "DraftKings" },
  { value: "fanduel", label: "FanDuel" },
  { value: "betmgm", label: "BetMGM" },
  { value: "caesars", label: "Caesars" },
  { value: "pointsbet", label: "PointsBet" },
  { value: "barstool", label: "Barstool" },
];

const BET_TYPES: { value: string; label: string }[] = [
  { value: "all", label: "All markets" },
  { value: "moneyline", label: "Moneyline" },
  { value: "total", label: "Total (O/U)" },
  { value: "spread", label: "Run line" },
];

function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export default function ValuePicksPage() {
  const [minEdgeRaw, setMinEdgeRaw] = React.useState("3");
  const [betType, setBetType] = React.useState("all");
  const [book, setBook] = React.useState("all");

  const minEdge = useDebounced(minEdgeRaw, 250);

  const filters = React.useMemo<ValuePicksFilters>(() => {
    const f: ValuePicksFilters = {};
    const n = Number(minEdge);
    if (Number.isFinite(n) && n >= 0) f.min_edge = n;
    if (betType !== "all") f.bet_type = betType as ValuePicksFilters["bet_type"];
    if (book !== "all") f.book = book;
    return f;
  }, [minEdge, betType, book]);

  const { data, isLoading, isError, error } = useValuePicksToday(filters);

  return (
    <div className="container py-10">
      <header className="mb-6 flex flex-col gap-3">
        <span className="label">Today · Value Picks</span>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Where the model disagrees with the market.
        </h1>
        <p className="max-w-prose text-muted-foreground">
          Picks are flagged when our model probability beats the de-vigged
          consensus by at least three percentage points <em>and</em> the
          prediction confidence is medium or high. Kelly fractions are
          server-capped at 25 % of bankroll.
        </p>
      </header>

      <div className="mb-6">
        <ResponsibleGamblingBanner />
      </div>

      {/* Filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-[160px,200px,200px]">
        <div className="flex flex-col gap-1">
          <label htmlFor="min-edge" className="label">
            Min edge (pp)
          </label>
          <Input
            id="min-edge"
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.5}
            value={minEdgeRaw}
            onChange={(e) => setMinEdgeRaw(e.target.value)}
            className="tabular font-mono"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="bet-type">Market</label>
          <Select value={betType} onValueChange={setBetType}>
            <SelectTrigger id="bet-type">
              <SelectValue placeholder="All markets" />
            </SelectTrigger>
            <SelectContent>
              {BET_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="label" htmlFor="book">Book</label>
          <Select value={book} onValueChange={setBook}>
            <SelectTrigger id="book">
              <SelectValue placeholder="All books" />
            </SelectTrigger>
            <SelectContent>
              {BOOKS.map((b) => (
                <SelectItem key={b.value} value={b.value}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-80" />
      ) : isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-6 text-sm text-destructive">
          Couldn&apos;t load value picks: {(error as Error)?.message ?? "unknown error"}
        </div>
      ) : (
        <ValuePicksTable picks={data ?? []} />
      )}
    </div>
  );
}
