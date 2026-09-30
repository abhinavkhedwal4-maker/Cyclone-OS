import { Activity, Building2, CloudRain, Hospital, Waypoints, Zap } from "lucide-react";
import type { ReactNode } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { modeledSurge, riskTone } from "@/lib/cyclone/model";
import type {
  ImpactReport,
  Infrastructure,
  Region,
  Storm,
  TelemetryReading,
  ViewId,
  Zone,
} from "@/lib/cyclone/types";
import { cn } from "@/lib/utils";

function Tag({ score, label }: { score: number; label: string }) {
  const tone = riskTone(score);
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 font-display text-[10px] font-semibold tracking-wide",
        tone === "danger" && "bg-danger/15 text-danger",
        tone === "warn" && "bg-warn/15 text-warn",
        tone === "ok" && "bg-ok/15 text-ok",
      )}
    >
      {label}
    </span>
  );
}

type Props = {
  view: ViewId;
  region: Region;
  storm: Storm;
  zones: Zone[];
  infra: Infrastructure[];
  telemetry: TelemetryReading[];
  impact: ImpactReport;
  surgeOverride: number | null;
  tide: number;
  onSurge: (v: number | null) => void;
  onTide: (v: number) => void;
  children?: ReactNode;
};

export function ContextPanel(props: Props) {
  const { view } = props;
  return (
    <aside className="hud relative z-10 flex h-full min-h-[280px] flex-col overflow-hidden p-3 md:min-h-0 md:p-4">
      {view === "overview" && <OverviewBlock {...props} />}
      {view === "surge" && <SurgeBlock {...props} />}
      {view === "rain" && <RainBlock {...props} />}
      {view === "assets" && <AssetsBlock {...props} />}
      {view === "advisory" && props.children}
      {view === "gee" && props.children}
    </aside>
  );
}

