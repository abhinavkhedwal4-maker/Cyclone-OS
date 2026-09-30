export type InfraType = "power" | "road" | "medical";
export type Audience = "municipal" | "health" | "grid";
export type Severity = "WATCH" | "WARNING" | "EMERGENCY";
export type ViewId =
  | "overview"
  | "surge"
  | "rain"
  | "assets"
  | "advisory"
  | "gee";

export type Region = {
  id: string;
  name: string;
  country: string;
  basin: string;
  center_lat: number;
  center_lon: number;
  shelf_factor: number;
};

export type Storm = {
  id: string;
  region_id: string;
  name: string;
  wind_kmh: number;
  pressure_hpa: number;
  rainfall_mm: number;
  movement_kmh: number;
  heading_deg: number;
  confidence: number;
  eta_hours: number;
  recorded_at: string;
};

export type Zone = {
  id: string;
  region_id: string;
  name: string;
  distance_km: number;
  elevation_m: number;
  drainage_capacity: number;
  population: number;
};

export type Infrastructure = {
  id: string;
  region_id: string;
  zone_id: string;
  name: string;
  type: InfraType;
  criticality: number;
};

export type TelemetryReading = {
  id: number;
  region_id: string;
  reading_type: string;
  value: number;
  unit: string;
  source: string;
  recorded_at: string;
};

export type Advisory = {
  id: string;
  region_id: string;
  headline: string;
  summary: string;
  actions: string[];
  severity: Severity;
  confidence: number;
  source: string;
  created_at: string;
};

export type DispatchEvent = {
  id: string;
  region_id: string;
  advisory_id: string | null;
  dispatched_at: string;
};

export type CycloneSnapshot = {
  regions: Region[];
  storms: Storm[];
  zones: Zone[];
  infrastructure: Infrastructure[];
  telemetry: TelemetryReading[];
  advisories: Advisory[];
  dispatches: DispatchEvent[];
  source: "supabase" | "demo";
};

export type ImpactReport = {
  surgeM: number;
  tideM: number;
  waterM: number;
  inundationKm2: number;
  peopleExposed: number;
  floodedCount: number;
  totalAssets: number;
  riskIndex: number;
  severity: Severity;
  zoneRisk: Record<string, number>;
  infraRisk: Record<string, number>;
  rainPath: { zoneId: string; score: number; pathway: string }[];
};
