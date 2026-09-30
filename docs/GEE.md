# Google Earth Engine → CycloneOS

Earth Engine cannot run inside this web app. You run the jobs on Google, then load summaries into the Supabase tables CycloneOS already queries.

## 1. Enable Earth Engine

1. Create or pick a Google Cloud project.
2. Enable the Earth Engine API.
3. Open [code.earthengine.google.com](https://code.earthengine.google.com) and register the project.

## 2. Export flood, rain, elevation

Open `gee/bay_of_bengal_export.js`, paste it into the Earth Engine code editor, pick a city, set dates around the current cyclone, and click **Run**. Start the three Drive tasks:

| Task | Dataset | Use in CycloneOS |
| --- | --- | --- |
| `cycloneos_s1_flood` | Sentinel-1 GRD VV | Flooded fraction per zone |
| `cycloneos_gpm_rain` | GPM IMERG V07 | `telemetry_readings` rainfall |
| `cycloneos_srtm` | SRTM 30 m | Zone `elevation_m` check |

## 3. Preprocess cyclone tracks

1. Download the IMD / JTWC best-track as CSV (`time, lat, lon, wind, pressure`).
2. Interpolate hourly positions.
3. Insert the latest fix into `storms` (`wind_kmh`, `pressure_hpa`, `heading_deg`, `movement_kmh`, `eta_hours`).

## 4. Zonal stats → Supabase

For each polygon in `zones` (buffer the city center by `distance_km`), reduce the three exports:

```text
flood_fraction = mean(flood_proxy)
rain_mm        = mean(rain_mm)
min_elev_m     = min(elev_m)
```

Put the results in a CSV shaped like `gee/telemetry.example.csv`:

```csv
region_id,reading_type,value,unit,source
kakinada-in,rainfall,320,mm,GPM IMERG
kakinada-in,flood_frac,0.18,1,Sentinel-1
```

Then, one time only, create the tables (Supabase SQL editor, in order):

```
supabase/schema.sql
supabase/policies.sql
```

Add the service-role key to `.env` (see `.env.example` — this key is server-only, never `VITE_`-prefixed) and run:

```bash
npm run gee:ingest -- --telemetry gee/telemetry.csv
```

For the storm track itself, shape the IMD/JTWC best-track as `gee/best-track.example.csv` and run:

```bash
npm run gee:ingest -- --track gee/best-track.csv
```

Both flags can be passed together. `scripts/gee-ingest.mjs` inserts the telemetry rows as-is and, for the track file, keeps only the latest fix per `region_id` (feed.ts already orders `storms` by `recorded_at desc` and reads the first one).

Optional: store GeoJSON in Supabase Storage (`gee/kakinada-flood.geojson`) if you later add vector overlays.

## 5. Refresh the dashboard

CycloneOS subscribes to `storms`, `advisories` and `dispatch_log`. After upsert, the Track view updates without a reload.
