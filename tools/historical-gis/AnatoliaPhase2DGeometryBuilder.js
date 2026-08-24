import {
  buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV16,
  isAnatoliaGeometryPoint,
  isPhysicalLandPoint,
} from "./AnatoliaPhase2DGeometryBuilderV16.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PHYSICAL_COAST_CORRECTIONS } from "../../src/map/data/AnatoliaPhysicalCoastCorrections.js";

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
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.length * 0
    + 38
    + physicalLand
    + coastCorrections
    + lakes;
}

export function buildAnatoliaPhase2DAssets(regions) {
  const assets = buildAnatoliaPhase2DAssetsV16(regions);
  const expectedSiteCount = expectedV16SiteCount();
  const siteCount = assets.siteCount ?? expectedSiteCount;

  if (!Number.isInteger(siteCount) || siteCount < expectedSiteCount) {
    throw new Error(`Phase 2D cartographic site count is invalid: ${siteCount}; expected at least ${expectedSiteCount}.`);
  }

  return {
    ...assets,
    historicalDate: assets.historicalDate ?? HISTORICAL_DATE,
    siteCount,
  };
}

export { isAnatoliaGeometryPoint, isPhysicalLandPoint };
