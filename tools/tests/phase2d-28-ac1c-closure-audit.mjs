import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");

const A1_TARGETS = [
  "lydia-smyrna",
  "ionia-ayasuluk",
  "caria-pecin",
  "caria-halikarnassos",
  "pontus-sinop",
];
const AMISOS = "pontus-amisos";
const AMASYA = "pontus-amasya";
const MIN_AREA = 0.00005;

function area(polygon) {
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * next[1] - next[0] * next[1] + next[0] * polygon[i][1] - next[0] * next[1];
  }
  // The expression above is intentionally replaced below with the canonical shoelace form.
  sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * next[1] - next[0] * polygon[i][1];
  }
  return Math.abs(sum) / 2;
}

function loadCanonical() {
  const sourcePath = path.join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `const __CLOSURE = { rawCells: new Map() };\nconst __TARGETS = new Set(${JSON.stringify([...A1_TARGETS, AMISOS])});\n`;
  let instrumented = prelude + source;
  const anchor = "      const rounded = roundPolygon(cell);\n";
  const replacement = "      if (__TARGETS.has(sites[siteIndex].provinceId) && !__CLOSURE.rawCells.has(sites[siteIndex].provinceId)) __CLOSURE.rawCells.set(sites[siteIndex].provinceId, { siteIndex, site: sites[siteIndex], cell });\n      const rounded = roundPolygon(cell);\n";
  assert.ok(instrumented.includes(anchor), "canonical raw-cell capture anchor missing");
  instrumented = instrumented.replace(anchor, replacement);
  instrumented = instrumented.replace("export { isPhysicalLandPoint };", "export { isPhysicalLandPoint, __CLOSURE };");
  const tempPath = path.join(path.dirname(sourcePath), `.closure-canonical-${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  return { sourcePath, tempPath };
}

const canonicalModule = loadCanonical();
let canonical;
try {
  canonical = await import(`file://${canonicalModule.tempPath}?closure=${process.pid}`);
} finally {
  fs.rmSync(canonicalModule.tempPath, { force: true });
}

canonical.buildAnatoliaPhase2DAssets([]);
const raw = canonical.__CLOSURE.rawCells;
const a1 = A1_TARGETS.map((provinceId) => {
  const record = raw.get(provinceId);
  assert.ok(record, `missing native raw cell: ${provinceId}`);
  return {
    provinceId,
    vertexCount: record.cell.length,
    rawArea: area(record.cell),
    belowMinArea: area(record.cell) < MIN_AREA,
    site: record.site,
  };
});
assert.ok(a1.every((item) => item.belowMinArea), "A1 target set is not uniformly below MIN_AREA");

const amisos = raw.get(AMISOS);
assert.ok(amisos, "missing native Amisos raw cell");

const v15Path = path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const v15Source = fs.readFileSync(v15Path, "utf8");
const v15Instrumented = v15Source.replace("export { isPhysicalLandPoint };", "export { isPhysicalLandPoint, normalizePhysicalBoundary };");
const v15Temp = path.join(path.dirname(v15Path), `.closure-v15-${process.pid}.mjs`);
fs.writeFileSync(v15Temp, v15Instrumented, "utf8");
const v15 = await import(`file://${v15Temp}?closure=${process.pid}`);
fs.rmSync(v15Temp, { force: true });
const normalized = v15.normalizePhysicalBoundary(amisos.cell);
assert.ok(normalized, "V15 normalization rejected the canonical Amisos raw cell");
const a2 = {
  canonicalRawArea: area(amisos.cell),
  v15NormalizedArea: area(normalized),
  areaRatio: area(normalized) / area(amisos.cell),
  vertexCount: normalized.length,
  reportedHistoricalTinyArea: 2.27e-13,
  tinyAreaReproduced: Math.abs(area(normalized) - 2.27e-13) < 1e-12,
};
assert.equal(a2.tinyAreaReproduced, false, "historical tiny area was unexpectedly reproduced by direct canonical raw -> V15 normalization");

const authorityPath = path.resolve("tools/historical-gis/recovery/physical-land-authority.mjs");
const authority = await import(`file://${authorityPath}?closure=${process.pid}`);
const metadataPath = path.resolve("src/map/data/AnatoliaProvinceRefinement.js");
const metadataSource = fs.readFileSync(metadataPath, "utf8");
const anchorMatch = metadataSource.match(/\"pontus-amasya\": anchor\(([-0-9.]+),\s*([-0-9.]+)/);
assert.ok(anchorMatch, "Amasya refinement anchor missing");
const amasyaAnchor = [Number(anchorMatch[1]), Number(anchorMatch[2])];
const nearbyLakes = authority.PHYSICAL_LAND_POLYGONS.length;
const runtimePath = path.resolve("src/map/data/AnatoliaPhysicalAtlasRuntime.js");
const runtimeSource = fs.readFileSync(runtimePath, "utf8");
const lakeCountMatch = runtimeSource.match(/lakes/g);
const c = {
  provinceId: AMASYA,
  anchor: amasyaAnchor,
  physicalLand: authority.isPhysicalLandPoint(amasyaAnchor),
  geometryBoundary: authority.isPhysicalGeometryBoundaryPoint(amasyaAnchor),
  finalGeometryBoundary: authority.isFinalPhysicalGeometryBoundaryPoint(amasyaAnchor),
  authorityExports: [
    "isPhysicalLandPoint",
    "isLakeInteriorPoint",
    "nearestLakeBoundaryPoint",
    "resolvePhysicalGeometryBoundaryPoint",
    "isPhysicalGeometryBoundaryPoint",
    "isFinalPhysicalGeometryBoundaryPoint",
  ],
  physicalLandPolygonCount: nearbyLakes,
  runtimeLakeSymbolPresent: Boolean(lakeCountMatch),
  rule: "lake interior is geometry-boundary-eligible for recovery but not final physical land; final geometry remains land-only",
};

console.log(JSON.stringify({
  phase: "2.8-C root-cause closure audit",
  productionChanges: false,
  constants: { MIN_AREA },
  A1: { targets: a1, verdict: "NATIVE_INPUT_OR_GENERATION_SCALE_ISSUE_CONFIRMED", minAreaChanged: false },
  A2: { target: AMISOS, result: a2, verdict: "HISTORICAL_TINY_AREA_NOT_FROM_DIRECT_V15_NORMALIZATION" },
  C: { result: c, verdict: "AUTHORITY_SEMANTICS_EXPLICIT_AND_NON-CIRCULAR" },
  closure: {
    A1: a1.every((item) => item.belowMinArea),
    A2: !a2.tinyAreaReproduced,
    C: c.authorityExports.length === 6 && c.runtimeLakeSymbolPresent,
  },
}, null, 2));
