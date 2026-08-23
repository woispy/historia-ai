import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  isPhysicalLandPoint as isPhysicalLandPointAuthority,
  isUsablePhysicalLandPoint,
} from "../../src/map/rendering/physical/PhysicalLandAuthority.js";

const COAST_INTERIOR_OFFSET = 0.004;
const COAST_INTERIOR_SEARCH = 0.08;
const EPSILON = 1e-9;
const REPRESENTATIVE_SEARCH_STEP = 0.01;
const REPRESENTATIVE_SEARCH_RADIUS = 0.5;
const MIN_VALID_POLYGON_AREA = 0.00005;
const EDGE_SAMPLE_FRACTIONS = [0.25, 0.5, 0.75];
const COAST_FRAGMENT_HALF_LENGTH = 0.01;
const INTERIOR_SAMPLE_FRACTIONS = [0.25, 0.5, 0.75];

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

const SEA_POLYGONS = ANATOLIA_PHYSICAL_ATLAS.seas.map((sea) => sea.coordinates);
const CHANNEL_POLYGONS = ANATOLIA_PHYSICAL_ATLAS.channels.map((channel) => channel.coordinates);
const LAKES = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes;

function isCanonicalPhysicalLandPoint(point) {
  return isPhysicalLandPointAuthority(
    point,
    ANATOLIA_PHYSICAL_ATLAS.landPolygons,
    LAKES,
  ) && isUsablePhysicalLandPoint(
    point,
    ANATOLIA_PHYSICAL_ATLAS.landPolygons,
    SEA_POLYGONS,
    CHANNEL_POLYGONS,
    LAKES,
  );
}

function findUsableRepresentativePoint(center) {
  if (!Array.isArray(center)) return null;
  if (isCanonicalPhysicalLandPoint(center)) return [...center];
  for (let radius = REPRESENTATIVE_SEARCH_STEP; radius <= REPRESENTATIVE_SEARCH_RADIUS; radius += REPRESENTATIVE_SEARCH_STEP) {
    const samples = Math.max(16, Math.ceil((2 * Math.PI * radius) / REPRESENTATIVE_SEARCH_STEP));
    for (let index = 0; index < samples; index += 1) {
      const angle = (index / samples) * Math.PI * 2;
      const candidate = [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
      if (isCanonicalPhysicalLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

function projectPointToSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return { point: [...start], t: 0 };
  const t = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * dx + (point[1] - start[1]) * dy
  ) / (dx * dx + dy * dy)));
  return {
    point: [start[0] + dx * t, start[1] + dy * t],
    t,
  };
}

function findNearestCoastSegment(point) {
  let best = null;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    if (!Array.isArray(polygon) || polygon.length < 2) continue;
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const projection = projectPointToSegment(point, start, end);
      const distance = distanceSquared(point, projection.point);
      if (!best || distance < best.distance) {
        best = { start, end, distance, projection: projection.point, t: projection.t };
      }
    }
  }
  return best;
}

function polygonArea(polygon) {
  let area = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    area += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(area) / 2;
}

function polygonVertexCentroid(polygon) {
  const sum = polygon.reduce(
    (total, [longitude, latitude]) => [total[0] + longitude, total[1] + latitude],
    [0, 0],
  );
  return [sum[0] / polygon.length, sum[1] / polygon.length];
}

function polygonCentroid(polygon) {
  let areaTwice = 0;
  let longitude = 0;
  let latitude = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    areaTwice += cross;
    longitude += (current[0] + next[0]) * cross;
    latitude += (current[1] + next[1]) * cross;
  }
  if (Math.abs(areaTwice) < EPSILON) return polygonVertexCentroid(polygon);
  return [longitude / (3 * areaTwice), latitude / (3 * areaTwice)];
}

function hasUsablePolygonSamples(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  if (polygonArea(polygon) < MIN_VALID_POLYGON_AREA) return false;

  const areaCentroid = polygonCentroid(polygon);
  const vertexCentroid = polygonVertexCentroid(polygon);
  if (!isCanonicalPhysicalLandPoint(areaCentroid) || !isCanonicalPhysicalLandPoint(vertexCentroid)) return false;

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (!isCanonicalPhysicalLandPoint(start)) return false;
    for (const fraction of EDGE_SAMPLE_FRACTIONS) {
      const sample = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isCanonicalPhysicalLandPoint(sample)) return false;
    }

    for (const fraction of INTERIOR_SAMPLE_FRACTIONS) {
      const sample = [
        areaCentroid[0] + (start[0] - areaCentroid[0]) * fraction,
        areaCentroid[1] + (start[1] - areaCentroid[1]) * fraction,
      ];
      if (!isCanonicalPhysicalLandPoint(sample)) return false;
    }
  }

  return true;
}

function translatePolygonToLandAnchor(polygon, anchor, sourceCentroid) {
  if (!Array.isArray(polygon) || polygon.length < 3 || !anchor || !sourceCentroid) return polygon;
  const delta = [anchor[0] - sourceCentroid[0], anchor[1] - sourceCentroid[1]];
  const translated = polygon.map(([longitude, latitude]) => [longitude + delta[0], latitude + delta[1]]);
  return hasUsablePolygonSamples(translated) ? translated : polygon;
}

function reconcilePolygonCentroid(polygon, metadata) {
  if (!Array.isArray(polygon) || polygon.length < 3) return polygon;
  if (hasUsablePolygonSamples(polygon)) return polygon;

  const representative = findUsableRepresentativePoint(metadata?.centroid ?? null);
  if (!representative) return null;

  const vertexCentroid = polygonVertexCentroid(polygon);
  const translatedFromVertex = translatePolygonToLandAnchor(polygon, representative, vertexCentroid);
  if (translatedFromVertex !== polygon && hasUsablePolygonSamples(translatedFromVertex)) return translatedFromVertex;

  const areaCentroid = polygonCentroid(polygon);
  const translatedFromArea = translatePolygonToLandAnchor(polygon, representative, areaCentroid);
  if (translatedFromArea !== polygon && hasUsablePolygonSamples(translatedFromArea)) return translatedFromArea;

  return null;
}

function refineCoastlinePolygon(polygon, metadata) {
  if (!Array.isArray(polygon) || polygon.length < 3) return polygon;
  const nearest = findNearestCoastSegment(polygonCentroid(polygon));
  if (!nearest) return reconcilePolygonCentroid(polygon, metadata);

  const dx = nearest.end[0] - nearest.start[0];
  const dy = nearest.end[1] - nearest.start[1];
  const length = Math.hypot(dx, dy);
  if (length < EPSILON) return reconcilePolygonCentroid(polygon, metadata);

  const normal = [-dy / length, dx / length];
  const offset = COAST_INTERIOR_OFFSET;
  const candidates = [1, -1].map((sign) => polygon.map(([longitude, latitude]) => [
    longitude + normal[0] * offset * sign,
    latitude + normal[1] * offset * sign,
  ]));

  const valid = candidates.find((candidate) => hasUsablePolygonSamples(candidate));
  if (valid) return valid;

  return reconcilePolygonCentroid(polygon, metadata);
}

export function refineAnatoliaPhase2DCoastline(polygons) {
  if (!Array.isArray(polygons)) return [];
  return polygons.map((polygon) => {
    const metadata = ANATOLIA_PROVINCE_METADATA[polygon?.provinceId] ?? null;
    return refineCoastlinePolygon(polygon?.coordinates ?? polygon, metadata);
  }).filter(Boolean);
}

export {
  hasUsablePolygonSamples,
  isCanonicalPhysicalLandPoint,
};
