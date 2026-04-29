/**
 * Thin fetch wrapper around the FastAPI backend.
 *
 *  - Validates every response against a Zod schema (errors surface loudly
 *    instead of "undefined of undefined" in components).
 *  - Uses Next.js' `next.revalidate` / `cache: "no-store"` hints so the
 *    server-component cache layer behaves correctly.
 *  - Plays nicely on both server and client (no `window` references).
 *
 *  All endpoints assume the backend is mounted at /api/v1.
 *
 *  IMPORTANT — z.output vs T:
 *  The `call()` helper is generic over the schema type `S extends ZodTypeAny`
 *  and returns `z.output<S> | null`. Earlier versions used a single-param
 *  `z.ZodType<T>` form which, for schemas with `.transform()`, resolved `T`
 *  to the *input* type — leaking `string | number` into props that expected
 *  clean `number`. The current form forces post-transform output everywhere.
 *
 *  Each public function additionally annotates its return type explicitly
 *  (`Promise<X | null>`) as belt-and-braces. If a future tweak somehow
 *  regresses the helper's inference, the explicit annotations still pin
 *  every endpoint to the right shape.
 */
import { z } from "zod";

import {
  Game,
  GameOdds,
  HealthDeep,
  PitcherStats,
  Player,
  Prediction,
  PredictionBreakdown,
  Team,
  TeamStats,
  ValuePick,
} from "./types";
import type {
  Game as GameT,
  GameOdds as GameOddsT,
  HealthDeep as HealthDeepT,
  PitcherStats as PitcherStatsT,
  Player as PlayerT,
  Prediction as PredictionT,
  PredictionBreakdown as PredictionBreakdownT,
  Team as TeamT,
  TeamStats as TeamStatsT,
  ValuePick as ValuePickT,
} from "./types";

const RAW_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.API_BASE_URL ||
  "";

if (!RAW_BASE && typeof window !== "undefined") {
  // Dev-time hint. Don't throw — server components without env should still
  // try to render skeleton states gracefully.
  // eslint-disable-next-line no-console
  console.warn(
    "[mlb-predictor-web] NEXT_PUBLIC_API_BASE_URL is unset — API calls will fail.",
  );
}

const API_BASE = RAW_BASE.replace(/\/+$/, "");
const V1 = `${API_BASE}/api/v1`;

export class ApiError extends Error {
  constructor(
    public status: number,
    public url: string,
    public body?: string,
  ) {
    super(`[${status}] ${url}${body ? `: ${body.slice(0, 200)}` : ""}`);
    this.name = "ApiError";
  }
}

interface FetchOpts {
  /** Next.js revalidate (seconds). Use `0` for never-cache. */
  revalidate?: number | false;
  /** Next.js cache directive — overrides `revalidate`. */
  cache?: RequestCache;
  /** Next.js cache tags for on-demand revalidation. */
  tags?: string[];
  /** Throw if the response status is in this set; default {404}. */
  silentStatuses?: Set<number>;
  signal?: AbortSignal;
}

/**
 * Schema-driven fetch.
 *
 *  Generic constraint `S extends z.ZodTypeAny` lets TypeScript see the full
 *  schema type (input + output + def). The return type uses `z.output<S>`
 *  to extract specifically the post-transform shape — which is what every
 *  consumer expects (clean numbers, no string leakage from Decimal coercion).
 */
async function call<S extends z.ZodTypeAny>(
  url: string,
  schema: S,
  opts: FetchOpts = {},
): Promise<z.output<S> | null> {
  const init: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    headers: { Accept: "application/json" },
    signal: opts.signal,
  };
  if (opts.cache) init.cache = opts.cache;
  if (opts.revalidate !== undefined || opts.tags) {
    init.next = {
      ...(opts.revalidate !== undefined && opts.revalidate !== false
        ? { revalidate: opts.revalidate }
        : {}),
      ...(opts.tags ? { tags: opts.tags } : {}),
    };
  }

  const resp = await fetch(url, init);
  const silent = opts.silentStatuses ?? new Set([404]);
  if (silent.has(resp.status)) return null;

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new ApiError(resp.status, url, text);
  }

  const json = await resp.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("[api] schema mismatch", url, parsed.error.format());
    throw new ApiError(500, url, "schema validation failed");
  }
  // safeParse returns the post-transform output — z.output<S>.
  return parsed.data as z.output<S>;
}

/* ------------------------------------------------------------------ Games */

export function getGamesToday(opts?: FetchOpts): Promise<GameT[] | null> {
  // Schedule + scores change rapidly. 60s is the sweet spot.
  return call(`${V1}/games/today`, z.array(Game), {
    revalidate: 60,
    tags: ["games:today"],
    ...opts,
  });
}

export function getGameById(
  gameId: number,
  opts?: FetchOpts,
): Promise<GameT | null> {
  return call(`${V1}/games/${gameId}`, Game, {
    revalidate: 60,
    tags: [`game:${gameId}`],
    ...opts,
  });
}

/* ------------------------------------------------------------ Predictions */

