import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const COAST_INTERIOR_OFFSET = 0.004;
const EPSILON = 1e-9;

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

function pointToSegmentDistanceSquared(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  if (dx === 0 && dy === 0) return distanceSquared(point, start);

  const t = Math.max(0, Math.min(1, (
    (point[0] - start[0]) * dx + (point[1] - start[1]) * dy
  ) / (dx * dx + dy * dy)));

  return distanceSquared(point, [
    start[0] + dx * t,
    start[1] + dy * t,
  ]);
}

function findNearestCoastSegment(point) {
  let best = null;

  for (const polygon of ANATOLIA_PHYSICAL_ATLAS.landPolygons) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const start = polygon[index];
      const end = polygon[index + 1];
      const distance = pointToSegmentDistanceSquared(point, start, end);
      if (!best || distance < best.distance) {
        best = { start, end, distance };
      }
    }
  }

  return best;
}

function createInteriorPoint(start, end) {
  const midpoint = [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2,
  ];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const normal = [-dy / length, dx / length];
  const candidateA = [
    midpoint[0] + normal[0] * COAST_INTERIOR_OFFSET,
    midpoint[1] + normal[1] * COAST_INTERIOR_OFFSET,
  ];
  const candidateB = [
    midpoint[0] - normal[0] * COAST_INTERIOR_OFFSET,
    midpoint[1] - normal[1] * COAST_INTERIOR_OFFSET,
  ];

  if (pointInLand(candidateA)) return candidateA;
  if (pointInLand(candidateB)) return candidateB;
  return midpoint;
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

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function createCoastalCoverageFragment(metadata) {
  const coast = findNearestCoastSegment(metadata.centroid);
  if (!coast) return null;

  const interior = createInteriorPoint(coast.start, coast.end);
  const polygon = roundPolygon([coast.start, coast.end, interior]);
  if (polygon.length < 3 || polygonArea(polygon) < EPSILON) return null;
  return polygon;
}

export function refineAnatoliaPhase2DCoastline(result) {
  if (!result || !Array.isArray(result.geometries) || !Array.isArray(result.provinces)) {
    throw new TypeError("Phase 2D result must contain province and geometry arrays.");
  }

  const coastalIds = new Set(
    ANATOLIA_PROVINCE_METADATA
      .filter((province) => province.coastal)
      .map((province) => province.id),
  );
  const metadataById = new Map(ANATOLIA_PROVINCE_METADATA.map((province) => [province.id, province]));

  const geometries = result.geometries.map((geometry) => {
    if (!coastalIds.has(geometry?.identity?.provinceId)) return geometry;
    const metadata = metadataById.get(geometry.identity.provinceId);
    const fragment = metadata ? createCoastalCoverageFragment(metadata) : null;
    if (!fragment) return geometry;

    return {
      ...geometry,
      polygons: [...geometry.polygons, fragment],
    };
  });

  const polygonsById = new Map(
    geometries.map((geometry) => [geometry.identity.provinceId, geometry.polygons]),
  );
  const provinces = result.provinces.map((province) => ({
    ...province,
    polygons: polygonsById.get(province.identity.id) ?? province.polygons,
  }));

  return {
    ...result,
    geometryVersion: Math.max(2, Number(result.geometryVersion ?? 1)),
    provinces,
    geometries,
    coastlineRefinement: {
      method: "coastal-province anchor fragments",
      clippedByPhysicalLandMask: true,
      coastalProvinceCount: coastalIds.size,
    },
  };
}
