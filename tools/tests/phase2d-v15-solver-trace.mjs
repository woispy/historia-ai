import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const sourcePath = path.join(ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const source = fs.readFileSync(sourcePath, "utf8");

const trace = [];
const traceSource = `const __solverTrace = globalThis.__HISTORIA_SOLVER_TRACE;\n`;
const instrumented = `${traceSource}${source}`
  .replace(
    "function buildPartition(sites, weights) {",
    "function buildPartition(sites, weights) {\n  __solverTrace.push({ type: \"buildPartition:start\", weightSnapshot: { ...weights } });",
  )
  .replace(
    "if (!cell.length) throw new Error(`Phase 2D V15 empty power cell: ${site.provinceId}`);",
    "if (!cell.length) { __solverTrace.push({ type: \"buildPartition:gate-abort\", provinceId: site.provinceId, reason: \"empty-power-cell\" }); throw new Error(`Phase 2D V15 empty power cell: ${site.provinceId}`); }",
  )
  .replace(
    "if (!polygon || !edgeOnPhysicalLand(polygon)) throw new Error(`Phase 2D V15 produced invalid physical-land geometry: ${site.provinceId}`);",
    "if (!polygon || !edgeOnPhysicalLand(polygon)) { __solverTrace.push({ type: \"buildPartition:gate-abort\", provinceId: site.provinceId, reason: \"invalid-physical-land-geometry\" }); throw new Error(`Phase 2D V15 produced invalid physical-land geometry: ${site.provinceId}`); }",
  )
  .replace(
    "function solveWeights(sites) {",
    "function solveWeights(sites) {\n  __solverTrace.push({ type: \"solveWeights:start\", siteCount: sites.length });",
  )
  .replace(
    "const featureBias = featureWeightBias();",
    "const featureBias = featureWeightBias();\n  __solverTrace.push({ type: \"featureWeightBias\", weights: { ...featureBias } });",
  )
  .replace(
    "let partition = buildPartition(sites, weights);",
    "__solverTrace.push({ type: \"initialWeights\", weights: { ...weights } });\n  let partition = buildPartition(sites, weights);\n  __solverTrace.push({ type: \"iteration:0:partition\", weights: { ...weights }, areas: [...partition.entries()].map(([id, polygon]) => ({ id, area: area(polygon) })) });",
  )
  .replace(
    "const oversized = summary.filter((item) => item.area > medianArea * MAX_AREA_RATIO);",
    "const oversized = summary.filter((item) => item.area > medianArea * MAX_AREA_RATIO);\n    __solverTrace.push({ type: \"iteration:summary\", iteration, medianArea, oversized: oversized.map((item) => ({ ...item })), targetWeights: { nicomedia: weights[\"bithynia-nicomedia\"] ?? 0, nicaea: weights[\"bithynia-nicaea\"] ?? 0 } });",
  )
  .replace(
    "for (const item of oversized) {",
    "for (const item of oversized) {\n      const beforeWeight = weights[item.id];",
  )
  .replace(
    "weights[item.id] -= Math.min(MAX_WEIGHT_STEP, Math.max(0.25, (ratio - MAX_AREA_RATIO) * 1.5));",
    "weights[item.id] -= Math.min(MAX_WEIGHT_STEP, Math.max(0.25, (ratio - MAX_AREA_RATIO) * 1.5));\n      __solverTrace.push({ type: \"weightMutation\", iteration, provinceId: item.id, before: beforeWeight, after: weights[item.id], ratio });",
  )
  .replace(
    "partition = buildPartition(sites, weights);",
    "partition = buildPartition(sites, weights);\n    __solverTrace.push({ type: \"iteration:rebuild\", iteration: iteration + 1, weights: { ...weights }, areas: [...partition.entries()].map(([id, polygon]) => ({ id, area: area(polygon) })) });",
  );

const tempPath = path.join(path.dirname(sourcePath), `.solver-trace-${process.pid}.mjs`);
fs.writeFileSync(tempPath, `${instrumented}\nexport { buildControlSites, featureWeightBias, solveWeights };\n`, "utf8");
globalThis.__HISTORIA_SOLVER_TRACE = trace;

try {
  const mod = await import(`file://${tempPath}?trace=${process.pid}`);
  const sites = mod.buildControlSites();
  const initialWeights = mod.featureWeightBias();
  const target = ["bithynia-nicomedia", "bithynia-nicaea"];
  let result = null;
  let status = "SOLVED";
  let abort = null;
  try {
    result = mod.solveWeights(sites);
  } catch (error) {
    status = "SOLVER_TRACE_ABORTED_BY_GLOBAL_PHYSICAL_GATE";
    abort = { name: error?.name ?? "Error", message: String(error?.message ?? error) };
  }
  console.log(JSON.stringify({
    schema: "phase2d-v15-solver-trace",
    canonicalBaseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
    status,
    targetProvinces: target,
    siteCount: sites.length,
    initialTargetWeights: Object.fromEntries(target.map((id) => [id, initialWeights[id] ?? 0])),
    solvedTargetWeights: result ? Object.fromEntries(target.map((id) => [id, result.weights[id] ?? 0])) : null,
    solverIterations: result?.iterations ?? null,
    abort,
    trace,
    traceMode: "read-only-source-instrumentation-around-production-solveWeights",
    note: "Instrumentation is applied only to an ephemeral forensic module. Production V15 source is not modified. Global buildPartition failures are preserved and no synthetic solver iteration is generated.",
  }, null, 2));
} finally {
  fs.rmSync(tempPath, { force: true });
}
