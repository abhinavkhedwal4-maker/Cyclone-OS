# 🌀 CycloneOS

**Cyclone impact and infrastructure vulnerability forecaster for Bay of Bengal / APAC coastal cities.**

Track an incoming storm, model surge and rainfall damage, and generate actionable advisories, all from one live desk.

![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)
![TanStack Start](https://img.shields.io/badge/TanStack-Start-ef4444)
![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-database-3ecf8e?logo=supabase&logoColor=white)
![Gemini](https://img.shields.io/badge/AI-Gemini%20%7C%20Grok-8b5cf6)

---

## ✨ Features

| Feature | Description |
|---|---|
| **Storm tracking** | Follows the incoming cyclone against five seeded coastal cities |
| **Storm-surge modelling** | Estimates the water line, zone-level inundation, and asset vulnerability |
| **Rainfall damage pathways** | Traces the cascade: drain failure → cut roads → lost power → medical risk |
| **AI advisory desk** | Drafts JSON advisories with severity, confidence, and recommended actions |
| **Dispatch log** | Records every advisory dispatched |
| **Earth Engine integration** | Ingests offline Sentinel-1, IMERG, and SRTM exports |
| **Demo mode** | Runs on built-in sample data with zero configuration |

---

## 🏗️ How It Works

```
Google Earth Engine ──(CSV export)──► gee:ingest ──► Supabase ──► CycloneOS desk
 Sentinel-1 / IMERG / SRTM                          regions, storms, zones,        │
                                                    infrastructure, telemetry,     ▼
                                                    advisories, dispatch log   Advisory engine
                                                                               Gemini → Grok → physics fallback
```

**Data layer (Supabase):** regions, storms, zones, infrastructure, telemetry, advisories, dispatch log.

**Satellite layer (Google Earth Engine):** you run the export jobs offline, then upload the results.

**AI layer:** Gemini if `GEMINI_API_KEY` is set, otherwise Grok. If no AI key is available, a built-in physics-based fallback still produces an advisory.

---

## 🧰 Tech Stack

React 19 · TanStack Start · Tailwind v4 · Leaflet · WebGL storm field · Supabase JS · xAI / Gemini server function

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project (optional, since demo mode works without it)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your env file
cp .env.example .env        # Windows PowerShell: Copy-Item .env.example .env

# 3. Start the dev server
npm run dev
```

### Connect Supabase

1. Add your Supabase URL and anon key to `.env`.
2. In the Supabase **SQL Editor**, run these **in order**:
   1. `supabase/schema.sql`: creates the tables
   2. `supabase/policies.sql`: alters the tables created above

> ⚠️ Run the schema first. The policies file modifies tables that `schema.sql` creates.

### Enable AI advisories (optional)

Set `GEMINI_API_KEY` in `.env`. Optionally set `GEMINI_MODEL` to choose a specific Gemini model. Without a Gemini key the desk falls back to Grok, then to the physics fallback.

### Demo mode

With no env vars set, the desk runs on the same sample rows as `src/lib/cyclone/seed.ts`.

---

## ⚙️ Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| Supabase URL | For live data | Your project URL |
| Supabase anon key | For live data | Public client key |
| `GEMINI_API_KEY` | No | Enables Gemini advisories |
| `GEMINI_MODEL` | No | Overrides the default Gemini model |
| Grok / xAI API key | No | Fallback AI provider |
| `SUPABASE_SERVICE_ROLE_KEY` | Only for `gee:ingest` | Server-side ingestion. **Never expose this to the browser.** |

See `.env.example` for the exact variable names.

---

## 🛰️ Earth Engine Pipeline

Full guide: [docs/GEE.md](https://github.com/abhinavkhedwal4-maker/Cyclone-OS/blob/main/docs/GEE.md)

1. Open the [Earth Engine Code Editor](https://code.earthengine.google.com/) and run the jobs in `gee/bay_of_bengal_export.js`.
2. Export the results as CSV (examples are in `gee/`).
3. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env`.
4. Ingest the data:

```bash
npm run gee:ingest -- --telemetry gee/telemetry.csv --track gee/best-track.csv
```

💡 The in-app **GEE Lab** panel (Overview → GEE view) walks through the same steps with a copy-pasteable script.

---

## 📜 Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run gee:ingest` | Ingest Earth Engine CSV exports into Supabase |

---

## ⚠️ Disclaimer

CycloneOS is a decision-support prototype. Its outputs are model-based estimates and should not replace official warnings from national meteorological and disaster management agencies (e.g. IMD, JTWC).

---

## 📄 License

Add your license here (e.g. MIT).
