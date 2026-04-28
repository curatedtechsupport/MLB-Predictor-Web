"use client";

import * as React from "react";

import { useLiveGame } from "@/lib/api/useLiveGame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WinProbGauge } from "./win-prob-gauge";
import { LivePlayStrip } from "./live-play-strip";
import { InningTimeline } from "./inning-timeline";
import { isInProgress } from "./live-format";

/**
 * Client wrapper that owns the SSE subscription for the detail page and
 * renders the gauge + play strip + half-inning timeline as one cohesive
 * unit. Server-rendered initial values come in as `initialHomePct` /
 * `initialAwayPct`; once the first tick lands they're superseded.
 *
 *  We also expose `tick.home_win_pct` to the timeline so the timeline can
 *  read directly from the same source of truth as the gauge.
 *
 *  Why a client wrapper instead of pushing `useLiveGame` into the gauge
 *  itself: keeping the gauge a pure presentational component lets the
 *  team page, slate cards, and any future consumers reuse it without
 *  pulling in the EventSource lifecycle.
 */
export function LiveGameSection({
  gameId,
  homeAbbr,
  awayAbbr,
  initialHomePct,
  initialAwayPct,
  /**
   * Whether to subscribe at all. The detail page passes `true` whenever
   * the prediction status isn't a final state — we still subscribe for
   * "Scheduled" because a game can transition to live while the user is
   * sitting on the page, and the broker will simply emit a status tick
   * as soon as the feed reports it.
   */
  enabled = true,
}: {
  gameId: number;
  homeAbbr: string;
  awayAbbr: string;
  initialHomePct: number;
  initialAwayPct: number;
  enabled?: boolean;
}) {
  const { tick, status } = useLiveGame(gameId, { enabled });

  const live = isInProgress(tick) || (tick?.is_final ?? false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Win probability</CardTitle>
          {tick ? (
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {tick.is_final
                ? "Final"
                : status === "live"
                  ? `Updating · ${humanStatus(status)}`
                  : humanStatus(status)}
            </span>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-4">
          <WinProbGauge
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
            homePct={initialHomePct}
            awayPct={initialAwayPct}
            liveHomePct={tick?.home_win_pct ?? null}
            liveAwayPct={tick?.away_win_pct ?? null}
            isLive={live && !tick?.is_final}
          />
          <LivePlayStrip
            tick={tick}
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-4">
          <InningTimeline
            tick={tick}
            homeAbbr={homeAbbr}
            awayAbbr={awayAbbr}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function humanStatus(s: "connecting" | "live" | "closed" | "error"): string {
  switch (s) {
    case "connecting":
      return "Connecting…";
    case "live":
      return "Live";
    case "closed":
      return "Disconnected";
    case "error":
      return "Reconnecting…";
  }
}
