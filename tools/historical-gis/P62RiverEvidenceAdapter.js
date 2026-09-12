const EXPECTED_GEOMETRY_SOURCE = "natural-earth-10m";
const EXPECTED_PROJECTION = "EPSG:4326";
const DEFAULT_TOLERANCE_KM = 15;

function fail(message) {
  throw new Error(`P6.2-B River Evidence Adapter failed: ${message}`);
}

function normalizePoint(point, name) {
  if (!Array.isArray(point) || point.length < 2) fail(`${name} must be [longitude, latitude].`);
  const normalized = [Number(point[0]), Number(point[1])];
  if (!Number.isFinite(normalized[0]) || !Number.isFinite(normalized[1])) fail(`${name} contains non-finite coordinates.`);
  if (normalized[0] < -180 || normalized[0] > 180 || normalized[1] < -90 || normalized[1] > 90) fail(`${name} is outside WGS84 bounds.`);
  return normalized;
}

function normalizeLine(line, name) {
  if (!Array.isArray(line) || line.length < 2) fail(`${name} must contain at least two coordinates.`);
  return line.map((point, index) => normalizePoint(point, `${name}[${index}]`));
}

function normalizeRiver(river, index) {
  if (!river || typeof river !== "object") fail(`river[${index}] is invalid.`);
  const coordinates = normalizeLine(river.coordinates, `river[${index}].coordinates`);
  if (river.geometrySource !== EXPECTED_GEOMETRY_SOURCE) fail(`river ${river.id ?? index} is not Natural Earth 10m geometry.`);
  return Object.freeze({
    id: String(river.id ?? `river-${index}`),
    canonicalId: river.canonicalId ? String(river.canonicalId) : null,
    name: String(river.name ?? "Unnamed river"),
    nameEn: String(river.nameEn ?? river.name ?? "Unnamed river"),
    rank: Number.isFinite(Number(river.rank)) ? Number(river.rank) : 9,
    coordinates,
    bounds: Array.isArray(river.bounds) ? river.bounds.map(Number) : null,
    geometrySource: EXPECTED_GEOMETRY_SOURCE,
  });
}

function haversineKm(a, b) {
  const toRad = (value) => (value * Math.PI) / 180;
  const lat1 = toRad(a[1]);
  const lat2 = toRad(b[1]);
  const dLat = lat2 - lat1;
  const dLon = toRad(b[0] - a[0]);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371.0088 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function minDistanceToLine(point, line) {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index < line.length - 1; index += 1) {
    const start = line[index];
    const end = line[index + 1];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const denominator = dx * dx + dy * dy;
    const t = denominator === 0
      ? 0
      : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
    best = Math.min(best, haversineKm(point, [start[0] + dx * t, start[1] + dy * t]));
  }
  return best;
}

function lineIntersectsBounds(line, bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4 || !bounds.every(Number.isFinite)) return true;
  return line.some(([lon, lat]) => lon >= bounds[0] && lon <= bounds[2] && lat >= bounds[1] && lat <= bounds[3]);
}

export function createP62RiverEvidenceAdapter({ rivers, projection = EXPECTED_PROJECTION, toleranceKm = DEFAULT_TOLERANCE_KM } = {}) {
  if (projection !== EXPECTED_PROJECTION) fail(`expected ${EXPECTED_PROJECTION}, received ${projection}.`);
  if (!Number.isFinite(toleranceKm) || toleranceKm < 0) fail("toleranceKm must be a finite non-negative number.");
  if (!Array.isArray(rivers) || rivers.length === 0) fail("Natural Earth river collection is empty.");

  const normalizedRivers = rivers.map(normalizeRiver).sort((a, b) => a.id.localeCompare(b.id));
  const canonicalIds = [...new Set(normalizedRivers.map((river) => river.canonicalId).filter(Boolean))].sort();
  const lines = normalizedRivers.map((river) => river.coordinates);

  return Object.freeze({
    schemaVersion: 1,
    phase: "P6.2-B",
    authoritative: false,
    source: "Natural Earth 10m river centerlines",
    projection: EXPECTED_PROJECTION,
    toleranceKm,
    riverCount: normalizedRivers.length,
    canonicalRiverIds: canonicalIds,
    rivers: Object.freeze(normalizedRivers),
    riverLines: Object.freeze(lines),
    hasNearbyRiver(point) {
      const normalizedPoint = normalizePoint(point, "point");
      return normalizedRivers.some((river) => {
        if (!lineIntersectsBounds([normalizedPoint], river.bounds)) return false;
        return minDistanceToLine(normalizedPoint, river.coordinates) <= toleranceKm;
      });
    },
    nearbyRiverIds(point) {
      const normalizedPoint = normalizePoint(point, "point");
      return normalizedRivers
        .filter((river) => lineIntersectsBounds([normalizedPoint], river.bounds)
          && minDistanceToLine(normalizedPoint, river.coordinates) <= toleranceKm)
        .map((river) => river.id);
    },
  });
}

export function p62RiverEvidenceLines(adapter) {
  if (!adapter || adapter.phase !== "P6.2-B" || adapter.authoritative !== false) fail("invalid non-authoritative river adapter.");
  return adapter.riverLines;
}

export const P62_RIVER_EVIDENCE_CONTRACT = Object.freeze({
  source: "Natural Earth 10m river centerlines",
  projection: EXPECTED_PROJECTION,
  semantics: "river centerlines are boundary evidence only; they do not define province borders",
  defaultToleranceKm: DEFAULT_TOLERANCE_KM,
  authoritative: false,
});
