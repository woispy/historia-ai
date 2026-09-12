import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

async function loadInstrumentedV15() {
  const sourcePath = path.join(ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `\nconst __C11 = { provinces: [], failures: [], currentProvince: null };\n`;
  let instrumented = `${prelude}${source}`;

  const normalizeStart = "function normalizePhysicalBoundary(polygon) {";
  const normalizeEnd = "\nfunction edgeOnPhysicalLand(polygon) {";
  const startIndex = instrumented.indexOf(normalizeStart);
  const endIndex = instrumented.indexOf(normalizeEnd, startIndex);
  assert.ok(startIndex >= 0 && endIndex > startIndex, "C11 failed to locate normalizePhysicalBoundary block");

  const instrumentedNormalize = `function normalizePhysicalBoundary(polygon) {\n  const normalized = [];\n  const trace = {\n    provinceId: __C11.currentProvince,\n    inputVertexCount: polygon.length,\n    edges: [],\n    failureStage: null,\n    failureEdgeIndex: null,\n    failureDetail: null,\n    normalizedVertexCountBeforeDeduplication: null,\n    deduplicatedVertexCount: null,\n    normalizedArea: null,\n    result: null,\n  };\n\n  for (let index = 0; index < polygon.length; index += 1) {\n    const start = polygon[index];\n    const end = polygon[(index + 1) % polygon.length];\n    const resolvedStart = isPhysicalLandPoint(start) ? start : resolvePhysicalGeometryBoundaryPoint(start);\n    const resolvedEnd = isPhysicalLandPoint(end) ? end : resolvePhysicalGeometryBoundaryPoint(end);\n    const edgeTrace = {\n      edgeIndex: index,\n      start: [start[0], start[1]],\n      end: [end[0], end[1]],\n      resolvedStart: resolvedStart ? [resolvedStart[0], resolvedStart[1]] : null,\n      resolvedEnd: resolvedEnd ? [resolvedEnd[0], resolvedEnd[1]] : null,\n      repaired: null,\n      repairVertexCount: null,\n      failureStage: null,\n      failureDetail: null,\n    };\n    trace.edges.push(edgeTrace);\n\n    if (!resolvedStart) {\n      edgeTrace.failureStage = "resolveStart";\n      edgeTrace.failureDetail = "resolvePhysicalGeometryBoundaryPoint returned null";\n      trace.failureStage = edgeTrace.failureStage;\n      trace.failureEdgeIndex = index;\n      trace.failureDetail = edgeTrace.failureDetail;\n      trace.result = null;\n      __C11.failures.push(trace);\n      __C11.provinces.push(trace);\n      return null;\n    }\n    if (!resolvedEnd) {\n      edgeTrace.failureStage = "resolveEnd";\n      edgeTrace.failureDetail = "resolvePhysicalGeometryBoundaryPoint returned null";\n      trace.failureStage = edgeTrace.failureStage;\n      trace.failureEdgeIndex = index;\n      trace.failureDetail = edgeTrace.failureDetail;\n      trace.result = null;\n      __C11.failures.push(trace);\n      __C11.provinces.push(trace);\n      return null;\n    }\n\n    const repaired = repairPhysicalEdge(resolvedStart, resolvedEnd);\n    edgeTrace.repaired = repaired ? repaired.map(([x, y]) => [x, y]) : null;\n    edgeTrace.repairVertexCount = repaired?.length ?? null;\n    if (!repaired) {\n      edgeTrace.failureStage = "repairPhysicalEdge";\n      edgeTrace.failureDetail = "repairPhysicalEdge returned null";\n      trace.failureStage = edgeTrace.failureStage;\n      trace.failureEdgeIndex = index;\n      trace.failureDetail = edgeTrace.failureDetail;\n      trace.result = null;\n      __C11.failures.push(trace);\n      __C11.provinces.push(trace);\n      return null;\n    }\n    normalized.push(...repaired.slice(0, -1));\n  }\n\n  trace.normalizedVertexCountBeforeDeduplication = normalized.length;\n  const deduplicated = [];\n  for (const point of normalized) {\n    const last = deduplicated[deduplicated.length - 1];\n    if (!last || last[0] !== point[0] || last[1] !== point[1]) deduplicated.push(point);\n  }\n  if (deduplicated.length > 1) {\n    const first = deduplicated[0];\n    const last = deduplicated[deduplicated.length - 1];\n    if (first[0] === last[0] && first[1] === last[1]) deduplicated.pop();\n  }\n  trace.deduplicatedVertexCount = deduplicated.length;\n  trace.normalizedArea = deduplicated.length >= 3 ? area(deduplicated) : null;\n\n  if (deduplicated.length < 3) {\n    trace.failureStage = "deduplicationVertexCount";\n    trace.failureDetail = `deduplicated vertex count ${deduplicated.length} < 3`;\n    trace.result = null;\n    __C11.failures.push(trace);\n    __C11.provinces.push(trace);\n    return null;\n  }\n  if (trace.normalizedArea < MIN_AREA) {\n    trace.failureStage = "area";\n    trace.failureDetail = `normalized area ${trace.normalizedArea} < MIN_AREA ${MIN_AREA}`;\n    trace.result = null;\n    __C11.failures.push(trace);\n    __C11.provinces.push(trace);\n    return null;\n  }\n\n  trace.result = deduplicated.map(([x, y]) => [x, y]);\n  __C11.provinces.push(trace);\n  return deduplicated;\n}`;

  instrumented = `${instrumented.slice(0, startIndex)}${instrumentedNormalize}${instrumented.slice(endIndex)}`;

  instrumented = instrumented.replace(
    "function buildPartition(sites, weights) {",
    `function buildPartition(sites, weights) {\n  __C11.currentProvince = null;`,
  );
  assert.notEqual(instrumented, `${prelude}${source}`, "C11 failed to locate production buildPartition declaration");

  instrumented = instrumented.replace(
    "    const site = sites[index];\n    const cell = powerCell(index, sites, weights);",
    `    const site = sites[index];\n    __C11.currentProvince = site.provinceId;\n    const cell = powerCell(index, sites, weights);`,
  );

  assert.notEqual(instrumented, `${prelude}${source}`, "C11 failed to locate production site context");

  const exportPattern = /export\\s*\\{[\\s\\S]*?\\};\\s*$/m;
  const withoutProductionExport = instrumented.replace(exportPattern, "");
  assert.notEqual(withoutProductionExport, instrumented, "C11 failed to locate production secondary export");
  instrumented = `${withoutProductionExport}\nexport { __C11 };\n`;

  const tempPath = path.join(ROOT, `tools/historical-gis/.c11-v15-${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    return await import(`file://${tempPath}?c11=${process.pid}`);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const mod = await loadInstrumentedV15();
assert.equal(typeof mod.buildAnatoliaPhase2DAssets, "function", "C11 failed to expose production builder");

let builderError = null;
try {
  mod.buildAnatoliaPhase2DAssets();
} catch (cause) {
  builderError = String(cause?.stack ?? cause);
}

const pontusAmasya = mod.__C11.provinces.find((item) => item.provinceId === "pontus-amasya") ?? null;
const failingProvince = mod.__C11.failures[0] ?? null;

console.log(JSON.stringify({
  schema: "phase2d-v15-site-pair-forensics-v7-c11-normalize-rejection",
  baseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
  productionFunction: "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js::normalizePhysicalBoundary",
  productionPath: "buildPartition() -> normalizePhysicalBoundary()",
  builderReachedProductionValidation: mod.__C11.provinces.length > 0,
  builderError,
  constants: { FINAL_EDGE_SAMPLE_COUNT: 64, MAX_EDGE_REPAIR_DEPTH: 12, MIN_AREA: 0.00005 },
  telemetry: {
    provinceCountBeforeFailure: mod.__C11.provinces.length,
    failureCount: mod.__C11.failures.length,
    firstFailingProvince: failingProvince?.provinceId ?? null,
    pontusAmasyaCaptured: Boolean(pontusAmasya),
    pontusAmasya,
  },
}, null, 2));
