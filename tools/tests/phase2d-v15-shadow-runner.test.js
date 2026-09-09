import assert from "node:assert/strict";
import fs from "node:fs";
import { buildAnatoliaPhase2DAssets } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import {
  isPhysicalLandPoint as shadowIsPhysicalLandPoint,
  isPhysicalGeometryBoundaryPoint as shadowIsPhysicalGeometryBoundaryPoint,
  nearestBoundaryLandPoint as shadowNearestBoundaryLandPoint,
  resolvePhysicalGeometryBoundaryPoint as shadowResolvePhysicalGeometryBoundaryPoint,
} from "./phase2d-v15-shadow-authority.mjs";
import {
  normalizePhysicalBoundaryCandidate,
  repairPhysicalEdgeCandidate,
  resolveGeometryAnchorCandidate,
  V15_SHADOW_CONTRACT,
} from "./phase2d-v15-shadow-candidate.mjs";

function signedArea(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * polygon[index][1];
  }
  return sum / 2;
}

function pointOnSegment(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const cross = (point[0] - start[0]) * dy - (point[1] - start[1]) * dx;
  if (Math.abs(cross) > 1e-9) return false;
  return point[0] >= Math.min(start[0], end[0]) - 1e-9
    && point[0] <= Math.max(start[0], end[0]) + 1e-9
    && point[1] >= Math.min(start[1], end[1]) - 1e-9
    && point[1] <= Math.max(start[1], end[1]) + 1e-9;
}

function pointInPolygon(point, polygon) {
  if (!polygon?.length) return false;
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const a = polygon[index];
    const b = polygon[previous];
    if (pointOnSegment(point, a, b)) return true;
    if ((a[1] > point[1]) !== (b[1] > point[1])
      && point[0] < ((b[0] - a[0]) * (point[1] - a[1])) / ((b[1] - a[1]) || 1e-9) + a[0]) inside = !inside;
  }
  return inside;
}

function lakeRings(lake) {
  return lake.rings ?? [lake.coordinates];
}

function isLakeInteriorPoint(point) {
  return ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.some((lake) => {
    const rings = lakeRings(lake);
    return rings.length > 0 && pointInPolygon(point, rings[0])
      && !rings.slice(1).some((ring) => pointInPolygon(point, ring));
  });
}

function nearestPointOnRing(point, ring) {
  let best = null;
  let bestDistance = Infinity;
  for (let index = 0; index < ring.length; index += 1) {
    const start = ring[index];
    const end = ring[(index + 1) % ring.length];
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const denominator = dx * dx + dy * dy;
    const t = denominator === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / denominator));
    const candidate = [start[0] + dx * t, start[1] + dy * t];
    const distance = Math.hypot(point[0] - candidate[0], point[1] - candidate[1]);
    if (distance < bestDistance) {
      best = candidate;
      bestDistance = distance;
    }
  }
  return { point: best, distance: bestDistance };
}

const physicalPolygons = ANATOLIA_PHYSICAL_ATLAS.landPolygons.filter((polygon) => Math.abs(signedArea(polygon)) >= 0.00005);

const authority = {
  isPhysicalLandPoint(point) {
    return shadowIsPhysicalLandPoint(point);
  },
  isPhysicalGeometryBoundaryPoint(point) {
    return shadowIsPhysicalGeometryBoundaryPoint(point);
  },
  nearestBoundaryLandPoint(point) {
    return shadowNearestBoundaryLandPoint(point);
  },
  resolvePhysicalGeometryBoundaryPoint(point) {
    return shadowResolvePhysicalGeometryBoundaryPoint(point);
  },
};

function canonicalPolygons() {
  const result = buildAnatoliaPhase2DAssets([]);
  return result.geometries.flatMap((geometry) => geometry.polygons.map((polygon) => ({ provinceId: geometry.identity.provinceId, polygon })));
}

function canonicalMetrics(polygon) {
  return {
    ringCount: 1,
    vertexCount: polygon.length,
    area: Math.abs(signedArea(polygon)),
    closed: polygon.length >= 3,
    provinceIdentity: null,
  };
}

function semanticPolygonEqual(a, b, epsilon = 1e-7) {
  if (!a || !b || a.length !== b.length) return false;
  const rotate = (polygon, offset) => polygon.map((_, index) => polygon[(index + offset) % polygon.length]);
  const equal = (left, right) => left.every(([x, y], index) => Math.abs(x - right[index][0]) <= epsilon && Math.abs(y - right[index][1]) <= epsilon);
  for (let offset = 0; offset < b.length; offset += 1) {
    if (equal(a, rotate(b, offset))) return true;
  }
  return false;
}

