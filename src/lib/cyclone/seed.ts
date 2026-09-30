import type {
  Advisory,
  CycloneSnapshot,
  DispatchEvent,
  Infrastructure,
  Region,
  Storm,
  TelemetryReading,
  Zone,
} from "./types";

export const REGIONS: Region[] = [
  { id: "kakinada-in", name: "Kakinada", country: "India", basin: "Bay of Bengal", center_lat: 16.99, center_lon: 82.24, shelf_factor: 1.25 },
  { id: "chittagong-bd", name: "Chittagong", country: "Bangladesh", basin: "Bay of Bengal", center_lat: 22.36, center_lon: 91.8, shelf_factor: 1.4 },
  { id: "sittwe-mm", name: "Sittwe", country: "Myanmar", basin: "Bay of Bengal", center_lat: 20.15, center_lon: 92.9, shelf_factor: 1.1 },
  { id: "quynhon-vn", name: "Quy Nhon", country: "Vietnam", basin: "Coastal APAC", center_lat: 13.77, center_lon: 109.22, shelf_factor: 0.95 },
  { id: "tacloban-ph", name: "Tacloban", country: "Philippines", basin: "Coastal APAC", center_lat: 11.24, center_lon: 125.0, shelf_factor: 1.3 },
];

export const STORMS: Storm[] = [
  { id: "11111111-1111-4111-8111-111111111111", region_id: "kakinada-in", name: "Cyclonic Storm 03B", wind_kmh: 185, pressure_hpa: 944, rainfall_mm: 320, movement_kmh: 14, heading_deg: 298, confidence: 0.86, eta_hours: 9, recorded_at: "2026-09-29T12:40:00Z" },
  { id: "22222222-2222-4222-8222-222222222222", region_id: "chittagong-bd", name: "Cyclone Mora", wind_kmh: 155, pressure_hpa: 962, rainfall_mm: 410, movement_kmh: 18, heading_deg: 15, confidence: 0.79, eta_hours: 14, recorded_at: "2026-09-29T12:40:00Z" },
  { id: "33333333-3333-4333-8333-333333333333", region_id: "sittwe-mm", name: "Cyclone Freida", wind_kmh: 205, pressure_hpa: 932, rainfall_mm: 265, movement_kmh: 11, heading_deg: 65, confidence: 0.82, eta_hours: 6, recorded_at: "2026-09-29T12:40:00Z" },
  { id: "44444444-4444-4444-8444-444444444444", region_id: "quynhon-vn", name: "Typhoon Lira", wind_kmh: 140, pressure_hpa: 970, rainfall_mm: 380, movement_kmh: 21, heading_deg: 280, confidence: 0.74, eta_hours: 20, recorded_at: "2026-09-29T12:40:00Z" },
  { id: "55555555-5555-4555-8555-555555555555", region_id: "tacloban-ph", name: "Typhoon Bagyo", wind_kmh: 230, pressure_hpa: 918, rainfall_mm: 300, movement_kmh: 24, heading_deg: 300, confidence: 0.88, eta_hours: 5, recorded_at: "2026-09-29T12:40:00Z" },
];

