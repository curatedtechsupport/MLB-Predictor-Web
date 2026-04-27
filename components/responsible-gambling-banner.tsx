import { AlertTriangle } from "lucide-react";

export function ResponsibleGamblingBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-md border border-edge/40 bg-edge/10 p-3 text-sm"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-edge" />
      <p className="text-foreground/90">
        <span className="font-medium">Bet responsibly.</span> Kelly fractions
        are capped at 25 % of bankroll server-side; do not exceed your own
        risk tolerance. Past performance is not a guarantee of future results.
        If gambling stops being fun, call <strong>1-800-GAMBLER</strong>.
      </p>
    </div>
  );
}
