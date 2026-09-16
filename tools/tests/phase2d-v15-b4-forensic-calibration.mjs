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
const TOLERANCE = 2e-7;

function area(polygon) {
  let sum = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const next = polygon[(index + 1) % polygon.length];
    sum += polygon[index][0] * next[1] - next[0] * next[1] + next[0] * polygon[index][1] - polygon[index][0] * next[1];
  }
  return Math.abs(sum) / 2;
}

function distance(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
function interpolate(a, b, fraction) { return [a[0] + (b[0] - a[0]) * fraction, a[1] + (b[1] - a[1]) * fraction]; }
function maxVertexDistance(a, b) {
  if (a.length !== b.length) return Infinity;
  return Math.max(...a.map((point, index) => distance(point, b[index])));
}

function classify(point, authority) {
  const land = authority.isPhysicalLandPoint(point);
  const lake = authority.isLakeInteriorPoint ? authority.isLakeInteriorPoint(point) : false;
  return land ? "land" : lake ? "lake-interior" : "water/invalid";
}

function loadInstrumented(sourcePath, mode) {
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `const __B4 = { sites: null, targetCells: new Map() };\n`;
  let instrumented = `${prelude}${source}`;

  if (mode === "canonical") {
    const needle = "  const polygonsByProvince = Object.fromEntries(\n";
    const replacement = "  __B4.sites = sites;\n  const polygonsByProvince = Object.fromEntries(\n";
    assert.ok(instrumented.includes(needle), "Canonical site capture anchor not found");
    instrumented = instrumented.replace(needle, replacement);
    const cellNeedle = "    const rounded = roundPolygon(cell);\n";
    const cellReplacement = "    const rounded = roundPolygon(cell);\n    if (TARGETS_B4.has(sites[siteIndex].provinceId) && !__B4.targetCells.has(sites[siteIndex].provinceId)) __B4.targetCells.set(sites[siteIndex].provinceId, { siteIndex, site: sites[siteIndex], cell, rounded });\n";
    assert.ok(instrumented.includes(cellNeedle), "Canonical cell capture anchor not found");
    instrumented = instrumented.replace(cellNeedle, cellReplacement);
    instrumented = instrumented.replace(
      "export { isPhysicalLandPoint };",
      "export { isPhysicalLandPoint, __B4 };",
    );
  } else {
    instrumented = instrumented.replace(
      "export { isPhysicalLandPoint };",
      "export { isPhysicalLandPoint, powerCell };",
    );
  }

  instrumented = `const TARGETS_B4 = new Set(${JSON.stringify(TARGETS)});\n${instrumented}`;
  const tempPath = path.join(path.dirname(sourcePath), `.b4.${mode}.${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  return { tempPath };
}

async function importInstrumented(sourcePath, mode) {
  const { tempPath } = loadInstrumented(sourcePath, mode);
  try {
    return await import(`file://${tempPath}?b4=${process.pid}-${mode}`);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const canonicalPath = path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
const v15Path = path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const authorityPath = path.resolve("tools/historical-gis/recovery/physical-land-authority.mjs");
const canonical = await importInstrumented(canonicalPath, "canonical");
const v15 = await importInstrumented(v15Path, "v15");
const authority = await import(`file://${authorityPath}?b4-authority=${process.pid}`);

canonical.buildAnatoliaPhase2DAssets();
const canonicalSites = canonical.__B4.sites;
assert.ok(Array.isArray(canonicalSites) && canonicalSites.length > 0, "Canonical site universe was not captured");
const canonicalPoliticalSiteCount = canonicalSites.filter((site) => Boolean(site.provinceId)).length;
assert.equal(canonicalPoliticalSiteCount, 1683, "Canonical full political site universe changed; calibration contract is stale");

const zeroWeights = Object.fromEntries(
  canonicalSites.filter((site) => site.provinceId).map((site) => [site.provinceId, 0]),
);
const canonicalTargetCells = canonical.__B4.targetCells;
const b4A = [];
for (const provinceId of TARGETS) {
  const canonicalRecord = canonicalTargetCells.get(provinceId);
  assert.ok(canonicalRecord, `Missing canonical target cell: ${provinceId}`);
  const v15Cell = v15.powerCell(canonicalRecord.siteIndex, canonicalSites, zeroWeights);
  const result = {
    provinceId,
    canonicalSiteIndex: canonicalRecord.siteIndex,
    site: canonicalRecord.site,
    canonicalVertexCount: canonicalRecord.cell.length,
    v15VertexCount: v15Cell.length,
    canonicalArea: area(canonicalRecord.cell),
    v15Area: area(v15Cell),
    areaDelta: Math.abs(area(canonicalRecord.cell) - area(v15Cell)),
    maxVertexDistance: maxVertexDistance(canonicalRecord.cell, v15Cell),
    equivalent: canonicalRecord.cell.length === v15Cell.length
      && Math.abs(area(canonicalRecord.cell) - area(v15Cell)) <= TOLERANCE
      && maxVertexDistance(canonicalRecord.cell, v15Cell) <= TOLERANCE,
  };
  b4A.push(result);
}

const uniqueEndpoints = new Map();
for (const edge of FAILURE_EDGES) {
  for (const point of [edge.start, edge.end]) uniqueEndpoints.set(point.map((value) => value.toFixed(5)).join(","), point);
}
const authorityEndpoints = [...uniqueEndpoints.values()].map((point) => ({
  point,
  canonical: { land: canonical.isPhysicalLandPoint(point), classification: classify(point, canonical) },
  v15: {
    land: authority.isPhysicalLandPoint(point),
    boundary: authority.isPhysicalGeometryBoundaryPoint(point),
    classification: classify(point, authority),
  },
}));

const b4B = {
  endpointCount: authorityEndpoints.length,
  divergences: authorityEndpoints.filter((item) => item.canonical.land !== item.v15.land),
  semanticDivergences: authorityEndpoints.filter((item) => item.canonical.classification !== item.v15.classification),
  endpoints: authorityEndpoints,
};

const edgeAuthority = FAILURE_EDGES.map((edge) => {
  const samples = Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => interpolate(edge.start, edge.end, index / SAMPLE_COUNT));
  const canonicalInvalid = samples.findIndex((point) => !canonical.isPhysicalLandPoint(point));
  const v15LandInvalid = samples.findIndex((point) => !authority.isPhysicalLandPoint(point));
  const v15BoundaryInvalid = samples.findIndex((point) => !authority.isPhysicalGeometryBoundaryPoint(point));
  return {
    ...edge,
    canonicalFirstInvalidSample: canonicalInvalid < 0 ? null : canonicalInvalid,
    v15LandFirstInvalidSample: v15LandInvalid < 0 ? null : v15LandInvalid,
    v15GeometryBoundaryFirstInvalidSample: v15BoundaryInvalid < 0 ? null : v15BoundaryInvalid,
  };
});

const b4Complete = b4A.every((item) => item.equivalent);
const authorityCharacterized = edgeAuthority.length === FAILURE_EDGES.length;

console.log(JSON.stringify({
  phase: "B4 — calibrated forensic comparison: identical canonical seed universe into V15 powerCell + endpoint physical-authority comparison",
  contract: {
    canonicalPoliticalSiteCount,
    canonicalTotalSiteCount: canonicalSites.length,
    priorTargetLocalSiteCount: 66,
    v15PowerCellInput: "canonical full site universe, exact coordinates/kinds/provinceIds",
    weights: "all zero; isolates powerCell geometry from V15 weight solver",
    productionChanges: false,
  },
  b4A: {
    purpose: "same full seed universe, same site index, same zero weights; isolate cell-construction divergence",
    results: b4A,
    verdict: b4Complete ? "EQUIVALENT" : "DIVERGENT",
  },
  b4B: {
    purpose: "same failure-edge endpoints evaluated by canonical physical authority and V15 shared physical authority",
    ...b4B,
    verdict: authorityCharacterized ? "CHARACTERIZED" : "INCOMPLETE",
  },
  edgeAuthority,
  conclusion: b4Complete
    ? "B4-A shows no seed-universe-induced cell-construction divergence for the calibrated targets; remaining divergence belongs downstream to clipping/normalization/authority or target-stage differences."
    : "B4-A still diverges under the identical full canonical seed universe; the prior 66-vs-2 target-local mismatch is not sufficient to explain the result and algorithm-level tracing remains required.",
  status: b4Complete && authorityCharacterized ? "B4_CALIBRATION_COMPLETE" : "B4_CALIBRATION_INCOMPLETE",
}, null, 2));
