/**
 * Zod schemas mirroring the FastAPI Pydantic models in `app/schemas.py`.
 *
 * Why hand-rolled and not generated from /openapi.json?
 *  - The backend uses Decimal for percentages and stats, which OpenAPI
 *    serializes as `string`. Hand-rolling lets us coerce to `number` at
 *    the boundary so component code never has to know about Decimal.
 *  - Lets us add narrow custom validators (e.g. enum for `favors`).
 *  - Keeps the runtime contract auditable in a single ~150-line file.
 *
 * IMPORTANT — z.output vs z.infer:
 *  Every exported `type Foo = z.output<typeof Foo>` below uses `z.output`,
 *  not `z.infer`. This matters because the `decimal` helper uses
 *  `.transform()`, which makes its input and output types differ
 *  (input: `string | number | null | undefined`, output: `number | null`).
 *  `z.infer` collapses to the input shape in some compositions; `z.output`
 *  always returns the post-transform shape. Components consume output
 *  types — clean numbers, no string leakage.
 *
 * If/when the API surface stabilizes further, swap this for `openapi-zod-client`
 * — every consumer below imports from `@/lib/api/types` so the migration is
 * mechanical.
 */
import { z } from "zod";

// Accept null/undefined/string/number; emit number | null. Coerces strings
// (Decimal serialized as string) to numbers via Number(); preserves null.
// Explicit return-type annotation on the transform forces TypeScript to
// resolve the output as `number | null`, not as the inferred-from-implementation
// union that would include the input branches.
const decimal = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((v): number | null => {
    if (v === null || v === undefined) return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  });

// Like decimal but rejects null. Used for fields the backend always emits.
const decimalRequired = z
  .union([z.number(), z.string()])
  .transform((v): number => (typeof v === "number" ? v : Number(v)));

// --- Reference ---
export const TeamMini = z.object({
  team_id: z.number(),
  abbr: z.string(),
  name: z.string(),
});
export type TeamMini = z.output<typeof TeamMini>;

export const Team = TeamMini.extend({
  league: z.string(),
  division: z.string(),
  timezone: z.string(),
  ballpark_id: z.number().nullable().optional(),
});
export type Team = z.output<typeof Team>;

export const Ballpark = z.object({
  ballpark_id: z.number(),
  name: z.string(),
  home_team_id: z.number().nullable().optional(),
  latitude: decimalRequired,
  longitude: decimalRequired,
  elevation_ft: z.number().nullable().optional(),
  roof_type: z.string().nullable().optional(),
  orientation_deg: z.number().nullable().optional(),
  park_factor_runs: decimal.optional(),
  park_factor_hr: decimal.optional(),
  park_factor_hits: decimal.optional(),
});
export type Ballpark = z.output<typeof Ballpark>;

// --- Stats ---
export const TeamStats = z.object({
  team_id: z.number(),
  season: z.number(),
  as_of_date: z.string(),
  runs_per_game: decimal.optional(),
  runs_allowed_per_game: decimal.optional(),
  team_wrc_plus: z.number().nullable().optional(),
  team_woba: decimal.optional(),
  last15_runs_per_game: decimal.optional(),
  bullpen_fip: decimal.optional(),
  pythag_win_pct: decimal.optional(),
});
export type TeamStats = z.output<typeof TeamStats>;

export const PitcherStats = z.object({
  player_id: z.number(),
  season: z.number(),
  as_of_date: z.string(),
  role: z.string().nullable().optional(),
  ip: decimal.optional(),
  era: decimal.optional(),
  fip: decimal.optional(),
  xfip: decimal.optional(),
  siera: decimal.optional(),
  whip: decimal.optional(),
  k_per_9: decimal.optional(),
  bb_per_9: decimal.optional(),
  hr_per_9: decimal.optional(),
  last5_fip: decimal.optional(),
});
export type PitcherStats = z.output<typeof PitcherStats>;

export const Player = z.object({
  player_id: z.number(),
  full_name: z.string(),
  team_id: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  bats: z.string().nullable().optional(),
  throws: z.string().nullable().optional(),
  active: z.boolean(),
});
export type Player = z.output<typeof Player>;

// --- Games ---
export const Game = z.object({
  game_id: z.number(),
  game_date: z.string(),
  game_datetime: z.string(),
  home_team: TeamMini.nullable().optional(),
  away_team: TeamMini.nullable().optional(),
  ballpark_id: z.number().nullable().optional(),
  home_starter_id: z.number().nullable().optional(),
  away_starter_id: z.number().nullable().optional(),
  plate_umpire_id: z.number().nullable().optional(),
  lineup_official: z.boolean(),
  status: z.string().nullable().optional(),
  home_score: z.number().nullable().optional(),
  away_score: z.number().nullable().optional(),
});
export type Game = z.output<typeof Game>;