export const ZONES: Zone[] = [
  { id: "kkd-port", region_id: "kakinada-in", name: "Kakinada Port", distance_km: 6, elevation_m: 3, drainage_capacity: 0.35, population: 42000 },
  { id: "kkd-city", region_id: "kakinada-in", name: "Kakinada City Core", distance_km: 12, elevation_m: 6, drainage_capacity: 0.5, population: 168000 },
  { id: "kkd-godavari", region_id: "kakinada-in", name: "Godavari Delta Belt", distance_km: 24, elevation_m: 4, drainage_capacity: 0.3, population: 96000 },
  { id: "kkd-yanam", region_id: "kakinada-in", name: "Yanam Corridor", distance_km: 38, elevation_m: 9, drainage_capacity: 0.55, population: 51000 },
  { id: "kkd-rajahmundry", region_id: "kakinada-in", name: "Rajahmundry Approach", distance_km: 58, elevation_m: 16, drainage_capacity: 0.62, population: 340000 },
  { id: "ctg-port", region_id: "chittagong-bd", name: "Chittagong Port Terminal", distance_km: 5, elevation_m: 2, drainage_capacity: 0.28, population: 61000 },
  { id: "ctg-city", region_id: "chittagong-bd", name: "Chittagong Metro Core", distance_km: 14, elevation_m: 8, drainage_capacity: 0.42, population: 410000 },
  { id: "ctg-coxbazar", region_id: "chittagong-bd", name: "Coxs Bazar Approach", distance_km: 46, elevation_m: 5, drainage_capacity: 0.33, population: 128000 },
  { id: "ctg-hathazari", region_id: "chittagong-bd", name: "Hathazari Belt", distance_km: 28, elevation_m: 11, drainage_capacity: 0.5, population: 74000 },
  { id: "ctg-sitakunda", region_id: "chittagong-bd", name: "Sitakunda Industrial Zone", distance_km: 20, elevation_m: 6, drainage_capacity: 0.38, population: 89000 },
  { id: "stw-coast", region_id: "sittwe-mm", name: "Sittwe Coastal Ward", distance_km: 4, elevation_m: 3, drainage_capacity: 0.22, population: 38000 },
  { id: "stw-city", region_id: "sittwe-mm", name: "Sittwe Town Centre", distance_km: 9, elevation_m: 7, drainage_capacity: 0.4, population: 94000 },
  { id: "stw-kaladan", region_id: "sittwe-mm", name: "Kaladan Riverbank", distance_km: 22, elevation_m: 4, drainage_capacity: 0.27, population: 47000 },
  { id: "stw-ponnagyun", region_id: "sittwe-mm", name: "Ponnagyun Belt", distance_km: 33, elevation_m: 12, drainage_capacity: 0.48, population: 29000 },
  { id: "qn-port", region_id: "quynhon-vn", name: "Quy Nhon Port", distance_km: 7, elevation_m: 4, drainage_capacity: 0.45, population: 52000 },
  { id: "qn-city", region_id: "quynhon-vn", name: "Quy Nhon City", distance_km: 13, elevation_m: 9, drainage_capacity: 0.55, population: 284000 },
  { id: "qn-tuyphuoc", region_id: "quynhon-vn", name: "Tuy Phuoc Lowlands", distance_km: 27, elevation_m: 3, drainage_capacity: 0.3, population: 61000 },
  { id: "qn-sonhai", region_id: "quynhon-vn", name: "Song Hai Delta", distance_km: 41, elevation_m: 6, drainage_capacity: 0.4, population: 38000 },
  { id: "tac-bay", region_id: "tacloban-ph", name: "San Pedro Bay Front", distance_km: 3, elevation_m: 2, drainage_capacity: 0.2, population: 71000 },
  { id: "tac-city", region_id: "tacloban-ph", name: "Tacloban City Centre", distance_km: 8, elevation_m: 6, drainage_capacity: 0.38, population: 249000 },
  { id: "tac-palo", region_id: "tacloban-ph", name: "Palo Municipality", distance_km: 16, elevation_m: 5, drainage_capacity: 0.3, population: 84000 },
  { id: "tac-tanauan", region_id: "tacloban-ph", name: "Tanauan Belt", distance_km: 23, elevation_m: 8, drainage_capacity: 0.42, population: 58000 },
];

