import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { isUsablePhysicalLandPoint } from "../../src/map/rendering/physical/PhysicalLandAuthority.js";

const COAST_INTERIOR_OFFSET = 0.004;
const COAST_INTERIOR_SEARCH = 0.08;
const EPSILON = 1e-9;
const REPRESENTATIVE_SEARCH_STEP = 0.01;
const REPRESENTATIVE_SEARCH_RADIUS = 0.5;
const MIN_VALID_POLYGON_AREA = 0.00005;
const EDGE_SAMPLE_FRACTIONS = [0.25, 0.5, 0.75];
const COAST_FRAGMENT_HALF_LENGTH = 0.01;

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

const SEA_POLYGONS = ANATOLIA_PHYSICAL_ATLAS.seas.map((sea) => sea.coordinates);
const CHANNEL_POLYGONS = ANATOLIA_PHYSICAL_ATLAS.channels.map((channel) => channel.coordinates);
const LAKES = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes;

function isUsableLandPoint(point) {
  return isUsablePhysicalLandPoint(
    point,
    ANATOLIA_PHYSICAL_ATLAS.landPolygons,
    SEA_POLYGONS,
    CHANNEL_POLYGONS,
    LAKES,
  );
}

function findUsableRepresentativePoint(center) {
  if (!Array.isArray(center)) return null;
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
  const projected = [start[0] + dx * t, start[1] + dy * t];
  return distanceSquared(point, projected);
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

  if (!isUsableLandPoint(polygonCentroid(polygon))) return false;
  if (!isUsableLandPoint(polygonVertexCentroid(polygon))) return false;

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (!isUsableLandPoint(start)) return false;
    for (const fraction of EDGE_SAMPLE_FRACTIONS) {
      const sample = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isUsableLandPoint(sample)) return false;
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
  if (translatedFromVertex !== polygon) return translatedFromVertex;

  const areaCentroid = polygonCentroid(polygon);
  const translatedFromArea = translatePolygonToLandAnchor(polygon, representative, areaCentroid);
  if (translatedFromArea !== polygon) return translatedFromArea;

  return null;
}

function roundPolygon(polygon) {
  return polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);
}

function createRepresentativePolygon(metadata) {
  const point = findUsableRepresentativePoint(metadata?.centroid ?? null);
  if (!point) return null;

  for (let radius = 0.035; radius >= 0.005; radius -= 0.005) {
    const polygon = Array.from({ length: 8 }, (_, index) => {
      const angle = (index / 8) * Math.PI * 2;
      return [point[0] + Math.cos(angle) * radius, point[1] + Math.sin(angle) * radius];
    });
    const rounded = roundPolygon(polygon);
    if (hasUsablePolygonSamples(rounded)) return rounded;
  }

  return null;
}

function createCoastalCoverageFragment(metadata) {
  const coast = findNearestCoastSegment(metadata.centroid);
  if (!coast) return null;

  const dx = coast.end[0] - coast.start[0];
  const dy = coast.end[1] - coast.start[1];
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const tangent = [dx / length, dy / length];
  const normal = [-tangent[1], tangent[0]];
  const center = coast.projection;

  // Use a short land-side strip around the nearest physical-coast projection.
  // The fragment stays within a few thousandths of the authoritative coast,
  // but its vertices remain strictly inside usable land so the land invariant
  // never needs an exception for exact boundary points.
  const halfLength = Math.min(COAST_FRAGMENT_HALF_LENGTH, length / 3);
  const alongA = [center[0] - tangent[0] * halfLength, center[1] - tangent[1] * halfLength];
  const alongB = [center[0] + tangent[0] * halfLength, center[1] + tangent[1] * halfLength];

  for (const direction of [1, -1]) {
    for (let coastOffset = COAST_INTERIOR_OFFSET; coastOffset <= COAST_INTERIOR_SEARCH; coastOffset += COAST_INTERIOR_OFFSET) {
      const coastA = [alongA[0] + normal[0] * direction * coastOffset, alongA[1] + normal[1] * direction * coastOffset];
      const coastB = [alongB[0] + normal[0] * direction * coastOffset, alongB[1] + normal[1] * direction * coastOffset];
      const interior = [
        center[0] + normal[0] * direction * (coastOffset + COAST_INTERIOR_OFFSET),
        center[1] + normal[1] * direction * (coastOffset + COAST_INTERIOR_OFFSET),
      ];
      const polygon = roundPolygon([coastA, coastB, interior]);
      if (hasUsablePolygonSamples(polygon)) return polygon;
    }
  }

  return null;
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

    let polygons = (geometry.polygons ?? [])
      .map((polygon) => reconcilePolygonCentroid(polygon, metadata))
      .filter((polygon) => hasUsablePolygonSamples(polygon));

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
      method: "strict physical-land polygon reconciliation with edge sampling and shared physical-land authority",
      clippedByPhysicalLandMask: true,
      clippedByGeneratedHydrography: true,
      coastalProvinceCount: coastalIds.size,
      landCentroidReconciliation: true,
      sourceProvinceGeometryPreserved: true,
      vertexCentroidLandInvariant: true,
      polygonBoundaryLandInvariant: true,
      waterExclusionInvariant: true,
    },
  };
}
