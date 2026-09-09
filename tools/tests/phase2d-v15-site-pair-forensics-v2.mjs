import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");

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

const STRICT_TOLERANCE = 2e-6;
const RELAXED_TOLERANCE = 2e-5;
const CELL_MARGIN_TOLERANCE = 2e-7;
const MAX_REPORTED_CANDIDATES = 12;

function squaredDistance(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function interpolate(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function midpoint(a, b) {
  return interpolate(a, b, 0.5);
}

function bisectorResidual(edge, a, b, wa = 0, wb = 0) {
  const c = b[0] ** 2 + b[1] ** 2 - a[0] ** 2 - a[1] ** 2 + wa - wb;
  const values = [edge.start, edge.end].map((point) =>
    2 * (b[0] - a[0]) * point[0] + 2 * (b[1] - a[1]) * point[1] - c);
  return Math.max(...values.map(Math.abs));
}

function powerValue(point, site, weight) {
  return squaredDistance(point, site.point) - weight;
}

function pairSupportsSegment(edge, i, j, sites, weights, marginTolerance) {
  const a = sites[i];
  const b = sites[j];
  const samples = [0, 0.5, 1].map((t) => interpolate(edge.start, edge.end, t));
  for (const point of samples) {
    const va = powerValue(point, a, weights.get(a.provinceId) ?? 0);
    const vb = powerValue(point, b, weights.get(b.provinceId) ?? 0);
    if (va > vb + marginTolerance || vb > va + marginTolerance) return false;
    for (let k = 0; k < sites.length; k += 1) {
      if (k === i || k === j) continue;
      const other = sites[k];
      const vo = powerValue(point, other, weights.get(other.provinceId) ?? 0);
      if (va > vo + marginTolerance || vb > vo + marginTolerance) return false;
    }
  }
  return true;
}

function pairDescriptor(i, j, sites, weights, residual, supportsSegment, toleranceClass) {
  const a = sites[i];
  const b = sites[j];
  return {
    siteA: { index: i, provinceId: a.provinceId ?? null, kind: a.kind ?? null, point: a.point },
    siteB: { index: j, provinceId: b.provinceId ?? null, kind: b.kind ?? null, point: b.point },
    weights: { siteA: weights.get(a.provinceId) ?? 0, siteB: weights.get(b.provinceId) ?? 0 },
    residual,
    supportsSegment,
    toleranceClass,
  };
}

function enumeratePairs(edge, sites, weights, tolerance) {
  const candidates = [];
  for (let i = 0; i < sites.length; i += 1) {
    for (let j = i + 1; j < sites.length; j += 1) {
      const a = sites[i].point;
      const b = sites[j].point;
      if (a[0] === b[0] && a[1] === b[1]) continue;
      const residual = bisectorResidual(edge, a, b, weights.get(sites[i].provinceId) ?? 0, weights.get(sites[j].provinceId) ?? 0);
      if (residual > tolerance) continue;
      const supportsSegment = pairSupportsSegment(edge, i, j, sites, weights, CELL_MARGIN_TOLERANCE);
      candidates.push(pairDescriptor(i, j, sites, weights, residual, supportsSegment, tolerance === STRICT_TOLERANCE ? "strict" : "relaxed"));
    }
  }
  candidates.sort((x, y) => Number(x.supportsSegment) - Number(y.supportsSegment) || x.residual - y.residual);
  return candidates.slice(0, MAX_REPORTED_CANDIDATES);
}

function groupProvincePair(candidate) {
  return [candidate.siteA.provinceId, candidate.siteB.provinceId].sort().join("↔");
}

async function loadCanonicalSites() {
  const sourcePath = path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const marker = "  const polygonsByProvince = Object.fromEntries(";
  assert.ok(source.includes(marker), "Canonical instrumentation marker missing");
  const tempPath = path.join(os.tmpdir(), `historia-b-sitepair-canonical-${process.pid}.mjs`);
  const instrumented = `${source.replace(
    marker,
    `  globalThis.__SITEPAIR_SITES = sites;\n${marker}`,
  )}\nexport const __SITEPAIR_GET_SITES = () => globalThis.__SITEPAIR_SITES;\n`;
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    const mod = await import(`file://${tempPath}?sitepair=${process.pid}`);
    try { mod.buildAnatoliaPhase2DAssets(); } catch {}
    const sites = mod.__SITEPAIR_GET_SITES();
    assert.ok(Array.isArray(sites) && sites.length > 0, "Canonical site list was not captured");
    return sites;
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

async function loadV15SitesAndWeights() {
  const sourcePath = path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const marker = "function buildPartition(sites, weights) {";
  assert.ok(source.includes(marker), "V15 instrumentation marker missing");
  const tempPath = path.join(os.tmpdir(), `historia-b-sitepair-v15-${process.pid}.mjs`);
  const instrumented = `${source.replace(
    marker,
    `${marker}\n  globalThis.__SITEPAIR_V15_SITES = sites;\n  globalThis.__SITEPAIR_V15_WEIGHTS = { ...weights };`,
  )}\nexport const __SITEPAIR_GET = () => ({ sites: globalThis.__SITEPAIR_V15_SITES, weights: globalThis.__SITEPAIR_V15_WEIGHTS });\n`;
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    const mod = await import(`file://${tempPath}?sitepair=${process.pid}`);
    try { mod.buildAnatoliaPhase2DAssets(); } catch {}
    const captured = mod.__SITEPAIR_GET();
    assert.ok(Array.isArray(captured.sites) && captured.sites.length > 0, "V15 site list was not captured");
    assert.ok(captured.weights && typeof captured.weights === "object", "V15 weights were not captured");
    return { sites: captured.sites, weights: new Map(Object.entries(captured.weights)) };
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const canonicalSites = await loadCanonicalSites();
const v15 = await loadV15SitesAndWeights();
const canonicalWeights = new Map(canonicalSites.filter((site) => site.provinceId).map((site) => [site.provinceId, 0]));

const matrix = FAILURE_EDGES.map((edge) => {
  const canonicalStrict = enumeratePairs(edge, canonicalSites, canonicalWeights, STRICT_TOLERANCE);
  const canonicalRelaxed = enumeratePairs(edge, canonicalSites, canonicalWeights, RELAXED_TOLERANCE);
  const v15Strict = enumeratePairs(edge, v15.sites, v15.weights, STRICT_TOLERANCE);
  const v15Relaxed = enumeratePairs(edge, v15.sites, v15.weights, RELAXED_TOLERANCE);

  const canonicalPhysical = canonicalStrict.filter((candidate) => candidate.supportsSegment);
  const v15Physical = v15Strict.filter((candidate) => candidate.supportsSegment);
  const canonicalProvincePairs = [...new Set(canonicalPhysical.map(groupProvincePair))];
  const v15ProvincePairs = [...new Set(v15Physical.map(groupProvincePair))];
  const commonProvincePairs = canonicalProvincePairs.filter((pair) => v15ProvincePairs.includes(pair));

  let provenanceStatus = "PROVENANCE_UNRESOLVED";
  if (canonicalPhysical.length === 1 && v15Physical.length === 1 && commonProvincePairs.length === 1) provenanceStatus = "PROVENANCE_RESOLVED_UNIQUE";
  else if (canonicalPhysical.length > 0 || v15Physical.length > 0) provenanceStatus = "PROVENANCE_RESOLVED_AMBIGUOUS";

  return {
    id: edge.id,
    provinceId: edge.provinceId,
    edge: { start: edge.start, end: edge.end },
    canonical: {
      siteCount: canonicalSites.length,
      strictCandidates: canonicalStrict,
      relaxedCandidates: canonicalRelaxed,
      strictSupportingCandidates: canonicalPhysical,
    },
    v15: {
      siteCount: v15.sites.length,
      weightEntries: v15.weights.size,
      strictCandidates: v15Strict,
      relaxedCandidates: v15Relaxed,
      strictSupportingCandidates: v15Physical,
    },
    topology: {
      canonicalProvincePairs,
      v15ProvincePairs,
      commonProvincePairs,
      provenanceStatus,
    },
  };
});

const summary = {
  failureEdgeCount: matrix.length,
  canonicalSiteCount: canonicalSites.length,
  v15SiteCount: v15.sites.length,
  uniqueResolved: matrix.filter((item) => item.topology.provenanceStatus === "PROVENANCE_RESOLVED_UNIQUE").length,
  ambiguous: matrix.filter((item) => item.topology.provenanceStatus === "PROVENANCE_RESOLVED_AMBIGUOUS").length,
  unresolved: matrix.filter((item) => item.topology.provenanceStatus === "PROVENANCE_UNRESOLVED").length,
  commonProvincePairCount: matrix.filter((item) => item.topology.commonProvincePairs.length > 0).length,
  canonicalStrictSupportingCount: matrix.filter((item) => item.canonical.strictSupportingCandidates.length > 0).length,
  v15StrictSupportingCount: matrix.filter((item) => item.v15.strictSupportingCandidates.length > 0).length,
};

console.log(JSON.stringify({ schemaVersion: 2, summary, matrix }, null, 2));
