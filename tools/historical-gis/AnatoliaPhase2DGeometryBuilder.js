import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV16,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV16.js";
import { isAnatoliaGeometryPoint } from "./AnatoliaGeometryAuthority.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_STRATEGIC_PASSES, ANATOLIA_RIVER_CROSSINGS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const HISTORICAL_DATE = "1300-01-01";
const BOUNDARY_SAMPLE_STEP = 0.06;
const MAX_BOUNDARY_NUMERICAL_DRIFT = 0.0001;
const DETERMINISTIC_WEIGHT_ITERATIONS = 24;
const GEOMETRY_EPS = 1e-8;

function boundarySiteCount(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 2) return 0;
  let count = 0;
  for (let index = 0; index < polygon.length - 1; index += 1) {
    const start = polygon[index];
    const end = polygon[index + 1];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const steps = Math.max(1, Math.ceil(length / BOUNDARY_SAMPLE_STEP));
    count += steps + 1;
  }
  return count;
}

function expectedV16SiteCount() {
  const physicalLand = ANATOLIA_PHYSICAL_ATLAS.landPolygons.reduce(
    (total, polygon) => total + boundarySiteCount(polygon),
    0,
  );
  const coastCorrections = ANATOLIA_PHYSICAL_COAST_CORRECTIONS.reduce(
    (total, item) => total + boundarySiteCount(item.coordinates),
    0,
  );
  const lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.reduce(
    (total, lake) => total + boundarySiteCount(lake.coordinates),
    0,
  );
  return 38 + physicalLand + coastCorrections + lakes;
}

function physicalBoundarySiteCount() {
  return expectedV16SiteCount() - ANATOLIA_PROVINCE_METADATA.length;
}

function naturalFeatureSiteCount() {
  return ANATOLIA_STRATEGIC_PASSES.length + ANATOLIA_RIVER_CROSSINGS.length;
}

function pointOnSegmentProjection(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0
    ? 0
    : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  return [start[0] + dx * t, start[1] + dy * t];
}

function physicalLandBoundaryCandidates() {
  return [
    ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
    ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
  ].filter((polygon) => Array.isArray(polygon) && polygon.length >= 2);
}

const PHYSICAL_LAND_BOUNDARIES = physicalLandBoundaryCandidates();

function recoverNumericalBoundaryDrift(point) {
  if (isPhysicalLandPoint(point)) return point;

  let best = null;
  let bestDistance = Infinity;
  for (const polygon of PHYSICAL_LAND_BOUNDARIES) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const candidate = pointOnSegmentProjection(point, polygon[index], polygon[index + 1]);
      const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (distance >= bestDistance) continue;
      if (!isPhysicalLandPoint(candidate)) continue;
      best = candidate;
      bestDistance = distance;
    }
  }

  if (best && bestDistance <= MAX_BOUNDARY_NUMERICAL_DRIFT) return best;
  return null;
}

function normalizeOuterRing(ring) {
  return ring.map((point) => {
    const recovered = recoverNumericalBoundaryDrift(point);
    if (recovered) return recovered.map((value) => Number(value.toFixed(7)));
    if (!isPhysicalLandPoint(point)) {
      throw new Error(`Phase 2D geometry vertex is outside physical land beyond numerical drift: ${point.join(",")}`);
    }
    return point;
  });
}

function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const before = polygon[previous];
    if ((current[1] > point[1]) !== (before[1] > point[1])
      && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || 1e-12) + current[0]) {
      inside = !inside;
    }
  }
  return inside;
}

function pointOnPolygonBoundary(point, polygon, tolerance = GEOMETRY_EPS) {
  if (!Array.isArray(polygon) || polygon.length < 2) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    const projected = pointOnSegmentProjection(point, polygon[index], polygon[(index + 1) % polygon.length]);
    if (Math.hypot(projected[0] - point[0], projected[1] - point[1]) <= tolerance) return true;
  }
  return false;
}

