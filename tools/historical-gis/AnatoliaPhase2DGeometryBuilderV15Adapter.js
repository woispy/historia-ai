import { buildAnatoliaPhase2DAssets as buildAnatoliaPhase2DAssetsV15 } from "./AnatoliaPhase2DGeometryBuilderV15.js";
import {
  PHYSICAL_LAND_POLYGONS,
  isPhysicalLandPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  isPhysicalGeometryBoundaryPoint as isPhysicalGeometrySupportPoint,
  resolvePhysicalGeometryBoundaryPoint,
  resolveGeometryAnchor,
} from "./recovery/physical-land-authority.mjs";
import { repairPhysicalPolygon } from "./recovery/physical-edge-repair-safe.mjs";
import { ANATOLIA_PROVINCE_REFINEMENTS } from "../../src/map/data/AnatoliaProvinceRefinement.js";

const STRICT_PHYSICAL_EDGE_SAMPLE_COUNT = 64;
const MAX_PHYSICAL_REPAIR_PASSES = 8;
const REPAIR_DENSIFICATION_SEGMENTS = 16;
const MAX_PARTITION_RECONCILIATION_PASSES = 8;
const PARTITION_BLEND_STEPS = 24;
const PARTITION_POINT_EPS = 1e-9;

/**
 * Phase 2D V16 contract adapter over the retained V15 geometry engine.
 * Historical anchors remain immutable research data. Geometry recovery is
 * temporary and uses the single shared physical-land recovery contract.
 */
function withGeometryAnchors(callback) {
  const originals = new Map();
  for (const [provinceId, refinement] of Object.entries(ANATOLIA_PROVINCE_REFINEMENTS)) {
    if (!refinement?.anchor) throw new Error(`Missing refinement anchor for geometry recovery: ${provinceId}`);
    const original = refinement.anchor;
    const resolved = resolveGeometryAnchor(provinceId, original);
    if (resolved[0] === original[0] && resolved[1] === original[1]) continue;
    originals.set(provinceId, original);
    refinement.anchor = resolved;
  }
  try {
    return callback();
  } finally {
    for (const [provinceId, original] of originals) ANATOLIA_PROVINCE_REFINEMENTS[provinceId].anchor = original;
  }
}

function isStrictlyPhysicalPath(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    if (!isPhysicalLandPoint(start) && !isFinalPhysicalGeometryBoundaryPoint(start)) return false;
    if (!isPhysicalLandPoint(end) && !isFinalPhysicalGeometryBoundaryPoint(end)) return false;
    for (let sampleIndex = 1; sampleIndex < STRICT_PHYSICAL_EDGE_SAMPLE_COUNT; sampleIndex += 1) {
      const fraction = sampleIndex / STRICT_PHYSICAL_EDGE_SAMPLE_COUNT;
      const point = [
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ];
      if (!isPhysicalLandPoint(point) && !isFinalPhysicalGeometryBoundaryPoint(point)) return false;
    }
  }
  return true;
}

function densifyPolygon(polygon) {
  const result = [];
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    result.push(start);
    for (let sampleIndex = 1; sampleIndex < REPAIR_DENSIFICATION_SEGMENTS; sampleIndex += 1) {
      const fraction = sampleIndex / REPAIR_DENSIFICATION_SEGMENTS;
      result.push([
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ]);
    }
  }
  return result;
}

function repairPhysicalPolygonToFixedPoint(polygon, provinceId) {
  // Preserve the V15 partition exactly when it already satisfies the strict
  // physical contract. Repairing every polygon unconditionally can move shared
  // Voronoi boundaries independently and create artificial province overlap.
  if (isStrictlyPhysicalPath(polygon)) return polygon;

  let current = polygon;
  for (let pass = 1; pass <= MAX_PHYSICAL_REPAIR_PASSES; pass += 1) {
    const repaired = repairPhysicalPolygon(current);
    if (isStrictlyPhysicalPath(repaired)) return repaired;
    current = densifyPolygon(repaired);
  }
  throw new Error(`Phase 2D physical repair did not converge to a land-safe polygon after ${MAX_PHYSICAL_REPAIR_PASSES} passes: ${provinceId}`);
}

