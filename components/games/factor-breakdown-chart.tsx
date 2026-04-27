"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { FactorBreakdownItem } from "@/lib/api/types";
import { favorsTone } from "@/lib/format";

/**
 * Factor breakdown — horizontal bars showing each factor's *signed*
 * contribution to log-odds (positive = favors home, negative = favors away).
 *
 * Multiplied by weight, so the bar magnitude is the *effective* shift each
 * factor produced. The longest bar tells you which factor moved the line
 * the most.
 */
export function FactorBreakdownChart({
  factors,
}: {
  factors: FactorBreakdownItem[];
}) {
  // Compute effective contribution = log_odds_delta * weight, sorted by |contribution|
  const data = React.useMemo(() => {
    return factors
      .map((f) => {
        const tone = favorsTone(f.favors);
        const sign = tone === "home" ? 1 : tone === "away" ? -1 : 0;
        const contribution = sign * Math.abs(f.log_odds_delta) * f.weight;
        return {
          name: humanize(f.factor),
          rawFactor: f.factor,
          tone,
          contribution: Number(contribution.toFixed(4)),
          weight: f.weight,
          confidence: f.confidence,
          delta: f.log_odds_delta,
        };
      })
      .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  }, [factors]);

  const max = Math.max(0.001, ...data.map((d) => Math.abs(d.contribution)));

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
          barCategoryGap={6}
        >
          <XAxis
            type="number"
            domain={[-max * 1.1, max * 1.1]}
            tick={false}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            axisLine={false}
            tickLine={false}
            tick={{
              fill: "hsl(var(--muted-foreground))",
              fontSize: 12,
              fontFamily: "var(--font-geist), sans-serif",
            }}
          />
          <Tooltip content={<FactorTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.4)" }} />
          <Bar dataKey="contribution" radius={[2, 2, 2, 2]} barSize={14}>
            {data.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.tone === "home"
                    ? "hsl(var(--home))"
                    : d.tone === "away"
                      ? "hsl(var(--away))"
                      : "hsl(var(--muted-foreground))"
                }
                fillOpacity={
                  // Confidence dims the bar — neutral or low-confidence
                  // factors look ghostly so they don't compete visually.
                  Math.max(0.25, d.confidence * 0.9 + 0.1)
                }
              />
            ))}
            <LabelList
              dataKey="contribution"
              position="right"
              formatter={(v: number) =>
                v === 0 ? "·" : `${v > 0 ? "+" : ""}${v.toFixed(3)}`
              }
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                fill: "hsl(var(--muted-foreground))",
              }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Legend />
    </div>
  );
}

function FactorTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: { name: string; contribution: number; weight: number; confidence: number; delta: number; tone: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-card p-3 text-xs shadow-md">
      <div className="font-display text-sm">{d.name}</div>
      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-0.5 font-mono tabular text-[11px]">
        <span className="text-muted-foreground">weight</span>
        <span>{(d.weight * 100).toFixed(0)}%</span>
        <span className="text-muted-foreground">log-odds Δ</span>
        <span>{d.delta.toFixed(3)}</span>
        <span className="text-muted-foreground">contribution</span>
        <span>
          {d.contribution > 0 ? "+" : ""}
          {d.contribution.toFixed(4)}
        </span>
        <span className="text-muted-foreground">confidence</span>
        <span>{(d.confidence * 100).toFixed(0)}%</span>
        <span className="text-muted-foreground">favors</span>
        <span className="capitalize">{d.tone}</span>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="mt-2 flex items-center justify-center gap-5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <span className="block h-2 w-2 rounded-sm bg-away" /> Favors away
      </span>
      <span className="flex items-center gap-1.5">
        <span className="block h-2 w-2 rounded-sm bg-home" /> Favors home
      </span>
      <span className="flex items-center gap-1.5">
        <span className="block h-2 w-2 rounded-sm bg-muted-foreground/60" /> Neutral
      </span>
    </div>
  );
}

function humanize(slug: string): string {
  const map: Record<string, string> = {
    starting_pitcher: "Starting Pitcher",
    team_offense: "Team Offense",
    bullpen: "Bullpen",
    lineup_vs_sp: "Lineup vs SP",
    situational: "Situational",
    defense: "Defense",
    weather: "Weather",
    ballpark: "Ballpark",
    umpire: "Umpire",
    injuries: "Injuries",
  };
  return map[slug] ?? slug.replace(/_/g, " ");
}
