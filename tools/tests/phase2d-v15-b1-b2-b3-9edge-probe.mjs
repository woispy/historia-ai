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
const TOPOLOGY_TOLERANCE = 2e-6;
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
function endpointMatch(a, b) {
  return (dist(a[0], b[0]) <= TOPOLOGY_TOLERANCE && dist(a[1], b[1]) <= TOPOLOGY_TOLERANCE)
    || (dist(a[0], b[1]) <= TOPOLOGY_TOLERANCE && dist(a[1], b[0]) <= TOPOLOGY_TOLERANCE);
}
function segmentCollinearWith(a, b, c, d) {
  const cross = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  return Math.abs(cross(a, b, c)) <= TOPOLOGY_TOLERANCE && Math.abs(cross(a, b, d)) <= TOPOLOGY_TOLERANCE;
}
function findExactEdge(edge, polygon) {
  for (let index = 0; index < polygon.length; index += 1) {
    const candidate = [polygon[index], polygon[(index + 1) % polygon.length]];
    if (endpointMatch(edge.start, edge.end, candidate[0], candidate[1])) return { edgeIndex: index, start: candidate[0], end: candidate[1], exact: true };
  }
  return null;
}
function bisectorResidual(edge, a, b, wa = 0, wb = 0) {
  const c = (b[0] ** 2 + b[1] ** 2 - a[0] ** 2 - a[1] ** 2 + wa - wb);
  const values = [edge.start, edge.end].map((point) => 2 * (b[0] - a[0]) * point[0] + 2 * (b[1] - a[1]) * point[1] - c);
  return Math.max(...values.map((value) => Math.abs(value)));
}
function provenanceCandidates(edge, ownerIndex, sites, weights) {
  const owner = sites[ownerIndex];
  const candidates = [];
  for (let index = 0; index < sites.length; index += 1) {
    if (index === ownerIndex) continue;
    const other = sites[index];
    const residual = bisectorResidual(edge, owner.point, other.point, weights?.[owner.provinceId] ?? 0, weights?.[other.provinceId] ?? 0);
    if (residual <= TOPOLOGY_TOLERANCE) {
      candidates.push({
        neighborIndex: index,
        neighborProvinceId: other.provinceId ?? null,
        neighborKind: other.kind,
        ownerProvinceId: owner.provinceId,
        ownerKind: owner.kind,
        residual,
      });
    }
  }
  return candidates;
}
function locateEdgeInCells(edge, records) {
  const hits = [];
  for (const record of records) {
    const exact = findExactEdge(edge, record.polygon);
    if (exact) {
      hits.push({
        ...record,
        edgeIndex: exact.edgeIndex,
        edge: { p0: exact.start, p1: exact.end },
        match: "exact-output-edge",
      });
    }
  }
  return hits;
}
function locateRawEdgeInPowerCells(edge, records) {
  const hits = [];
  for (const record of records) {
    const exactCell = findExactEdge(edge, record.cell);
    if (exactCell) {
      hits.push({
        ...record,
        edgeIndex: exactCell.edgeIndex,
        edge: { p0: exactCell.start, p1: exactCell.end },
        match: "exact-power-cell-edge",
      });
      continue;
    }
    for (let edgeIndex = 0; edgeIndex < record.cell.length; edgeIndex += 1) {
      const start = record.cell[edgeIndex];
      const end = record.cell[(edgeIndex + 1) % record.cell.length];
      if (segmentCollinearWith(edge.start, edge.end, start, end)
        && dist(edge.start, start) <= TOPOLOGY_TOLERANCE
        && dist(edge.end, end) <= TOPOLOGY_TOLERANCE) {
        hits.push({ ...record, edgeIndex, edge: { p0: start, p1: end }, match: "topology-cell-edge" });
      }
    }
  }
  return hits;
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
  return { ...repair(start, end, 0), trace };
}

