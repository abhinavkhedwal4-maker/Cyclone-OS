/**
 * CycloneOS — Google Earth Engine export
 * Paste into https://code.earthengine.google.com
 *
 * Outputs (Google Drive):
 *   cycloneos_s1_flood  — Sentinel-1 VV flood proxy (wet = 1)
 *   cycloneos_gpm_rain  — IMERG accumulated precipitation (mm)
 *   cycloneos_srtm      — SRTM elevation (m)
 *
 * After export: zonal-stats into Supabase `zones` / `telemetry_readings`.
 */

var CITIES = {
  kakinada: ee.Geometry.Point([82.24, 16.99]),
  chittagong: ee.Geometry.Point([91.80, 22.36]),
  sittwe: ee.Geometry.Point([92.90, 20.15]),
  quynhon: ee.Geometry.Point([109.22, 13.77]),
  tacloban: ee.Geometry.Point([125.00, 11.24])
};

var city = CITIES.kakinada; // change city here
var roi = city.buffer(80000);
var start = '2026-09-20';
var end = '2026-09-29';

Map.centerObject(roi, 8);
Map.addLayer(roi, {color: 'cyan'}, 'ROI');

var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(roi)
  .filterDate(start, end)
  .filter(ee.Filter.eq('instrumentMode', 'IW'))
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
  .select('VV')
  .median();

var floodProxy = s1.lt(-16).selfMask().rename('flood_proxy');
Map.addLayer(floodProxy, {palette: ['#3EC8FF']}, 'S1 flood proxy');

var rain = ee.ImageCollection('NASA/GPM_L3/IMERG_V07')
  .filterBounds(roi)
  .filterDate(start, end)
  .select('precipitation')
  .sum()
  .clip(roi)
  .rename('rain_mm');
Map.addLayer(rain, {min: 0, max: 400, palette: ['#05080d', '#3EC8FF', '#F0A12E']}, 'IMERG rain');

var elev = ee.Image('USGS/SRTMGL1_003').clip(roi).rename('elev_m');
Map.addLayer(elev, {min: 0, max: 40, palette: ['#3EC8FF', '#101a28']}, 'SRTM');

Export.image.toDrive({
  image: floodProxy, description: 'cycloneos_s1_flood',
  region: roi, scale: 20, maxPixels: 1e9, fileFormat: 'GeoTIFF'
});
Export.image.toDrive({
  image: rain, description: 'cycloneos_gpm_rain',
  region: roi, scale: 1000, maxPixels: 1e9, fileFormat: 'GeoTIFF'
});
Export.image.toDrive({
  image: elev, description: 'cycloneos_srtm',
  region: roi, scale: 30, maxPixels: 1e9, fileFormat: 'GeoTIFF'
});
