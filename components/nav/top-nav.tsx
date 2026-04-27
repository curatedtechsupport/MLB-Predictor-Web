import Link from "next/link";

import { ThemeToggle } from "@/components/nav/theme-toggle";

const sections = [
  { href: "/games/today", label: "Slate" },
  { href: "/value-picks", label: "Value Picks" },
];

export function TopNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href="/games/today"
            className="group flex items-center gap-2 font-display text-lg font-semibold tracking-tight"
          >
            {/* Tiny diamond wordmark */}
            <span
              aria-hidden
              className="inline-block h-3 w-3 rotate-45 bg-primary transition-transform group-hover:rotate-[225deg] duration-500"
            />
            <span>
              MLB
              <span className="text-muted-foreground"> ·</span>
              <span className="font-normal italic"> oracle</span>
            </span>
          </Link>

          <nav className="hidden gap-6 md:flex">
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="label hover:text-foreground transition-colors"
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile section row */}
      <nav className="container flex gap-5 overflow-x-auto pb-2 md:hidden">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="label whitespace-nowrap hover:text-foreground transition-colors"
          >
            {s.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
