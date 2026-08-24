import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV16,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV16.js";
import { isAnatoliaGeometryPoint } from "./AnatoliaGeometryAuthority.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const HISTORICAL_DATE = "1300-01-01";
const BOUNDARY_SAMPLE_STEP = 0.06;
const MAX_BOUNDARY_NUMERICAL_DRIFT = 0.0001;

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

function normalizeGeometryPhysicalBoundary(geometry) {
  const coordinates = geometry.geometry?.coordinates;
  if (!Array.isArray(coordinates) || coordinates.length === 0 || !Array.isArray(coordinates[0])) {
    throw new Error(`Phase 2D geometry has invalid polygon coordinates: ${geometry.identity?.provinceId ?? "unknown"}`);
  }

  const normalizedOuterRing = normalizeOuterRing(coordinates[0]);
  return {
    ...geometry,
    geometry: {
      ...geometry.geometry,
      coordinates: [normalizedOuterRing, ...coordinates.slice(1)],
    },
    polygons: [normalizedOuterRing],
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

  const geometries = assets.geometries
    .map((geometry) => ({
      ...geometry,
      identity: {
        ...(geometry.identity ?? {}),
        id: geometry.identity?.provinceId ?? geometry.identity?.id,
        provinceId: geometry.identity?.provinceId ?? geometry.identity?.id,
      },
    }))
    .map(normalizeGeometryPhysicalBoundary);
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
    barrierSiteCount: 0,
  };
}

export { isAnatoliaGeometryPoint, isPhysicalLandPoint };
