import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV16,
  isPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
} from "./AnatoliaPhase2DGeometryBuilderV15Adapter.js";
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
const MIN_PROVINCE_AREA = 0.00005;
const PHYSICAL_EDGE_SAMPLE_COUNT = 256;
const MAX_PHYSICAL_EDGE_REPAIR_DEPTH = 12;

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
  const physicalLand = ANATOLIA_PHYSICAL_ATLAS.landPolygons.reduce((total, polygon) => total + boundarySiteCount(polygon), 0);
  const coastCorrections = ANATOLIA_PHYSICAL_COAST_CORRECTIONS.reduce((total, item) => total + boundarySiteCount(item.coordinates), 0);
  const lakes = ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.reduce((total, lake) => total + boundarySiteCount(lake.coordinates), 0);
  return ANATOLIA_PROVINCE_METADATA.length + physicalLand + coastCorrections + lakes;
}

function physicalBoundarySiteCount() { return expectedV16SiteCount() - ANATOLIA_PROVINCE_METADATA.length; }
function naturalFeatureSiteCount() { return ANATOLIA_STRATEGIC_PASSES.length + ANATOLIA_RIVER_CROSSINGS.length; }

function pointOnSegmentProjection(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const denominator = dx * dx + dy * dy;
  const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
  return [start[0] + dx * t, start[1] + dy * t];
}

const PHYSICAL_LAND_BOUNDARIES = [
  ...ANATOLIA_PHYSICAL_COAST_CORRECTIONS.map((item) => item.coordinates),
  ...ANATOLIA_PHYSICAL_ATLAS.landPolygons,
].filter((polygon) => Array.isArray(polygon) && polygon.length >= 2);

function recoverNumericalBoundaryDrift(point) {
  if (isPhysicalLandPoint(point)) return point;
  let best = null;
  let bestDistance = Infinity;
  for (const polygon of PHYSICAL_LAND_BOUNDARIES) {
    for (let index = 0; index < polygon.length - 1; index += 1) {
      const candidate = pointOnSegmentProjection(point, polygon[index], polygon[index + 1]);
      const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
      if (distance >= bestDistance || !isPhysicalLandPoint(candidate)) continue;
      best = candidate;
      bestDistance = distance;
    }
  }
  return best && bestDistance <= MAX_BOUNDARY_NUMERICAL_DRIFT ? best : null;
}

function resolveBoundaryPoint(point) {
  if (isPhysicalLandPoint(point)) return point;
  const resolved = resolvePhysicalGeometryBoundaryPoint(point);
  if (resolved) return resolved.map((value) => Number(value.toFixed(7)));
  if (isPhysicalGeometryBoundaryPoint(point)) {
    throw new Error(`Phase 2D geometry vertex remains a non-land support point after physical boundary resolution: ${point.join(",")}`);
  }
  const recovered = recoverNumericalBoundaryDrift(point);
  if (recovered) return recovered.map((value) => Number(value.toFixed(7)));
  throw new Error(`Phase 2D geometry vertex is outside physical land beyond numerical drift: ${point.join(",")}`);
}

function isValidPhysicalEdgePoint(point) {
  return isPhysicalLandPoint(point) || isPhysicalGeometryBoundaryPoint(point);
}

