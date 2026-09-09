import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");

const TARGETS = ["bithynia-nicomedia", "bithynia-nicaea"];
const FAILURE_EDGES = [
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.87953, 40.72476], end: [29.88817, 40.72993] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.88817, 40.72993], end: [29.91915, 40.71851] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 0, start: [29.94879, 40.71649], end: [29.96697, 40.7418] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 2, start: [29.87953, 40.72476], end: [29.85423, 40.7623] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [29.96697, 40.7418], end: [29.94879, 40.71649] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [29.99643, 40.72103], end: [30.01852, 40.70688] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 3, start: [30.01852, 40.70688], end: [29.99643, 40.72103] },
  { provinceId: "bithynia-nicomedia", edgeIndex: 1, start: [30.02342, 40.70087], end: [30.06008, 40.71516] },
  { provinceId: "bithynia-nicaea", edgeIndex: 0, start: [29.91915, 40.71851], end: [29.88817, 40.72993] },
];

const SAMPLE_COUNT = 64;
const EPS = 1e-7;
const MAX_DEPTH = 12;

function dist(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
function area(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const n = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * n[1] - n[0] * polygon[i][1];
  }
  return Math.abs(sum) / 2;
}
function interpolate(a, b, fraction) { return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction]; }
function segDistance(point, start, end) {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const d = dx * dx + dy * dy;
  const t = d ? Math.max(0, Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / d)) : 0;
  return dist(point, [start[0] + dx * t, start[1] + dy * t]);
}
function nearestEdge(edge, polygon) {
  let best = null;
  for (let i = 0; i < polygon.length; i += 1) {
    const start = polygon[i];
    const end = polygon[(i + 1) % polygon.length];
    const direct = dist(edge.start, start) + dist(edge.end, end);
    const reverse = dist(edge.start, end) + dist(edge.end, start);
    const score = Math.min(direct, reverse);
    if (!best || score < best.score) best = { edgeIndex: i, score, start, end, reversed: reverse < direct };
  }
  return best;
}
function firstInvalid(edge, predicate) {
  for (let index = 0; index <= SAMPLE_COUNT; index += 1) {
    const fraction = index / SAMPLE_COUNT;
    const point = interpolate(edge.start, edge.end, fraction);
    if (!predicate(point)) return { sampleIndex: index, sampleCount: SAMPLE_COUNT, fraction, point };
  }
  return null;
}
function classify(point, authority) {
  const land = authority.isPhysicalLandPoint(point);
  const lake = authority.isLakeInteriorPoint ? authority.isLakeInteriorPoint(point) : false;
  return land ? "land" : lake ? "lake-interior" : "water/invalid";
}

function loadV15Raw() {
  const sourcePath = path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `\nconst __B_RAW = new Map();\n`;
  let instrumented = source.replace("const rawAnchor = (item) =>", `${prelude}\nconst rawAnchor = (item) =>`);
  instrumented = instrumented.replace(
    "    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;",
    "    if (TARGETS_B_FOR_INSTRUMENT.has(site.provinceId)) __B_RAW.set(site.provinceId, rawPolygon ?? null);\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;",
  );
  instrumented = instrumented.replace(
    "    if (!polygon || !edgeOnPhysicalLand(polygon)) throw new Error(`Phase 2D V15 produced invalid physical-land geometry: ${site.provinceId}`);",
    "    if (!polygon || !edgeOnPhysicalLand(polygon)) continue;",
  );
  instrumented = instrumented.replace(
    "export { isPhysicalLandPoint };",
    "export { isPhysicalLandPoint, __B_RAW };",
  );
  instrumented = `const TARGETS_B_FOR_INSTRUMENT = new Set(${JSON.stringify(TARGETS)});\n${instrumented}`;
  const tempPath = path.join(path.dirname(sourcePath), `.AnatoliaPhase2DGeometryBuilderV15.bprobe.${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    return import(`file://${tempPath}`).then(async (mod) => {
      try {
        const sites = mod.buildControlSites ? mod.buildControlSites() : null;
        if (sites) {
          const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0]));
          try { mod.buildPartition(sites, weights); } catch {}
        } else {
          try { mod.buildAnatoliaPhase2DAssets(); } catch {}
        }
        return Object.fromEntries(mod.__B_RAW.entries());
      } finally {
        fs.rmSync(tempPath, { force: true });
      }
    });
  } catch (error) {
    fs.rmSync(tempPath, { force: true });
    throw error;
  }
}

function loadCanonicalAuthority() {
  return import(`file://${CANONICAL_ROOT}/tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`);
}

async function loadV15Authority() {
  return import("../historical-gis/recovery/physical-land-authority.mjs");
}

