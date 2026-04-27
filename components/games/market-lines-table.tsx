import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { GameOdds, SportsbookOdds } from "@/lib/api/types";
import { gameTimeShort, moneyline, num, pct, relTime } from "@/lib/format";

const BOOK_LABELS: Record<string, string> = {
  draftkings: "DraftKings",
  fanduel: "FanDuel",
  betmgm: "BetMGM",
  caesars: "Caesars",
  pointsbet: "PointsBet",
  barstool: "Barstool",
};

function bookLabel(book: string): string {
  return BOOK_LABELS[book.toLowerCase()] ?? book;
}

export function MarketLinesTable({ odds }: { odds: GameOdds | null }) {
  if (!odds || odds.books.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border/80 p-6 text-center text-sm text-muted-foreground">
        No sportsbook lines available yet for this game.
      </div>
    );
  }

  // Latest snapshot per book
  const latestByBook = new Map<string, SportsbookOdds>();
  for (const o of odds.books) {
    const prev = latestByBook.get(o.book);
    if (!prev || new Date(o.captured_at) > new Date(prev.captured_at)) {
      latestByBook.set(o.book, o);
    }
  }
  const rows = Array.from(latestByBook.values()).sort((a, b) =>
    bookLabel(a.book).localeCompare(bookLabel(b.book)),
  );

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book</TableHead>
            <TableHead className="text-right">Away ML</TableHead>
            <TableHead className="text-right">Home ML</TableHead>
            <TableHead className="text-right">Implied (A / H)</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">O / U</TableHead>
            <TableHead className="text-right">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.book}>
              <TableCell className="font-medium">{bookLabel(r.book)}</TableCell>
              <TableCell className="text-right text-away tabular">
                {moneyline(r.away_moneyline ?? null)}
              </TableCell>
              <TableCell className="text-right text-home tabular">
                {moneyline(r.home_moneyline ?? null)}
              </TableCell>
              <TableCell className="text-right tabular text-muted-foreground">
                {pct(r.away_implied_pct, 1)} / {pct(r.home_implied_pct, 1)}
              </TableCell>
              <TableCell className="text-right tabular">
                {r.total_line === null || r.total_line === undefined
                  ? "—"
                  : num(r.total_line).toFixed(1)}
              </TableCell>
              <TableCell className="text-right tabular text-muted-foreground">
                {moneyline(r.over_odds ?? null)} / {moneyline(r.under_odds ?? null)}
              </TableCell>
              <TableCell className="text-right text-xs text-muted-foreground">
                {relTime(r.captured_at)}
              </TableCell>
            </TableRow>
          ))}
          {odds.consensus_home_pct !== null &&
          odds.consensus_home_pct !== undefined ? (
            <TableRow className="border-t border-border bg-muted/30 font-medium">
              <TableCell>Consensus</TableCell>
              <TableCell className="text-right text-away tabular">
                {pct(odds.consensus_away_pct, 2)}
              </TableCell>
              <TableCell className="text-right text-home tabular">
                {pct(odds.consensus_home_pct, 2)}
              </TableCell>
              <TableCell colSpan={4} className="text-right text-xs text-muted-foreground">
                de-vigged across {rows.length} book{rows.length === 1 ? "" : "s"}
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Implied % values are de-vigged (juice removed). Lines refresh every 15
        minutes server-side.
      </p>
    </div>
  );
}

export function MarketLinesTimestamp({ odds }: { odds: GameOdds | null }) {
  if (!odds?.books.length) return null;
  const latest = odds.books.reduce((acc, o) =>
    new Date(o.captured_at) > new Date(acc.captured_at) ? o : acc,
  );
  return (
    <span className="text-xs text-muted-foreground">
      Lines as of {gameTimeShort(latest.captured_at)} · {relTime(latest.captured_at)}
    </span>
  );
}
