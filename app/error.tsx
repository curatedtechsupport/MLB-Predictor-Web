"use client";

import * as React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to console for now — wire to Sentry / log drain when available.
    // eslint-disable-next-line no-console
    console.error("[mlb-oracle] page error", error);
  }, [error]);

  return (
    <div className="container flex flex-col items-start gap-4 py-16">
      <div className="flex items-center gap-2 text-edge">
        <AlertTriangle className="h-5 w-5" />
        <span className="label">Error</span>
      </div>
      <h1 className="font-display text-4xl font-semibold">
        Something broke loading the data.
      </h1>
      <p className="max-w-prose text-muted-foreground">
        The backend may be cold-starting on Railway, or the API base URL may
        be misconfigured. Try again in a moment.
      </p>
      {error.digest ? (
        <code className="rounded bg-muted px-2 py-1 text-xs tabular">
          digest: {error.digest}
        </code>
      ) : null}
      <Button onClick={() => reset()} variant="outline">
        <RotateCw className="h-4 w-4" /> Retry
      </Button>
    </div>
  );
}
