"use client";

import * as React from "react";

import type { LiveGameTick } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import { inningLabel } from "./live-format";

/**
 * A linear marker timeline below the Monte Carlo chart. Each time the
 * incoming tick's inning OR half changes from what we've already
 * recorded, we push a new marker showing that half-inning's terminal
 * win probability.
 *
 * State is kept in component state — not persisted. The first time the
 * user lands on the page mid-game, we'll only have markers for the rest
 * of the game. That's intentional: the persistence story (a true play
 * log) lives in the backtest pipeline, not the live UI.
 */

interface Marker {
  key: string; // `${inning}-${half}` so it's stable across renders
  inning: number;
  half: string | null | undefined;
  homePct: number;
  awayPct: number;
  ts: string;
}

export function InningTimeline({
  tick,
  homeAbbr,
  awayAbbr,
  className,
}: {
  tick: LiveGameTick | null;
  homeAbbr: string;
  awayAbbr: string;
  className?: string;
}) {
  const [markers, setMarkers] = React.useState<Marker[]>([]);

  React.useEffect(() => {
    if (!tick || tick.inning == null) return;
    const key = `${tick.inning}-${tick.half ?? ""}`;
    setMarkers((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.key === key) {
        // Same half-inning — replace the trailing marker with the latest
        // probability so the rendered line traces the *terminal* state
        // of each half-inning rather than the first pitch.
        const next = prev.slice(0, -1);
        next.push({
          key,
          inning: tick.inning!,
          half: tick.half,
          homePct: tick.home_win_pct,
          awayPct: tick.away_win_pct,
          ts: tick.ts,
        });
        return next;
      }
      // New half-inning — append.
      return [
        ...prev,
        {
          key,
          inning: tick.inning!,
          half: tick.half,
          homePct: tick.home_win_pct,
          awayPct: tick.away_win_pct,
          ts: tick.ts,
        },
      ];
    });
  }, [tick]);

  if (markers.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-border/60 px-4 py-3 text-xs text-muted-foreground",
          className,
        )}
      >
        Win-probability timeline will populate as the game progresses.
      </div>
    );
  }

  // Map percentages to a 0..1 vertical position (50% = middle) for a
  // simple sparkline-style polyline. We render home_win_pct since the
  // gauge is home-centric; values are 0..100.
  const W = 100; // viewBox width — px-agnostic
  const H = 30; // viewBox height
  const stepX = markers.length > 1 ? W / (markers.length - 1) : W;
  const points = markers
    .map((m, i) => {
      const x = (markers.length > 1 ? i * stepX : W / 2).toFixed(2);
      // Higher home_win_pct → closer to the top of the SVG (y=0).
      const y = (((100 - m.homePct) / 100) * H).toFixed(2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between">
        <span className="label">Half-inning timeline</span>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <span className="text-home">{homeAbbr}</span> win % · top↑
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-12 w-full"
        role="img"
        aria-label="Half-inning win probability timeline"
      >
        {/* 50% midline */}
        <line
          x1={0}
          x2={W}
          y1={H / 2}
          y2={H / 2}
          stroke="hsl(var(--border))"
          strokeWidth={0.5}
          strokeDasharray="1 2"
        />
        <polyline
          points={points}
          fill="none"
          stroke="hsl(var(--home))"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        {markers.map((m, i) => {
          const x = markers.length > 1 ? i * stepX : W / 2;
          const y = ((100 - m.homePct) / 100) * H;
          return (
            <circle
              key={m.key + i}
              cx={x}
              cy={y}
              r={1.2}
              fill="hsl(var(--home))"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[11px] tabular text-muted-foreground">
        {markers.map((m) => (
          <span
            key={m.key}
            className="inline-flex items-baseline gap-1"
            title={`${m.awayPct.toFixed(1)}% / ${m.homePct.toFixed(1)}%`}
          >
            <span className="text-foreground">{inningLabel(m.inning, m.half)}</span>
            <span className="text-home">{m.homePct.toFixed(0)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}
