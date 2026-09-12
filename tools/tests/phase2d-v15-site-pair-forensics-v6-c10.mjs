import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

async function loadInstrumentedV15() {
  const sourcePath = path.join(ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `\nconst __C10 = { provinces: [], failures: [] };\n`;
  let instrumented = `${prelude}${source}`;

  instrumented = instrumented.replace(
    "function buildPartition(sites, weights) {",
    `function buildPartition(sites, weights) {\n  __C10.currentProvince = null;`,
  );
  assert.notEqual(instrumented, `${prelude}${source}`, "C10 failed to locate production buildPartition declaration");

  instrumented = instrumented.replace(
    "    const site = sites[index];\n    const cell = powerCell(index, sites, weights);",
    `    const site = sites[index];\n    __C10.currentProvince = site.provinceId;\n    const cell = powerCell(index, sites, weights);`,
  );

  instrumented = instrumented.replace(
    "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;\n    if (!polygon || !edgeOnPhysicalLand(polygon)) throw new Error(`Phase 2D V15 produced invalid physical-land geometry: ${site.provinceId}`);",
    `    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;\n    const __record = {\n      provinceId: site.provinceId,\n      rawPolygon: rawPolygon ? rawPolygon.map(([x, y]) => [x, y]) : null,\n      normalizedPolygon: polygon ? polygon.map(([x, y]) => [x, y]) : null,\n      normalizedEdgeChecks: [],\n      finalEdgeCheck: null,\n    };\n    if (polygon) {\n      for (let edgeIndex = 0; edgeIndex < polygon.length; edgeIndex += 1) {\n        const start = polygon[edgeIndex];\n        const end = polygon[(edgeIndex + 1) % polygon.length];\n        let firstInvalid = null;\n        for (let sampleIndex = 0; sampleIndex <= FINAL_EDGE_SAMPLE_COUNT; sampleIndex += 1) {\n          const fraction = sampleIndex / FINAL_EDGE_SAMPLE_COUNT;\n          const point = interpolate(start, end, fraction);\n          if (!isPhysicalGeometryBoundaryPoint(point)) {\n            firstInvalid = { sampleIndex, fraction, point: [point[0], point[1]] };\n            break;\n          }\n        }\n        __record.normalizedEdgeChecks.push({\n          edgeIndex,\n          start: [start[0], start[1]],\n          end: [end[0], end[1]],\n          edgeIsPhysical: firstInvalid === null,\n          firstInvalid,\n        });\n      }\n      const failingEdge = __record.normalizedEdgeChecks.find((edge) => !edge.edgeIsPhysical) ?? null;\n      __record.finalEdgeCheck = {\n        edgeOnPhysicalLand: failingEdge === null,\n        firstFailingEdgeIndex: failingEdge?.edgeIndex ?? null,\n        firstFailingEdge: failingEdge,\n      };\n    }\n    __C10.provinces.push(__record);\n    if (!polygon || !edgeOnPhysicalLand(polygon)) {\n      __C10.failures.push(__record);\n      throw new Error("Phase 2D V15 produced invalid physical-land geometry: " + site.provinceId);\n    }`,
  );
  assert.notEqual(instrumented, `${prelude}${source}`, "C10 failed to locate production polygon validation block");

  instrumented = instrumented.replace(
    "export { isPhysicalLandPoint };",
    "export { isPhysicalLandPoint, __C10, buildAnatoliaPhase2DAssets };",
  );
  assert.notEqual(instrumented, `${prelude}${source}`, "C10 export instrumentation did not apply");

  const tempPath = path.join(ROOT, `tools/historical-gis/.c10-v15-${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    return await import(`file://${tempPath}?c10=${process.pid}`);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const mod = await loadInstrumentedV15();
assert.equal(typeof mod.buildAnatoliaPhase2DAssets, "function", "C10 failed to expose production builder");

let builderError = null;
try {
  mod.buildAnatoliaPhase2DAssets();
} catch (cause) {
  builderError = String(cause?.stack ?? cause);
}

assert.ok(mod.__C10.provinces.length > 0, `C10 captured no production polygons; builderError=${builderError ?? "none"}`);

const failingProvince = mod.__C10.failures[0] ?? null;
const pontusAmasya = mod.__C10.provinces.find((item) => item.provinceId === "pontus-amasya") ?? null;

console.log(JSON.stringify({
  schema: "phase2d-v15-site-pair-forensics-v6-c10-final-polygon-edge",
  baseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
  productionFunction: "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js::buildPartition",
  productionValidation: "buildPartition() -> normalizePhysicalBoundary() -> edgeOnPhysicalLand()",
  builderReachedProductionValidation: mod.__C10.provinces.length > 0,
  builderError,
  constants: { FINAL_EDGE_SAMPLE_COUNT: 64, MAX_EDGE_REPAIR_DEPTH: 12 },
  telemetry: {
    provinceCountBeforeFailure: mod.__C10.provinces.length,
    failureCount: mod.__C10.failures.length,
    firstFailingProvince: failingProvince?.provinceId ?? null,
    pontusAmasyaCaptured: Boolean(pontusAmasya),
    failingProvince,
    pontusAmasya,
  },
}, null, 2));
