import { buildAnatoliaPhase2DAssets as buildPhase2D, isAnatoliaGeometryPoint } from "./AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";

const LAKE_TERRAIN = "lake";
const RECOVERY_GRID_STEP = 0.01;
const RECOVERY_MAX_RADIUS = 1.5;

function clonePoint(point) {
  return Array.isArray(point) ? [point[0], point[1]] : point;
}

function distanceSquared(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const current = polygon[index];
    const prior = polygon[previous];
    const crosses = (current[1] > point[1]) !== (prior[1] > point[1])
      && point[0] < ((prior[0] - current[0]) * (point[1] - current[1]))
        / (prior[1] - current[1] || Number.EPSILON) + current[0];
    if (crosses) inside = !inside;
  }
  return inside;
}

function pointInWater(point) {
  return ANATOLIA_PHYSICAL_ATLAS.seas.some((sea) => pointInPolygon(point, sea.coordinates))
    || ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => pointInPolygon(point, lake.coordinates));
}

function pointInLand(point) {
  return ANATOLIA_PHYSICAL_ATLAS.landPolygons.some((polygon) => pointInPolygon(point, polygon));
}

function isPhysicalRecoveryPoint(point) {
  return isAnatoliaGeometryPoint(point) && pointInLand(point) && !pointInWater(point);
}

function findPhysicalRecoveryAnchor(origin) {
  if (isPhysicalRecoveryPoint(origin)) return origin;

  let best = null;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (let radius = 0; radius <= RECOVERY_MAX_RADIUS; radius += RECOVERY_GRID_STEP) {
    const directions = radius === 0 ? 1 : 72;
    for (let direction = 0; direction < directions; direction += 1) {
      const angle = (direction / directions) * Math.PI * 2;
      const candidate = [
        origin[0] + Math.cos(angle) * radius,
        origin[1] + Math.sin(angle) * radius,
      ];
      if (!isPhysicalRecoveryPoint(candidate)) continue;
      const distance = distanceSquared(candidate, origin);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = candidate;
      }
    }
    if (best) return best;
  }
  return null;
}

function restoreHistoricalAnchors(result, originals) {
  for (const province of result.provinces ?? []) {
    const original = originals.get(province.identity.id);
    if (original && province.historical) province.historical.anchor = clonePoint(original);
  }
  for (const geometry of result.geometries ?? []) {
    const original = originals.get(geometry.identity.provinceId);
    if (original && geometry.metadata) geometry.metadata.anchor = clonePoint(original);
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
      const anchor = findPhysicalRecoveryAnchor(metadata.centroid);
      if (!anchor) continue;
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

export { isAnatoliaGeometryPoint };
