# mlb-predictor-web

Next.js 14 dashboard for the MLB Daily Win Probability Calculator. Consumes the
FastAPI backend (`mlb-predictor`) over HTTPS and renders the slate, per-game
prediction breakdowns, sportsbook market lines, and flagged value picks.

> **Companion to** the [`mlb-predictor`](../mlb-predictor) backend. This repo
> ships separately — frontend on Vercel, backend on Railway — and connects via
> a single `NEXT_PUBLIC_API_BASE_URL` environment variable.

---

## Stack

| Concern               | Choice                                                |
| --------------------- | ----------------------------------------------------- |
| Framework             | Next.js 14 (App Router) + React Server Components     |
| Language              | TypeScript (strict)                                   |
| Styling               | Tailwind CSS + custom design tokens                   |
| UI primitives         | shadcn/ui-style hand-rolled (Radix Select, Slot)      |
| Charts                | Recharts                                              |
| Client data fetching  | TanStack Query (React Query) v5                       |
| Runtime validation    | Zod (Pydantic schemas mirrored at the type boundary)  |
| Theming               | `next-themes` (dark mode default)                     |
| Date / time           | `date-fns` + `date-fns-tz` (`America/New_York`)       |
| Icons                 | `lucide-react`                                        |
| Fonts                 | Newsreader (display) · Geist Sans · Geist Mono        |

---

## Pages

| Route             | Description                                                           |
| ----------------- | --------------------------------------------------------------------- |
| `/games/today`    | Slate of today's games with home/away win % bars + confidence badge   |
| `/games/[id]`     | Full prediction breakdown: gauge, factor chart, MC dist, market lines, value picks |
| `/value-picks`    | Sortable & filterable table of flagged edges (responsible-gambling banner up top) |
| `/teams/[id]`     | Team page: hero stats, run-scoring profile, placeholders for fatigue / injuries / recent results |

---

## Local development

### 1. Prerequisites

- Node.js ≥ 18.18 (Node 20 recommended)
- A running backend — either local (`uvicorn app.main:app --port 8000`) or the
  Railway deployment.

### 2. Install & run

```bash
cp .env.example .env.local
# edit .env.local to point NEXT_PUBLIC_API_BASE_URL at your backend
npm install
npm run dev
```

The dashboard runs at `http://localhost:3000`. Pages are server-rendered with
`revalidate` hints (60–600s depending on data volatility); client components
use React Query with matching refetch intervals.

### 3. Scripts

```bash
npm run dev        # next dev
npm run build      # next build
npm run start      # next start (after build)
npm run lint       # next lint
npm run typecheck  # tsc --noEmit
```

---

## Environment variables

| Variable                    | Required | Notes                                                    |
| --------------------------- | :------: | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_BASE_URL`  |    ✓     | Backend root URL, **no trailing slash**. Client appends `/api/v1/...` |

Because this is `NEXT_PUBLIC_`, the value is bundled into the client. That's
intentional — there's nothing secret here, the FastAPI backend is the same URL
the browser hits directly.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel: **New Project → Import**.
3. Framework preset is auto-detected as Next.js. Leave defaults.
4. Add **environment variable** `NEXT_PUBLIC_API_BASE_URL` with the Railway URL
   (e.g. `https://mlb-predictor.up.railway.app`). Set it for **Production**,
   **Preview**, **Development**.
5. Deploy. First build takes ~90 seconds.

The included `vercel.json` pins the region to `iad1` (us-east) to minimize
latency to the Railway backend (also us-east by default).

---

## CORS

The FastAPI backend already allows the Vercel domain via `app/main.py`'s
`CORSMiddleware`. If the backend rejects requests, set `ALLOWED_ORIGINS` on
the Railway service to include both `http://localhost:3000` and your Vercel
production / preview URLs.

---

## Project layout

