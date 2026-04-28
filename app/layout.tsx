import type { Metadata, Viewport } from "next";
import { Newsreader } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";

import { TopNav } from "@/components/nav/top-nav";
import { SiteFooter } from "@/components/nav/site-footer";
import { Providers } from "./providers";

import "./globals.css";

// Newsreader: pulled from Google Fonts. `adjustFontFallback: false` disables
// Next 14's automatic fallback-metric computation, which is what produces
// the "Failed to find font override values for font Newsreader" build
// error on Vercel. Slight CLS regression in exchange for a reliable build.
const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  adjustFontFallback: false,
});

// Geist Sans + Mono come from the dedicated `geist` package, which ships
// the font binaries locally rather than fetching from Google Fonts (which
// does not host Geist reliably). The package exposes `.variable` directly
// as `--font-geist-sans` and `--font-geist-mono`. No constructor call.

export const metadata: Metadata = {
  title: {
    default: "MLB Oracle — Daily Win Probabilities",
    template: "%s · MLB Oracle",
  },
  description:
    "Daily MLB win probabilities, Monte Carlo distributions, sportsbook odds comparisons, and value picks — built on a calibrated 10-factor model.",
  applicationName: "MLB Oracle",
  authors: [{ name: "mlb-predictor" }],
  openGraph: {
    title: "MLB Oracle",
    description:
      "Daily MLB win probabilities, Monte Carlo distributions, and value picks.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0d0c" },
    { media: "(prefers-color-scheme: light)", color: "#f6f1e7" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${newsreader.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <TopNav />
            <main className="relative z-10 flex-1 animate-fade-up">{children}</main>
            <SiteFooter />
          </div>
        </Providers>
      </body>
    </html>
  );
}
