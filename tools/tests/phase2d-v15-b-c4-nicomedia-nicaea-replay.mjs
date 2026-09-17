import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
const V15_ROOT = process.env.V15_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");
assert.ok(V15_ROOT, "V15_ROOT is required");
const FAILURE_EDGES = [
  { caseId: "B-01", provinceId: "bithynia-nicomedia", start: [29.87953, 40.72476], end: [29.88817, 40.72993] },
  { caseId: "B-02", provinceId: "bithynia-nicomedia", start: [29.88817, 40.72993], end: [29.91915, 40.71851] },
  { caseId: "B-03", provinceId: "bithynia-nicomedia", start: [29.94879, 40.71649], end: [29.96697, 40.7418] },
  { caseId: "B-04", provinceId: "bithynia-nicomedia", start: [29.87953, 40.72476], end: [29.85423, 40.7623] },
  { caseId: "B-05", provinceId: "bithynia-nicomedia", start: [29.96697, 40.7418], end: [29.94879, 40.71649] },
  { caseId: "B-06", provinceId: "bithynia-nicomedia", start: [29.99643, 40.72103], end: [30.01852, 40.70688] },
  { caseId: "B-07", provinceId: "bithynia-nicomedia", start: [30.01852, 40.70688], end: [29.99643, 40.72103] },
  { caseId: "B-08", provinceId: "bithynia-nicomedia", start: [30.02342, 40.70087], end: [30.06008, 40.71516] },
  { caseId: "B-09", provinceId: "bithynia-nicaea", start: [29.91915, 40.71851], end: [29.88817, 40.72993] },
];
const SAMPLE_COUNT = 64;
const FINAL_EDGE_SAMPLE_COUNT = 64;
const MAX_EDGE_REPAIR_DEPTH = 12;
const EPS = 1e-7;
const interpolate = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const edgeInvalids = (edge, predicate) => Array.from({ length: SAMPLE_COUNT + 1 }, (_, i) => i / SAMPLE_COUNT).map((t) => ({ fraction: t, point: interpolate(edge.start, edge.end, t) })).filter(({ point }) => !predicate(point));
const area = (poly) => Math.abs(poly.reduce((s, p, i) => { const q = poly[(i + 1) % poly.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

async function instrumentV15() {
  const sourcePath = path.join(V15_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const marker = "function buildPartition(sites, weights) {";
  const injected = source.replace(marker, "export { powerCell, repairPhysicalEdge, normalizePhysicalBoundary, edgeOnPhysicalLand, isPhysicalGeometryBoundaryPoint, resolvePhysicalGeometryBoundaryPoint };\n\n" + marker);
  assert.notEqual(injected, source, "V15 instrumentation failed");
  const temp = path.join(path.dirname(sourcePath), `.b-c4-v15.${process.pid}.mjs`);
  fs.writeFileSync(temp, injected, "utf8");
  try { return await import(`file://${temp}?c4=${process.pid}`); } finally { fs.rmSync(temp, { force: true }); }
}

function captureCanonical() {
  const sourcePath = path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const marker = "  const polygonsByProvince = Object.fromEntries(\n";
  const injected = source.replace(marker, "  globalThis.__C4_SITES = sites.map((site) => ({ ...site, point: [...site.point] }));\n  globalThis.__C4_RECORDS = [];\n\n" + marker).replace("    const cell = buildVoronoiCell(siteIndex, sites);\n", "    const cell = buildVoronoiCell(siteIndex, sites);\n    globalThis.__C4_RECORDS.push({ siteIndex, site: sites[siteIndex], cell });\n");
  assert.notEqual(injected, source, "canonical instrumentation failed");
  const temp = path.join(path.dirname(sourcePath), `.b-c4-canonical.${process.pid}.mjs`);
  fs.writeFileSync(temp, injected, "utf8");
  try {
    const code = `import * as m from ${JSON.stringify(`file://${temp}?c4=${process.pid}`)}; m.buildAnatoliaPhase2DAssets([]); process.stdout.write(JSON.stringify({sites:globalThis.__C4_SITES??[],records:globalThis.__C4_RECORDS??[]}));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    if (child.status !== 0) throw new Error(child.stderr || `canonical capture exited ${child.status}`);
    return JSON.parse(child.stdout);
  } finally { fs.rmSync(temp, { force: true }); }
}

function diagnoseRepair(edge, v15) {
  const stats = { calls: 0, successLeaves: 0, depthLimit: 0, resolverNull: 0, endpointCollapse: 0, invalidEdgeLeaves: 0, maxDepthReached: 0 };
  const resolverSamples = [];
  const progress = [];
  function edgeIsPhysical(start, end) {
    for (let index = 0; index <= FINAL_EDGE_SAMPLE_COUNT; index += 1) {
      if (!v15.isPhysicalGeometryBoundaryPoint(interpolate(start, end, index / FINAL_EDGE_SAMPLE_COUNT))) return false;
    }
    return true;
  }
  function walk(start, end, depth) {
    stats.calls += 1;
    stats.maxDepthReached = Math.max(stats.maxDepthReached, depth);
    const segmentLength = dist(start, end);
    if (edgeIsPhysical(start, end)) { stats.successLeaves += 1; return true; }
    if (depth >= MAX_EDGE_REPAIR_DEPTH) { stats.depthLimit += 1; progress.push({ depth, status: "depth-limit", start, end, segmentLength }); return false; }
    let invalidFraction = null;
    for (let index = 1; index < FINAL_EDGE_SAMPLE_COUNT; index += 1) {
      const fraction = index / FINAL_EDGE_SAMPLE_COUNT;
      if (!v15.isPhysicalGeometryBoundaryPoint(interpolate(start, end, fraction))) { invalidFraction = fraction; break; }
    }
    if (invalidFraction === null) { stats.successLeaves += 1; return true; }
    const sample = interpolate(start, end, invalidFraction);
    const boundary = v15.resolvePhysicalGeometryBoundaryPoint(sample);
    const resolved = boundary ? boundary.map((value) => Number(value.toFixed(7))) : null;
    const leftLength = resolved ? dist(start, resolved) : null;
    const rightLength = resolved ? dist(resolved, end) : null;
    progress.push({ depth, status: boundary ? "resolved" : "resolver-null", start, end, segmentLength, invalidFraction, sample, boundary, resolved, leftLength, rightLength, maxChildLength: resolved ? Math.max(leftLength, rightLength) : null, progressRatio: resolved ? Math.max(leftLength, rightLength) / segmentLength : null });
    if (resolverSamples.length < 20) resolverSamples.push({ depth, fraction: invalidFraction, sample, boundary });
    if (!boundary) { stats.resolverNull += 1; return false; }
    if (dist(resolved, start) <= EPS || dist(resolved, end) <= EPS) { stats.endpointCollapse += 1; return false; }
    const left = walk(start, resolved, depth + 1);
    const right = walk(resolved, end, depth + 1);
    if (!left || !right) return false;
    return true;
  }
  const result = walk(edge.start, edge.end, 0);
  return { result, stats, resolverSamples, progress };
}

const v15 = await instrumentV15();
const canonical = captureCanonical();
const sites = canonical.sites;
assert.equal(sites.length, 5633, "Unexpected canonical site count");
const zeroWeights = Object.fromEntries(sites.map((s, i) => [s.provinceId ?? `__site_${i}`, 0]));
const nearest = (point) => sites.map((site, index) => ({ index, d: dist(point, site.point) })).sort((a, b) => a.d - b.d).slice(0, 2).map((x) => x.index);
const recordByIndex = new Map(canonical.records.map((r) => [r.siteIndex, r]));

const rows = FAILURE_EDGES.map((edge) => {
  const mid = interpolate(edge.start, edge.end, 0.5);
  const supportInvalid = edgeInvalids(edge, v15.isPhysicalGeometryBoundaryPoint);
  let repair = null; let repairError = null;
  try { repair = v15.repairPhysicalEdge(edge.start, edge.end); } catch (e) { repairError = e?.message ?? String(e); }
  const resolvedStart = v15.resolvePhysicalGeometryBoundaryPoint(edge.start);
  const resolvedEnd = v15.resolvePhysicalGeometryBoundaryPoint(edge.end);
  const diagnostic = diagnoseRepair(edge, v15);
  const candidateCells = nearest(mid).map((siteIndex) => {
    const raw = recordByIndex.get(siteIndex)?.cell ?? [];
    const cell = v15.powerCell(siteIndex, sites, zeroWeights);
    let normalized = null; let normalizeError = null;
    try { normalized = v15.normalizePhysicalBoundary(raw); } catch (e) { normalizeError = e?.message ?? String(e); }
    return { siteIndex, site: sites[siteIndex], canonicalRawArea: area(raw), v15RawArea: area(cell), normalizedArea: normalized ? area(normalized) : 0, normalizedVertexCount: normalized?.length ?? 0, normalizedAccepted: Boolean(normalized && v15.edgeOnPhysicalLand(normalized)), normalizeError };
  });
  return { ...edge, midpoint: mid, supportInvalidSamples: supportInvalid.length, firstSupportInvalid: supportInvalid[0] ?? null, resolvedStart, resolvedEnd, endpointResolutionSucceeded: Boolean(resolvedStart && resolvedEnd), v15RepairSucceeded: Boolean(repair), v15RepairVertexCount: repair?.length ?? 0, v15RepairError: repairError, repairDiagnostic: diagnostic, candidateCells };
});

const summary = {
  phase: "B-C4 — Nicomedia/Nicaea final physical-edge replay",
  canonicalSiteCount: sites.length,
  failureEdgeCount: rows.length,
  v15RepairSucceededCount: rows.filter((r) => r.v15RepairSucceeded).length,
  v15RepairFailedCount: rows.filter((r) => !r.v15RepairSucceeded).length,
  endpointResolutionSucceededCount: rows.filter((r) => r.endpointResolutionSucceeded).length,
  rows,
};
console.log(JSON.stringify(summary, null, 2));