export function getPredictionsToday(
  opts?: FetchOpts,
): Promise<PredictionT[] | null> {
  return call(`${V1}/predictions/today`, z.array(Prediction), {
    revalidate: 120,
    tags: ["predictions:today"],
    ...opts,
  });
}

export function getPrediction(
  gameId: number,
  opts?: FetchOpts,
): Promise<PredictionT | null> {
  return call(`${V1}/predictions/${gameId}`, Prediction, {
    revalidate: 120,
    tags: [`prediction:${gameId}`],
    ...opts,
  });
}

export function getPredictionBreakdown(
  gameId: number,
  opts?: FetchOpts,
): Promise<PredictionBreakdownT | null> {
  return call(`${V1}/predictions/${gameId}/breakdown`, PredictionBreakdown, {
    revalidate: 120,
    tags: [`prediction:${gameId}:breakdown`],
    ...opts,
  });
}

/* ------------------------------------------------------------------- Odds */

export function getOddsToday(opts?: FetchOpts): Promise<GameOddsT[] | null> {
  return call(`${V1}/odds/today`, z.array(GameOdds), {
    revalidate: 60,
    tags: ["odds:today"],
    ...opts,
  });
}

export function getOddsForGame(
  gameId: number,
  opts?: FetchOpts,
): Promise<GameOddsT | null> {
  return call(`${V1}/odds/${gameId}`, GameOdds, {
    revalidate: 60,
    tags: [`odds:${gameId}`],
    ...opts,
  });
}

export function getOddsHistory(
  gameId: number,
  opts?: FetchOpts,
): Promise<GameOddsT[] | null> {
  return call(`${V1}/odds/${gameId}/history`, z.array(GameOdds), {
    revalidate: 300,
    tags: [`odds:${gameId}:history`],
    ...opts,
  });
}

/* ------------------------------------------------------------ Value picks */

export interface ValuePicksFilters {
  min_edge?: number;
  bet_type?: "moneyline" | "total" | "spread";
  book?: string;
}

export function getValuePicksToday(
  filters: ValuePicksFilters = {},
  opts?: FetchOpts,
): Promise<ValuePickT[] | null> {
  const qs = new URLSearchParams();
  if (filters.min_edge !== undefined) qs.set("min_edge", String(filters.min_edge));
  if (filters.bet_type) qs.set("bet_type", filters.bet_type);
  if (filters.book) qs.set("book", filters.book);
  const url = `${V1}/value-picks/today${qs.toString() ? `?${qs}` : ""}`;
  return call(url, z.array(ValuePick), {
    revalidate: 90,
    tags: ["value-picks:today", `value-picks:filters:${qs.toString()}`],
    ...opts,
  });
}

export function getValuePicksForGame(
  gameId: number,
  opts?: FetchOpts,
): Promise<ValuePickT[] | null> {
  return call(`${V1}/value-picks/${gameId}`, z.array(ValuePick), {
    revalidate: 90,
    tags: [`value-picks:${gameId}`],
    ...opts,
  });
}

/* ------------------------------------------------------------------ Teams */

export function getTeam(
  teamId: number,
  opts?: FetchOpts,
): Promise<TeamT | null> {
  return call(`${V1}/teams/${teamId}`, Team, {
    revalidate: 3600,
    tags: [`team:${teamId}`],
    ...opts,
  });
}

export function getTeamStats(
  teamId: number,
  opts?: FetchOpts,
): Promise<TeamStatsT | null> {
  return call(`${V1}/teams/${teamId}/stats`, TeamStats, {
    revalidate: 600,
    tags: [`team:${teamId}:stats`],
    ...opts,
  });
}

export function getTeamRoster(
  teamId: number,
  opts?: FetchOpts,
): Promise<PlayerT[] | null> {
  return call(`${V1}/teams/${teamId}/roster`, z.array(Player), {
    revalidate: 3600,
    tags: [`team:${teamId}:roster`],
    ...opts,
  });
}

export function listTeams(opts?: FetchOpts): Promise<TeamT[] | null> {
  return call(`${V1}/teams`, z.array(Team), {
    revalidate: 86400,
    tags: ["teams"],
    ...opts,
  });
}

/* ------------------------------------------------------------- Pitchers */

export function getPitcher(
  playerId: number,
  opts?: FetchOpts,
): Promise<PlayerT | null> {
  return call(`${V1}/pitchers/${playerId}`, Player, {
    revalidate: 3600,
    tags: [`pitcher:${playerId}`],
    ...opts,
  });
}

export function getPitcherStats(
  playerId: number,
  opts?: FetchOpts,
): Promise<PitcherStatsT | null> {
  return call(`${V1}/pitchers/${playerId}/stats`, PitcherStats, {
    revalidate: 3600,
    tags: [`pitcher:${playerId}:stats`],
    ...opts,
  });
}

/* -------------------------------------------------------------- Health */

export function getHealthDeep(
  opts?: FetchOpts,
): Promise<HealthDeepT | null> {
  return call(`${API_BASE}/admin/health/deep`, HealthDeep, {
    revalidate: 30,
    silentStatuses: new Set([404, 401]),
    ...opts,
  });
}

export const API_BASE_URL = API_BASE;
