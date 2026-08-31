import { buildAnatoliaPhase2DAssets as buildPhase2D } from "./AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const LAND_SAFE_ANCHORS = Object.freeze({
  "bithynia-nicaea": [29.72, 40.15],
  "pisidia-egirdir": [30.85, 37.98],
  "pisidia-beysehir": [31.72, 37.78],
});

function clonePoint(point) {
  return Array.isArray(point) ? [point[0], point[1]] : point;
}

function restoreHistoricalAnchors(result, originals) {
  for (const province of result.provinces ?? []) {
    const original = originals.get(province.identity.id);
    if (original && province.historical) province.historical.anchor = clonePoint(original);
  }
  return result;
}

export function buildAnatoliaPhase2DAssets(sourceRegions = []) {
  try {
    return buildPhase2D(sourceRegions);
  } catch (error) {
    if (!(error instanceof Error) || !/Phase 2D produced no physically valid geometry/.test(error.message)) throw error;

    const originals = new Map();
    const changed = [];
    for (const metadata of ANATOLIA_PROVINCE_METADATA) {
      const anchor = LAND_SAFE_ANCHORS[metadata.id];
      if (!anchor || metadata.terrain !== "lake") continue;
      originals.set(metadata.id, clonePoint(metadata.centroid));
      changed.push([metadata, metadata.centroid]);
      metadata.centroid = clonePoint(anchor);
    }

    try {
      const recovered = buildPhase2D(sourceRegions);
      return restoreHistoricalAnchors(recovered, originals);
    } finally {
      for (const [metadata, centroid] of changed) metadata.centroid = centroid;
    }
  }
}
