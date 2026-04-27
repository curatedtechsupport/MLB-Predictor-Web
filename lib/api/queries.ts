/**
 * React Query bindings.
 *
 * Server components fetch directly via `lib/api/client.ts`. Client components
 * that need to refetch on state changes (e.g. value-picks filters) use these
 * hooks. Keep the query keys hierarchical so we can invalidate broadly when
 * needed (e.g. on a manual "refresh" action).
 */
"use client";

import {
  keepPreviousData,
  useQuery,
  type UseQueryOptions,
} from "@tanstack/react-query";

import {
  getGamesToday,
  getHealthDeep,
  getOddsForGame,
  getOddsHistory,
  getOddsToday,
  getPredictionBreakdown,
  getPredictionsToday,
  getValuePicksForGame,
  getValuePicksToday,
  type ValuePicksFilters,
} from "./client";

export const qk = {
  all: ["mlb"] as const,
  gamesToday: () => [...qk.all, "games", "today"] as const,
  predictionsToday: () => [...qk.all, "predictions", "today"] as const,
  predictionBreakdown: (id: number) =>
    [...qk.all, "predictions", id, "breakdown"] as const,
  oddsToday: () => [...qk.all, "odds", "today"] as const,
  oddsByGame: (id: number) => [...qk.all, "odds", id] as const,
  oddsHistory: (id: number) => [...qk.all, "odds", id, "history"] as const,
  valuePicksToday: (f: ValuePicksFilters) =>
    [...qk.all, "value-picks", "today", f] as const,
  valuePicksByGame: (id: number) =>
    [...qk.all, "value-picks", id] as const,
  health: () => [...qk.all, "health"] as const,
};

export function useGamesToday(opts?: Partial<UseQueryOptions>) {
  return useQuery({
    queryKey: qk.gamesToday(),
    queryFn: () => getGamesToday({ cache: "no-store" }),
    refetchInterval: 60_000,
    ...(opts as object),
  });
}

export function usePredictionsToday() {
  return useQuery({
    queryKey: qk.predictionsToday(),
    queryFn: () => getPredictionsToday({ cache: "no-store" }),
    refetchInterval: 120_000,
  });
}

export function usePredictionBreakdown(gameId: number) {
  return useQuery({
    queryKey: qk.predictionBreakdown(gameId),
    queryFn: () => getPredictionBreakdown(gameId, { cache: "no-store" }),
    enabled: Number.isFinite(gameId),
  });
}

export function useOddsToday() {
  return useQuery({
    queryKey: qk.oddsToday(),
    queryFn: () => getOddsToday({ cache: "no-store" }),
    refetchInterval: 60_000,
  });
}

export function useOddsForGame(gameId: number) {
  return useQuery({
    queryKey: qk.oddsByGame(gameId),
    queryFn: () => getOddsForGame(gameId, { cache: "no-store" }),
    enabled: Number.isFinite(gameId),
    refetchInterval: 60_000,
  });
}

export function useOddsHistory(gameId: number) {
  return useQuery({
    queryKey: qk.oddsHistory(gameId),
    queryFn: () => getOddsHistory(gameId, { cache: "no-store" }),
    enabled: Number.isFinite(gameId),
  });
}

export function useValuePicksToday(filters: ValuePicksFilters) {
  return useQuery({
    queryKey: qk.valuePicksToday(filters),
    queryFn: () => getValuePicksToday(filters, { cache: "no-store" }),
    refetchInterval: 90_000,
    placeholderData: keepPreviousData,
  });
}

export function useValuePicksForGame(gameId: number) {
  return useQuery({
    queryKey: qk.valuePicksByGame(gameId),
    queryFn: () => getValuePicksForGame(gameId, { cache: "no-store" }),
    enabled: Number.isFinite(gameId),
  });
}

export function useHealth() {
  return useQuery({
    queryKey: qk.health(),
    queryFn: () => getHealthDeep({ cache: "no-store" }),
    refetchInterval: 30_000,
  });
}
