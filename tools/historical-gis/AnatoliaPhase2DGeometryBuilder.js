import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV16,
  isAnatoliaGeometryPoint,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV16.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const HISTORICAL_DATE = "1300-01-01";
const BOUNDARY_SAMPLE_STEP = 0.06;

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
      identity: {
        id: provinceId,
        name: metadata.name,
      },
      references: {
        geometryId: provinceId,
        countryId: metadata.countryId,
        capitalCityId: metadata.cityId,
      },
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

export function buildAnatoliaPhase2DAssets(regions) {
  const assets = buildAnatoliaPhase2DAssetsV16(regions);
  const expectedSiteCount = expectedV16SiteCount();
  const siteCount = assets.siteCount ?? expectedSiteCount;

  if (!Number.isInteger(siteCount) || siteCount < expectedSiteCount) {
    throw new Error(`Phase 2D cartographic site count is invalid: ${siteCount}; expected at least ${expectedSiteCount}.`);
  }

  const geometries = assets.geometries.map((geometry) => ({
    ...geometry,
    identity: {
      ...(geometry.identity ?? {}),
      id: geometry.identity?.provinceId ?? geometry.identity?.id,
      provinceId: geometry.identity?.provinceId ?? geometry.identity?.id,
    },
  }));
  const provinces = buildProvinceAssets(geometries);

  return {
    ...assets,
    geometries,
    provinces,
    historicalDate: assets.historicalDate ?? HISTORICAL_DATE,
    siteCount,
    barrierSiteCount: 0,
  };
}

export { isAnatoliaGeometryPoint, isPhysicalLandPoint };
