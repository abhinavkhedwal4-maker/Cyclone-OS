# CycloneOS

Cyclone impact and infrastructure vulnerability forecaster for Bay of Bengal / APAC coastal cities. The live desk combines:

- **Supabase** — regions, storms, zones, infrastructure, telemetry, advisories, dispatch log
- **Google Earth Engine** — offline Sentinel-1 / IMERG / SRTM exports you upload
- **AI advisory desk** — Gemini (if `GEMINI_API_KEY` is set) or Grok, with a physics fallback

## What it does

1. Tracks the incoming cyclone against five seeded coastal cities.
2. Models storm-surge water line, zone inundation and asset vulnerability.
3. Maps rainfall damage pathways (drain failure → cut roads → lost power → medical risk).
4. Drafts JSON advisories with severity, confidence and recommended actions.
5. Logs every dispatch.

## Setup

1. Copy `.env.example` to `.env`.
2. Paste your Supabase URL and anon key.
3. In the Supabase SQL editor, run `supabase/schema.sql` then `supabase/policies.sql` (schema first — policies alters tables schema.sql creates).
4. Optional: set `GEMINI_API_KEY` (and `GEMINI_MODEL` if you have Gemini 3.7 Flash).
5. `npm install` and `npm run dev`.

Without env vars the desk runs on the same sample rows as `src/lib/cyclone/seed.ts` (demo feed).

## Earth Engine

See [docs/GEE.md](docs/GEE.md) and `gee/bay_of_bengal_export.js`. Run those jobs in the Earth Engine code editor, shape the results as CSV (examples in `gee/`), add `SUPABASE_SERVICE_ROLE_KEY` to `.env`, then:

```bash
npm run gee:ingest -- --telemetry gee/telemetry.csv --track gee/best-track.csv
```

The in-app GEE Lab panel (Overview → GEE view) walks through the same steps with a copy-pasteable script.

## Stack

React 19, TanStack Start, Tailwind v4, Leaflet, WebGL storm field, Supabase JS, xAI / Gemini server function.
