"use client";

import * as React from "react";

import type { LiveGameTick } from "@/lib/api/types";
import { cn } from "@/lib/utils";
import {
  basesLabel,
  inningLabel,
  outsLabel,
} from "./live-format";

/**
 * One-line play strip that summarizes the current state and narrates the
 * last resolved play. Lives directly under the win-prob gauge on the
 * detail page.
 *
 *  Format:
 *    [T5 · 1 out · runner on 2nd]   "Mookie Betts singles to right."
 *
 *  - Status block uses Geist Mono — terminal cadence.
 *  - Quote uses Newsreader italic — editorial cadence.
 *  - When the last play changes between renders we briefly highlight the
 *    quote (one-shot animation) so the eye catches the update without
 *    needing constant motion.
 */
export function LivePlayStrip({
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
  const lastPlayRef = React.useRef<string | null>(null);
  const [bumpKey, setBumpKey] = React.useState(0);

  React.useEffect(() => {
    const next = tick?.last_play ?? null;
    if (next && next !== lastPlayRef.current) {
      lastPlayRef.current = next;
      setBumpKey((k) => k + 1);
    }
  }, [tick?.last_play]);

  if (!tick) {
    return (
      <div
        className={cn(
          "rounded-md border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground",
          className,
        )}
      >
        Waiting for first pitch…
      </div>
    );
  }

  const inn = inningLabel(tick.inning, tick.half);
  const outs = outsLabel(tick.outs);
  const bases = basesLabel(tick.base_state);
  const score = `${awayAbbr} ${tick.score_away} · ${homeAbbr} ${tick.score_home}`;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-md border border-border/60 bg-card/60 px-4 py-3 sm:flex-row sm:items-center sm:gap-4",
        className,
      )}
      aria-live="polite"
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-wider text-muted-foreground">
        <span className="tabular text-foreground">{inn}</span>
        <span aria-hidden>·</span>
        <span className="tabular">{outs}</span>
        <span aria-hidden>·</span>
        <span>{bases}</span>
        <span aria-hidden>·</span>
        <span className="tabular text-foreground">{score}</span>
      </div>

      {tick.last_play ? (
        <p
          key={bumpKey}
          className="flex-1 animate-fade-up font-display text-base italic leading-snug text-foreground/90"
        >
          &ldquo;{tick.last_play}&rdquo;
        </p>
      ) : (
        <p className="flex-1 text-sm text-muted-foreground">
          {tick.is_final ? "Game final." : "Awaiting play resolution…"}
        </p>
      )}
    </div>
  );
}