function repairPhysicalEdge(start, end, authority) {
  const trace = [];
  function repair(a, b, depth) {
    const invalid = firstInvalid({ start: a, end: b }, authority.isPhysicalGeometryBoundaryPoint);
    if (!invalid) return { ok: true, depth, segment: [a, b] };
    trace.push({ depth, start: a, end: b, firstInvalid: invalid });
    if (depth >= MAX_DEPTH) return { ok: false, depth, segment: null };
    const boundary = authority.resolvePhysicalGeometryBoundaryPoint(invalid.point);
    if (!boundary) return { ok: false, depth, segment: null };
    const resolved = boundary.map((value) => Number(value.toFixed(7)));
    if (dist(resolved, a) <= EPS || dist(resolved, b) <= EPS) return { ok: false, depth, segment: null };
    const left = repair(a, resolved, depth + 1);
    const right = repair(resolved, b, depth + 1);
    if (!left.ok || !right.ok) return { ok: false, depth: Math.max(left.depth, right.depth), segment: null };
    return { ok: true, depth: Math.max(left.depth, right.depth), segment: [...left.segment.slice(0, -1), ...right.segment] };
  }
  const result = repair(start, end, 0);
  return { ...result, trace };
}

const canonical = await loadCanonicalAuthority();
const v15 = await loadV15Authority();
const v15Raw = await loadV15Raw();
for (const id of TARGETS) assert.ok(Array.isArray(v15Raw[id]) && v15Raw[id].length >= 3, `Missing V15 raw polygon for ${id}`);

const matrix = FAILURE_EDGES.map((edge, caseIndex) => {
  const rawPolygon = v15Raw[edge.provinceId];
  const matched = nearestEdge(edge, rawPolygon);
  const v15Edge = { start: matched.start, end: matched.end };
  const canonicalFirstInvalid = firstInvalid(edge, canonical.isPhysicalLandPoint);
  const v15FirstInvalid = firstInvalid(v15Edge, v15.isPhysicalGeometryBoundaryPoint);
  const b1Repair = repairPhysicalEdge(edge.start, edge.end, v15);
  const b2Repair = repairPhysicalEdge(v15Edge.start, v15Edge.end, v15);
  const authorityProbePoint = canonicalFirstInvalid?.point ?? edge.start;
  const b3 = {
    point: authorityProbePoint,
    canonical: { result: canonical.isPhysicalLandPoint(authorityProbePoint), classification: classify(authorityProbePoint, canonical) },
    v15: { result: v15.isPhysicalGeometryBoundaryPoint(authorityProbePoint), classification: classify(authorityProbePoint, v15) },
    divergence: canonical.isPhysicalLandPoint(authorityProbePoint) !== v15.isPhysicalGeometryBoundaryPoint(authorityProbePoint),
  };
  return {
    caseId: `B-${String(caseIndex + 1).padStart(2, "0")}`,
    provinceId: edge.provinceId,
    edgeId: `${edge.provinceId}:edge-${edge.edgeIndex}:${edge.start.join(",")}→${edge.end.join(",")}`,
    edgeIndex: edge.edgeIndex,
    canonicalEdge: { p0: edge.start, p1: edge.end, length: dist(edge.start, edge.end) },
    v15RawEdge: { p0: v15Edge.start, p1: v15Edge.end, length: dist(v15Edge.start, v15Edge.end), sourceEdgeIndex: matched.edgeIndex, endpointMatchScore: matched.score, reversed: matched.reversed },
    canonicalFirstInvalid,
    v15FirstInvalid,
    b1: { authority: "V15 physical geometry boundary", firstInvalid: firstInvalid(edge, v15.isPhysicalGeometryBoundaryPoint), repair: b1Repair },
    b2: { authority: "V15 physical geometry boundary", firstInvalid: v15FirstInvalid, repair: b2Repair },
    b3,
    resolver: v15FirstInvalid ? v15.resolvePhysicalGeometryBoundaryPoint(v15FirstInvalid.point) : null,
    recursionDepth: { b1: b1Repair.depth, b2: b2Repair.depth },
    finalEdgeResult: { b1: b1Repair.ok, b2: b2Repair.ok },
  };
});

const summary = {
  phase: "B — Nicomedia/Nicaea cross-geometry divergence",
  targets: { nicomedia: 8, nicaea: 1, total: 9 },
  sampleCount: SAMPLE_COUNT,
  maxRepairDepth: MAX_DEPTH,
  v15RawPolygons: Object.fromEntries(TARGETS.map((id) => [id, { vertexCount: v15Raw[id].length, area: area(v15Raw[id]) }])) ,
  classifications: matrix.reduce((acc, row) => {
    const key = row.b3.divergence ? "AUTHORITY_PROVENANCE_DIVERGENCE" : "NO_AUTHORITY_DIVERGENCE";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}),
  matrix,
};

console.log(JSON.stringify(summary, null, 2));
