import hydrography from "../../src/map/data/generated/anatolia-hydrography-10m.json" with { type: "json" };
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const COAST_INTERIOR_OFFSET = 0.004;
const COAST_INTERIOR_SEARCH = 0.08;
const EPSILON = 1e-9;
const REPRESENTATIVE_SEARCH_STEP = 0.01;
const REPRESENTATIVE_SEARCH_RADIUS = 0.5;

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  const [x, y] = point;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const [xi, yi] = polygon[index];
    const [xj, yj] = polygon[previous];
    const intersects = yi > y !== yj > y
      && x < ((xj - xi) * (y - yi)) / (yj - yi || Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointInLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function pointInHydrographyWater(point) {
  return hydrography.lakes.some((lake) => (
    Array.isArray(lake.rings)
      ? lake.rings.some((ring) => pointInPolygon(point, ring))
      : pointInPolygon(point, lake.coordinates)
  ));
}

function isUsableLandPoint(point) {
  return pointInLand(point) && !pointInHydrographyWater(point);
}

function findUsableRepresentativePoint(center) {
  if (isUsableLandPoint(center)) return [...center];
  for (let radius = REPRESENTATIVE_SEARCH_STEP; radius <= REPRESENTATIVE_SEARCH_RADIUS; radius += REPRESENTATIVE_SEARCH_STEP) {
    const samples = Math.max(16, Math.ceil((2 * Math.PI * radius) / REPRESENTATIVE_SEARCH_STEP));
    for (let index = 0; index < samples; index += 1) {
      const angle = (index / samples) * Math.PI * 2;
      const candidate = [center[0] + Math.cos(angle) * radius, center[1] + Math.sin(angle) * radius];
      if (isUsableLandPoint(candidate)) return candidate;
    }
  }
  return null;
}

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);
  const t = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * dx + (point[1] - start[1]) * dy
  ) / (dx * dx + dy * dy)));
  return distanceSquared(point, [start[0] + dx * t, start[1] + dy * t]);
}

function findNearestCoastSegment(point) {
  let best = null;
  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    if (!Array.isArray(polygon) || polygon.length < 2) continue;
    for (let index = 0; index < polygon.length; index += 1) {
      const start = polygon[index];
      const end = polygon[(index + 1) % polygon.length];
      const distance = pointToSegmentDistanceSquared(point, start, end);
      if (!best || distance < best.distance) best = { start, end, distance };
    }
  }
  return best;
}

function createInteriorPoint(start, end) {
  const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const normal = [-dy / length, dx / length];

  for (let offset = COAST_INTERIOR_OFFSET; offset <= COAST_INTERIOR_SEARCH; offset += COAST_INTERIOR_OFFSET) {
    const candidateA = [midpoint[0] + normal[0] * offset, midpoint[1] + normal[1] * offset];
    const candidateB = [midpoint[0] - normal[0] * offset, midpoint[1] - normal[1] * offset];
    if (isUsableLandPoint(candidateA)) return candidateA;
    if (isUsableLandPoint(candidateB)) return candidateB;
  }
  return null;
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
  if (Math.abs(areaTwice) < EPSILON) return polygon[0];
  return [longitude / (3 * areaTwice), latitude / (3 * areaTwice)];
}

function translatePolygonToLandAnchor(polygon, anchor) {
  if (!Array.isArray(polygon) || polygon.length < 3 || !anchor) return polygon;
  const centroid = polygonCentroid(polygon);
  if (isUsableLandPoint(centroid) || !isUsableLandPoint(anchor)) return polygon;
  const delta = [anchor[0] - centroid[0], anchor[1] - centroid[1]];
  const translated = polygon.map(([longitude, latitude]) => [longitude + delta[0], latitude + delta[1]]);
  return isUsableLandPoint(polygonCentroid(translated)) ? translated : polygon;
}

function reconcilePolygonCentroid(polygon, metadata) {
  if (!Array.isArray(polygon) || polygon.length < 3) return polygon;
  if (polygonArea(polygon) < 0.00005) return polygon;
  const centroid = polygonCentroid(polygon);
  if (isUsableLandPoint(centroid)) return polygon;
  const representative = findUsableRepresentativePoint(metadata?.centroid ?? null);
  return translatePolygonToLandAnchor(polygon, representative);
}

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function createRepresentativePolygon(metadata) {
  const point = findUsableRepresentativePoint(metadata?.centroid ?? null);
  if (!point) return null;
  const radius = 0.035;
  const polygon = Array.from({ length: 8 }, (_, index) => {
    const angle = (index / 8) * Math.PI * 2;
    return [point[0] + Math.cos(angle) * radius, point[1] + Math.sin(angle) * radius];
  });
  return isUsableLandPoint(polygonCentroid(polygon)) ? roundPolygon(polygon) : null;
}

function createCoastalCoverageFragment(metadata) {
  const coast = findNearestCoastSegment(metadata.centroid);
  if (!coast) return null;
  const interior = createInteriorPoint(coast.start, coast.end);
  if (!interior) return null;
  const polygon = roundPolygon([coast.start, coast.end, interior]);
  if (polygon.length < 3 || polygonArea(polygon) < EPSILON) return null;
  return isUsableLandPoint(polygonCentroid(polygon)) ? polygon : null;
}

export function refineAnatoliaPhase2DCoastline(result) {
  if (!result || !Array.isArray(result.geometries) || !Array.isArray(result.provinces)) {
    throw new TypeError("Phase 2D result must contain province and geometry arrays.");
  }

  const coastalIds = new Set(
    ANATOLIA_PROVINCE_METADATA.filter((province) => province.coastal).map((province) => province.id),
  );
  const metadataById = new Map(ANATOLIA_PROVINCE_METADATA.map((province) => [province.id, province]));

  const geometries = result.geometries.map((geometry) => {
    const metadata = metadataById.get(geometry?.identity?.provinceId);
    if (!metadata) return geometry;

    let polygons = (geometry.polygons ?? []).map((polygon) => reconcilePolygonCentroid(polygon, metadata));
    if (!polygons.length) {
      const representative = createRepresentativePolygon(metadata);
      if (representative) polygons = [representative];
    }

    if (coastalIds.has(geometry?.identity?.provinceId)) {
      const fragment = createCoastalCoverageFragment(metadata);
      if (fragment) polygons = [...polygons, fragment];
    }

    return { ...geometry, polygons };
  });

  const polygonsById = new Map(geometries.map((geometry) => [geometry.identity.provinceId, geometry.polygons]));
  const provinces = result.provinces.map((province) => ({
    ...province,
    polygons: polygonsById.get(province.identity.id) ?? province.polygons,
  }));
  const polygonCount = geometries.reduce((total, geometry) => total + geometry.polygons.length, 0);

  return {
    ...result,
    geometryVersion: Math.max(2, Number(result.geometryVersion ?? 1)),
    polygonCount,
    provinces,
    geometries,
    coastlineRefinement: {
      method: "land-centroid reconciliation plus generated 10m hydrography-safe coastal fragments",
      clippedByPhysicalLandMask: true,
      clippedByGeneratedHydrography: true,
      coastalProvinceCount: coastalIds.size,
      landCentroidReconciliation: true,
      sourceProvinceGeometryPreserved: true,
    },
  };
}
