import { Toaster } from "sonner";
import { useMemo, useState } from "react";
import { computeImpact } from "@/lib/cyclone/model";
import { useCycloneFeed } from "@/lib/cyclone/feed";
import { useCycloneStore } from "@/lib/cyclone/store";
import { viewMeta } from "@/lib/cyclone/views";
import { AdvisoryConsole } from "./advisory-console";
import { CommandBar } from "./command-bar";
import { ContextPanel } from "./context-panel";
import { GeeLab } from "./gee-lab";
import { KpiStrip } from "./kpi-strip";
import { StormMap } from "./storm-map";
import { StormSky } from "./storm-sky";
import { Ticker } from "./ticker";
import { ViewRail } from "./view-rail";

export function Dashboard() {
  const { snap, status, pushAdvisory, pushDispatch } = useCycloneFeed();
  const view = useCycloneStore((s) => s.view);
  const regionId = useCycloneStore((s) => s.regionId);
  const surgeOverride = useCycloneStore((s) => s.surgeOverride);
  const tide = useCycloneStore((s) => s.tide);
  const audience = useCycloneStore((s) => s.audience);
  const setView = useCycloneStore((s) => s.setView);
  const setRegionId = useCycloneStore((s) => s.setRegionId);
  const setSurgeOverride = useCycloneStore((s) => s.setSurgeOverride);
  const setTide = useCycloneStore((s) => s.setTide);
  const setAudience = useCycloneStore((s) => s.setAudience);
  const [flashKey, setFlashKey] = useState(0);

  const region = snap.regions.find((r) => r.id === regionId) ?? snap.regions[0];
  const storm = snap.storms.find((s) => s.region_id === region?.id) ?? snap.storms[0];

  const impact = useMemo(() => {
    if (!storm || !region) {
      return computeImpact(
        snap.storms[0]!,
        snap.regions[0]!,
        [],
        [],
        tide,
        surgeOverride,
      );
    }
    return computeImpact(
      storm,
      region,
      snap.zones.filter((z) => z.region_id === region.id),
      snap.infrastructure.filter((a) => a.region_id === region.id),
      tide,
      surgeOverride,
    );
  }, [storm, region, snap.zones, snap.infrastructure, tide, surgeOverride, snap.storms, snap.regions]);

  if (!region || !storm) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg font-display text-muted">
        Loading cyclone desk…
      </div>
    );
  }

  const zones = snap.zones.filter((z) => z.region_id === region.id);
  const infra = snap.infrastructure.filter((a) => a.region_id === region.id);
  const telemetry = snap.telemetry.filter((t) => t.region_id === region.id);
  const advisories = snap.advisories.filter((a) => a.region_id === region.id);
  const dispatches = snap.dispatches.filter((d) => d.region_id === region.id);

  const meta = viewMeta(view);
  const kicker =
    impact.severity === "EMERGENCY" ? "Severe — dispatch window open" : meta.kicker;

  const ticker = `Sentinel-1 pass 06:12 UTC flood mask refreshed   //   GPM IMERG rainfall ingested   //   ${storm.name} ${storm.wind_kmh} km/h heading ${storm.heading_deg}°   //   ${impact.floodedCount} assets below ${impact.waterM.toFixed(1)} m   //   payout trigger ${impact.waterM >= 4.5 ? "MET" : "armed"}   //   `;

  return (
    <div className="relative flex h-dvh min-h-0 flex-col text-fg">
      <StormSky view={view} flashKey={flashKey} />
      <div className="scrim" />
      <div className="scan" />
      <Toaster theme="dark" position="top-center" />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <CommandBar
          regions={snap.regions}
          regionId={region.id}
          onRegion={(id) => {
            setRegionId(id);
            setFlashKey((n) => n + 1);
          }}
          feed={status}
          severity={impact.severity}
        />

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:grid md:grid-cols-[92px_minmax(0,1fr)_minmax(280px,380px)] md:overflow-hidden">
          <ViewRail
            view={view}
            onView={(id) => {
              setView(id);
              setFlashKey((n) => n + 1);
            }}
          />

          <main className="flex min-h-[42vh] min-w-0 flex-1 flex-col gap-3 p-3 md:min-h-0 md:p-4">
            <StormMap
              region={region}
              storm={storm}
              zones={zones}
              infra={infra}
              impact={impact}
              view={view}
              kicker={kicker}
              title={meta.title}
              sub={`${meta.sub} · ${region.name}, ${region.country}`}
            />
          </main>

          <div className="min-h-0 px-3 pb-3 md:h-full md:py-4 md:pr-4 md:pl-0">
            <ContextPanel
              view={view}
              region={region}
              storm={storm}
              zones={zones}
              infra={infra}
              telemetry={telemetry}
              impact={impact}
              surgeOverride={surgeOverride}
              tide={tide}
              onSurge={setSurgeOverride}
              onTide={setTide}
            >
              {view === "advisory" ? (
                <AdvisoryConsole
                  region={region}
                  storm={storm}
                  impact={impact}
                  infra={infra}
                  audience={audience}
                  onAudience={setAudience}
                  advisories={advisories}
                  dispatches={dispatches}
                  onCreate={pushAdvisory}
                  onDispatch={pushDispatch}
                />
              ) : null}
              {view === "gee" ? <GeeLab /> : null}
            </ContextPanel>
          </div>
        </div>

        <KpiStrip
          view={view}
          storm={storm}
          impact={impact}
          dispatched={dispatches.length}
        />
        <Ticker line={ticker} />
      </div>
    </div>
  );
}