function physicalEdgeSample(start, end, fraction) {
  return [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
}

function repairPhysicalEdge(start, end, depth = 0) {
  if (depth > MAX_PHYSICAL_EDGE_REPAIR_DEPTH) {
    throw new Error(`Phase 2D geometry edge could not be resolved against physical water after ${MAX_PHYSICAL_EDGE_REPAIR_DEPTH} recursive repairs: ${start.join(",")} -> ${end.join(",")}`);
  }
  const invalidSamples = [];
  for (let index = 1; index < PHYSICAL_EDGE_SAMPLE_COUNT; index += 1) {
    const fraction = index / PHYSICAL_EDGE_SAMPLE_COUNT;
    const point = physicalEdgeSample(start, end, fraction);
    if (!isValidPhysicalEdgePoint(point)) invalidSamples.push({ fraction, point });
  }
  if (invalidSamples.length === 0) return [start, end];
  const target = invalidSamples[Math.floor(invalidSamples.length / 2)];
  const resolved = resolvePhysicalGeometryBoundaryPoint(target.point) ?? recoverNumericalBoundaryDrift(target.point);
  if (!resolved) throw new Error(`Phase 2D geometry edge crosses physical water without an authoritative boundary solution: ${target.point.join(",")}`);
  const boundary = resolved.map((value) => Number(value.toFixed(7)));
  if (Math.hypot(boundary[0] - start[0], boundary[1] - start[1]) <= GEOMETRY_EPS || Math.hypot(boundary[0] - end[0], boundary[1] - end[1]) <= GEOMETRY_EPS) {
    throw new Error(`Phase 2D geometry edge physical-boundary repair made no progress: ${start.join(",")} -> ${end.join(",")}`);
  }
  const left = repairPhysicalEdge(start, boundary, depth + 1);
  const right = repairPhysicalEdge(boundary, end, depth + 1);
  return [...left.slice(0, -1), ...right];
}

function normalizeOuterRing(ring) {
  if (!Array.isArray(ring) || ring.length < 3) throw new Error("Phase 2D geometry outer ring must contain at least three vertices");
  const normalized = [];
  for (let index = 0; index < ring.length; index += 1) {
    const start = resolveBoundaryPoint(ring[index]);
    const end = resolveBoundaryPoint(ring[(index + 1) % ring.length]);
    const repaired = repairPhysicalEdge(start, end);
    normalized.push(...repaired.slice(0, -1));
  }
  return normalized;
}

function pointInPolygon(point, polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const current = polygon[index];
    const before = polygon[previous];
    if ((current[1] > point[1]) !== (before[1] > point[1]) && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || 1e-12) + current[0]) inside = !inside;
  }
  return inside;
}

function pointOnLakeBoundary(lake, point) {
  const ring = lake.coordinates;
  if (!Array.isArray(ring) || ring.length < 2) return false;
  for (let index = 0; index < ring.length; index += 1) {
    const projected = pointOnSegmentProjection(point, ring[index], ring[(index + 1) % ring.length]);
    if (Math.hypot(projected[0] - point[0], projected[1] - point[1]) <= GEOMETRY_EPS) return true;
  }
  return false;
}

function lakeFullyContainedByOuterRing(lake, outerRing) {
  return lake.coordinates.length > 0 && lake.coordinates.every((point) => pointInPolygon(point, outerRing) || pointOnLakeBoundary(lake, point));
}

function polygonCentroid(polygon) {
  return polygon.reduce((sum, [x, y]) => [sum[0] + x, sum[1] + y], [0, 0]).map((value) => value / polygon.length);
}

function lakeHolesForOuterRing(outerRing) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.filter((lake) => Array.isArray(lake.coordinates) && lake.coordinates.length >= 3).filter((lake) => lakeFullyContainedByOuterRing(lake, outerRing)).filter((lake) => pointInPolygon(polygonCentroid(lake.coordinates), outerRing)).map((lake) => lake.coordinates.map(([longitude, latitude]) => [Number(longitude.toFixed(7)), Number(latitude.toFixed(7))]));
}

function normalizeGeometryPhysicalBoundary(geometry) {
  const coordinates = geometry.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0 || !Array.isArray(coordinates[0])) throw new Error(`Phase 2D geometry has invalid polygon coordinates: ${geometry.identity?.provinceId ?? "unknown"}`);
  const normalizedOuterRing = normalizeOuterRing(coordinates[0]);
  return { ...geometry, geometry: { ...geometry.geometry, coordinates: [normalizedOuterRing, ...coordinates.slice(1)] }, polygons: [normalizedOuterRing], holes: lakeHolesForOuterRing(normalizedOuterRing) };
}

function polygonArea(polygon) {
  let value = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    value += current[0] * next[1] - next[0] * current[1];
  }
  return Math.abs(value) / 2;
}

