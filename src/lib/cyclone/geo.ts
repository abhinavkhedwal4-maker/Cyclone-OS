const R = 6371;

export function destPoint(
  lat: number,
  lon: number,
  bearingDeg: number,
  km: number,
) {
  const br = (bearingDeg * Math.PI) / 180;
  const φ1 = (lat * Math.PI) / 180;
  const λ1 = (lon * Math.PI) / 180;
  const δ = km / R;
  const φ2 = Math.asin(
    Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(br),
  );
  const λ2 =
    λ1 +
    Math.atan2(
      Math.sin(br) * Math.sin(δ) * Math.cos(φ1),
      Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2),
    );
  return {
    lat: (φ2 * 180) / Math.PI,
    lon: ((((λ2 * 180) / Math.PI + 540) % 360) - 180),
  };
}

export function stormEye(
  lat: number,
  lon: number,
  headingDeg: number,
  etaHours: number,
  movementKmh: number,
) {
  const range = Math.max(18, etaHours * movementKmh);
  return destPoint(lat, lon, headingDeg + 180, range);
}

export function trackPoints(
  lat: number,
  lon: number,
  headingDeg: number,
  etaHours: number,
  movementKmh: number,
) {
  const eye = stormEye(lat, lon, headingDeg, etaHours, movementKmh);
  const inland = destPoint(lat, lon, headingDeg, 28);
  const mid = destPoint(lat, lon, headingDeg + 180, (etaHours * movementKmh) * 0.45);
  return [eye, mid, { lat, lon }, inland];
}

export function zoneCoord(
  lat: number,
  lon: number,
  distanceKm: number,
  index: number,
  count: number,
) {
  const spread = (index - (count - 1) / 2) * 16;
  const inland = 268 + spread;
  return destPoint(lat, lon, inland, Math.max(4, distanceKm * 0.42));
}
