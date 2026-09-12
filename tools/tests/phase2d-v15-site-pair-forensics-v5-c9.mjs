import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
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

function clone(point) { return [point[0], point[1]]; }
function distance(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }

async function loadInstrumentedV15() {
  const sourcePath = path.join(ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `\nconst __C9 = { calls: [], transitions: [] };\n`;
  let instrumented = `${prelude}${source}`;

  instrumented = instrumented.replace(
    "function repairPhysicalEdge(start, end, depth = 0) {",
    `function repairPhysicalEdge(start, end, depth = 0) {\n  const __callId = __C9.calls.length;\n  const __call = { id: __callId, depth, start: clone(start), end: clone(end), inputLength: distance(start, end) };\n  __C9.calls.push(__call);\n`,
  );

  instrumented = instrumented.replace(
    "  if (edgeIsPhysical(start, end)) return [start, end];\n  if (depth >= MAX_EDGE_REPAIR_DEPTH) return null;",
    `  if (edgeIsPhysical(start, end)) {\n    __call.outcome = "physical";\n    return [start, end];\n  }\n  if (depth >= MAX_EDGE_REPAIR_DEPTH) {\n    __call.outcome = "max-depth";\n    return null;\n  }`,
  );

  instrumented = instrumented.replace(
    "  const boundary = resolvePhysicalGeometryBoundaryPoint(interpolate(start, end, invalidFraction));\n  if (!boundary) return null;\n  const resolved = boundary.map((value) => Number(value.toFixed(7)));",
    `  const sampledInvalidPoint = interpolate(start, end, invalidFraction);\n  const boundary = resolvePhysicalGeometryBoundaryPoint(sampledInvalidPoint);\n  __call.invalidFraction = invalidFraction;\n  __call.invalidPoint = clone(sampledInvalidPoint);\n  __call.boundary = boundary ? clone(boundary) : null;\n  if (!boundary) {\n    __call.outcome = "no-boundary";\n    return null;\n  }\n  const resolved = boundary.map((value) => Number(value.toFixed(7)));\n  __call.resolved = clone(resolved);`,
  );

  instrumented = instrumented.replace(
    "  if (Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS\n    || Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS) return null;\n\n  const left = repairPhysicalEdge(start, resolved, depth + 1);\n  const right = repairPhysicalEdge(resolved, end, depth + 1);\n  if (!left || !right) return null;",
    `  const collapseToStart = Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS;\n  const collapseToEnd = Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS;\n  __call.collapseToStart = collapseToStart;\n  __call.collapseToEnd = collapseToEnd;\n  if (collapseToStart || collapseToEnd) {\n    __call.outcome = "endpoint-collapse";\n    return null;\n  }\n\n  const leftArgs = { start: clone(start), end: clone(resolved), depth: depth + 1 };\n  const rightArgs = { start: clone(resolved), end: clone(end), depth: depth + 1 };\n  const left = repairPhysicalEdge(leftArgs.start, leftArgs.end, leftArgs.depth);\n  const right = repairPhysicalEdge(rightArgs.start, rightArgs.end, rightArgs.depth);\n  const childCalls = __C9.calls.filter((candidate) => candidate.depth === depth + 1\n    && ((distance(candidate.start, leftArgs.start) <= EPS && distance(candidate.end, leftArgs.end) <= EPS)\n      || (distance(candidate.start, rightArgs.start) <= EPS && distance(candidate.end, rightArgs.end) <= EPS)));\n  __C9.transitions.push({\n    parentCallId: __callId,\n    depth,\n    parent: { start: clone(start), end: clone(end) },\n    invalidFraction,\n    invalidPoint: clone(sampledInvalidPoint),\n    boundary: clone(boundary),\n    resolved: clone(resolved),\n    previousRecoveryState: __call.previousRecoveryState ?? null,\n    left: leftArgs,\n    right: rightArgs,\n    leftSucceeded: Boolean(left),\n    rightSucceeded: Boolean(right),\n    matchingChildCallIds: childCalls.map((candidate) => candidate.id),\n  });\n  if (!left || !right) {\n    __call.outcome = "child-failure";\n    return null;\n  }\n  __call.outcome = "repaired";`,
  );

  instrumented = instrumented.replace(
    "export { isPhysicalLandPoint };",
    "export { __C9, repairPhysicalEdge };",
  );

  const tempPath = path.join(ROOT, `tools/historical-gis/.c9-v15-${process.pid}.mjs`);
  fs.writeFileSync(tempPath, instrumented, "utf8");
  try {
    return await import(`file://${tempPath}?c9=${process.pid}`);
  } finally {
    fs.rmSync(tempPath, { force: true });
  }
}

const mod = await loadInstrumentedV15();
assert.equal(typeof mod.repairPhysicalEdge, "function", "C9 failed to expose production repairPhysicalEdge");

const results = [];
for (const edge of FAILURE_EDGES) {
  const before = mod.__C9.calls.length;
  const transitionBefore = mod.__C9.transitions.length;
  let repaired = null;
  let error = null;
  try {
    repaired = mod.repairPhysicalEdge(edge.start, edge.end, 0);
  } catch (cause) {
    error = String(cause?.stack ?? cause);
  }
  const calls = mod.__C9.calls.slice(before);
  const transitions = mod.__C9.transitions.slice(transitionBefore);
  const maxDepth = calls.reduce((max, call) => Math.max(max, call.depth), -1);
  const depthHistogram = Object.fromEntries(
    [...new Set(calls.map((call) => call.depth))].sort((a, b) => a - b).map((depth) => [depth, calls.filter((call) => call.depth === depth).length]),
  );
  const repeatedRecovery = [];
  for (let index = 1; index < calls.length; index += 1) {
    const previous = calls[index - 1];
    const current = calls[index];
    if (previous.resolved && current.resolved && distance(previous.resolved, current.resolved) <= 1e-7) repeatedRecovery.push({ previousCallId: previous.id, currentCallId: current.id, point: previous.resolved });
  }
  results.push({
    ...edge,
    repaired: Boolean(repaired),
    repairedVertexCount: repaired?.length ?? 0,
    error,
    callCount: calls.length,
    transitionCount: transitions.length,
    maxDepth,
    depthHistogram,
    terminalOutcomes: Object.fromEntries([...new Set(calls.map((call) => call.outcome ?? "unclassified"))].map((outcome) => [outcome, calls.filter((call) => (call.outcome ?? "unclassified") === outcome).length])),
    repeatedRecovery,
    calls,
    transitions,
  });
}

const allCalls = mod.__C9.calls;
assert.ok(allCalls.length > 0, "C9 captured no production repairPhysicalEdge calls");

console.log(JSON.stringify({
  schema: "phase2d-v15-site-pair-forensics-v5-c9",
  baseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
  productionFunction: "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js::repairPhysicalEdge",
  constants: { FINAL_EDGE_SAMPLE_COUNT: 64, MAX_EDGE_REPAIR_DEPTH: 12 },
  instrumentation: {
    capturesActualRecursiveCallChain: true,
    capturesParentRecoveryAndChildArguments: true,
    capturesPreviousRecoveryState: true,
    previousRecoveryStateForwardedByProductionSignature: false,
  },
  results,
}, null, 2));
