import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import { PHYSICAL_LAND_POLYGONS, isPhysicalLandPoint, isFinalPhysicalGeometryBoundaryPoint, isPhysicalGeometryBoundaryPoint as isPhysicalGeometrySupportPoint, resolvePhysicalGeometryBoundaryPoint, resolveGeometryAnchor } from "./recovery/physical-land-authority.mjs";
import { repairPhysicalPolygon } from "./recovery/physical-edge-repair-v2.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const STRICT_PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const MAX_PHYSICAL_REPAIR_PASSES = 4;
const PARTITION_CLIP_EPS = 1e-10;

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

function signedArea(polygon) { let sum = 0; for (let index = 0; index < polygon.length; index += 1) { const current = polygon[index]; const next = polygon[(index + 1) % polygon.length]; sum += current[0] * next[1] - next[0] * current[1]; } return sum / 2; }
function edgeCross(start, end, point) { return (end[0] - start[0]) * (point[1] - start[1]) - (end[1] - start[1]) * (point[0] - start[0]); }
function intersectLines(a, b, c, d) {
  const r = [b[0] - a[0], b[1] - a[1]]; const s = [d[0] - c[0], d[1] - c[1]];
  const denominator = r[0] * s[1] - r[1] * s[0]; if (Math.abs(denominator) <= PARTITION_CLIP_EPS) return null;
  const q = [c[0] - a[0], c[1] - a[1]]; const t = (q[0] * s[1] - q[1] * s[0]) / denominator;
  return [a[0] + r[0] * t, a[1] + r[1] * t];
}
function clipPolygonToCell(polygon, cell) {
  if (!Array.isArray(cell) || cell.length < 3) return polygon;
  let output = polygon.map((point) => [...point]); const clip = signedArea(cell) < 0 ? [...cell].reverse() : cell;
  for (let edge = 0; edge < clip.length; edge += 1) {
    if (!output.length) return [];
    const start = clip[edge]; const end = clip[(edge + 1) % clip.length]; const input = output; output = [];
    const inside = (point) => edgeCross(start, end, point) >= -PARTITION_CLIP_EPS;
    for (let index = 0; index < input.length; index += 1) {
      const current = input[index]; const next = input[(index + 1) % input.length]; const currentInside = inside(current); const nextInside = inside(next);
      if (currentInside && nextInside) output.push(next);
      else if (currentInside !== nextInside) { const intersection = intersectLines(current, next, start, end); if (intersection) output.push(intersection); if (!currentInside && nextInside) output.push(next); }
    }
  }
  return output;
}
function polygonSignature(polygon) {
  return JSON.stringify(polygon.map(([longitude, latitude]) => [Number(longitude.toFixed(10)), Number(latitude.toFixed(10))]));
}
function repairPhysicalPolygonToFixedPoint(polygon, provinceId, containmentPolygon) {
  if (isStrictlyPhysicalPath(polygon)) return polygon;
  let current = polygon; let lastError = null; let previousSignature = null;
  for (let pass = 1; pass <= MAX_PHYSICAL_REPAIR_PASSES; pass += 1) {
    const currentSignature = polygonSignature(current);
    if (currentSignature === previousSignature) break;
    previousSignature = currentSignature;
    try {
      const repaired = repairPhysicalPolygon(current);
      if (repaired.length < 3) throw new Error("physical repair returned fewer than three vertices");
      const partitionClipped = containmentPolygon ? clipPolygonToCell(repaired, containmentPolygon) : repaired;
      if (partitionClipped.length >= 3 && isStrictlyPhysicalPath(partitionClipped)) return partitionClipped;
      if (partitionClipped.length < 3) throw new Error("partition reconciliation removed the physical polygon");
      current = partitionClipped;
    } catch (error) { lastError = error; break; }
  }
  const detail = Array.isArray(current) ? polygonSignature(current) : "unavailable";
  throw new Error(`Phase 2D physical repair failed for ${provinceId}: ${lastError?.message ?? "did not converge"}; polygon=${detail}`);
}

function normalizeGeometryContract(assets) {
  return {
    ...assets,
    provinces: assets.provinces.map((province) => ({ ...province, header: { ...province.header, assetVersion: 16, generator: "Historia AI Phase 2D Geometry Builder V16" } })),
    geometries: assets.geometries.map((geometry) => {
      const polygon = geometry.polygons?.[0]; const holes = geometry.holes ?? [];
      if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
      const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
      const historicalAnchor = provinceId ? ANATOLIA_PROVINCE_REFINEMENTS[provinceId]?.anchor : null;
      if (!historicalAnchor) throw new Error(`Missing historical anchor in V16 adapter contract: ${provinceId ?? "unknown"}`);
      const sourcePartitionCell = geometry.sourcePartitionCell;
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