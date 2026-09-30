import { formatPeople } from "@/lib/cyclone/model";
import type { ImpactReport, Storm, ViewId } from "@/lib/cyclone/types";

type Props = {
  view: ViewId;
  storm: Storm;
  impact: ImpactReport;
  dispatched: number;
};

export function KpiStrip({ view, storm, impact, dispatched }: Props) {
  const rows =
    view === "surge"
      ? [
          ["Water line", `${impact.waterM.toFixed(1)}`, "m"],
          ["Inundation", `${impact.inundationKm2}`, "km²"],
          ["People exposed", formatPeople(impact.peopleExposed), ""],
          ["Assets flooded", `${impact.floodedCount}/${impact.totalAssets}`, ""],
          ["Model confidence", `${Math.round(storm.confidence * 100)}`, "%"],
        ]
      : view === "rain"
        ? [
            ["24h rainfall", `${storm.rainfall_mm}`, "mm"],
            ["Peak catchments", `${impact.rainPath.filter((p) => p.score > 0.55).length}`, ""],
            ["People exposed", formatPeople(impact.peopleExposed), ""],
            ["Road / power cuts", `${impact.floodedCount}`, ""],
            ["Soil saturation", "91", "%"],
          ]
        : view === "assets"
          ? [
              ["Assets at risk", `${impact.floodedCount}/${impact.totalAssets}`, ""],
              ["Risk index", `${impact.riskIndex}`, "/100"],
              ["Water line", `${impact.waterM.toFixed(1)}`, "m"],
              ["Criticality 3 hits", `${impact.floodedCount}`, ""],
              ["Hardening picks", "5", ""],
            ]
          : view === "advisory"
            ? [
                ["Severity", impact.severity, ""],
                ["Confidence", `${Math.round(storm.confidence * 100)}`, "%"],
                ["Action window", `${storm.eta_hours}`, "h"],
                ["Dispatched", `${dispatched}`, ""],
                ["Payout trigger", impact.waterM >= 4.5 ? "Met" : "Armed", ""],
              ]
            : [
                ["Risk index", `${impact.riskIndex}`, "/100"],
                ["Action window", `${storm.eta_hours}`, "h"],
                ["People exposed", formatPeople(impact.peopleExposed), ""],
                ["Assets at risk", `${impact.floodedCount}/${impact.totalAssets}`, ""],
                ["Insurance trigger", impact.waterM >= 4.5 ? "Met" : "Armed", ""],
              ];

  return (
    <section className="relative z-10 grid grid-cols-2 gap-2 px-3 pb-3 md:grid-cols-5 md:px-4">
      {rows.map((row, i) => (
        <article
          key={row[0]}
          className={`hud kpi px-4 py-3 ${impact.severity === "EMERGENCY" && i === 0 ? "shadow-[0_0_0_1px_rgb(255_90_106_/_0.45)]" : ""}`}
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <p className="m-0 font-display text-[10px] tracking-[0.18em] text-muted uppercase">{row[0]}</p>
          <b className="font-display text-2xl font-semibold tracking-tight tabular-nums md:text-[28px]">
            {row[1]}
            {row[2] ? <small className="ml-1 text-sm font-medium text-muted">{row[2]}</small> : null}
          </b>
        </article>
      ))}
    </section>
  );
}
