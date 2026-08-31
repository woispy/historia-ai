const EARTH_RADIUS_M = 6378137;
const WEB_MERCATOR_LIMIT = 85.0511287798066;

function finite(value) { return Number.isFinite(value); }
function assertFinite(value, name) { if (!finite(value)) throw new Error(`${name} must be finite.`); }

export function createTerrainMetricSpace({ crs } = {}) {
  if (crs !== "EPSG:4326" && crs !== "EPSG:3857") throw new Error(`Unsupported terrain metric CRS: ${crs || "missing"}`);
  return Object.freeze({ crs, project, distancePerDegree });
}

function project(longitude, latitude) {
  assertFinite(longitude, "longitude"); assertFinite(latitude, "latitude");
  if (longitude < -180 || longitude > 180 || latitude < -90 || latitude > 90) throw new Error("Geographic coordinate outside WGS84 bounds.");
  if (this?.crs === "EPSG:3857") return Object.freeze({ x: longitude * Math.PI / 180 * EARTH_RADIUS_M, y: Math.log(Math.tan(Math.PI / 4 + Math.min(Math.max(latitude, -WEB_MERCATOR_LIMIT), WEB_MERCATOR_LIMIT) * Math.PI / 360)) * EARTH_RADIUS_M });
  const latitudeScale = Math.PI / 180 * EARTH_RADIUS_M;
  return Object.freeze({ x: longitude * latitudeScale * Math.cos(latitude * Math.PI / 180), y: latitude * latitudeScale });
}

function distancePerDegree(latitude) {
  assertFinite(latitude, "latitude");
  if (latitude < -90 || latitude > 90) throw new Error("Latitude outside WGS84 bounds.");
  const lat = latitude * Math.PI / 180;
  const metersLat = 111132.92 - 559.82 * Math.cos(2 * lat) + 1.175 * Math.cos(4 * lat) - 0.0023 * Math.cos(6 * lat);
  const metersLon = 111412.84 * Math.cos(lat) - 93.5 * Math.cos(3 * lat) + 0.118 * Math.cos(5 * lat);
  return Object.freeze({ longitudeMeters: metersLon, latitudeMeters: metersLat });
}
