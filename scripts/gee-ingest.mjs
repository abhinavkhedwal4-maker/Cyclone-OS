#!/usr/bin/env node
/**
 * CycloneOS — GEE / best-track ingestion.
 *
 * Loads the zonal-stats and storm-track CSVs you produced after running
 * gee/bay_of_bengal_export.js (see docs/GEE.md) into Supabase, so the live
 * dashboard (src/lib/cyclone/feed.ts) picks them up on its next refresh.
 *
 * Run from a terminal only — it needs the Supabase *service role* key,
 * which bypasses row-level security and must never reach the browser or a
 * VITE_-prefixed env var.
 *
 * Setup (once):
 *   1. Run supabase/schema.sql then supabase/policies.sql in the Supabase
 *      SQL editor.
 *   2. Add to .env (NOT .env.example, and make sure .env is gitignored):
 *        SUPABASE_URL=https://YOUR_PROJECT.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings -> API -> service_role)
 *
 * Usage:
 *   npm run gee:ingest -- --telemetry gee/telemetry.csv
 *   npm run gee:ingest -- --track gee/best-track.csv
 *   npm run gee:ingest -- --telemetry gee/telemetry.csv --track gee/best-track.csv
 *
 * gee/telemetry.csv columns (header row required):
 *   region_id,reading_type,value,unit,source[,recorded_at]
 *   kakinada-in,rainfall,320,mm,GPM IMERG
 *   kakinada-in,flood_frac,0.18,1,Sentinel-1
 *
 * gee/best-track.csv columns (IMD/JTWC best-track, header row required):
 *   region_id,name,recorded_at,wind_kmh,pressure_hpa,heading_deg,movement_kmh,eta_hours,confidence,rainfall_mm
 * Only the newest row per region_id is inserted as the latest storm fix —
 * feed.ts already orders storms by recorded_at desc and takes the first.
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  const path = resolve(process.cwd(), ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (!m || m[1].startsWith("#")) continue;
    const value = m[2].replace(/^["']|["']$/g, "");
    if (!(m[1] in process.env)) process.env[m[1]] = value;
  }
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).filter(Boolean).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i]]));
  });
}

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  loadDotEnv();
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY in .env. See the header of this script.",
    );
    process.exit(1);
  }
  const sb = createClient(url, key);

  const telemetryPath = arg("telemetry");
  const trackPath = arg("track");
  if (!telemetryPath && !trackPath) {
    console.error("Pass --telemetry <csv> and/or --track <csv>. See the header of this script.");
    process.exit(1);
  }

  if (telemetryPath) {
    const rows = parseCsv(readFileSync(resolve(telemetryPath), "utf8")).map((r) => ({
      region_id: r.region_id,
      reading_type: r.reading_type,
      value: Number(r.value),
      unit: r.unit ?? "",
      source: r.source ?? "",
      recorded_at: r.recorded_at || new Date().toISOString(),
    }));
    if (rows.some((r) => !r.region_id || !r.reading_type || Number.isNaN(r.value))) {
      console.error("telemetry CSV: every row needs region_id, reading_type and a numeric value.");
      process.exit(1);
    }
    const { error } = await sb.from("telemetry_readings").insert(rows);
    if (error) throw error;
    console.log(`telemetry_readings: inserted ${rows.length} row(s) from ${telemetryPath}`);
  }

  if (trackPath) {
    const rows = parseCsv(readFileSync(resolve(trackPath), "utf8"));
    if (rows.some((r) => !r.region_id || !r.name)) {
      console.error("track CSV: every row needs region_id and name.");
      process.exit(1);
    }
    // Keep only the latest fix per region — that's what the dashboard reads.
    const latest = new Map();
    for (const r of rows) {
      const prev = latest.get(r.region_id);
      if (!prev || new Date(r.recorded_at) > new Date(prev.recorded_at)) latest.set(r.region_id, r);
    }
    const payload = [...latest.values()].map((r) => ({
      region_id: r.region_id,
      name: r.name,
      wind_kmh: Number(r.wind_kmh) || 0,
      pressure_hpa: Number(r.pressure_hpa) || 0,
      rainfall_mm: Number(r.rainfall_mm) || 0,
      movement_kmh: Number(r.movement_kmh) || 0,
      heading_deg: Number(r.heading_deg) || 0,
      confidence: Number(r.confidence) || 0.8,
      eta_hours: Number(r.eta_hours) || 0,
      recorded_at: r.recorded_at || new Date().toISOString(),
    }));
    const { error } = await sb.from("storms").insert(payload);
    if (error) throw error;
    console.log(`storms: inserted ${payload.length} latest fix(es) from ${trackPath}`);
  }

  console.log("Done. The dashboard picks this up on its next Supabase refresh.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
