import { format, formatDistanceToNow, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

const ET_TZ = "America/New_York";

/** Coerce a Decimal-as-string-or-number from FastAPI to a JS number. */
export function num(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/** "55.4%" — percentage already on 0–100 scale. */
export function pct(v: unknown, digits = 1): string {
  const n = num(v, NaN);
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

/** "0.412" — for things like wOBA, batting avg. */
export function rate3(v: unknown): string {
  const n = num(v, NaN);
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(3).replace(/^0/, "");
}

/** "+125" / "−110" — American moneyline, with proper minus sign. */
export function moneyline(v: number | null | undefined): string {
  if (v === null || v === undefined || !Number.isFinite(v)) return "—";
  return v > 0 ? `+${v}` : `\u2212${Math.abs(v)}`;
}

/** "12.5%" — Kelly fraction display, 0–1 input. */
export function kelly(v: unknown): string {
  const n = num(v, NaN);
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

/** "Tue, Apr 27 · 7:05 PM ET" */
export function gameTime(iso: string): string {
  try {
    return formatInTimeZone(parseISO(iso), ET_TZ, "EEE, MMM d · h:mm aaa 'ET'");
  } catch {
    return "—";
  }
}

/** "7:05 PM ET" — short variant. */
export function gameTimeShort(iso: string): string {
  try {
    return formatInTimeZone(parseISO(iso), ET_TZ, "h:mm aaa 'ET'");
  } catch {
    return "—";
  }
}

export function ymdET(iso: string): string {
  try {
    return formatInTimeZone(parseISO(iso), ET_TZ, "yyyy-MM-dd");
  } catch {
    return iso;
  }
}

export function relTime(iso: string): string {
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return "—";
  }
}

export function dateLabel(d: string | Date): string {
  const dt = typeof d === "string" ? parseISO(d) : d;
  return format(dt, "MMM d, yyyy");
}

/** Map confidence label → tone bucket for badges. */
export function confidenceTone(
  label: string | null | undefined,
): "high" | "medium" | "low" | "unknown" {
  const v = (label || "").toLowerCase();
  if (v === "high") return "high";
  if (v === "medium") return "medium";
  if (v === "low") return "low";
  return "unknown";
}

/** Which side a factor favors, for color coding charts and rows. */
export function favorsTone(
  v: string | null | undefined,
): "home" | "away" | "neutral" {
  const lo = (v || "").toLowerCase();
  if (lo === "home") return "home";
  if (lo === "away") return "away";
  return "neutral";
}
