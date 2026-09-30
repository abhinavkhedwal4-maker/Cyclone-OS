import type {
  Audience,
  ImpactReport,
  Infrastructure,
  Region,
  Severity,
  Storm,
  Zone,
} from "./types";

export function modeledSurge(storm: Storm, region: Region) {
  const wind = (storm.wind_kmh / 118) ** 2 * 2.32;
  const pressure = Math.max(0, (1012 - storm.pressure_hpa) / 26);
  return Number(((wind + pressure) * region.shelf_factor).toFixed(2));
}

export function zoneInundation(zone: Zone, waterM: number) {
  const decay = Math.exp(-zone.distance_km / 44);
  const local = waterM * decay;
  if (zone.elevation_m >= local) return 0;
  const over = local - zone.elevation_m;
  const drainFail = 1 - zone.drainage_capacity;
  return Math.min(1, (over / 3.6) * (0.5 + drainFail * 0.5));
}

export function rainDamage(storm: Storm, zone: Zone) {
  const rain = storm.rainfall_mm / 420;
  const drainFail = 1 - zone.drainage_capacity;
  const lowland = 1 / (1 + zone.elevation_m / 9);
  return Math.min(1, rain * (0.35 + drainFail * 0.65) * (0.55 + lowland * 0.7));
}

function severityOf(wind: number, maxInundation: number, rainfall: number): Severity {
  if (wind >= 185 || maxInundation > 0.68 || rainfall >= 380) return "EMERGENCY";
  if (wind >= 120 || maxInundation > 0.34) return "WARNING";
  return "WATCH";
}

const PATHWAYS: Record<string, string> = {
  power: "inundation → feeder isolation → hospital backup window",
  road: "sheet flow → arterial cut → delayed evacuation",
  medical: "ground-floor flooding → patient transfer → surge beds inland",
};

export function computeImpact(
  storm: Storm,
  region: Region,
  zones: Zone[],
  infra: Infrastructure[],
  tideM: number,
  surgeOverride: number | null,
): ImpactReport {
  const surgeM = surgeOverride ?? modeledSurge(storm, region);
  const waterM = surgeM + tideM;
  const zoneRisk: Record<string, number> = {};
  for (const z of zones) zoneRisk[z.id] = zoneInundation(z, waterM);

  const infraRisk: Record<string, number> = {};
  for (const asset of infra) {
    const zRisk = zoneRisk[asset.zone_id] ?? 0;
    infraRisk[asset.id] = Math.min(1, asset.criticality / 3 * 0.38 + zRisk * 0.62);
  }

  const peopleExposed = zones.reduce(
    (sum, z) => sum + z.population * (zoneRisk[z.id] ?? 0),
    0,
  );
  const flooded = infra.filter((a) => (infraRisk[a.id] ?? 0) >= 0.45);
  const maxZ = Math.max(0, ...Object.values(zoneRisk));
  const inundationKm2 = Number(
    (38 * waterM ** 1.42 * region.shelf_factor).toFixed(0),
  );
  const riskIndex = Math.round(
    Math.min(
      99,
      storm.wind_kmh / 2.6 + maxZ * 38 + storm.rainfall_mm / 22 + (1 - storm.confidence) * 8,
    ),
  );

  const rainPath = [...zones]
    .map((z) => {
      const score = rainDamage(storm, z);
      const worst = infra
        .filter((a) => a.zone_id === z.id)
        .sort((a, b) => (infraRisk[b.id] ?? 0) - (infraRisk[a.id] ?? 0))[0];
      const pathway = worst
        ? `${z.name} · ${PATHWAYS[worst.type]}`
        : `${z.name} · drainage failure → household flood`;
      return { zoneId: z.id, score, pathway };
    })
    .sort((a, b) => b.score - a.score);

  return {
    surgeM,
    tideM,
    waterM,
    inundationKm2,
    peopleExposed,
    floodedCount: flooded.length,
    totalAssets: infra.length,
    riskIndex,
    severity: severityOf(storm.wind_kmh, maxZ, storm.rainfall_mm),
    zoneRisk,
    infraRisk,
    rainPath,
  };
}

export function formatPeople(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return `${Math.round(n)}`;
}

export function composeAdvisory(input: {
  region: Region;
  storm: Storm;
  impact: ImpactReport;
  audience: Audience;
  floodedNames: string[];
}) {
  const { region, storm, impact, audience, floodedNames } = input;
  const who =
    audience === "health"
      ? "Health department"
      : audience === "grid"
        ? "Power utility"
        : "Municipal commissioner";
  const act =
    audience === "health"
      ? [
          `Move patients off ground floors at ${impact.floodedCount} exposed medical sites.`,
          "Confirm backup power and 48h consumables at district hospitals.",
          "Stage ambulance corridors on inland arterials above the surge line.",
        ]
      : audience === "grid"
        ? [
            `Isolate substations below ${impact.waterM.toFixed(1)} m water line.`,
            "Stage repair crews inland of the surge band before landfall.",
            "Prioritise feeders serving hospitals and relief shelters.",
          ]
        : [
            "Open relief shelters and pre-position pumps in low-lying wards.",
            "Begin phased evacuation of the surge band within the action window.",
            "Hold NH / coastal arterials for outbound traffic only.",
          ];

  const headline =
    impact.severity === "EMERGENCY"
      ? `${storm.name}: emergency surge window — ${region.name}`
      : impact.severity === "WARNING"
        ? `${storm.name}: coastal warning for ${region.name}`
        : `${storm.name}: watch issued — ${region.name}`;

  return {
    headline,
    summary: `${who}: water ${impact.waterM.toFixed(1)} m, ~${formatPeople(impact.peopleExposed)} people and ${impact.floodedCount}/${impact.totalAssets} critical assets below the line (${floodedNames.slice(0, 3).join(", ") || "none named"}). Wind ${storm.wind_kmh} km/h, rainfall ${storm.rainfall_mm} mm, ETA ${storm.eta_hours}h.`,
    actions: act,
    severity: impact.severity,
    confidence: Number((storm.confidence * (0.9 + (1 - impact.riskIndex / 200))).toFixed(2)),
  };
}

export function riskTone(score: number): "ok" | "warn" | "danger" {
  if (score >= 0.62) return "danger";
  if (score >= 0.34) return "warn";
  return "ok";
}
