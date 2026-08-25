import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { PHYSICAL_LAND_POLYGONS, isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, isPhysicalGeometryBoundaryPoint as isPhysicalGeometrySupportPoint, resolvePhysicalGeometryBoundaryPoint, resolveGeometryAnchor } from "./recovery/physical-land-authority.mjs";
import { repairPhysicalPolygon } from "./recovery/physical-edge-repair-v2.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const STRICT_PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const MAX_PHYSICAL_REPAIR_PASSES = 8;
const REPAIR_DENSIFICATION_SEGMENTS = 16;
const PARTITION_RECONCILIATION_PASSES = 4;
const PARTITION_EPS = 1e-10;

function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry recovery: ${provinceId}`);
    const original = refinement.anchor; const resolved = resolveGeometryAnchor(provinceId, original);
    if (resolved[0] === original[0] && resolved[1] === original[1]) continue;
    originals.set(provinceId, original); refinement.anchor = resolved;
  }
  try { return callback(); } finally { for (const [provinceId, original] of originals) ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = original; }
}

function isStrictlyPhysicalPath(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]; const end = polygon[(index + 1) % polygon.length];
    if (!isPhysicalLandPoint(start) && !isFinalPhysicalGeometryBoundaryPoint(start)) return false;
    if (!isPhysicalLandPoint(end) && !isFinalPhysicalGeometryBoundaryPoint(end)) return false;
    for (let sampleIndex = 1; sampleIndex < STRICT_PHYSICAL_EDGE_SAMPLE_COUNT; sampleIndex += 1) {
      const fraction = sampleIndex / STRICT_PHYSICAL_EDGE_SAMPLE_COUNT;
      const point = [start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction];
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) return false;
    }
  }
  return true;
}

function signedArea(polygon) { let sum = 0; for (let index = 0; index < polygon.length; index += 1) { const next = (index + 1) % polygon.length; sum += polygon[index][0] * polygon[next][1] - polygon[next][0] * polygon[index][1]; } return sum / 2; }
function cross(a, b, point) { return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]); }

function clipPolygonToPowerCell(polygon, cell) {
  if (!Array.isArray(cell) || cell.length < 3) return polygon;
  let output = polygon.map((point) => [...point]);
  const clip = signedArea(cell) < 0 ? [...cell].reverse() : cell;
  for (let edge = 0; edge < clip.length; edge += 1) {
    if (!output.length) return [];
    const start = clip[edge]; const end = clip[(edge + 1) % clip.length]; const input = output; output = [];
    const inside = (point) => cross(start, end, point) >= -PARTITION_EPS;
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index]; const next = input[(index + 1) % input.length]; const currentInside = inside(current); const nextInside = inside(next);
      if (currentInside && nextInside) output.push(next);
      else if (currentInside !== nextInside) {
        const currentValue = cross(start, end, current); const nextValue = cross(start, end, next); const denominator = currentValue - nextValue;
        const t = Math.abs(denominator) < PARTITION_EPS ? 0 : currentValue / denominator;
        output.push([current[0] + (next[0] - current[0]) * t, current[1] + (next[1] - current[1]) * t]);
        if (!currentInside && nextInside) output.push(next);
      }
    }
  }
  return output;
}

function densifyPolygon(polygon) {
  const result = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index]; const end = polygon[(index + 1) % polygon.length]; result.push(start);
    for (let sampleIndex = 1; sampleIndex < REPAIR_DENSIFICATION_SEGMENTS; sampleIndex += 1) {
      const fraction = sampleIndex / REPAIR_DENSIFICATION_SEGMENTS;
      result.push([start[0] + (end[0] - start[0]) * fraction, start[1] + (end[1] - start[1]) * fraction]);
    }
  }
  return result;
}

function repairPhysicalPolygonToFixedPoint(polygon, provinceId, sourcePartitionCell) {
  if (isStrictlyPhysicalPath(polygon)) return polygon;
  let current = polygon; let lastError = null;
  for (let pass = 1; pass <= MAX_PHYSICAL_REPAIR_PASSES; pass += 1) {
    try {
      const repaired = repairPhysicalPolygon(current);
      const reconciled = clipPolygonToPowerCell(repaired, sourcePartitionCell);
      if (reconciled.length >= 3 && isStrictlyPhysicalPath(reconciled)) return reconciled;
      current = densifyPolygon(reconciled.length >= 3 ? reconciled : repaired);
    } catch (error) { lastError = error; break; }
  }
  const detail = Array.isArray(current) ? JSON.stringify(current.map(([longitude, latitude]) => [Number(longitude.toFixed(10)), Number(latitude.toFixed(10))])) : "unavailable";
  throw new Error(`Phase 2D physical repair failed for ${provinceId}: ${lastError?.message ?? "did not converge"}; polygon=${detail}`);
}

function normalizeGeometryContract(assets) {
  return {
    ...assets,
    provinces: assets.provinces.map((province) => ({ ...province, header: { ...province.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" } })),
    geometries: assets.geometries.map((geometry) => {
      const polygon = geometry.polygons?.[0]; const holes = geometry.holes ?? []; const sourcePartitionCell = geometry.sourcePartitionCell;
      if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
      const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
      const historicalAnchor = provinceId ? ANATOLIA_PROVINCE_REFINEMENTS[provinceId]?.anchor : null;
      if (!historicalAnchor) throw new Error(`Missing historical anchor in V16 adapter contract: ${provinceId ?? "unknown"}`);
      if (!Array.isArray(sourcePartitionCell) || sourcePartitionCell.length < 3) throw new Error(`Missing source partition cell in V16 adapter contract: ${provinceId ?? "unknown"}`);
      const repairedPolygon = repairPhysicalPolygonToFixedPoint(polygon, provinceId ?? "unknown", sourcePartitionCell);
      return {
        ...geometry,
        sourcePartitionCell: undefined,
        header: { ...geometry.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" },
        identity: { ...(geometry.identity ?? {}), id: provinceId, provinceId, historicalAnchor: [historicalAnchor[0], historicalAnchor[1]] },
        polygons: [repairedPolygon],
        geometry: { ...(geometry.geometry ?? {}), type: "Polygon", coordinates: [repairedPolygon, ...holes] },
      };
    }),
  };
}

export function buildAnatoliaPhase2DAssets(regions) { return withGeometryAnchors(() => normalizeGeometryContract(buildAnatoliaPhase2DAssetsV15(regions))); }
function isPhysicalGeometryBoundaryPoint(point) { return isPhysicalGeometrySupportPoint(point); }
export { isPhysicalLandPoint, isPhysicalGeometryBoundaryPoint, isFinalPhysicalGeometryBoundaryPoint, resolvePhysicalGeometryBoundaryPoint, PHYSICAL_LAND_POLYGONS, resolveGeometryAnchor };