async function loadInstrumentedModule(sourcePath, canonical = false) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = "const __B_INSTRUMENT = { sites: null, records: [], rawByProvince: new Map() };\n";
  let instrumented = `${prelude}${source}`;
  if (canonical) {
    instrumented = instrumented.replace(
      "  const sites = [];\n  const seen = new Set();",
      "  const sites = [];\n  const seen = new Set();",
    );
    instrumented = instrumented.replace(
      "  const polygonsByProvince = Object.fromEntries(",
      "  __B_INSTRUMENT.sites = sites;\n  const polygonsByProvince = Object.fromEntries(",
    );
    instrumented = instrumented.replace(
      "    const rounded = roundPolygon(cell);",
      "    const rounded = roundPolygon(cell);\n    if (TARGETS_B_FOR_INSTRUMENT.has(sites[siteIndex].provinceId)) __B_INSTRUMENT.records.push({ provinceId: sites[siteIndex].provinceId, siteIndex, site: sites[siteIndex], cell, polygon: rounded });",
    );
    instrumented = instrumented.replace(
      "export { isPhysicalLandPoint };",
      "export { isPhysicalLandPoint, __B_INSTRUMENT, buildVoronoiCell };",
    );
  } else {
    instrumented = instrumented.replace(
      "    const cell = powerCell(index, sites, weights);",
      "    const cell = powerCell(index, sites, weights);\n    if (TARGETS_B_FOR_INSTRUMENT.has(site.provinceId)) __B_INSTRUMENT.records.push({ provinceId: site.provinceId, siteIndex: index, site, cell });",
    );
    instrumented = instrumented.replace(
      "    const rawPolygon = clipCellToLand(cell, site.point)[0];",
      "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    if (TARGETS_B_FOR_INSTRUMENT.has(site.provinceId)) __B_INSTRUMENT.rawByProvince.set(site.provinceId, rawPolygon ?? null);",
    );
    instrumented = instrumented.replace(
      "export { isPhysicalLandPoint, isPhysicalGeometryBoundaryPoint, resolveGeometryAnchor, resolvePhysicalGeometryBoundaryPoint }",
      "export { isPhysicalLandPoint, isPhysicalGeometryBoundaryPoint, resolveGeometryAnchor, resolvePhysicalGeometryBoundaryPoint }",
    );
    instrumented = instrumented.replace(
      "export { isPhysicalLandPoint };",
      "export { isPhysicalLandPoint, __B_INSTRUMENT, buildControlSites, buildPartition, powerCell };",
    );
  }
  instrumented = `const TARGETS_B_FOR_INSTRUMENT = new Set(${JSON.stringify(TARGETS)});\n${instrumented}`;
  const tempPath = path.join(path.dirname(sourcePath), `.bprobe.${canonical ? "canonical" : "v15"}.${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    return await import(`file://${tempPath}?v=${process.pid}-${canonical ? "c" : "v"}`);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

async function collectCanonicalProvenance() {
  const sourcePath = path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const mod = await loadInstrumentedModule(sourcePath, true);
  try { mod.buildAnatoliaPhase2DAssets(); } catch {}
  return mod.__B_INSTRUMENT;
}
async function collectV15Provenance() {
  const sourcePath = path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const mod = await loadInstrumentedModule(sourcePath, false);
  const sites = mod.buildControlSites();
  const weights = Object.fromEntries(sites.map((site) => [site.provinceId, 0]));
  try { mod.buildPartition(sites, weights); } catch {}
  return { ...mod.__B_INSTRUMENT, sites, weights };
}

const canonical = await import(`file://${CANONICAL_ROOT}/tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`);
const v15 = await import("../historical-gis/recovery/physical-land-authority.mjs");
const canonicalProv = await collectCanonicalProvenance();
const v15Prov = await collectV15Provenance();

const canonicalTargetRecords = canonicalProv.records.filter((record) => TARGETS.includes(record.provinceId));
const v15TargetRecords = v15Prov.records.filter((record) => TARGETS.includes(record.provinceId));
assert.ok(canonicalTargetRecords.length > 0, "Missing canonical target cell records");
assert.ok(v15TargetRecords.length > 0, "Missing V15 target cell records");

const matrix = FAILURE_EDGES.map((edge, caseIndex) => {
  const canonicalHits = locateEdgeInCells(edge, canonicalTargetRecords.filter((record) => record.provinceId === edge.provinceId));
  const canonicalOwner = canonicalHits[0] ?? null;
  const canonicalNeighborCandidates = canonicalOwner
    ? provenanceCandidates(canonicalOwner.edge, canonicalOwner.siteIndex, canonicalProv.sites ?? [], {})
    : [];

  const v15ExactPowerHits = locateRawEdgeInPowerCells(edge, v15TargetRecords);
  const v15ProvinceRecord = v15TargetRecords.find((record) => record.provinceId === edge.provinceId) ?? null;
  const v15SameProvinceRaw = v15Prov.rawByProvince.get(edge.provinceId) ?? null;
  const v15RawExact = v15SameProvinceRaw ? findExactEdge(edge, v15SameProvinceRaw) : null;
  const v15NeighborCandidates = v15ProvinceRecord
    ? provenanceCandidates(edge, v15ProvinceRecord.siteIndex, v15Prov.sites, v15Prov.weights)
    : [];

  const canonicalFirstInvalid = firstInvalid(edge, canonical.isPhysicalLandPoint);
  const v15FirstInvalid = firstInvalid(edge, v15.isPhysicalGeometryBoundaryPoint);
  const b1Repair = repairPhysicalEdge(edge.start, edge.end, v15);
  const b2Edge = v15RawExact ? { start: v15RawExact.start, end: v15RawExact.end } : edge;
  const b2Repair = repairPhysicalEdge(b2Edge.start, b2Edge.end, v15);
  const authorityProbePoint = canonicalFirstInvalid?.point ?? edge.start;
  const canonicalAuthority = canonical.isPhysicalLandPoint(authorityProbePoint);
  const v15Authority = v15.isPhysicalGeometryBoundaryPoint(authorityProbePoint);
  const b3 = {
    point: authorityProbePoint,
    canonical: { result: canonicalAuthority, classification: classify(authorityProbePoint, canonical) },
    v15: { result: v15Authority, classification: classify(authorityProbePoint, v15) },
    divergence: canonicalAuthority !== v15Authority,
  };

  const canonicalProvenance = canonicalOwner ? {
    owner: { siteIndex: canonicalOwner.siteIndex, provinceId: canonicalOwner.site.provinceId, kind: canonicalOwner.site.kind, point: canonicalOwner.site.point },
    edgeIndex: canonicalOwner.edgeIndex,
    neighborCandidates: canonicalNeighborCandidates,
  } : null;
  const v15Provenance = v15ProvinceRecord ? {
    owner: { siteIndex: v15ProvinceRecord.siteIndex, provinceId: v15ProvinceRecord.site.provinceId, kind: v15ProvinceRecord.site.kind, point: v15ProvinceRecord.site.point },
    rawPolygonEdge: v15RawExact ? { edgeIndex: v15RawExact.edgeIndex, p0: v15RawExact.start, p1: v15RawExact.end } : null,
    exactPowerCellHits: v15ExactPowerHits.map((hit) => ({ siteIndex: hit.siteIndex, provinceId: hit.provinceId, kind: hit.site.kind, edgeIndex: hit.edgeIndex, edge: hit.edge, match: hit.match })),
    neighborCandidates: v15NeighborCandidates,
  } : null;

  const canonicalNeighborProvinceIds = [...new Set(canonicalNeighborCandidates.map((candidate) => candidate.neighborProvinceId).filter(Boolean))];
  const v15NeighborProvinceIds = [...new Set(v15NeighborCandidates.map((candidate) => candidate.neighborProvinceId).filter(Boolean))];
  const topologyDivergence = canonicalNeighborProvinceIds.length > 0
    && v15NeighborProvinceIds.length > 0
    && !canonicalNeighborProvinceIds.some((id) => v15NeighborProvinceIds.includes(id));
  const seedDivergence = canonicalOwner && v15ProvinceRecord
    ? canonicalOwner.site.provinceId !== v15ProvinceRecord.site.provinceId || canonicalOwner.site.kind !== v15ProvinceRecord.site.kind
    : true;
  const geometryDivergence = !v15RawExact;

  return {
    caseId: `B-${String(caseIndex + 1).padStart(2, "0")}`,
    provinceId: edge.provinceId,
    edgeId: `${edge.provinceId}:edge-${edge.edgeIndex}:${edge.start.join(",")}→${edge.end.join(",")}`,
    canonicalEdge: { p0: edge.start, p1: edge.end, length: dist(edge.start, edge.end) },
    canonicalProvenance,
    v15Provenance,
    canonicalFirstInvalid,
    v15FirstInvalid,
    b1: { authority: "V15 physical geometry boundary", firstInvalid: firstInvalid(edge, v15.isPhysicalGeometryBoundaryPoint), repair: b1Repair },
    b2: { authority: "V15 physical geometry boundary", firstInvalid: firstInvalid(b2Edge, v15.isPhysicalGeometryBoundaryPoint), repair: b2Repair },
    b3,
    resolver: v15FirstInvalid ? v15.resolvePhysicalGeometryBoundaryPoint(v15FirstInvalid.point) : null,
    recursionDepth: { b1: b1Repair.depth, b2: b2Repair.depth },
    finalEdgeResult: { b1: b1Repair.ok, b2: b2Repair.ok },
    divergence: {
      GEOMETRY_DIVERGENCE: geometryDivergence,
      AUTHORITY_DIVERGENCE: b3.divergence,
      SEED_DIVERGENCE: seedDivergence,
      TOPOLOGY_DIVERGENCE: topologyDivergence,
    },
  };
});

const summary = {
  phase: "B — Nicomedia/Nicaea cross-geometry divergence — calibrated provenance/topology probe",
  targets: { nicomedia: 8, nicaea: 1, total: 9 },
  sampleCount: SAMPLE_COUNT,
  maxRepairDepth: MAX_DEPTH,
  topologyTolerance: TOPOLOGY_TOLERANCE,
  canonicalTargetSiteCount: canonicalTargetRecords.length,
  v15TargetSiteCount: v15TargetRecords.length,
  v15RawPolygons: Object.fromEntries(TARGETS.map((id) => [id, { vertexCount: (v15Prov.rawByProvince.get(id) ?? []).length, area: v15Prov.rawByProvince.get(id) ? area(v15Prov.rawByProvince.get(id)) : null }])),
  classifications: matrix.reduce((acc, row) => {
    for (const [key, value] of Object.entries(row.divergence)) if (value) acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}),
  matrix,
};

console.log(JSON.stringify(summary, null, 2));
