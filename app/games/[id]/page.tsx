import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import {
  getOddsForGame,
  getPredictionBreakdown,
  getValuePicksForGame,
} from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceBadge } from "@/components/ui/confidence-badge";
import { FactorBreakdownChart } from "@/components/games/factor-breakdown-chart";
import { LiveGameSection } from "@/components/games/live-game-section";
import { MarketLinesTable } from "@/components/games/market-lines-table";
import { MonteCarloChart } from "@/components/games/monte-carlo-chart";
import { ValuePicksPanel } from "@/components/games/value-picks-panel";
import type { MarketComparison } from "@/lib/api/types";
import { gameTime, num, pct } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 60;

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return { title: "Game" };
  try {
    const bd = await getPredictionBreakdown(id);
    if (!bd) return { title: "Game" };
    return {
      title: `${bd.away_team.abbr} @ ${bd.home_team.abbr}`,
    };
  } catch {
    return { title: "Game" };
  }
}

export default async function GameDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  // Fetch breakdown, odds, value picks in parallel — single await wave.
  const [breakdown, odds, picks] = await Promise.all([
    getPredictionBreakdown(id),
    getOddsForGame(id),
    getValuePicksForGame(id),
  ]);

  if (!breakdown) notFound();

  const { home_team, away_team, prediction, factor_breakdown, monte_carlo, market_comparison } =
    breakdown;

  const homePct = num(prediction.home_win_pct);
  const awayPct = num(prediction.away_win_pct);

  // We let the client subscribe whenever the game *might* be live or about
  // to be. The hook itself is cheap when the backend says Final — backend
  // emits one tick + closes, hook tears down. This means a final-game
  // page still gets a clean "Final" badge without an error toast.
  return (
    <div className="container py-8 md:py-10">
      {/* Back link */}
      <Link
        href="/games/today"
        className="label inline-flex items-center gap-1 hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" /> Today&apos;s slate
      </Link>

      {/* Header */}
      <header className="mt-3 flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold leading-none tracking-tight md:text-6xl">
            <span className="text-away">{away_team.abbr}</span>
            <span className="mx-3 text-muted-foreground italic font-normal">at</span>
            <span className="text-home">{home_team.abbr}</span>
          </h1>
          {prediction.confidence ? (
            <ConfidenceBadge
              label={prediction.confidence}
              score={
                prediction.confidence_score !== null && prediction.confidence_score !== undefined
                  ? num(prediction.confidence_score)
                  : null
              }
              className="text-sm"
            />
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span>{away_team.name} at {home_team.name}</span>
          <span aria-hidden>·</span>
          <span className="tabular">{gameTime(prediction.generated_at)}</span>
          <span aria-hidden>·</span>
          <span className="font-mono text-xs">model {prediction.model_version}</span>
        </div>
      </header>

      <div className="rule mt-6" />

      {/* Top section: live gauge + market comparison strip */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr,1fr]">
        <LiveGameSection
          gameId={id}
          homeAbbr={home_team.abbr}
          awayAbbr={away_team.abbr}
          initialHomePct={homePct}
          initialAwayPct={awayPct}
        />

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Model vs market</CardTitle>
            {market_comparison?.flagged_value ? (
              <Badge variant="edge">value flagged</Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            <MarketStripCells
              homeAbbr={home_team.abbr}
              homePct={homePct}
              market={market_comparison}
            />
          </CardContent>
        </Card>
      </section>

      {/* Factor breakdown */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Factor breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              Effective contribution of each factor (signed log-odds × weight).
              Bars further from zero moved the line more.
            </p>
          </CardHeader>
          <CardContent>
            <FactorBreakdownChart factors={factor_breakdown} />
          </CardContent>
        </Card>
      </section>

      {/* Monte Carlo + Value Picks */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[3fr,2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Run distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {monte_carlo ? (
              <MonteCarloChart
                monteCarlo={monte_carlo}
                predictedTotal={prediction.predicted_total ?? null}
                predictedRunDiff={prediction.predicted_run_diff ?? null}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Monte Carlo distribution not available for this prediction.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value picks</CardTitle>
          </CardHeader>
          <CardContent>
            <ValuePicksPanel picks={picks ?? []} />
          </CardContent>
        </Card>
      </section>

      {/* Market lines table */}
      <section className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Sportsbook lines</CardTitle>
          </CardHeader>
          <CardContent>
            <MarketLinesTable odds={odds} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MarketStripCells({
  homeAbbr,
  homePct,
  market,
}: {
  homeAbbr: string;
  homePct: number;
  market: MarketComparison | null | undefined;
}) {
  if (!market) {
    return (
      <p className="text-sm text-muted-foreground">
        No market lines available yet.
      </p>
    );
  }
  const consensus = market.home_market_implied_pct;
  const edge = market.edge_pct;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 font-mono tabular md:grid-cols-4">
      <Cell label={`Model · ${homeAbbr}`} value={pct(homePct, 1)} accent="home" />
      <Cell
        label={`Market · ${homeAbbr}`}
        value={consensus !== null && consensus !== undefined ? pct(consensus, 1) : "—"}
      />
      <Cell
        label="Edge"
        value={
          edge !== null && edge !== undefined
            ? `${edge > 0 ? "+" : ""}${edge.toFixed(2)}pp`
            : "—"
        }
        accent={edge && edge > 0 ? "edge" : undefined}
      />
      <Cell
        label="Kelly"
        value={
          market.kelly_fraction !== null && market.kelly_fraction !== undefined
            ? `${(market.kelly_fraction * 100).toFixed(1)}%`
            : "—"
        }
      />
    </dl>
  );
}

function Cell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "home" | "away" | "edge";
}) {
  const tone =
    accent === "home"
      ? "text-home"
      : accent === "away"
        ? "text-away"
        : accent === "edge"
          ? "text-edge"
          : "";
  return (
    <div>
      <dt className="label">{label}</dt>
      <dd className={`mt-1 text-2xl ${tone}`}>{value}</dd>
    </div>
  );
}