function pointOnLakeBoundary(lake, point) {
  return pointOnPolygonBoundary(point, lake.coordinates);
}

function lakeContainsPoint(lake, point) {
  return pointInPolygon(point, lake.coordinates) || pointOnLakeBoundary(lake, point);
}

function polygonCentroid(polygon) {
  return polygon.reduce(
    (sum, [x, y]) => [sum[0] + x, sum[1] + y],
    [0, 0],
  ).map((value) => value / polygon.length);
}

function lakeFullyContainedByOuterRing(lake, outerRing) {
  const coordinates = lake.coordinates;
  if (!coordinates.length) return false;
  return coordinates.every((point) => pointInPolygon(point, outerRing) || pointOnLakeBoundary(lake, point));
}

function lakeHolesForOuterRing(outerRing) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes
    .filter((lake) => Array.isArray(lake.coordinates) && lake.coordinates.length >= 3)
    .filter((lake) => lakeFullyContainedByOuterRing(lake, outerRing))
    .filter((lake) => pointInPolygon(polygonCentroid(lake.coordinates), outerRing))
    .map((lake) => lake.coordinates.map(([longitude, latitude]) => [
      Number(longitude.toFixed(7)),
      Number(latitude.toFixed(7)),
    ]));
}

function segmentLakeIntersections(start, end, lakeRing) {
  const intersections = [];
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  for (let index = 0; index < lakeRing.length; index += 1) {
    const a = lakeRing[index];
    const b = lakeRing[(index + 1) % lakeRing.length];
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const denominator = dx * ey - dy * ex;
    if (Math.abs(denominator) <= GEOMETRY_EPS) continue;
    const ax = a[0] - start[0];
    const ay = a[1] - start[1];
    const t = (ax * ey - ay * ex) / denominator;
    const u = (ax * dy - ay * dx) / denominator;
    if (t < -GEOMETRY_EPS || t > 1 + GEOMETRY_EPS || u < -GEOMETRY_EPS || u > 1 + GEOMETRY_EPS) continue;
    intersections.push({
      t: Math.max(0, Math.min(1, t)),
      point: [start[0] + dx * t, start[1] + dy * t],
      edgeIndex: index,
    });
  }
  intersections.sort((left, right) => left.t - right.t);
  return intersections.filter((item, index, all) => index === 0 || Math.abs(item.t - all[index - 1].t) > GEOMETRY_EPS);
}

function pathStaysInsideOuterRing(path, outerRing, lake, protectedRings = []) {
  if (!path.length) return false;
  const validInSource = (point) => pointInPolygon(point, outerRing) || pointOnLakeBoundary(lake, point);
  const outsideNeighbors = (point) => protectedRings.every((ring) => (
    ring === outerRing
      || !pointInPolygon(point, ring)
      || pointOnPolygonBoundary(point, ring)
  ));

  for (let index = 0; index < path.length; index += 1) {
    if (!validInSource(path[index]) || !outsideNeighbors(path[index])) return false;
    if (index === 0) continue;
    const start = path[index - 1];
    const end = path[index];
    for (const fraction of [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]) {
      const sample = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!validInSource(sample) || !outsideNeighbors(sample)) return false;
    }
  }
  return true;
}

