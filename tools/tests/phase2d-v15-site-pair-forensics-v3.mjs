import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");

const TARGETS = new Set(["bithynia-nicomedia", "bithynia-nicaea"]);
const FAILURE_EDGES = [
  { id: "B-01", provinceId: "bithynia-nicomedia", start: [29.87953, 40.72476], end: [29.88817, 40.72993] },
  { id: "B-02", provinceId: "bithynia-nicomedia", start: [29.88817, 40.72993], end: [29.91915, 40.71851] },
  { id: "B-03", provinceId: "bithynia-nicomedia", start: [29.94879, 40.71649], end: [29.96697, 40.7418] },
  { id: "B-04", provinceId: "bithynia-nicomedia", start: [29.87953, 40.72476], end: [29.85423, 40.7623] },
  { id: "B-05", provinceId: "bithynia-nicomedia", start: [29.96697, 40.7418], end: [29.94879, 40.71649] },
  { id: "B-06", provinceId: "bithynia-nicomedia", start: [29.99643, 40.72103], end: [30.01852, 40.70688] },
  { id: "B-07", provinceId: "bithynia-nicomedia", start: [30.01852, 40.70688], end: [29.99643, 40.72103] },
  { id: "B-08", provinceId: "bithynia-nicomedia", start: [30.02342, 40.70087], end: [30.06008, 40.71516] },
  { id: "B-09", provinceId: "bithynia-nicaea", start: [29.91915, 40.71851], end: [29.88817, 40.72993] },
];

const EDGE_TOLERANCE = 2e-6;
const LINE_TOLERANCE = 3e-6;
const POINT_TOLERANCE = 3e-6;

function distance(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
function cross(a, b, p) { return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]); }
function endpointPairMatch(a, b, c, d) {
  return (distance(a, c) <= EDGE_TOLERANCE && distance(b, d) <= EDGE_TOLERANCE)
    || (distance(a, d) <= EDGE_TOLERANCE && distance(b, c) <= EDGE_TOLERANCE);
}
function pointOnSegment(point, start, end, tolerance = POINT_TOLERANCE) {
  const length = distance(start, end);
  if (length <= tolerance) return distance(point, start) <= tolerance;
  if (Math.abs(cross(start, end, point)) > tolerance * Math.max(1, length)) return false;
  const dot = (point[0] - start[0]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[0] - start[0]) + (point[1] - start[1]) * (end[1] - start[1]);
  return dot >= -tolerance && dot <= length * length + tolerance;
}
function edgeLineResidual(edge, a, b) {
  const A = 2 * (b[0] - a[0]);
  const B = 2 * (b[1] - a[1]);
  const C = b[0] ** 2 + b[1] ** 2 - a[0] ** 2 - a[1] ** 2;
  return Math.max(
    Math.abs(A * edge.start[0] + B * edge.start[1] - C),
    Math.abs(A * edge.end[0] + B * edge.end[1] - C),
  );
}
function finalEdgeHits(edge, records) {
  const hits = [];
  for (const record of records) {
    for (let edgeIndex = 0; edgeIndex < record.polygon.length; edgeIndex += 1) {
      const start = record.polygon[edgeIndex];
      const end = record.polygon[(edgeIndex + 1) % record.polygon.length];
      if (endpointPairMatch(edge.start, edge.end, start, end)) {
        hits.push({ record, edgeIndex, outputEdge: { start, end }, match: "exact-rounded-edge" });
      }
    }
  }
  return hits;
}
function traceCandidates(edge, record) {
  const candidates = [];
  for (const step of record.clipTrace) {
    const residual = edgeLineResidual(edge, step.site.point, step.other.point);
    if (residual > LINE_TOLERANCE) continue;
    const segments = [];
    for (let i = 0; i < step.after.length; i += 1) {
      const start = step.after[i];
      const end = step.after[(i + 1) % step.after.length];
      if (pointOnSegment(edge.start, start, end) && pointOnSegment(edge.end, start, end)) {
        segments.push({ start, end });
      }
    }
    candidates.push({
      otherIndex: step.otherIndex,
      other: step.other,
      residual,
      beforeVertexCount: step.before.length,
      afterVertexCount: step.after.length,
      matchingSegments: segments,
      changed: step.changed,
      stepIndex: step.stepIndex,
    });
  }
  return candidates;
}

