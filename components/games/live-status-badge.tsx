"use client";

import * as React from "react";

import { useLiveGame } from "@/lib/api/useLiveGame";
import { cn } from "@/lib/utils";
import { compactLiveLabel, isInProgress } from "./live-format";

/**
 * Tiny live overlay that drops onto a GameCard. Subscribes to the
 * per-game SSE stream when `initialStatus === "live"` and renders a
 * pulsing red dot + compact "LIVE · T5 · 3-2" label.
 *
 *  Why subscribe per card: the backend's broker dedupes by game_id and
 *  fans out to up to 50 subscribers, so even a 15-game slate sits well
 *  under the cap. The bandwidth overhead is one heartbeat/15s per card
 *  plus one tick per resolved play — trivial.
 *
 *  We deliberately don't subscribe for non-live games. Pre-game
 *  subscriptions would still work (the broker can pre-game stream a
 *  status-only payload) but the slate card has nothing useful to render
 *  with that data, and we'd double-up traffic for no benefit.
 */
export function LiveStatusBadge({
  gameId,
  initialStatus,
  className,
}: {
  gameId: number;
  /** The `Game.status` value from the server-rendered slate. */
  initialStatus: string | null | undefined;
  className?: string;
}) {
  const isLiveServer = (initialStatus ?? "").toLowerCase() === "live";
  const { tick } = useLiveGame(gameId, { enabled: isLiveServer });

  // Hide entirely if the server didn't say live and we don't have a
  // tick that says we're in progress. The most common path is "live" →
  // subscribe → tick arrives → render. The fallback path (server hasn't
  // refreshed yet but a tick is already in progress) is unlikely because
  // we only subscribe when isLiveServer is true; including it as a
  // belt-and-braces.
  const live = isLiveServer || isInProgress(tick);
  if (!live) return null;

  // If we have a tick, prefer the rich label. Otherwise fall back to
  // a plain "LIVE" until the first tick arrives.
  const label = tick ? compactLiveLabel(tick) : "LIVE";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-red-500",
        className,
      )}
      aria-live="polite"
      aria-label={`Live game ${label}`}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
      </span>
      <span className="tabular">{label}</span>
    </span>
  );
}
