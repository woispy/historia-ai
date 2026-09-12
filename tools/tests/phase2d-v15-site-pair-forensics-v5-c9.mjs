import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

async function loadInstrumentedV15() {
  const sourcePath = path.join(ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source = fs.readFileSync(sourcePath, "utf8");
  const prelude = `\nconst __C9 = { calls: [], transitions: [] };\n`;
  let instrumented = `${prelude}${source}`;

  instrumented = instrumented.replace(
    "function repairPhysicalEdge(start, end, depth = 0) {",
    `function repairPhysicalEdge(start, end, depth = 0) {\n  const __callId = __C9.calls.length;\n  const __call = { id: __callId, depth, start: [start[0], start[1]], end: [end[0], end[1]] };\n  __C9.calls.push(__call);\n`,
  );
  assert.notEqual(instrumented, `${prelude}${source}`, "C9 failed to locate production repairPhysicalEdge declaration");

  instrumented = instrumented.replace(
    "  if (edgeIsPhysical(start, end)) return [start, end];\n  if (depth >= MAX_EDGE_REPAIR_DEPTH) return null;",
    `  if (edgeIsPhysical(start, end)) {\n    __call.outcome = "physical";\n    return [start, end];\n  }\n  if (depth >= MAX_EDGE_REPAIR_DEPTH) {\n    __call.outcome = "max-depth";\n    return null;\n  }`,
  );

  instrumented = instrumented.replace(
    "  const boundary = resolvePhysicalGeometryBoundaryPoint(interpolate(start, end, invalidFraction));\n  if (!boundary) return null;\n  const resolved = boundary.map((value) => Number(value.toFixed(7)));",
    `  const sampledInvalidPoint = interpolate(start, end, invalidFraction);\n  const boundary = resolvePhysicalGeometryBoundaryPoint(sampledInvalidPoint);\n  __call.invalidFraction = invalidFraction;\n  __call.invalidPoint = [sampledInvalidPoint[0], sampledInvalidPoint[1]];\n  __call.boundary = boundary ? [boundary[0], boundary[1]] : null;\n  if (!boundary) {\n    __call.outcome = "no-boundary";\n    return null;\n  }\n  const resolved = boundary.map((value) => Number(value.toFixed(7)));\n  __call.resolved = [resolved[0], resolved[1]];`,
  );

  instrumented = instrumented.replace(
    "  if (Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS\n    || Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS) return null;\n\n  const left = repairPhysicalEdge(start, resolved, depth + 1);\n  const right = repairPhysicalEdge(resolved, end, depth + 1);\n  if (!left || !right) return null;",
    `  const collapseToStart = Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS;\n  const collapseToEnd = Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS;\n  __call.collapseToStart = collapseToStart;\n  __call.collapseToEnd = collapseToEnd;\n  if (collapseToStart || collapseToEnd) {\n    __call.outcome = "endpoint-collapse";\n    return null;\n  }\n\n  const leftArgs = { start: [start[0], start[1]], end: [resolved[0], resolved[1]], depth: depth + 1 };\n  const rightArgs = { start: [resolved[0], resolved[1]], end: [end[0], end[1]], depth: depth + 1 };\n  const left = repairPhysicalEdge(leftArgs.start, leftArgs.end, leftArgs.depth);\n  const right = repairPhysicalEdge(rightArgs.start, rightArgs.end, rightArgs.depth);\n  const childCalls = __C9.calls.filter((candidate) => candidate.depth === depth + 1\n    && ((Math.hypot(candidate.start[0] - leftArgs.start[0], candidate.start[1] - leftArgs.start[1]) <= EPS\n      && Math.hypot(candidate.end[0] - leftArgs.end[0], candidate.end[1] - leftArgs.end[1]) <= EPS)\n      || (Math.hypot(candidate.start[0] - rightArgs.start[0], candidate.start[1] - rightArgs.start[1]) <= EPS\n      && Math.hypot(candidate.end[0] - rightArgs.end[0], candidate.end[1] - rightArgs.end[1]) <= EPS)));\n  __C9.transitions.push({\n    parentCallId: __callId,\n    depth,\n    parent: { start: [start[0], start[1]], end: [end[0], end[1]] },\n    invalidFraction,\n    invalidPoint: [sampledInvalidPoint[0], sampledInvalidPoint[1]],\n    boundary: [boundary[0], boundary[1]],\n    resolved: [resolved[0], resolved[1]],\n    previousRecoveryState: __call.previousRecoveryState ?? null,\n    left: leftArgs,\n    right: rightArgs,\n    leftSucceeded: Boolean(left),\n    rightSucceeded: Boolean(right),\n    matchingChildCallIds: childCalls.map((candidate) => candidate.id),\n  });\n  if (!left || !right) {\n    __call.outcome = "child-failure";\n    return null;\n  }\n  __call.outcome = "repaired";`,
  );

  instrumented = instrumented.replace(
    "export { isPhysicalLandPoint };",
    "export { isPhysicalLandPoint, __C9, repairPhysicalEdge };",
  );
  assert.notEqual(instrumented, `${prelude}${source}`, "C9 export instrumentation did not apply");

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
assert.equal(typeof mod.buildAnatoliaPhase2DAssets, "function", "C9 failed to expose production builder");

let builderError = null;
try {
  mod.buildAnatoliaPhase2DAssets();
} catch (cause) {
  builderError = String(cause?.stack ?? cause);
}

const allCalls = mod.__C9.calls;
assert.ok(allCalls.length > 0, `C9.3 captured no production repairPhysicalEdge calls from buildAnatoliaPhase2DAssets; builderError=${builderError ?? "none"}`);

const transitions = mod.__C9.transitions;
const maxDepth = allCalls.reduce((max, call) => Math.max(max, call.depth), -1);
const depthHistogram = Object.fromEntries(
  [...new Set(allCalls.map((call) => call.depth))].sort((a, b) => a - b).map((depth) => [depth, allCalls.filter((call) => call.depth === depth).length]),
);

console.log(JSON.stringify({
  schema: "phase2d-v15-site-pair-forensics-v5-c9-production-callsite",
  baseline: "6b7424125eee4a1c72925b7a1780c68e695e9ba3",
  productionFunction: "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js::repairPhysicalEdge",
  productionCallSite: "normalizePhysicalBoundary() -> repairPhysicalEdge()",
  builderReachedProductionCallSite: allCalls.length > 0,
  builderError,
  constants: { FINAL_EDGE_SAMPLE_COUNT: 64, MAX_EDGE_REPAIR_DEPTH: 12 },
  instrumentation: {
    capturesActualRecursiveCallChain: true,
    capturesParentRecoveryAndChildArguments: true,
    capturesPreviousRecoveryState: true,
    previousRecoveryStateForwardedByProductionSignature: false,
  },
  telemetry: {
    callCount: allCalls.length,
    transitionCount: transitions.length,
    maxDepth,
    depthHistogram,
    outcomes: Object.fromEntries([...new Set(allCalls.map((call) => call.outcome ?? "unclassified"))].map((outcome) => [outcome, allCalls.filter((call) => (call.outcome ?? "unclassified") === outcome).length])),
    sampleCalls: allCalls.slice(0, 32),
    sampleTransitions: transitions.slice(0, 32),
  },
}, null, 2));