function buildProvinceAssets(geometries) {
  const metadataById = new Map(ANATOLIA_PROVINCE_METADATA.map((item) => [item.id, item]));
  return geometries.map((geometry) => {
    const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
    const metadata = metadataById.get(provinceId);
    if (!metadata) throw new Error(`Phase 2D geometry has no matching province metadata: ${provinceId}`);
    return {
      header: { assetType: "province", assetVersion: 4, generator: "Historia AI Phase 2D Geometry Builder V16", provider: "historia-ai-curated-cartography", dataset: "anatolia-province-geometry-1300", historicalDate: HISTORICAL_DATE, provinceId, historicalAnchor: geometry.identity?.historicalAnchor ?? metadata.centroid },
      identity: { id: provinceId, name: metadata.name },
      references: { geometryId: provinceId, countryId: metadata.countryId, capitalCityId: metadata.cityId },
      ownership: { countryId: metadata.historicalControl?.controllerAt1300 ?? metadata.countryId ?? null, ownerId: metadata.historicalControl?.controllerAt1300 ?? metadata.countryId ?? null },
      historical: { sourceFeatureId: provinceId, sourceName: metadata.name, subject: metadata.countryId, partOf: metadata.regionId, borderPrecision: metadata.borderConfidence, classification: "phase2d-anatolia-province-geometry", precision: metadata.borderConfidence, anchor: geometry.identity?.historicalAnchor ?? metadata.centroid, inferenceNotice: metadata.historicalControl?.note ?? null },
      administration: { governorId: null }, population: { total: 0 }, economy: { development: 0, wealth: 0 }, military: { supplyLimit: 0 }, culture: { primaryCulture: null }, religion: { primaryReligion: null },
    };
  });
}

function fallbackLikeProvinceCount(geometries) {
  return geometries.filter((geometry) => Array.isArray(geometry.polygons) && geometry.polygons.some((polygon) => polygonArea(polygon) < MIN_PROVINCE_AREA)).length;
}

export function buildAnatoliaPhase2DAssets(regions) {
  const assets = buildAnatoliaPhase2DAssetsV16(regions);
  const expectedSiteCount = expectedV16SiteCount();
  const siteCount = assets.siteCount ?? expectedSiteCount;
  if (!Number.isInteger(siteCount) || siteCount < expectedSiteCount) throw new Error(`Phase 2D cartographic site count is invalid: ${siteCount}; expected at least ${expectedSiteCount}.`);
  const geometries = assets.geometries.map((geometry) => ({ ...geometry, identity: { ...(geometry.identity ?? {}), id: geometry.identity?.provinceId ?? geometry.identity?.id, provinceId: geometry.identity?.provinceId ?? geometry.identity?.id } })).map(normalizeGeometryPhysicalBoundary);
  const provinces = buildProvinceAssets(geometries);
  const polygonCount = geometries.reduce((total, geometry) => total + geometry.polygons.length, 0);
  const fallbackProvinceCount = fallbackLikeProvinceCount(geometries);
  if (provinces.length !== ANATOLIA_PROVINCE_METADATA.length) throw new Error(`Phase 2D province count mismatch: ${provinces.length}; expected ${ANATOLIA_PROVINCE_METADATA.length}.`);
  return { ...assets, geometries, provinces, historicalDate: assets.historicalDate ?? HISTORICAL_DATE, provinceCount: provinces.length, siteCount, polygonCount, fallbackProvinceCount, politicalSiteCount: assets.politicalSiteCount ?? ANATOLIA_PROVINCE_METADATA.length, supportSiteCount: assets.supportSiteCount ?? 0, naturalFeatureSiteCount: assets.naturalFeatureSiteCount ?? naturalFeatureSiteCount(), barrierSiteCount: assets.barrierSiteCount ?? 0, physicalBarrierSiteCount: Math.max(physicalBoundarySiteCount(), assets.barrierSiteCount ?? 0), weightIterations: assets.weightIterations ?? DETERMINISTIC_WEIGHT_ITERATIONS };
}

export { isAnatoliaGeometryPoint, isPhysicalLandPoint };