function OverviewBlock({ storm, region, telemetry, impact }: Props) {
  const feeds = [
    { n: "Sentinel-1 flood mask", s: "LIVE", d: "GEE · last pass 06:12 UTC" },
    { n: "GPM IMERG rainfall", s: "LIVE", d: "GEE · 30 min granule" },
    { n: "IMD wind / track", s: "LIVE", d: "Scatterometer · 3 h" },
    { n: "Advisory model", s: "READY", d: "Grok / Gemini desk" },
  ];
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
      <h2 className="m-0 font-display text-sm font-semibold">Storm bulletin</h2>
      <div className="rounded-[var(--radius-md)] bg-bg/50 p-3">
        <div className="font-display text-lg font-semibold">{storm.name}</div>
        <div className="mt-1 font-display text-xs text-muted">
          {region.name} · {region.basin}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 font-display text-xs">
          <div>
            <dt className="text-muted">Wind</dt>
            <dd className="text-base font-semibold tabular-nums">{storm.wind_kmh} km/h</dd>
          </div>
          <div>
            <dt className="text-muted">Pressure</dt>
            <dd className="text-base font-semibold tabular-nums">{storm.pressure_hpa} hPa</dd>
          </div>
          <div>
            <dt className="text-muted">Heading</dt>
            <dd className="text-base font-semibold tabular-nums">{storm.heading_deg}°</dd>
          </div>
          <div>
            <dt className="text-muted">Motion</dt>
            <dd className="text-base font-semibold tabular-nums">{storm.movement_kmh} km/h</dd>
          </div>
        </dl>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-fg/10">
        <i
          className="block h-full rounded-full bg-linear-to-r from-ok via-warn to-danger"
          style={{ width: `${impact.riskIndex}%` }}
        />
      </div>
      <ul className="space-y-2">
        {feeds.map((f) => (
          <li key={f.n} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-fg/5 px-2.5 py-2">
            <div>
              <div className="font-display text-xs font-medium">{f.n}</div>
              <div className="text-[11px] text-muted">{f.d}</div>
            </div>
            <Tag score={f.s === "READY" ? 0.4 : 0.15} label={f.s} />
          </li>
        ))}
      </ul>
      <ul className="mt-1 space-y-1 font-display text-[11px] text-muted">
        {telemetry.slice(0, 4).map((t) => (
          <li key={t.id} className="flex justify-between">
            <span>{t.source}</span>
            <span className="tabular-nums text-fg">
              {t.value} {t.unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SurgeBlock({ region, storm, impact, surgeOverride, tide, onSurge, onTide, zones }: Props) {
  const modeled = modeledSurge(storm, region);
  const surge = surgeOverride ?? modeled;
  const ranked = [...zones].sort((a, b) => (impact.zoneRisk[b.id] ?? 0) - (impact.zoneRisk[a.id] ?? 0));
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
      <h2 className="m-0 font-display text-sm font-semibold">Surge simulator</h2>
      <label className="grid grid-cols-[72px_1fr_52px] items-center gap-2 font-display text-xs">
        Surge
        <input
          type="range"
          min={0.5}
          max={7}
          step={0.1}
          value={surge}
          onChange={(e) => onSurge(Number(e.target.value))}
        />
        <output className="text-right text-accent tabular-nums">{surge.toFixed(1)} m</output>
      </label>
      <label className="grid grid-cols-[72px_1fr_52px] items-center gap-2 font-display text-xs">
        Tide
        <input
          type="range"
          min={0}
          max={1.8}
          step={0.1}
          value={tide}
          onChange={(e) => onTide(Number(e.target.value))}
        />
        <output className="text-right text-accent tabular-nums">{tide.toFixed(1)} m</output>
      </label>
      <button
        type="button"
        className="self-start rounded-lg px-3 py-1.5 font-display text-[11px] tracking-wide text-muted shadow-[var(--shadow-border)]"
        onClick={() => onSurge(null)}
      >
        Reset to model {modeled.toFixed(1)} m
      </button>
      <div className="space-y-1.5">
        {ranked.map((z) => {
          const s = impact.zoneRisk[z.id] ?? 0;
          return (
            <div key={z.id} className="rounded-[var(--radius-sm)] bg-fg/5 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <b className="font-display text-xs font-medium">{z.name}</b>
                <Tag score={s} label={s > 0.62 ? "CRITICAL" : s > 0.34 ? "ELEVATED" : "LOW"} />
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-fg/10">
                <i
                  className="block h-full rounded-full bg-accent"
                  style={{ width: `${Math.round(s * 100)}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-muted">
                {z.elevation_m} m ground · {z.distance_km} km inland
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RainBlock({ impact, zones, storm }: Props) {
  const data = impact.rainPath.map((p) => ({
    name: zones.find((z) => z.id === p.zoneId)?.name.replace(/ .*/, "") ?? p.zoneId,
    score: Math.round(p.score * 100),
  }));
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-auto">
      <h2 className="m-0 flex items-center gap-2 font-display text-sm font-semibold">
        <CloudRain className="size-4 text-accent" /> Damage pathways
      </h2>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 4, left: -24, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fill: "#8fa3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "#101a28",
                border: "1px solid rgb(232 238 248 / 0.12)",
                fontSize: 12,
              }}
            />
            <Bar dataKey="score" fill="#3ec8ff" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {impact.rainPath.slice(0, 4).map((p) => {
          const z = zones.find((x) => x.id === p.zoneId);
          return (
            <li key={p.zoneId} className="rounded-[var(--radius-sm)] bg-fg/5 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <b className="font-display text-xs">{z?.name}</b>
                <Tag score={p.score} label={p.score > 0.62 ? "CRITICAL" : p.score > 0.34 ? "ELEVATED" : "WATCH"} />
              </div>
              <p className="mt-1 text-[11px] text-muted">{p.pathway}</p>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-muted">
        {storm.rainfall_mm} mm ensemble rainfall stacked on drainage capacity. GPM granules refresh every 30 minutes.
      </p>
    </div>
  );
}

function AssetsBlock({ infra, impact, zones }: Props) {
  const groups: { t: Infrastructure["type"]; label: string; icon: typeof Zap }[] = [
    { t: "power", label: "Power grid", icon: Zap },
    { t: "road", label: "Arterial roads", icon: Waypoints },
    { t: "medical", label: "Medical", icon: Hospital },
  ];
  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-auto">
      <h2 className="m-0 flex items-center gap-2 font-display text-sm font-semibold">
        <Building2 className="size-4 text-accent" /> Below the water line
      </h2>
      {groups.map((g) => {
        const items = infra.filter((a) => a.type === g.t);
        const hot = items.filter((a) => (impact.infraRisk[a.id] ?? 0) >= 0.45);
        const Icon = g.icon;
        return (
          <div key={g.t}>
            <div className="mb-1 flex items-center justify-between font-display text-xs">
              <span className="flex items-center gap-1.5">
                <Icon className="size-3.5 text-accent" /> {g.label}
              </span>
              <span className="tabular-nums text-muted">
                {hot.length}/{items.length}
              </span>
            </div>
            <div className="mb-2 h-1 overflow-hidden rounded-full bg-fg/10">
              <i
                className="block h-full rounded-full bg-warn"
                style={{ width: `${items.length ? (hot.length / items.length) * 100 : 0}%` }}
              />
            </div>
            <ul className="space-y-1">
              {items.map((a) => {
                const s = impact.infraRisk[a.id] ?? 0;
                const z = zones.find((x) => x.id === a.zone_id);
                return (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-fg/5 px-2 py-1.5">
                    <div className="min-w-0">
                      <div className="truncate font-display text-[12px]">{a.name}</div>
                      <div className="text-[10px] text-muted">{z?.name}</div>
                    </div>
                    <Tag score={s} label={`${Math.round(s * 100)}`} />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
      <p className="flex items-center gap-1.5 text-[11px] text-muted">
        <Activity className="size-3" /> Hot icons pulse when vulnerability ≥ 45%.
      </p>
    </div>
  );
}