function normalizeWithForensics(provinceId, polygon) {
  const normalized = [];
  const diagnostics = { edgeCount: polygon.length, repairedEdges: 0, failedEdges: 0, authoritative: false };
  const failures = [];

  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const resolvedStart = authority.isPhysicalLandPoint(start) ? [...start] : authority.resolvePhysicalGeometryBoundaryPoint(start);
    const resolvedEnd = authority.isPhysicalLandPoint(end) ? [...end] : authority.resolvePhysicalGeometryBoundaryPoint(end);
    if (!resolvedStart || !resolvedEnd) {
      diagnostics.failedEdges += 1;
      failures.push({ provinceId, edgeIndex: index, start, end, resolvedStart, resolvedEnd, endpointRecovery: { start: resolvedStart ? "resolved" : "failed", end: resolvedEnd ? "resolved" : "failed" }, repairResult: null, terminationReason: null, maxDepthObserved: null, sampleCount: null, recursionCalls: null, failureStage: !resolvedStart ? "start-endpoint-recovery" : "end-endpoint-recovery" });
      return { polygon: null, diagnostics, failures };
    }
    const repaired = repairPhysicalEdgeCandidate(resolvedStart, resolvedEnd, authority);
    if (!repaired.points) {
      diagnostics.failedEdges += 1;
      failures.push({ provinceId, edgeIndex: index, start, end, resolvedStart, resolvedEnd, endpointRecovery: { start: "resolved", end: "resolved" }, repairResult: "failed", terminationReason: repaired.diagnostics.terminationReason, maxDepthObserved: repaired.diagnostics.maxDepthObserved, sampleCount: repaired.diagnostics.sampleCount, recursionCalls: repaired.diagnostics.recursionCalls, failureStage: `edge-repair:${repaired.diagnostics.terminationReason ?? "unknown"}` });
      return { polygon: null, diagnostics, failures };
    }
    if (repaired.points.length > 2) diagnostics.repairedEdges += 1;
    normalized.push(...repaired.points.slice(0, -1));
  }

  const deduplicated = [];
  for (const point of normalized) {
    const last = deduplicated[deduplicated.length - 1];
    if (!last || last[0] !== point[0] || last[1] !== point[1]) deduplicated.push(point);
  }
  if (deduplicated.length > 1) {
    const first = deduplicated[0];
    const last = deduplicated[deduplicated.length - 1];
    if (first[0] === last[0] && first[1] === last[1]) deduplicated.pop();
  }
  if (deduplicated.length < 3 || Math.abs(signedArea(deduplicated)) < 0.00005) {
    diagnostics.failedEdges += 1;
    failures.push({ provinceId, edgeIndex: null, start: null, end: null, resolvedStart: null, resolvedEnd: null, endpointRecovery: null, repairResult: "failed", terminationReason: null, maxDepthObserved: null, sampleCount: null, recursionCalls: null, failureStage: "post-normalization-degenerate-or-min-area" });
    return { polygon: null, diagnostics, failures };
  }
  return { polygon: deduplicated, diagnostics, failures };
}

// PA-05 — actual bounded candidate recovery execution.
{
  const source = ANATOLIA_PROVINCE_METADATA.find((item) => !authority.isPhysicalLandPoint(item.centroid));
  if (source) {
    const recovered = resolveGeometryAnchorCandidate(source.id, source.centroid, authority);
    assert.equal(recovered.authoritative, false);
    if (recovered.point) {
      const distance = Math.hypot(recovered.point[0] - source.centroid[0], recovered.point[1] - source.centroid[1]);
      assert.ok(distance <= V15_SHADOW_CONTRACT.MAX_RECOVERY_DISTANCE + 1e-9, `PA-05 recovery exceeded 0.75: ${distance}`);
      assert.ok(authority.isPhysicalLandPoint(recovered.point), "PA-05 candidate is not physical land");
    } else {
      assert.equal(recovered.diagnostics.failure, "bounded-recovery-exhausted");
    }
  }
}

// PA-10 — pathological edge: force recursive subdivision with a segment-relative interior resolver.
{
  const pathologicalAuthority = {
    isPhysicalGeometryBoundaryPoint: () => false,
    resolvePhysicalGeometryBoundaryPoint: ([x, y]) => {
      const bias = 0.1234567;
      return [x + (1 - x) * bias, y + (1 - y) * bias];
    },
  };
  const result = repairPhysicalEdgeCandidate([0, 0], [1, 1], pathologicalAuthority);
  assert.equal(result.points, null);
  assert.equal(result.authoritative, false);
  assert.equal(result.diagnostics.maxDepthObserved, V15_SHADOW_CONTRACT.MAX_EDGE_REPAIR_DEPTH);
  assert.equal(result.diagnostics.terminationReason, "max-depth");
  assert.ok(result.diagnostics.sampleCount >= V15_SHADOW_CONTRACT.FINAL_EDGE_SAMPLE_COUNT);
  assert.ok(result.diagnostics.recursionCalls > 0);
}