export const INFRASTRUCTURE: Infrastructure[] = [
  { id: "kkd-inf-1", region_id: "kakinada-in", zone_id: "kkd-port", name: "Kakinada Deep Water Port Grid", type: "power", criticality: 3 },
  { id: "kkd-inf-2", region_id: "kakinada-in", zone_id: "kkd-port", name: "NH16 Coastal Arterial", type: "road", criticality: 3 },
  { id: "kkd-inf-3", region_id: "kakinada-in", zone_id: "kkd-city", name: "Government General Hospital", type: "medical", criticality: 3 },
  { id: "kkd-inf-4", region_id: "kakinada-in", zone_id: "kkd-city", name: "Kakinada 220kV Substation", type: "power", criticality: 2 },
  { id: "kkd-inf-5", region_id: "kakinada-in", zone_id: "kkd-godavari", name: "Godavari Delta Feeder Road", type: "road", criticality: 2 },
  { id: "kkd-inf-6", region_id: "kakinada-in", zone_id: "kkd-yanam", name: "Yanam Community Health Centre", type: "medical", criticality: 2 },
  { id: "kkd-inf-7", region_id: "kakinada-in", zone_id: "kkd-rajahmundry", name: "Rajahmundry Bridge Crossing", type: "road", criticality: 3 },
  { id: "kkd-inf-8", region_id: "kakinada-in", zone_id: "kkd-rajahmundry", name: "Rajahmundry Thermal Feeder", type: "power", criticality: 1 },
  { id: "ctg-inf-1", region_id: "chittagong-bd", zone_id: "ctg-port", name: "Chittagong Port Grid Station", type: "power", criticality: 3 },
  { id: "ctg-inf-2", region_id: "chittagong-bd", zone_id: "ctg-city", name: "Chittagong Medical College Hospital", type: "medical", criticality: 3 },
  { id: "ctg-inf-3", region_id: "chittagong-bd", zone_id: "ctg-coxbazar", name: "N1 Chittagong-Coxs Bazar Highway", type: "road", criticality: 3 },
  { id: "ctg-inf-4", region_id: "chittagong-bd", zone_id: "ctg-sitakunda", name: "Sitakunda Industrial Substation", type: "power", criticality: 2 },
  { id: "ctg-inf-5", region_id: "chittagong-bd", zone_id: "ctg-hathazari", name: "Hathazari Rural Clinic", type: "medical", criticality: 1 },
  { id: "ctg-inf-6", region_id: "chittagong-bd", zone_id: "ctg-city", name: "Karnaphuli Crossing Road", type: "road", criticality: 2 },
  { id: "stw-inf-1", region_id: "sittwe-mm", zone_id: "stw-coast", name: "Sittwe Airport Feeder", type: "power", criticality: 2 },
  { id: "stw-inf-2", region_id: "sittwe-mm", zone_id: "stw-city", name: "Sittwe General Hospital", type: "medical", criticality: 3 },
  { id: "stw-inf-3", region_id: "sittwe-mm", zone_id: "stw-coast", name: "Coastal Ring Road", type: "road", criticality: 2 },
  { id: "stw-inf-4", region_id: "sittwe-mm", zone_id: "stw-kaladan", name: "Kaladan Ferry Crossing", type: "road", criticality: 2 },
  { id: "stw-inf-5", region_id: "sittwe-mm", zone_id: "stw-ponnagyun", name: "Ponnagyun Rural Clinic", type: "medical", criticality: 1 },
  { id: "qn-inf-1", region_id: "quynhon-vn", zone_id: "qn-port", name: "Quy Nhon Port Substation", type: "power", criticality: 2 },
  { id: "qn-inf-2", region_id: "quynhon-vn", zone_id: "qn-city", name: "Binh Dinh General Hospital", type: "medical", criticality: 3 },
  { id: "qn-inf-3", region_id: "quynhon-vn", zone_id: "qn-tuyphuoc", name: "QL1A Coastal Highway", type: "road", criticality: 3 },
  { id: "qn-inf-4", region_id: "quynhon-vn", zone_id: "qn-tuyphuoc", name: "Tuy Phuoc Flood Clinic", type: "medical", criticality: 1 },
  { id: "qn-inf-5", region_id: "quynhon-vn", zone_id: "qn-sonhai", name: "Song Hai Delta Feeder", type: "power", criticality: 1 },
  { id: "tac-inf-1", region_id: "tacloban-ph", zone_id: "tac-bay", name: "San Pedro Bay Grid Feeder", type: "power", criticality: 3 },
  { id: "tac-inf-2", region_id: "tacloban-ph", zone_id: "tac-city", name: "Eastern Visayas Regional Medical Center", type: "medical", criticality: 3 },
  { id: "tac-inf-3", region_id: "tacloban-ph", zone_id: "tac-palo", name: "Pan-Philippine Highway Segment", type: "road", criticality: 3 },
  { id: "tac-inf-4", region_id: "tacloban-ph", zone_id: "tac-palo", name: "Palo District Hospital", type: "medical", criticality: 2 },
  { id: "tac-inf-5", region_id: "tacloban-ph", zone_id: "tac-tanauan", name: "Tanauan Substation", type: "power", criticality: 1 },
];

function stamp(hoursAgo: number) {
  return new Date(Date.now() - hoursAgo * 3600_000).toISOString();
}

export const TELEMETRY: TelemetryReading[] = REGIONS.flatMap((region, i) => {
  const storm = STORMS.find((s) => s.region_id === region.id)!;
  return [
    { id: i * 10 + 1, region_id: region.id, reading_type: "wind", value: storm.wind_kmh, unit: "km/h", source: "IMD Doppler", recorded_at: stamp(0.4) },
    { id: i * 10 + 2, region_id: region.id, reading_type: "pressure", value: storm.pressure_hpa, unit: "hPa", source: "ASCAT scatterometer", recorded_at: stamp(0.6) },
    { id: i * 10 + 3, region_id: region.id, reading_type: "rainfall", value: storm.rainfall_mm, unit: "mm", source: "GPM IMERG", recorded_at: stamp(0.5) },
    { id: i * 10 + 4, region_id: region.id, reading_type: "tide", value: 0.6 + region.shelf_factor * 0.12, unit: "m", source: "Coastal gauge", recorded_at: stamp(0.2) },
    { id: i * 10 + 5, region_id: region.id, reading_type: "soil", value: 78 + i * 3, unit: "%", source: "SMAP L3", recorded_at: stamp(1.1) },
  ];
});

export const ADVISORIES: Advisory[] = [];
export const DISPATCHES: DispatchEvent[] = [];

export function demoSnapshot(): CycloneSnapshot {
  return {
    regions: REGIONS,
    storms: STORMS,
    zones: ZONES,
    infrastructure: INFRASTRUCTURE,
    telemetry: TELEMETRY,
    advisories: ADVISORIES,
    dispatches: DISPATCHES,
    source: "demo",
  };
}
