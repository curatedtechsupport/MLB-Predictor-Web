"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { MonteCarloSummary } from "@/lib/api/types";
import { num } from "@/lib/format";

/**
 * The MC summary returned by the backend currently exposes per-team win
 * distributions as `{ "0": 0.04, "1": 0.12, ... }` — counts of *games* won
 * across the simulation as a function of bin. Until the backend persists a
 * dedicated total-runs histogram, we render the *home* and *away* run-count
 * distributions as two stacked area curves: the spread between the curves
 * is the expected run differential.
 */
export function MonteCarloChart({
  monteCarlo,
  predictedTotal,
  predictedRunDiff,
}: {
  monteCarlo: MonteCarloSummary;
  predictedTotal?: number | string | null;
  predictedRunDiff?: number | string | null;
}) {
  const data = React.useMemo(() => {
    const homeKeys = Object.keys(monteCarlo.home_win_distribution || {});
    const awayKeys = Object.keys(monteCarlo.away_win_distribution || {});
    const allBins = Array.from(new Set([...homeKeys, ...awayKeys]))
      .map((k) => Number(k))
      .filter((k) => Number.isFinite(k))
      .sort((a, b) => a - b);

    return allBins.map((bin) => ({
      bin,
      home: (monteCarlo.home_win_distribution[String(bin)] ?? 0) * 100,
      away: (monteCarlo.away_win_distribution[String(bin)] ?? 0) * 100,
    }));
  }, [monteCarlo]);

  const total = num(predictedTotal, NaN);
  const diff = num(predictedRunDiff, NaN);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="label">Monte Carlo · {monteCarlo.iterations.toLocaleString()} iterations</span>
        </div>
        <div className="flex gap-6 font-mono text-sm tabular">
          <Stat label="Predicted total" value={Number.isFinite(total) ? total.toFixed(2) : "—"} />
          <Stat
            label="Run diff (H−A)"
            value={
              Number.isFinite(diff)
                ? `${diff > 0 ? "+" : ""}${diff.toFixed(2)}`
                : "—"
            }
          />
        </div>
      </div>

      <div className="mt-3 h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
          >
            <defs>
              <linearGradient id="awayFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--away))" stopOpacity={0.4} />
                <stop offset="100%" stopColor="hsl(var(--away))" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="homeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--home))" stopOpacity={0.45} />
                <stop offset="100%" stopColor="hsl(var(--home))" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" vertical={false} />
            <XAxis
              dataKey="bin"
              type="number"
              domain={["dataMin", "dataMax"]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              label={{
                value: "Runs scored",
                position: "insideBottom",
                offset: -6,
                fill: "hsl(var(--muted-foreground))",
                fontSize: 11,
              }}
            />
            <YAxis
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip
              content={<MCTooltip />}
              cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "2 4" }}
            />
            <Area
              type="monotone"
              dataKey="away"
              stroke="hsl(var(--away))"
              strokeWidth={1.5}
              fill="url(#awayFill)"
            />
            <Area
              type="monotone"
              dataKey="home"
              stroke="hsl(var(--home))"
              strokeWidth={1.5}
              fill="url(#homeFill)"
            />
            {Number.isFinite(total) ? (
              <ReferenceLine
                x={Math.round(total / 2)}
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="3 3"
                label={{
                  value: "μ/2",
                  position: "top",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 10,
                }}
              />
            ) : null}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MCTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: number;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-border bg-card p-2 text-xs shadow-md">
      <div className="font-mono tabular">
        <span className="text-muted-foreground">runs · </span>
        {label}
      </div>
      <div className="mt-1 space-y-0.5">
        {payload.map((p) => (
          <div key={p.name} className="flex items-center gap-2 font-mono tabular">
            <span
              className="block h-2 w-2 rounded-sm"
              style={{ background: p.color }}
            />
            <span className="capitalize text-muted-foreground">{p.name}</span>
            <span>{p.value.toFixed(2)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-end">
      <span className="label">{label}</span>
      <span className="text-base font-medium">{value}</span>
    </div>
  );
}
