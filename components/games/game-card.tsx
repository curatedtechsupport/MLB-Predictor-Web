import Link from "next/link";

import { Card, CardContent } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import type { Game, Prediction } from "@/lib/api/types";
import { gameTimeShort } from "@/lib/format";
import { WinProbBar } from "./win-prob-bar";
import { LiveStatusBadge } from "./live-status-badge";

export function GameCard({
  game,
  prediction,
}: {
  game: Game;
  prediction: Prediction | null;
}) {
  const home = game.home_team;
  const away = game.away_team;
  if (!home || !away) {
    // Shouldn't happen with proper ingest — guard anyway.
    return null;
  }

  const status = (game.status ?? "").toLowerCase();
  const isLive = status === "live";

  return (
    <Link
      href={`/games/${game.game_id}`}
      className="group focus-visible:outline-none"
    >
      <Card className="transition-all duration-200 hover:border-primary/40 group-focus-visible:ring-2 group-focus-visible:ring-ring">
        <CardContent className="flex flex-col gap-4 p-5">
          {/* Header row: time + status */}
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-xs text-muted-foreground tabular">
              {gameTimeShort(game.game_datetime)}
            </span>
            {isLive ? (
              <LiveStatusBadge
                gameId={game.game_id}
                initialStatus={game.status}
              />
            ) : (
              <span className="label">
                {status === "final"
                  ? "Final"
                  : game.lineup_official
                    ? "Lineup set"
                    : "Scheduled"}
              </span>
            )}
          </div>

          {/* Matchup */}
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-display text-lg leading-tight">
                <span className="text-away">{away.abbr}</span>
                <span className="text-muted-foreground"> @ </span>
                <span className="text-home">{home.abbr}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {away.name} at {home.name}
              </div>
            </div>
            {prediction?.confidence ? (
              <ConfidenceBadge
                label={prediction.confidence}
                score={prediction.confidence_score ?? null}
              />
            ) : null}
          </div>

          {/* Win prob */}
          {prediction ? (
            <WinProbBar
              homeAbbr={home.abbr}
              awayAbbr={away.abbr}
              homePct={prediction.home_win_pct}
              awayPct={prediction.away_win_pct}
              size="md"
            />
          ) : (
            <div className="text-xs text-muted-foreground italic">
              Prediction pending — generating…
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