```
mlb-predictor-web/
├── app/
│   ├── layout.tsx                  # Fonts, providers, top nav, footer, metadata
│   ├── globals.css                 # Design tokens (light + dark) + grain texture
│   ├── providers.tsx               # QueryClient + ThemeProvider
│   ├── page.tsx                    # → redirects to /games/today
│   ├── error.tsx, not-found.tsx
│   ├── games/
│   │   ├── today/page.tsx          # Slate (server)
│   │   └── [id]/page.tsx           # Detail (server, parallel fetch)
│   ├── value-picks/page.tsx        # Table (client, debounced filters)
│   └── teams/[id]/page.tsx         # Team page (server)
├── components/
│   ├── ui/                         # Card, Badge, Button, Table, Select, Input, ConfidenceBadge…
│   ├── nav/                        # TopNav, ThemeToggle, SiteFooter
│   ├── games/                      # WinProbBar/Gauge, FactorBreakdownChart,
│   │                               # MonteCarloChart, MarketLinesTable, ValuePicksPanel
│   ├── value-picks/                # ValuePicksTable
│   ├── teams/                      # RollingRPGSparkline + placeholders
│   └── responsible-gambling-banner.tsx
├── lib/
│   ├── utils.ts                    # cn() helper
│   ├── format.ts                   # num/pct/rate3/moneyline/kelly/gameTime/etc.
│   └── api/
│       ├── types.ts                # Zod schemas mirroring app/schemas.py
│       ├── client.ts               # Server-side fetch wrapper (revalidate hints)
│       └── queries.ts              # Client-side React Query hooks
├── public/                         # Static assets (currently empty)
├── tailwind.config.ts              # Custom palette: home (terracotta), away (slate), edge (gold)
├── components.json                 # shadcn/ui config
├── next.config.mjs
├── postcss.config.mjs
├── tsconfig.json
├── vercel.json
├── .env.example, .env.local.example
└── package.json
```

---

## API client design

The typed API layer is **hand-rolled Zod, not generated** from `/openapi.json`
— deliberately. The backend emits Pydantic `Decimal` fields as JSON strings
(e.g. `"4.612"` for runs-per-game), and the dashboard wants `number` inputs
to recharts and arithmetic. A custom `decimal` Zod preprocessor coerces
`string | number | null | undefined → number | undefined` at the validation
boundary, so component code never sees a `Decimal`.

If/when the backend switches to floats (or adds an OpenAPI extension to
declare these fields as numeric), the types here can be regenerated; the
client wrapper would not need changes.

### Caching

- **Server components** call `client.ts` directly with `revalidate` hints:
  - `60s`  — slate, odds (volatile)
  - `120s` — predictions (rarely change between scheduler runs)
  - `600s` — team metadata
- **Client components** use React Query with matching `refetchInterval`s and
  `staleTime: 30s`.

### Endpoints consumed

```
GET /api/v1/games/today
GET /api/v1/games/{id}
GET /api/v1/predictions/today
GET /api/v1/predictions/{game_id}
GET /api/v1/predictions/{game_id}/breakdown   ← includes MarketComparison
GET /api/v1/odds/today
GET /api/v1/odds/{game_id}
GET /api/v1/odds/{game_id}/history
GET /api/v1/value-picks/today?min_edge=…&bet_type=…&book=…
GET /api/v1/value-picks/{game_id}
GET /api/v1/teams/{id}
GET /api/v1/teams/{id}/stats
GET /api/v1/admin/health/deep
```

> **Note:** The dashboard intentionally does **not** call admin ingestion
> endpoints (`/admin/ingest/odds`, `/admin/value-picks/compute`). Those are
> the responsibility of the 15-minute scheduler. Hammering them from the
> browser would burn paid Odds API credits.

---

## Design notes

The aesthetic targets editorial / Bloomberg-Terminal-meets-The-Athletic:

- Warm near-black background (`24 10% 6%`) with subtle SVG grain
- Terracotta-clay **home** accent (`12 60% 58%`)
- Cool slate **away** accent (`205 50% 65%`)
- Muted gold **edge** accent (`38 65% 60%`) for value picks
- Newsreader display serif for headlines, Geist Sans for body, Geist Mono for stats
- Tabular numerals everywhere quantitative data appears

Dark mode is the default; the toggle in the top nav swaps tokens via
`next-themes`. SSR-safe via a `mounted` guard in `ThemeToggle`.

---

## Responsible gambling

Every Kelly fraction in the backend is hard-capped at **25%**. The
`/value-picks` page surfaces a prominent banner with that disclosure plus a
1-800-GAMBLER reference. Display logic never reformats Kelly values to make
them appear larger than the server-emitted figure.

---

## What's not built yet (intentionally)

These features need backend endpoints that don't exist yet — see
`RESUME_PROMPT.md` tech-debt section.

| Surface                       | Pending backend                                  |
| ----------------------------- | ------------------------------------------------ |
| Bullpen fatigue (team page)   | `GET /api/v1/teams/{id}/bullpen-fatigue`         |
| Active injuries (team page)   | `GET /api/v1/teams/{id}/injuries`                |
| Last 10 results (team page)   | `GET /api/v1/teams/{id}/games?limit=10`          |
| Live in-game updates          | `GET /api/v1/games/{id}/stream` (SSE — M6.5)     |
| MC totals histogram (proper)  | Persisted binned distribution on prediction row  |

The team page renders these as honest placeholders rather than fabricating
data, with a TODO note pointing at the missing endpoint.

---

## License

Internal — see top-level repo policy.