// PA-11 — N(N(P)) semantic idempotence on canonical physical polygons.
{
  const polygons = canonicalPolygons();
  assert.ok(polygons.length > 0, "PA-11 requires canonical polygons");
  let checked = 0;
  for (const { polygon } of polygons) {
    const first = normalizePhysicalBoundaryCandidate(polygon, authority);
    if (!first.polygon) continue;
    const second = normalizePhysicalBoundaryCandidate(first.polygon, authority);
    assert.ok(second.polygon, "PA-11 second normalization failed");
    const metricsA = canonicalMetrics(first.polygon);
    const metricsB = canonicalMetrics(second.polygon);
    assert.equal(metricsB.ringCount, metricsA.ringCount);
    assert.equal(metricsB.vertexCount, metricsA.vertexCount);
    assert.ok(Math.abs(metricsB.area - metricsA.area) <= 1e-9, "PA-11 area changed after second normalization");
    assert.equal(metricsB.closed, metricsA.closed);
    assert.ok(semanticPolygonEqual(first.polygon, second.polygon), "PA-11 N(N(P)) is not semantically equal to N(P)");
    checked += 1;
  }
  assert.ok(checked > 0, "PA-11 found no normalizable canonical polygon");
}

// Shadow comparison: canonical polygon vs V15 candidate normalization.
{
  const diffs = [];
  const failureStages = [];
  for (const { provinceId, polygon } of canonicalPolygons()) {
    const candidate = normalizeWithForensics(provinceId, polygon);
    if (!candidate.polygon) {
      diffs.push({ provinceId, topology: "candidate-normalization-failed", diagnostics: candidate.diagnostics, failures: candidate.failures });
      failureStages.push(...candidate.failures);
      continue;
    }
    const canonical = canonicalMetrics(polygon);
    const shadow = canonicalMetrics(candidate.polygon);
    diffs.push({ provinceId, topology: canonical.vertexCount === shadow.vertexCount ? "same-cardinality" : "vertex-count-delta", ringStructure: `${canonical.ringCount}->${shadow.ringCount}`, areaDelta: shadow.area - canonical.area, coordinateDeltaMax: polygon.reduce((max, point, index) => { const other = candidate.polygon[index % candidate.polygon.length]; return Math.max(max, Math.hypot(point[0] - other[0], point[1] - other[1])); }, 0), authority: candidate.diagnostics.authoritative, semanticEqual: semanticPolygonEqual(polygon, candidate.polygon), diagnostics: candidate.diagnostics });
  }
  const topologyBreaks = diffs.filter((item) => item.topology === "candidate-normalization-failed").length;
  const authorityViolations = diffs.filter((item) => item.diagnostics?.authoritative === true).length;

  const forensicSnapshot = {
    contract: V15_SHADOW_CONTRACT,
    PA05: "EXECUTED",
    PA10: "EXECUTED",
    PA11: "EXECUTED",
    shadowDiffCount: diffs.length,
    topologyBreaks,
    authorityViolations,
    semanticEqualCount: diffs.filter((item) => item.semanticEqual).length,
    maxAreaDelta: diffs.some((item) => typeof item.areaDelta === "number") ? Math.max(...diffs.filter((item) => typeof item.areaDelta === "number").map((item) => Math.abs(item.areaDelta))) : null,
    maxCoordinateDelta: diffs.some((item) => typeof item.coordinateDeltaMax === "number") ? Math.max(...diffs.filter((item) => typeof item.coordinateDeltaMax === "number").map((item) => item.coordinateDeltaMax)) : null,
    failureStageCounts: Object.fromEntries(failureStages.reduce((counts, item) => { counts.set(item.failureStage, (counts.get(item.failureStage) ?? 0) + 1); return counts; }, new Map())),
    failureForensics: failureStages,
    diffs,
  };
  fs.mkdirSync("artifacts/phase2.8-c", { recursive: true });
  fs.writeFileSync("artifacts/phase2.8-c/v15-shadow-forensics.json", `${JSON.stringify(forensicSnapshot, null, 2)}\n`, "utf8");
  console.log(`V15 shadow forensic snapshot: topologyBreaks=${topologyBreaks}, candidate-normalization-failed=${topologyBreaks}, shadowDiffCount=${diffs.length}`);
  console.log(`V15 shadow failure-stage counts: ${JSON.stringify(forensicSnapshot.failureStageCounts)}`);

  assert.equal(topologyBreaks, 0, `V15 shadow topology failures: ${topologyBreaks}`);
  assert.equal(authorityViolations, 0, `V15 shadow authority violations: ${authorityViolations}`);
  console.log(JSON.stringify({ contract: V15_SHADOW_CONTRACT, PA05: "EXECUTED", PA10: "EXECUTED", PA11: "EXECUTED", shadowDiffCount: diffs.length, topologyBreaks, authorityViolations, semanticEqualCount: diffs.filter((item) => item.semanticEqual).length, maxAreaDelta: forensicSnapshot.maxAreaDelta, maxCoordinateDelta: forensicSnapshot.maxCoordinateDelta, failureStageCounts: forensicSnapshot.failureStageCounts }, null, 2));
}

console.log("V15 shadow runner: execution completed without granting production authority");

// CI trigger marker: no executable behavior change.