function pointOnSegment(point, start, end, tolerance = PARTITION_POINT_EPS) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const cross = dx * (point[1] - start[1]) - dy * (point[0] - start[0]);
  if (Math.abs(cross) > tolerance) return false;
  return point[0] >= Math.min(start[0], end[0]) - tolerance
    && point[0] <= Math.max(start[0], end[0]) + tolerance
    && point[1] >= Math.min(start[1], end[1]) - tolerance
    && point[1] <= Math.max(start[1], end[1]) + tolerance;
}

function pointInPolygon(point, polygon) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index += 1) {
    const current = polygon[index];
    const before = polygon[previous];
    if (pointOnSegment(point, before, current)) return true;
    if (
      (current[1] > point[1]) !== (before[1] > point[1])
      && point[0] < ((before[0] - current[0]) * (point[1] - current[1])) / ((before[1] - current[1]) || 1e-12) + current[0]
    ) inside = !inside;
  }
  return inside;
}

function pointInStrictPolygon(point, polygon) {
  for (let index = 0; index < polygon.length; index += 1) {
    if (pointOnSegment(point, polygon[index], polygon[(index + 1) % polygon.length])) return false;
  }
  return pointInPolygon(point, polygon);
}

function polygonCentroid(polygon) {
  let areaTwice = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const current = polygon[index];
    const next = polygon[(index + 1) % polygon.length];
    const cross = current[0] * next[1] - next[0] * current[1];
    areaTwice += cross;
    x += (current[0] + next[0]) * cross;
    y += (current[1] + next[1]) * cross;
  }
  if (Math.abs(areaTwice) <= PARTITION_POINT_EPS) {
    return polygon.reduce((sum, point) => [sum[0] + point[0], sum[1] + point[1]], [0, 0]).map((value) => value / polygon.length);
  }
  return [x / (3 * areaTwice), y / (3 * areaTwice)];
}

function geometryOwnsPoint(geometry, point) {
  const outer = geometry.polygon;
  if (!pointInStrictPolygon(point, outer)) return false;
  return !(geometry.holes ?? []).some((hole) => pointInStrictPolygon(point, hole));
}

function hasPartitionOverlap(source, target) {
  const probes = [polygonCentroid(source.polygon), ...source.polygon];
  return probes.some((probe) => geometryOwnsPoint(target, probe));
}

function clonePolygon(polygon) {
  return polygon.map((point) => [point[0], point[1]]);
}

function blendPolygons(original, repaired, fraction) {
  if (original.length !== repaired.length) return null;
  return original.map((point, index) => [
    point[0] + (repaired[index][0] - point[0]) * fraction,
    point[1] + (repaired[index][1] - point[1]) * fraction,
  ]);
}

function reconcileSharedPartition(geometryEntries) {
  // Physical repair is deliberately local, but province ownership is global:
  // independently repaired cells must never re-enter another cell. When a
  // repair moves a boundary across a neighbour, walk that repaired polygon
  // back toward its original V15 cell until both invariants hold: strict
  // physical validity and no province nesting/overlap. This is generic and
  // does not whitelist or special-case any province pair.
  for (let pass = 1; pass <= MAX_PARTITION_RECONCILIATION_PASSES; pass += 1) {
    let changed = false;
    for (const source of geometryEntries) {
      for (const target of geometryEntries) {
        if (source === target || !hasPartitionOverlap(source, target)) continue;
        if (!source.repaired) {
          throw new Error(`Phase 2D partition overlap cannot be reconciled without moving the authoritative source cell: ${source.provinceId} enters ${target.provinceId}`);
        }

        let candidate = null;
        for (let step = PARTITION_BLEND_STEPS - 1; step >= 0; step -= 1) {
          const fraction = step / PARTITION_BLEND_STEPS;
          const blended = blendPolygons(source.original, source.polygon, fraction);
          if (!blended || !isStrictlyPhysicalPath(blended)) continue;
          const trial = { ...source, polygon: blended };
          if (!hasPartitionOverlap(trial, target) && !geometryEntries.some((other) => other !== source && other !== target && hasPartitionOverlap(trial, other))) {
            candidate = blended;
            break;
          }
        }

        if (!candidate) {
          throw new Error(`Phase 2D partition overlap could not be reconciled generically: ${source.provinceId} enters ${target.provinceId}`);
        }
        source.polygon = candidate;
        changed = true;
      }
    }
    if (!changed) return;
  }

  for (const source of geometryEntries) {
    for (const target of geometryEntries) {
      if (source === target) continue;
      if (hasPartitionOverlap(source, target)) {
        throw new Error(`Phase 2D partition overlap remained after reconciliation: ${source.provinceId} enters ${target.provinceId}`);
      }
    }
  }
}

