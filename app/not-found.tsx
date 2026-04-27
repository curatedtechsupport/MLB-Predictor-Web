import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center justify-center py-24 text-center">
      <span className="label">404</span>
      <h1 className="font-display text-5xl font-semibold mt-2">
        Out of the strike zone
      </h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        That page doesn&apos;t exist. Maybe the slate moved on.
      </p>
      <Button asChild className="mt-6">
        <Link href="/games/today">Today&apos;s slate</Link>
      </Button>
    </div>
  );
}