// --- Predictions ---
export const FactorBreakdownItem = z.object({
  factor: z.string(),
  weight: z.number(),
  log_odds_delta: z.number(),
  favors: z.string(), // "home" | "away" | "neutral"
  confidence: z.number().min(0).max(1),
  detail: z.record(z.unknown()).nullable().optional(),
});
export type FactorBreakdownItem = z.output<typeof FactorBreakdownItem>;

export const MonteCarloSummary = z.object({
  iterations: z.number(),
  home_win_distribution: z.record(z.number()),
  away_win_distribution: z.record(z.number()),
});
export type MonteCarloSummary = z.output<typeof MonteCarloSummary>;

export const MarketComparison = z.object({
  home_market_implied_pct: z.number().nullable().optional(),
  edge_pct: z.number().nullable().optional(),
  kelly_fraction: z.number().nullable().optional(),
  flagged_value: z.boolean(),
});
export type MarketComparison = z.output<typeof MarketComparison>;

export const Prediction = z.object({
  prediction_id: z.number(),
  game_id: z.number(),
  generated_at: z.string(),
  home_win_pct: decimalRequired,
  away_win_pct: decimalRequired,
  predicted_total: decimal.optional(),
  predicted_run_diff: decimal.optional(),
  confidence: z.string().nullable().optional(),
  confidence_score: decimal.optional(),
  model_version: z.string(),
});
export type Prediction = z.output<typeof Prediction>;

export const PredictionBreakdown = z.object({
  game_id: z.number(),
  game_date: z.string(),
  home_team: TeamMini,
  away_team: TeamMini,
  prediction: Prediction,
  factor_breakdown: z.array(FactorBreakdownItem),
  monte_carlo: MonteCarloSummary.nullable().optional(),
  market_comparison: MarketComparison.nullable().optional(),
});
export type PredictionBreakdown = z.output<typeof PredictionBreakdown>;

// --- Sportsbook odds ---
export const SportsbookOdds = z.object({
  game_id: z.number(),
  book: z.string(),
  captured_at: z.string(),
  home_moneyline: z.number().nullable().optional(),
  away_moneyline: z.number().nullable().optional(),
  home_implied_pct: decimal.optional(),
  away_implied_pct: decimal.optional(),
  total_line: decimal.optional(),
  over_odds: z.number().nullable().optional(),
  under_odds: z.number().nullable().optional(),
});
export type SportsbookOdds = z.output<typeof SportsbookOdds>;

export const GameOdds = z.object({
  game_id: z.number(),
  books: z.array(SportsbookOdds),
  consensus_home_pct: z.number().nullable().optional(),
  consensus_away_pct: z.number().nullable().optional(),
});
export type GameOdds = z.output<typeof GameOdds>;

// --- Value picks ---
export const ValuePick = z.object({
  pick_id: z.number(),
  prediction_id: z.number(),
  game_id: z.number(),
  bet_type: z.string().nullable().optional(),
  side: z.string().nullable().optional(),
  model_pct: decimal.optional(),
  market_pct: decimal.optional(),
  edge_pct: decimal.optional(),
  kelly_fraction: decimal.optional(),
  flagged_at: z.string(),
});
export type ValuePick = z.output<typeof ValuePick>;

// --- Health ---
export const HealthDeep = z.object({
  status: z.string(),
  database: z.string().optional(),
  counts: z.record(z.number()).optional(),
  last_refresh: z.string().nullable().optional(),
}).passthrough();
export type HealthDeep = z.output<typeof HealthDeep>;

// --- Live game stream (M6.5) ---
/**
 * Mirrors `app/schemas.py:LiveGameTick`. One SSE event payload per play
 * resolved by the MLB feed adapter. Fields are flat so the frontend can
 * splice the tick straight into its prediction view-model without joins.
 *
 * `base_state` is a 3-bit string ("000" empty, "100" runner on 1B,
 * "111" bases loaded). Encoded as string to dodge JSON's "0" coercion.
 *
 * `home_win_pct` is the *blended* live probability — pre-game prior
 * decayed against the WPA table by inning. Always 0..100 to mirror
 * Prediction.home_win_pct.
 */
export const LiveGameTick = z.object({
  game_id: z.number(),
  status: z.string(), // "Pre-Game" | "In Progress" | "Final" | ...
  inning: z.number().nullable().optional(),
  half: z.string().nullable().optional(), // "top" | "bottom" | null pre-game
  score_home: z.number(),
  score_away: z.number(),
  base_state: z.string(), // "000" .. "111"
  outs: z.number(),
  home_win_pct: z.number(), // 0..100 (blended)
  away_win_pct: z.number(), // 0..100
  last_play: z.string().nullable().optional(),
  ts: z.string(), // ISO datetime, server emit time
  is_final: z.boolean(),
});
export type LiveGameTick = z.output<typeof LiveGameTick>;

// --- Convenience composite types ---
export type GameWithPrediction = Game & { prediction: Prediction | null };
