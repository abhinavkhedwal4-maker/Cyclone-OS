import { Check, Copy, Layers, Loader2, Satellite, TriangleAlert } from "lucide-react";
import { useEffect, useState, type ComponentType } from "react";
import { toast } from "sonner";
import { getGeeStormLayer } from "@/routes/api/gee/-storm-layer";

const SCRIPT = `// CycloneOS — Earth Engine export (paste in https://code.earthengine.google.com)
var roi = ee.Geometry.Point([82.24, 16.99]).buffer(80000); // Kakinada; swap lon/lat
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(roi).filterDate('2026-09-20', '2026-09-29')
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .select('VV').median();
var wet = s1.lt(-16).selfMask().rename('flood_proxy');
var rain = ee.ImageCollection('NASA/GPM_L3/IMERG_V07')
  .filterBounds(roi).filterDate('2026-09-27', '2026-09-29')
  .select('precipitation').sum().clip(roi);
var elev = ee.Image('USGS/SRTMGL1_003').clip(roi);
Export.image.toDrive({image: wet, description: 'cycloneos_s1_flood', region: roi, scale: 20, maxPixels: 1e9});
Export.image.toDrive({image: rain, description: 'cycloneos_gpm_rain', region: roi, scale: 1000, maxPixels: 1e9});
Export.image.toDrive({image: elev, description: 'cycloneos_srtm', region: roi, scale: 30, maxPixels: 1e9});
`;

const STEPS = [
  { t: "Open Earth Engine", d: "Sign in at code.earthengine.google.com with the Google Cloud project that has Earth Engine enabled." },
  { t: "Set the ROI", d: "Use the coastal city lon/lat from CycloneOS (Kakinada 82.24, 16.99 — or Chittagong, Sittwe, Quy Nhon, Tacloban)." },
  { t: "Run the export", d: "Paste the script, change dates to the current storm, click Run, then start the three Drive tasks." },
  { t: "Ingest to Supabase", d: "Convert GeoTIFF → zone stats as a CSV (see gee/telemetry.example.csv), then run `npm run gee:ingest -- --telemetry gee/telemetry.csv`. Full steps in docs/GEE.md." },
];

type GeeResult =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "not_configured"; message: string }
  | { status: "not_installed"; message: string }
  | { status: "ok"; urlTile: string }
  | { status: "error"; message: string };

/** Mini map overlay shown when GEE returns a live tile URL */
function GeeMapOverlay({ urlTile }: { urlTile: string }) {
  const [Inner, setInner] = useState<ComponentType<{ geeTileUrl: string }> | null>(null);

  useEffect(() => {
    void import("./gee-map-inner").then((m) => setInner(() => m.GeeMapInner));
  }, []);

  if (!Inner) {
    return (
      <div className="flex h-40 items-center justify-center rounded-[var(--radius-md)] bg-bg/60 font-display text-xs tracking-widest text-muted uppercase">
        Loading map…
      </div>
    );
  }
  return <Inner geeTileUrl={urlTile} />;
}

export function GeeLab() {
  const [copied, setCopied] = useState(false);
  const [geeResult, setGeeResult] = useState<GeeResult>({ status: "idle" });

  const copy = async () => {
    await navigator.clipboard.writeText(SCRIPT);
    setCopied(true);
    toast.success("Earth Engine script copied");
    window.setTimeout(() => setCopied(false), 1600);
  };

  const fetchGeeLayer = async () => {
    setGeeResult({ status: "loading" });
    try {
      const result = await getGeeStormLayer();
      setGeeResult(result as GeeResult);
    } catch (err) {
      setGeeResult({ status: "error", message: err instanceof Error ? err.message : "Request failed" });
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
      <h2 className="m-0 flex items-center gap-2 font-display text-sm font-semibold">
        <Satellite className="size-4 text-accent" /> Earth Engine lab
      </h2>
      <p className="text-xs leading-relaxed text-muted">
        GEE cannot run in the browser. You run the satellite jobs on Google's platform, then load the summaries into your existing Supabase tables. CycloneOS already reads those tables live.
      </p>

      {/* Live layer fetch */}
      <div className="rounded-[var(--radius-md)] bg-fg/5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-display text-xs font-medium">Live Sentinel-1 layer</span>
          <button
            type="button"
            onClick={() => void fetchGeeLayer()}
            disabled={geeResult.status === "loading"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-1.5 font-display text-[11px] tracking-wider text-accent transition-colors hover:bg-accent/20 disabled:opacity-50"
          >
            {geeResult.status === "loading" ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Layers className="size-3" />
            )}
            {geeResult.status === "loading" ? "Fetching…" : "Fetch layer"}
          </button>
        </div>

        {geeResult.status === "not_configured" && (
          <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-warn/10 p-2.5 text-[11px] text-warn">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {geeResult.message}{" "}
              <span className="text-muted">Add <code className="bg-bg/60 px-1 py-0.5 rounded">GEE_SERVICE_ACCOUNT</code> and <code className="bg-bg/60 px-1 py-0.5 rounded">GEE_PRIVATE_KEY</code> to your environment.</span>
            </span>
          </div>
        )}

        {geeResult.status === "not_installed" && (
          <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-warn/10 p-2.5 text-[11px] text-warn">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            <span>
              {geeResult.message}
            </span>
          </div>
        )}

        {geeResult.status === "error" && (
          <div className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-danger/10 p-2.5 text-[11px] text-danger">
            <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
            {geeResult.message}
          </div>
        )}

        {geeResult.status === "ok" && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-1.5 text-[11px] text-ok">
              <Check className="size-3" /> Tile layer acquired
            </div>
            <GeeMapOverlay urlTile={geeResult.urlTile} />
          </div>
        )}

        {geeResult.status === "idle" && (
          <p className="text-[11px] text-muted">
            Click "Fetch layer" to pull a live Sentinel-1 GRD mosaic via the server-side GEE API. Requires credentials in environment.
          </p>
        )}
      </div>

      <ol className="space-y-2">
        {STEPS.map((s, i) => (
          <li key={s.t} className="flex gap-2.5 rounded-[var(--radius-sm)] bg-fg/5 p-2.5">
            <span className="font-display text-accent tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <div>
              <div className="font-display text-xs font-medium">{s.t}</div>
              <p className="mt-0.5 text-[11px] text-muted">{s.d}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="relative">
        <pre className="max-h-48 overflow-auto rounded-[var(--radius-md)] bg-bg/80 p-3 font-mono text-[10px] leading-relaxed text-muted">
          {SCRIPT}
        </pre>
        <button
          type="button"
          onClick={() => void copy()}
          className="absolute top-2 right-2 inline-flex min-h-9 items-center gap-1 rounded-lg bg-surface px-2 font-display text-[11px] shadow-[var(--shadow-border)]"
        >
          {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