async function loadInstrumentedCanonical(sourcePath) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `
const __V3 = { sites: null, cells: [], active: null };
`;
  let instrumented = `${prelude}${source}`;
  instrumented = instrumented.replace(
    "function clipHalfPlane(polygon, a, b, c) {\n  if (!polygon.length) return [];",
    `function clipHalfPlane(polygon, a, b, c) {
  const __trace = __V3.active;
  const __before = polygon.map((point) => [...point]);
  if (!polygon.length) return [];
  const __otherPoint = __trace?.otherPoint ?? null;`,
  );
  instrumented = instrumented.replace(
    "  return output;\n}\n\nfunction buildVoronoiCell(siteIndex, sites) {",
    `  if (__trace) {
    __trace.clipTrace.push({
      stepIndex: __trace.clipTrace.length,
      otherIndex: __trace.otherIndex,
      site: { point: [...__trace.site.point], provinceId: __trace.site.provinceId ?? null, kind: __trace.site.kind },
      other: __otherPoint ? { point: [...__otherPoint.point], provinceId: __otherPoint.provinceId ?? null, kind: __otherPoint.kind } : null,
      a, b, c,
      before: __before,
      after: output.map((point) => [...point]),
      changed: JSON.stringify(__before) !== JSON.stringify(output),
    });
  }
  return output;
}

function buildVoronoiCell(siteIndex, sites) {`,
  );
  instrumented = instrumented.replace(
    "  const site = sites[siteIndex].point;",
    `  const siteRecord = sites[siteIndex];
  const site = siteRecord.point;
  __V3.sites = sites;
  const __trace = { site: siteRecord, otherIndex: null, otherPoint: null, clipTrace: [] };
  __V3.active = __trace;`,
  );
  instrumented = instrumented.replace(
    "    const other = sites[otherIndex].point;",
    `    const otherRecord = sites[otherIndex];
    const other = otherRecord.point;
    __trace.otherIndex = otherIndex;
    __trace.otherPoint = otherRecord;`,
  );
  instrumented = instrumented.replace(
    "  return polygon;\n}\n\nfunction roundPolygon(polygon) {",
    `  if (TARGETS.has(siteRecord.provinceId)) {
    __V3.cells.push({
      siteIndex,
      site: { point: [...siteRecord.point], provinceId: siteRecord.provinceId ?? null, kind: siteRecord.kind },
      polygon: polygon.map((point) => [...point]),
      clipTrace: __trace.clipTrace,
    });
  }
  __V3.active = null;
  return polygon;
}

function roundPolygon(polygon) {`,
  );
  instrumented = instrumented.replace(
    "export { isPhysicalLandPoint };",
    "export { __V3 };",
  );
  instrumented = `const TARGETS = new Set(${JSON.stringify([...TARGETS])});\n${instrumented}`;
  const tempPath = path.join(path.dirname(sourcePath), `.v3-canonical.${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    return await import(`file://${tempPath}?v3=${process.pid}`);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const canonicalPath = path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
const canonical = await loadInstrumentedCanonical(canonicalPath);
canonical.buildAnatoliaPhase2DAssets();

const targetCells = canonical.__V3.cells;
assert.ok(targetCells.length > 0, "Canonical instrumentation captured no target cells");

const matrix = FAILURE_EDGES.map((edge) => {
  const roundedCells = targetCells.map((cell) => ({
    ...cell,
    polygon: cell.polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]),
  }));
  const hits = finalEdgeHits(edge, roundedCells);
  const provenance = [];
  for (const hit of hits) {
    const candidates = traceCandidates(edge, hit.record);
    for (const candidate of candidates) {
      provenance.push({
        owner: hit.record.site,
        neighborIndex: candidate.otherIndex,
        neighbor: candidate.other,
        outputEdgeIndex: hit.edgeIndex,
        residual: candidate.residual,
        matchingSegments: candidate.matchingSegments,
        clipStepIndex: candidate.stepIndex,
        clipBeforeVertexCount: candidate.beforeVertexCount,
        clipAfterVertexCount: candidate.afterVertexCount,
        clipChanged: candidate.changed,
      });
    }
  }
  const uniqueKeys = new Set(provenance.map((item) => `${item.owner?.provinceId}:${item.owner?.kind}:${item.owner?.neighborIndex}:${item.clipStepIndex}`));
  const status = provenance.length === 1 ? "PROVENANCE_RESOLVED_UNIQUE"
    : provenance.length > 1 ? "PROVENANCE_RESOLVED_AMBIGUOUS"
      : "PROVENANCE_UNRESOLVED";
  return {
    id: edge.id,
    provinceId: edge.provinceId,
    edge,
    finalEdgeHitCount: hits.length,
    provenanceStatus: status,
    uniqueProvenanceCount: uniqueKeys.size,
    provenance,
  };
});

console.log(JSON.stringify({
  schema: "phase2d-v15-site-pair-forensics-v3",
  canonicalBaseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
  targetCellCount: targetCells.length,
  targetSiteCount: canonical.__V3.sites?.filter((site) => TARGETS.has(site.provinceId)).length ?? 0,
  matrix,
}, null, 2));
