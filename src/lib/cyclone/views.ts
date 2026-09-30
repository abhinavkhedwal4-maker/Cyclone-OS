import type { ViewId } from "./types";

export const VIEWS: {
  id: ViewId;
  label: string;
  kicker: string;
  title: string;
  sub: string;
  swirl: number;
  speed: number;
  zoom: number;
  rain: number;
  amt: number;
  sev: number;
  tint: [number, number, number];
}[] = [
  {
    id: "overview",
    label: "Track",
    kicker: "Bay of Bengal — anticipatory action",
    title: "Act before landfall",
    sub: "Ensemble track, satellite exposure and the 72-hour action window",
    swirl: 1,
    speed: 1,
    zoom: 1.04,
    rain: 0.5,
    amt: 0.1,
    sev: 1,
    tint: [0.75, 0.92, 1],
  },
  {
    id: "surge",
    label: "Surge",
    kicker: "Inundation simulator",
    title: "Storm surge",
    sub: "Move the water line — zones and assets recompute instantly",
    swirl: 1.4,
    speed: 1.3,
    zoom: 1.07,
    rain: 0.8,
    amt: 0.2,
    sev: 2,
    tint: [1, 0.82, 0.58],
  },
  {
    id: "rain",
    label: "Rain",
    kicker: "Damage pathways",
    title: "Rainfall cascade",
    sub: "Where heavy rain cuts roads and takes substations offline",
    swirl: 1.1,
    speed: 1.1,
    zoom: 1.05,
    rain: 1.7,
    amt: 0.24,
    sev: 1,
    tint: [0.5, 0.78, 1],
  },
  {
    id: "assets",
    label: "Assets",
    kicker: "Critical infrastructure",
    title: "Exposure ledger",
    sub: "Power, roads and medical sites below the projected water line",
    swirl: 1,
    speed: 0.9,
    zoom: 1.09,
    rain: 0.6,
    amt: 0.12,
    sev: 2,
    tint: [1, 0.9, 0.75],
  },
  {
    id: "advisory",
    label: "Dispatch",
    kicker: "Early warning",
    title: "Advisory desk",
    sub: "Compose, score and send to municipal, health and grid teams",
    swirl: 2,
    speed: 1.9,
    zoom: 1.12,
    rain: 1.3,
    amt: 0.28,
    sev: 3,
    tint: [1, 0.46, 0.46],
  },
  {
    id: "gee",
    label: "GEE",
    kicker: "Earth Engine lab",
    title: "Satellite ingest",
    sub: "Run flood and rainfall exports, then load them into Supabase",
    swirl: 0.85,
    speed: 0.8,
    zoom: 1.03,
    rain: 0.4,
    amt: 0.14,
    sev: 1,
    tint: [0.62, 0.95, 0.82],
  },
];

export function viewMeta(id: ViewId) {
  return VIEWS.find((v) => v.id === id) ?? VIEWS[0];
}
