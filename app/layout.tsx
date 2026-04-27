import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";

import { TopNav } from "@/components/nav/top-nav";
import { SiteFooter } from "@/components/nav/site-footer";
import { Providers } from "./providers";

import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

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
      className={`${newsreader.variable} ${geist.variable} ${geistMono.variable}`}
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
