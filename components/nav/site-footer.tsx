import { getHealthDeep } from "@/lib/api/client";
import { relTime } from "@/lib/format";

export async function SiteFooter() {
  // Best-effort. Health endpoint may be 401/404 in some environments —
  // we silence those in the client and just render "—" if so.
  let lastRefresh: string | null = null;
  try {
    const h = await getHealthDeep({ revalidate: 30 });
    lastRefresh = h?.last_refresh ?? null;
  } catch {
    lastRefresh = null;
  }

  return (
    <footer className="mt-16 border-t border-border/60">
      <div className="container flex flex-col gap-4 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="label">Status</span>
          <span className="tabular">
            {lastRefresh
              ? `Data refreshed ${relTime(lastRefresh)}`
              : "Refresh status unavailable"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="label">v0.1 · M6</span>
          <span aria-hidden>·</span>
          <span>
            Predictions are statistical, not advice. Bet responsibly. 21+.
          </span>
        </div>
      </div>
    </footer>
  );
}
