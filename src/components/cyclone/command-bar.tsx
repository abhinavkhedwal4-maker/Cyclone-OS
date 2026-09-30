import { Radio } from "lucide-react";
import { useEffect, useState } from "react";
import type { Region } from "@/lib/cyclone/types";

type Props = {
  regions: Region[];
  regionId: string;
  onRegion: (id: string) => void;
  feed: "demo" | "live" | "loading";
  severity: string;
};

export function CommandBar({ regions, regionId, onRegion, feed, severity }: Props) {
  const [clock, setClock] = useState("--:--:-- UTC");
  useEffect(() => {
    const tick = () => setClock(`${new Date().toISOString().slice(11, 19)} UTC`);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="relative z-10 flex items-center justify-between gap-3 border-b border-border px-3 py-2.5 md:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <div className="brand-ring" aria-hidden="true">
          <i />
        </div>
        <div className="min-w-0">
          <div className="font-display text-lg font-semibold tracking-wide md:text-xl">
            CYCLONE<span className="text-accent">OS</span>
          </div>
          <div className="hidden font-display text-[10px] tracking-[0.22em] text-muted uppercase sm:block">
            Impact & infrastructure forecaster
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <span className="hidden items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[10px] tracking-widest text-muted uppercase sm:flex">
          <span className="live-dot" />
          {feed === "live" ? "Supabase live" : feed === "loading" ? "Linking feed" : "Demo feed"}
        </span>
        <span
          className={`hidden rounded-full px-2.5 py-1 font-display text-[10px] tracking-widest uppercase md:inline ${
            severity === "EMERGENCY"
              ? "bg-danger/15 text-danger"
              : severity === "WARNING"
                ? "bg-warn/15 text-warn"
                : "bg-ok/15 text-ok"
          }`}
        >
          {severity}
        </span>
        <label className="sr-only" htmlFor="region">
          Region
        </label>
        <select
          id="region"
          value={regionId}
          onChange={(e) => onRegion(e.target.value)}
          className="max-w-36 rounded-lg bg-surface/80 px-2.5 py-2 font-display text-xs text-fg shadow-[var(--shadow-border)] outline-none md:max-w-none"
        >
          {regions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}, {r.country}
            </option>
          ))}
        </select>
        <div className="hidden items-center gap-1.5 font-display text-xs text-muted tabular-nums lg:flex">
          <Radio className="size-3.5 text-accent" />
          {clock}
        </div>
      </div>
    </header>
  );
}
