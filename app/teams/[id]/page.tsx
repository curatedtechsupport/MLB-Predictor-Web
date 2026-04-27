import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getTeam, getTeamStats } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/atoms";
import { RollingRPGSparkline } from "@/components/teams/rolling-rpg-sparkline";
import {
  BullpenFatigueTable,
  InjuriesList,
  LastTenResults,
} from "@/components/teams/team-data-placeholders";
import { num, pct, rate3 } from "@/lib/format";

export const dynamic = "force-dynamic";
export const revalidate = 600;

interface PageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) return { title: "Team" };
  try {
    const team = await getTeam(id);
    if (!team) return { title: "Team" };
    return { title: `${team.name} (${team.abbr})` };
  } catch {
    return { title: "Team" };
  }
}

/* ------------------------------------------------------------------ Stat row */

interface StatBlockProps {
  label: string;
  value: string;
  footnote?: string;
  tone?: "default" | "home" | "away" | "muted";
}

function StatBlock({ label, value, footnote, tone = "default" }: StatBlockProps) {
  const toneClass =
    tone === "home"
      ? "text-home"
      : tone === "away"
        ? "text-away"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <div className="flex flex-col gap-1.5">
      <span className="label text-muted-foreground">{label}</span>
      <span className={`font-display text-3xl tabular ${toneClass}`}>{value}</span>
      {footnote ? (
        <span className="text-xs text-muted-foreground">{footnote}</span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Page */

export default async function TeamDetailPage({ params }: PageProps) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const [team, stats] = await Promise.all([
    getTeam(id),
    getTeamStats(id).catch(() => null),
  ]);

  if (!team) notFound();

  const seasonRpg = stats?.runs_per_game;
  const seasonRapg = stats?.runs_allowed_per_game;
  const last15 = stats?.last15_runs_per_game;
  const wrcPlus = stats?.team_wrc_plus;
  const woba = stats?.team_woba;
  const bullpenFip = stats?.bullpen_fip;
  const pythag = stats?.pythag_win_pct;

  // Differential: positive => offense outscoring opponents
  const runDiff =
    seasonRpg !== undefined && seasonRapg !== undefined
      ? num(seasonRpg) - num(seasonRapg)
      : null;

  return (
    <div className="container py-8 lg:py-12">
      {/* Back link */}
      <Link
        href="/games/today"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to slate
      </Link>

      {/* Header */}
      <header className="mb-8 flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="font-mono">
              {team.abbr}
            </Badge>
            <Badge variant="muted">{team.league}</Badge>
            <Badge variant="muted">{team.division}</Badge>
          </div>
          <h1 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
            {team.name}
          </h1>
          {stats?.as_of_date ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Stats as of{" "}
              <span className="tabular text-foreground">{stats.as_of_date}</span>
              {stats.season ? (
                <>
                  {" "}
                  · <span className="tabular">{stats.season}</span> season
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        {runDiff !== null ? (
          <div className="flex flex-col items-end gap-1">
            <span className="label text-muted-foreground">Run diff / G</span>
            <span
              className={`font-display text-3xl tabular ${runDiff >= 0 ? "text-home" : "text-away"}`}
            >
              {runDiff >= 0 ? "+" : ""}
              {rate3(runDiff)}
            </span>
          </div>
        ) : null}
      </header>

      {!stats ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No team stats are currently available for this team.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Hero stat grid */}
          <section className="mb-10">
            <div className="grid grid-cols-2 gap-x-6 gap-y-8 rounded-md border border-border/60 bg-card/50 p-6 md:grid-cols-3 lg:grid-cols-6">
              <StatBlock
                label="Runs / G"
                value={rate3(seasonRpg)}
                tone="home"
                footnote="Season"
              />
              <StatBlock
                label="Runs allowed / G"
                value={rate3(seasonRapg)}
                tone="away"
                footnote="Season"
              />
              <StatBlock
                label="Last 15 RPG"
                value={rate3(last15)}
                footnote="Recent form"
              />
              <StatBlock
                label="wRC+"
                value={wrcPlus != null ? String(wrcPlus) : "—"}
                footnote="100 = league avg"
              />
              <StatBlock
                label="wOBA"
                value={
                  woba != null ? num(woba).toFixed(3).replace(/^0/, "") : "—"
                }
                footnote="Currently OPS proxy"
              />
              <StatBlock
                label="Pythag W%"
                value={pythag != null ? pct(pythag, 1) : "—"}
                footnote="Exp. 1.83"
              />
            </div>
            {bullpenFip != null ? (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="label">Bullpen FIP</span>
                <span className="tabular text-foreground">
                  {num(bullpenFip).toFixed(2)}
                </span>
              </div>
            ) : null}
          </section>

          {/* Rolling RPG comparison */}
          <section className="mb-10">
            <Card>
              <CardHeader>
                <CardTitle>Run-scoring profile</CardTitle>
              </CardHeader>
              <CardContent>
                <RollingRPGSparkline
                  seasonRpg={seasonRpg}
                  last15Rpg={last15}
                />
              </CardContent>
            </Card>
          </section>

          <Separator className="my-10" />

          {/* Placeholder grid — backend endpoints pending */}
          <section className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Bullpen fatigue</CardTitle>
              </CardHeader>
              <CardContent>
                <BullpenFatigueTable />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active injuries</CardTitle>
              </CardHeader>
              <CardContent>
                <InjuriesList />
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Last 10 results</CardTitle>
              </CardHeader>
              <CardContent>
                <LastTenResults />
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