function lakeBoundaryPath(lake, fromPoint, toPoint, outerRing, protectedRings = []) {
  const lakeRing = lake.coordinates;
  let fromIndex = 0;
  let toIndex = 0;
  let fromDistance = Infinity;
  let toDistance = Infinity;
  for (let index = 0; index < lakeRing.length; index += 1) {
    const fromCandidate = lakeRing[index];
    const toCandidate = lakeRing[index];
    const fromD = Math.hypot(fromCandidate[0] - fromPoint[0], fromCandidate[1] - fromPoint[1]);
    const toD = Math.hypot(toCandidate[0] - toPoint[0], toCandidate[1] - toPoint[1]);
    if (fromD < fromDistance) { fromDistance = fromD; fromIndex = index; }
    if (toD < toDistance) { toDistance = toD; toIndex = index; }
  }

  const buildPath = (step) => {
    const path = [fromPoint];
    let index = fromIndex;
    for (let guard = 0; guard <= lakeRing.length + 1; guard += 1) {
      path.push(lakeRing[index]);
      if (index === toIndex) break;
      index = (index + step + lakeRing.length) % lakeRing.length;
    }
    path.push(toPoint);
    return path;
  };

  const candidates = [buildPath(1), buildPath(-1)];
  const valid = candidates.filter((path) => pathStaysInsideOuterRing(path, outerRing, lake, protectedRings));
  if (!valid.length) {
    throw new Error(`Phase 2D lake boundary detour leaves its source province outer ring or enters a neighboring province: ${lake.name ?? "unnamed lake"}.`);
  }
  return valid.sort((left, right) => {
    const length = (path) => path.slice(1).reduce((sum, point, index) => {
      const previous = path[index];
      return sum + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
    }, 0);
    return length(left) - length(right);
  })[0];
}

function waterSafeOuterRing(outerRing, protectedRings = []) {
  let ring = outerRing.slice();
  for (const lake of ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes) {
    if (!Array.isArray(lake.coordinates) || lake.coordinates.length < 3) continue;
    const next = [];
    for (let index = 0; index < ring.length; index += 1) {
      const start = ring[index];
      const end = ring[(index + 1) % ring.length];
      const midpoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
      const intersects = segmentLakeIntersections(start, end, lake.coordinates);
      if (!lakeContainsPoint(lake, midpoint) && intersects.length < 2) {
        next.push(start);
        continue;
      }
      if (intersects.length >= 2) {
        next.push(start);
        for (let intersectionIndex = 0; intersectionIndex + 1 < intersects.length; intersectionIndex += 2) {
          const first = intersects[intersectionIndex];
          const last = intersects[intersectionIndex + 1];
          const detour = lakeBoundaryPath(lake, first.point, last.point, outerRing, protectedRings);
          next.push(...detour.slice(0, -1));
          next.push(last.point);
        }
      } else {
        next.push(start);
      }
    }
    ring = next;
  }
  return ring;
}

function normalizeGeometryPhysicalBoundary(geometry, protectedRings = []) {
  const coordinates = geometry.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0 || !Array.isArray(coordinates[0])) {
    throw new Error(`Phase 2D geometry has invalid polygon coordinates: ${geometry.identity?.provinceId ?? "unknown"}`);
  }

  const normalizedOuterRing = normalizeOuterRing(coordinates[0]);
  const waterSafeRing = waterSafeOuterRing(normalizedOuterRing, protectedRings);
  const existingHoles = Array.isArray(geometry.holes) ? geometry.holes : [];
  const holes = existingHoles.length > 0
    ? existingHoles
    : lakeHolesForOuterRing(waterSafeRing);

  return {
    ...geometry,
    geometry: {
      ...geometry.geometry,
      coordinates: [waterSafeRing, ...coordinates.slice(1)],
    },
    polygons: [waterSafeRing],
    holes,
  };
}

