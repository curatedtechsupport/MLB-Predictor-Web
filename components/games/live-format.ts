/**
 * Pure formatters for live-game ticks. Kept in a separate file so the
 * components can stay thin and so we can unit-test these in isolation
 * later (each is a pure function of input → string).
 */
import type { LiveGameTick } from "@/lib/api/types";

/**
 * "T5" / "B7" — top/bottom of the Nth inning. Falls back to a dash for
 * pre-game ticks where inning is null. Half is `"top" | "bottom" | null`
 * per the backend.
 */
export function inningLabel(
  inning: number | null | undefined,
  half: string | null | undefined,
): string {
  if (inning == null || !Number.isFinite(inning)) return "—";
  const prefix =
    half === "top" ? "T" : half === "bottom" ? "B" : ""; // mid/end: omit
  return `${prefix}${inning}`;
}

/** "1 out" / "2 outs" / "0 outs". */
export function outsLabel(outs: number): string {
  if (!Number.isFinite(outs)) return "—";
  return outs === 1 ? "1 out" : `${outs} outs`;
}

/**
 * Convert a 3-bit base_state string to a human phrase.
 *   "000" → "bases empty"
 *   "100" → "runner on 1st"
 *   "010" → "runner on 2nd"
 *   "001" → "runner on 3rd"
 *   "110" → "runners on 1st and 2nd"
 *   "101" → "runners on the corners"   (idiomatic; 1st + 3rd)
 *   "011" → "runners on 2nd and 3rd"
 *   "111" → "bases loaded"
 */
export function basesLabel(baseState: string | null | undefined): string {
  if (!baseState || baseState.length !== 3) return "bases empty";
  switch (baseState) {
    case "000":
      return "bases empty";
    case "100":
      return "runner on 1st";
    case "010":
      return "runner on 2nd";
    case "001":
      return "runner on 3rd";
    case "110":
      return "runners on 1st and 2nd";
    case "101":
      return "runners on the corners";
    case "011":
      return "runners on 2nd and 3rd";
    case "111":
      return "bases loaded";
    default:
      return "bases empty";
  }
}

/** Compact slate-card label: "T5 · 3-2" (inning · score). */
export function compactLiveLabel(tick: LiveGameTick): string {
  const inn = inningLabel(tick.inning, tick.half);
  const score = `${tick.score_away}-${tick.score_home}`;
  return inn === "—" ? `LIVE · ${score}` : `LIVE · ${inn} · ${score}`;
}

/** Returns true if a tick represents an in-progress (not pre/post) state. */
export function isInProgress(tick: LiveGameTick | null | undefined): boolean {
  if (!tick) return false;
  if (tick.is_final) return false;
  // Backend emits "In Progress" for active games. Be permissive — older
  // payloads might use other casings.
  return tick.status.toLowerCase().includes("progress");
}