function normalizeGeometryContract(assets) {
  const geometryEntries = [];
  const geometries = assets.geometries.map((geometry) => {
    const polygon = geometry.polygons?.[0];
    const holes = geometry.holes ?? [];
    if (!Array.isArray(polygon) || polygon.length < 3) return geometry;
    const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
    const historicalAnchor = provinceId ? ANATOLIA_PROVINCE_REFINEMENTS[provinceId]?.anchor : null;
    if (!historicalAnchor) throw new Error(`Missing historical anchor in V16 adapter contract: ${provinceId ?? "unknown"}`);
    const repairedPolygon = repairPhysicalPolygonToFixedPoint(polygon, provinceId ?? "unknown");
    const entry = {
      provinceId,
      original: clonePolygon(polygon),
      polygon: clonePolygon(repairedPolygon),
      repaired: repairedPolygon !== polygon,
      holes,
    };
    geometryEntries.push(entry);
    return {
      ...geometry,
      header: {
        ...geometry.header,
        assetVersion: 16,
        generator: "Historia AI Phase 2D Geometry Builder V16",
      },
      identity: {
        ...(geometry.identity ?? {}),
        id: provinceId,
        provinceId,
        historicalAnchor: [historicalAnchor[0], historicalAnchor[1]],
      },
      polygons: [entry.polygon],
      geometry: {
        ...(geometry.geometry ?? {}),
        type: "Polygon",
        coordinates: [entry.polygon, ...holes],
      },
    };
  });

  reconcileSharedPartition(geometryEntries);
  const byProvince = new Map(geometryEntries.map((entry) => [entry.provinceId, entry.polygon]));
  for (const geometry of geometries) {
    const provinceId = geometry.identity?.provinceId ?? geometry.identity?.id;
    const polygon = byProvince.get(provinceId);
    if (!polygon) continue;
    geometry.polygons = [polygon];
    geometry.geometry = {
      ...(geometry.geometry ?? {}),
      type: "Polygon",
      coordinates: [polygon, ...(geometry.holes ?? [])],
    };
  }

  return {
    ...assets,
    provinces: assets.provinces.map((province) => ({
      ...province,
      header: {
        ...province.header,
        assetVersion: 16,
        generator: "Historia AI Phase 2D Geometry Builder V16",
      },
    })),
    geometries,
  };
}

export function buildAnatoliaPhase2DAssets(regions) {
  return withGeometryAnchors(() => normalizeGeometryContract(buildAnatoliaPhase2DAssetsV15(regions)));
}

/**
 * V15 needs the temporary support surface while constructing its intermediate
 * partition. V16 exposes the final contract separately: lake-interior support
 * points are never valid final political-edge points.
 */
function isPhysicalGeometryBoundaryPoint(point) {
  return isPhysicalGeometrySupportPoint(point);
}

export {
  isPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint,
  isFinalPhysicalGeometryBoundaryPoint,
  resolvePhysicalGeometryBoundaryPoint,
  PHYSICAL_LAND_POLYGONS,
  resolveGeometryAnchor,
};

// V16 contract marker: the adapter, not the retained V15 engine, owns the public generator identity.
