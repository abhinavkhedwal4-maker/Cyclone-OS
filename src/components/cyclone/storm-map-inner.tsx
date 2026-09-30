import { useEffect } from "react";
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { destPoint, stormEye, trackPoints, zoneCoord } from "@/lib/cyclone/geo";
import { riskTone } from "@/lib/cyclone/model";
import type { ImpactReport, Infrastructure, Region, Storm, ViewId, Zone } from "@/lib/cyclone/types";

// Fix Leaflet's broken default marker icon paths when bundled with Vite/webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TONE = {
  ok: "#3ee0a4",
  warn: "#f0a12e",
  danger: "#ff5a6a",
};

/** Forces the map container to recalculate its size on first mount — prevents grey/blank tiles. */
function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

function FlyTo({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lon], 8.4, { duration: 1.05 });
    const t = window.setTimeout(() => map.invalidateSize(), 280);
    return () => window.clearTimeout(t);
  }, [lat, lon, map]);
  return null;
}

function eyeIcon() {
  return L.divIcon({
    className: "storm-eye",
    iconSize: [120, 120],
    iconAnchor: [60, 60],
    html: `<div class="eye-wrap"><span class="eye-ring a"></span><span class="eye-ring b"></span><span class="eye-ring c"></span><span class="eye-core"></span></div>`,
  });
}

function infraIcon(type: Infrastructure["type"], hot: boolean) {
  return L.divIcon({
    className: "infra-icon",
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div class="infra-mark ${type}${hot ? " is-hot" : ""}"></div>`,
  });
}

type Props = {
  region: Region;
  storm: Storm;
  zones: Zone[];
  infra: Infrastructure[];
  impact: ImpactReport;
  view: ViewId;
};

export function StormMapInner({ region, storm, zones, infra, impact, view }: Props) {
  const eye = stormEye(region.center_lat, region.center_lon, storm.heading_deg, storm.eta_hours, storm.movement_kmh);
  const track = trackPoints(
    region.center_lat,
    region.center_lon,
    storm.heading_deg,
    storm.eta_hours,
    storm.movement_kmh,
  ).map((p) => [p.lat, p.lon] as [number, number]);
  const cone = [
    destPoint(eye.lat, eye.lon, storm.heading_deg - 14, storm.eta_hours * storm.movement_kmh + 36),
    destPoint(eye.lat, eye.lon, storm.heading_deg + 14, storm.eta_hours * storm.movement_kmh + 36),
  ];

  return (
    <MapContainer
      center={[region.center_lat, region.center_lon]}
      zoom={8.4}
      zoomControl={false}
      attributionControl
      className="h-full w-full min-h-[400px]"
    >
      {/* OpenStreetMap — zero API key, zero watermark */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        subdomains="abc"
        maxZoom={19}
      />
      <ResizeMap />
      <FlyTo lat={region.center_lat} lon={region.center_lon} />

      {[20, 50, 100].map((km) => (
        <Circle
          key={km}
          center={[region.center_lat, region.center_lon]}
          radius={km * 1000}
          pathOptions={{ color: "#3ec8ff", weight: 1, opacity: 0.28, fillOpacity: 0, dashArray: "4 8" }}
        />
      ))}

      <Polyline
        positions={track}
        pathOptions={{ color: "#f0a12e", weight: 2.4, opacity: 0.9 }}
      />
      <Polyline
        positions={[[eye.lat, eye.lon], [cone[0].lat, cone[0].lon]]}
        pathOptions={{ color: "#f0a12e", weight: 1, opacity: 0.35, dashArray: "3 6" }}
      />
      <Polyline
        positions={[[eye.lat, eye.lon], [cone[1].lat, cone[1].lon]]}
        pathOptions={{ color: "#f0a12e", weight: 1, opacity: 0.35, dashArray: "3 6" }}
      />

      <Marker position={[eye.lat, eye.lon]} icon={eyeIcon()}>
        <Tooltip direction="top" offset={[0, -24]}>
          {storm.name} · {storm.wind_kmh} km/h · ETA {storm.eta_hours}h
        </Tooltip>
      </Marker>

      {zones.map((z, i) => {
        const c = zoneCoord(region.center_lat, region.center_lon, z.distance_km, i, zones.length);
        const score = view === "rain" ? (impact.rainPath.find((p) => p.zoneId === z.id)?.score ?? 0) : (impact.zoneRisk[z.id] ?? 0);
        const tone = TONE[riskTone(score)];
        return (
          <Circle
            key={z.id}
            center={[c.lat, c.lon]}
            radius={1400 + Math.sqrt(z.population) * 18}
            pathOptions={{
              color: tone,
              weight: 1.4,
              opacity: 0.9,
              fillColor: tone,
              fillOpacity: 0.18 + score * 0.32,
            }}
          >
            <Popup>
              <div className="font-display text-xs">
                <strong>{z.name}</strong>
                <div>Elevation {z.elevation_m} m · drain {(z.drainage_capacity * 100).toFixed(0)}%</div>
                <div>Risk {(score * 100).toFixed(0)}% · {z.population.toLocaleString()} people</div>
              </div>
            </Popup>
          </Circle>
        );
      })}

      {infra.map((asset, i) => {
        const zone = zones.find((z) => z.id === asset.zone_id);
        const zi = Math.max(0, zones.findIndex((z) => z.id === asset.zone_id));
        const base = zone
          ? zoneCoord(region.center_lat, region.center_lon, zone.distance_km, zi, zones.length)
          : { lat: region.center_lat, lon: region.center_lon };
        const jitter = destPoint(base.lat, base.lon, (i * 47) % 360, 2.2);
        const hot = (impact.infraRisk[asset.id] ?? 0) >= 0.45;
        return (
          <Marker key={asset.id} position={[jitter.lat, jitter.lon]} icon={infraIcon(asset.type, hot)}>
            <Popup>
              <div className="font-display text-xs">
                <strong>{asset.name}</strong>
                <div className="capitalize">{asset.type} · criticality {asset.criticality}</div>
                <div>Vulnerability {((impact.infraRisk[asset.id] ?? 0) * 100).toFixed(0)}%</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
