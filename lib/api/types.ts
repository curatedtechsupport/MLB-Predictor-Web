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
 * If/when the API surface stabilizes further, swap this for `openapi-zod-client`
 * — every consumer below imports from `@/lib/api/types` so the migration is
 * mechanical.
 */
import { z } from "zod";

// FastAPI emits Decimal as string. Coerce to number at the schema boundary.
const decimal = z.preprocess(
  (v) => (v === null || v === undefined ? null : Number(v)),
  z.number().nullable(),
);
const decimalRequired = z.preprocess(
  (v) => Number(v),
  z.number(),
);

// --- Reference ---
export const TeamMini = z.object({
  team_id: z.number(),
  abbr: z.string(),
  name: z.string(),
});
export type TeamMini = z.infer<typeof TeamMini>;

export const Team = TeamMini.extend({
  league: z.string(),
  division: z.string(),
  timezone: z.string(),
  ballpark_id: z.number().nullable().optional(),
});
export type Team = z.infer<typeof Team>;

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
export type Ballpark = z.infer<typeof Ballpark>;

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
export type TeamStats = z.infer<typeof TeamStats>;

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
export type PitcherStats = z.infer<typeof PitcherStats>;

export const Player = z.object({
  player_id: z.number(),
  full_name: z.string(),
  team_id: z.number().nullable().optional(),
  position: z.string().nullable().optional(),
  bats: z.string().nullable().optional(),
  throws: z.string().nullable().optional(),
  active: z.boolean(),
});
export type Player = z.infer<typeof Player>;

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
export type Game = z.infer<typeof Game>;

// --- Predictions ---
export const FactorBreakdownItem = z.object({
  factor: z.string(),
  weight: z.number(),
  log_odds_delta: z.number(),
  favors: z.string(), // "home" | "away" | "neutral"
  confidence: z.number().min(0).max(1).default(1),
  detail: z.record(z.unknown()).nullable().optional(),
});
export type FactorBreakdownItem = z.infer<typeof FactorBreakdownItem>;

export const MonteCarloSummary = z.object({
  iterations: z.number(),
  home_win_distribution: z.record(z.number()),
  away_win_distribution: z.record(z.number()),
});
export type MonteCarloSummary = z.infer<typeof MonteCarloSummary>;

export const MarketComparison = z.object({
  home_market_implied_pct: z.number().nullable().optional(),
  edge_pct: z.number().nullable().optional(),
  kelly_fraction: z.number().nullable().optional(),
  flagged_value: z.boolean().default(false),
});
export type MarketComparison = z.infer<typeof MarketComparison>;

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
export type Prediction = z.infer<typeof Prediction>;

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
export type PredictionBreakdown = z.infer<typeof PredictionBreakdown>;

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
export type SportsbookOdds = z.infer<typeof SportsbookOdds>;

export const GameOdds = z.object({
  game_id: z.number(),
  books: z.array(SportsbookOdds),
  consensus_home_pct: z.number().nullable().optional(),
  consensus_away_pct: z.number().nullable().optional(),
});
export type GameOdds = z.infer<typeof GameOdds>;

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
export type ValuePick = z.infer<typeof ValuePick>;

// --- Health ---
export const HealthDeep = z.object({
  status: z.string(),
  database: z.string().optional(),
  counts: z.record(z.number()).optional(),
  last_refresh: z.string().nullable().optional(),
}).passthrough();
export type HealthDeep = z.infer<typeof HealthDeep>;

// --- Convenience composite types ---
export type GameWithPrediction = Game & { prediction: Prediction | null };