function buildProvinceAssets(geometries) {
  const metadataById = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, item]));
  return geometries.map((geometry) => {
    const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
    const metadata = metadataById.get(provinceId);
    if (!metadata) throw new Error(`Phase 2D geometry has no matching province metadata: ${provinceId}`);
    return {
      header: {
        assetType: "province",
        assetVersion: 4,
        generator: "Historia AI Phase 2D Geometry Builder V16",
        provider: "historia-ai-curated-cartography",
        dataset: "anatolia-province-geometry-1300",
        historicalDate: HISTORICAL_DATE,
        provinceId,
        historicalAnchor: geometry.identity?.historicalAnchor ?? metadata.centroid,
      },
      identity: { id: provinceId, name: metadata.name },
      references: { geometryId: provinceId, countryId: metadata.countryId, capitalCityId: metadata.cityId },
      ownership: {
        countryId: metadata.historicalControl?.controllerAt1300 ?? metadata.countryId ?? null,
        ownerId: metadata.historicalControl?.controllerAt1300 ?? metadata.countryId ?? null,
      },
      historical: {
        sourceFeatureId: provinceId,
        sourceName: metadata.name,
        subject: metadata.countryId,
        partOf: metadata.regionId,
        borderPrecision: metadata.borderConfidence,
        classification: "phase2d-anatolia-province-geometry",
        precision: metadata.borderConfidence,
        anchor: geometry.identity?.historicalAnchor ?? metadata.centroid,
        inferenceNotice: metadata.historicalControl?.note ?? null,
      },
      administration: { governorId: null },
      population: { total: 0 },
      economy: { development: 0, wealth: 0 },
      military: { supplyLimit: 0 },
      culture: { primaryCulture: null },
      religion: { primaryReligion: null },
    };
  });
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

function fallbackLikeProvinceCount(geometries) {
  return geometries.filter((geometry) => (
    Array.isArray(geometry.polygons)
    && geometry.polygons.some((polygon) => polygonArea(polygon) < 0.00005)
  )).length;
}

export function buildAnatoliaPhase2DAssets(regions) {
  const assets = buildAnatoliaPhase2DAssetsV16(regions);
  const expectedSiteCount = expectedV16SiteCount();
  const siteCount = assets.siteCount ?? expectedSiteCount;

  if (!Number.isInteger(siteCount) || siteCount < expectedSiteCount) {
    throw new Error(`Phase 2D cartographic site count is invalid: ${siteCount}; expected at least ${expectedSiteCount}.`);
  }

  const baseGeometries = assets.geometries.map((geometry) => ({
    ...geometry,
    identity: {
      ...(geometry.identity ?? {}),
      id: geometry.identity?.provinceId ?? geometry.identity?.id,
      provinceId: geometry.identity?.provinceId ?? geometry.identity?.id,
    },
  }));
  const protectedRings = baseGeometries
    .map((geometry) => geometry.geometry?.coordinates?.[0])
    .filter((ring) => Array.isArray(ring) && ring.length >= 3);
  const geometries = baseGeometries.map((geometry) => normalizeGeometryPhysicalBoundary(geometry, protectedRings));
  const provinces = buildProvinceAssets(geometries);
  const polygonCount = geometries.reduce(
    (total, geometry) => total + geometry.polygons.length,
    0,
  );
  const fallbackProvinceCount = fallbackLikeProvinceCount(geometries);

  if (provinces.length !== ANATOLIA_PROVINCE_METADATA.length) {
    throw new Error(`Phase 2D province count mismatch: ${provinces.length}; expected ${ANATOLIA_PROVINCE_METADATA.length}.`);
  }

  return {
    ...assets,
    geometries,
    provinces,
    historicalDate: assets.historicalDate ?? HISTORICAL_DATE,
    provinceCount: provinces.length,
    siteCount,
    polygonCount,
    fallbackProvinceCount,
    politicalSiteCount: assets.politicalSiteCount ?? ANATOLIA_PROVINCE_METADATA.length,
    supportSiteCount: assets.supportSiteCount ?? 0,
    naturalFeatureSiteCount: assets.naturalFeatureSiteCount ?? naturalFeatureSiteCount(),
    barrierSiteCount: 0,
    physicalBarrierSiteCount: Math.max(physicalBoundarySiteCount(), assets.barrierSiteCount ?? 0),
    weightIterations: assets.weightIterations ?? DETERMINISTIC_WEIGHT_ITERATIONS,
  };
}

export { isAnatoliaGeometryPoint, isPhysicalLandPoint };
