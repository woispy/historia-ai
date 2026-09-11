import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
if (!CANONICAL_ROOT) throw new Error("CANONICAL_ROOT is required");

function polygonArea(polygon) {
  if (!polygon?.length) return 0;
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * next[1] - next[0] * polygon[i][1];
  }
  return Math.abs(sum) / 2;
}

function canonicalRawPolygon() {
  const canonicalBuilder = join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const code = `const original=Number.prototype.toFixed; Number.prototype.toFixed=function(d){if(d===5)return String(Number(this));return original.call(this,d)}; const m=await import(${JSON.stringify(pathToFileURL(canonicalBuilder).href)}); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find((x)=>x.identity.provinceId===\"pontus-amisos\"); if(!g) throw new Error(\"Canonical Amisos geometry missing\"); process.stdout.write(JSON.stringify(g.polygons[0]));`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (child.status !== 0) throw new Error(child.stderr || "Canonical Amisos probe failed");
  return JSON.parse(child.stdout);
}

const sourcePath = join(process.cwd(), "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const source = readFileSync(sourcePath, "utf8");
const tempPath = join(dirname(sourcePath), "AnatoliaPhase2DGeometryBuilderV15.A2Trace.mjs");
const tracePrelude = `\nconst __a2Trace = globalThis.__A2_TRACE = { active: false, events: [] };\nfunction __a2Point(point) { return point ? [Number(point[0]), Number(point[1])] : null; }\nfunction __a2Area(polygon) { if (!polygon?.length) return 0; let sum = 0; for (let i = 0; i < polygon.length; i += 1) { const n = polygon[(i + 1) % polygon.length]; sum += polygon[i][0] * n[1] - n[0] * polygon[i][1]; } return Math.abs(sum) / 2; }\nfunction __a2Event(type, payload = {}) { if (__a2Trace.active) __a2Trace.events.push({ type, ...payload }); }\n`;

let traced = source.replace("const BBOX = [25.45, 35.72, 44.85, 42.35];", "const BBOX = [25.45, 35.72, 44.85, 42.35];" + tracePrelude);
traced = traced.replace(
  "function repairPhysicalEdge(start, end, depth = 0) {\n  if (edgeIsPhysical(start, end)) return [start, end];",
  "function repairPhysicalEdge(start, end, depth = 0) {\n  const repairId = __a2Trace.active ? __a2Trace.events.filter((event) => event.type === \"repair-start\").length : -1;\n  __a2Event(\"repair-start\", { repairId, depth, start: __a2Point(start), end: __a2Point(end), physicalBefore: edgeIsPhysical(start, end) });\n  if (edgeIsPhysical(start, end)) { __a2Event(\"repair-accepted\", { repairId, depth }); return [start, end]; }"
);
traced = traced.replace("  if (depth >= MAX_EDGE_REPAIR_DEPTH) return null;", "  if (depth >= MAX_EDGE_REPAIR_DEPTH) { __a2Event(\"repair-depth-limit\", { repairId, depth }); return null; }");
traced = traced.replace("  if (invalidFraction === null) return [start, end];", "  if (invalidFraction === null) { __a2Event(\"repair-no-invalid-sample\", { repairId, depth }); return [start, end]; }");
traced = traced.replace(
  "  const boundary = resolvePhysicalGeometryBoundaryPoint(interpolate(start, end, invalidFraction));\n  if (!boundary) return null;",
  "  const invalidPoint = interpolate(start, end, invalidFraction);\n  const boundary = resolvePhysicalGeometryBoundaryPoint(invalidPoint);\n  __a2Event(\"repair-resolution\", { repairId, depth, invalidFraction, invalidPoint: __a2Point(invalidPoint), boundary: __a2Point(boundary) });\n  if (!boundary) { __a2Event(\"repair-resolution-failed\", { repairId, depth }); return null; }"
);
traced = traced.replace(
  "  if (Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS\n    || Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS) return null;",
  "  const startDistance = Math.hypot(resolved[0] - start[0], resolved[1] - start[1]);\n  const endDistance = Math.hypot(resolved[0] - end[0], resolved[1] - end[1]);\n  __a2Event(\"repair-resolved-point\", { repairId, depth, resolved, startDistance, endDistance });\n  if (startDistance <= EPS || endDistance <= EPS) { __a2Event(\"repair-resolved-endpoint-rejected\", { repairId, depth }); return null; }"
);
traced = traced.replace(
  "  if (!left || !right) return null;\n  return [...left.slice(0, -1), ...right];",
  "  if (!left || !right) { __a2Event(\"repair-child-failed\", { repairId, depth }); return null; }\n  const combined = [...left.slice(0, -1), ...right];\n  __a2Event(\"repair-combined\", { repairId, depth, vertexCount: combined.length, area: __a2Area(combined) });\n  return combined;"
);
traced = traced.replace(
  "function normalizePhysicalBoundary(polygon) {\n  const normalized = [];",
  "function normalizePhysicalBoundary(polygon) {\n  __a2Event(\"normalize-start\", { inputVertexCount: polygon.length, inputArea: __a2Area(polygon) });\n  const normalized = [];"
);
traced = traced.replace(
  "    const repaired = repairPhysicalEdge(resolvedStart, resolvedEnd);\n    if (!repaired) return null;\n    normalized.push(...repaired.slice(0, -1));",
  "    const repaired = repairPhysicalEdge(resolvedStart, resolvedEnd);\n    __a2Event(\"edge-result\", { edgeIndex: index, start: __a2Point(start), end: __a2Point(end), resolvedStart: __a2Point(resolvedStart), resolvedEnd: __a2Point(resolvedEnd), repairedVertexCount: repaired?.length ?? 0 });\n    if (!repaired) { __a2Event(\"normalize-abort\", { edgeIndex: index }); return null; }\n    normalized.push(...repaired.slice(0, -1));"
);
traced = traced.replace(
  "  return deduplicated.length >= 3 && area(deduplicated) >= MIN_AREA ? deduplicated : null;",
  "  const normalizedArea = area(deduplicated);\n  __a2Event(\"normalize-result\", { normalizedVertexCount: deduplicated.length, normalizedArea, meetsMinArea: normalizedArea >= MIN_AREA });\n  return deduplicated.length >= 3 && normalizedArea >= MIN_AREA ? deduplicated : null;"
);
traced += "\nexport function __traceNormalize(polygon) { __a2Trace.active = true; __a2Trace.events = []; const result = normalizePhysicalBoundary(polygon); return { result, trace: __a2Trace }; }\n";

writeFileSync(tempPath, traced, "utf8");
try {
  const rawPolygon = canonicalRawPolygon();
  const mod = await import(`${pathToFileURL(tempPath).href}?a2=${Date.now()}`);
  const tracedResult = mod.__traceNormalize(rawPolygon);
  const normalized = tracedResult.result;
  const events = tracedResult.trace.events;
  console.log(JSON.stringify({
    provinceId: "pontus-amisos",
    canonicalRaw: { vertexCount: rawPolygon.length, area: polygonArea(rawPolygon), polygon: rawPolygon },
    v15Normalization: { vertexCount: normalized?.length ?? 0, area: normalized ? polygonArea(normalized) : null, meetsMinArea: normalized ? polygonArea(normalized) >= 0.00005 : false, polygon: normalized },
    firstAreaCollapse: { inputArea: polygonArea(rawPolygon), outputArea: normalized ? polygonArea(normalized) : null, areaRatio: normalized ? polygonArea(normalized) / polygonArea(rawPolygon) : null },
    edgeResults: events.filter((event) => event.type === "edge-result"),
    repairEvents: events.filter((event) => event.type.startsWith("repair-")),
    normalizeEvents: events.filter((event) => event.type === "normalize-start" || event.type === "normalize-abort" || event.type === "normalize-result"),
  }, null, 2));
} finally {
  rmSync(tempPath, { force: true });
}
