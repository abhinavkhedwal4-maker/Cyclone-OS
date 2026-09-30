import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Kakinada, Bay of Bengal — default view for the GEE overlay
const GEE_CENTER: [number, number] = [16.99, 82.24];
const GEE_ZOOM = 9;

function ResizeMap() {
  const map = useMap();
  useEffect(() => {
    const t = window.setTimeout(() => map.invalidateSize(), 250);
    return () => window.clearTimeout(t);
  }, [map]);
  return null;
}

export function GeeMapInner({ geeTileUrl }: { geeTileUrl: string }) {
  return (
    <div className="h-44 w-full overflow-hidden rounded-[var(--radius-md)]">
      <MapContainer
        center={GEE_CENTER}
        zoom={GEE_ZOOM}
        zoomControl={false}
        attributionControl
        className="h-full w-full"
      >
        {/* OpenStreetMap standard tiles — zero API key, zero watermark */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          subdomains="abc"
          maxZoom={19}
        />
        {/* GEE Sentinel-1 overlay */}
        <TileLayer
          attribution="Google Earth Engine"
          url={geeTileUrl}
          opacity={0.7}
        />
        <ResizeMap />
      </MapContainer>
    </div>
  );
}
