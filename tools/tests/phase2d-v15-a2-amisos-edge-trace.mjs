import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = join(process.cwd(), "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const source = readFileSync(sourcePath, "utf8");
const tempRoot = mkdtempSync(join(tmpdir(), "historia-a2-trace-"));
const tempPath = join(dirname(sourcePath), "AnatoliaPhase2DGeometryBuilderV15.A2Trace.mjs");

const tracePrelude = `\nconst __a2Trace = globalThis.__A2_TRACE = { active: false, provinceId: null, edges: [], repairs: [], events: [] };\nfunction __a2Area(polygon) { let sum = 0; for (let i = 0; i < polygon.length; i += 1) { const n = polygon[(i + 1) % polygon.length]; sum += polygon[i][0] * n[1] - n[0] * polygon[i][1]; } return Math.abs(sum) / 2; }\nfunction __a2Point(point) { return point ? [Number(point[0]), Number(point[1])] : null; }\nfunction __a2Event(type, payload = {}) { if (__a2Trace.active) __a2Trace.events.push({ type, ...payload }); }\n`;

let traced = source.replace("const BBOX = [25.45, 35.72, 44.85, 42.35];", "const BBOX = [25.45, 35.72, 44.85, 42.35];" + tracePrelude);
traced = traced.replace(
  "function repairPhysicalEdge(start, end, depth = 0) {\n  if (edgeIsPhysical(start, end)) return [start, end];",
  "function repairPhysicalEdge(start, end, depth = 0) {\n  const repairId = __a2Trace.active ? __a2Trace.repairs.length : -1;\n  if (__a2Trace.active) __a2Trace.repairs.push({ repairId, depth, start: __a2Point(start), end: __a2Point(end), physicalBefore: edgeIsPhysical(start, end) });\n  if (edgeIsPhysical(start, end)) { __a2Event(\"repair-accepted\", { repairId, depth }); return [start, end]; }"
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
  "  if (!left || !right) { __a2Event(\"repair-child-failed\", { repairId, depth }); return null; }\n  const combined = [...left.slice(0, -1), ...right];\n  __a2Event(\"repair-combined\", { repairId, depth, vertexCount: combined.length });\n  return combined;"
);
traced = traced.replace(
  "function normalizePhysicalBoundary(polygon) {\n  const normalized = [];",
  "function normalizePhysicalBoundary(polygon) {\n  __a2Event(\"normalize-start\", { inputVertexCount: polygon.length, inputArea: __a2Area(polygon) });\n  const normalized = [];"
);
traced = traced.replace(
  "    const repaired = repairPhysicalEdge(resolvedStart, resolvedEnd);\n    if (!repaired) return null;\n    normalized.push(...repaired.slice(0, -1));",
  "    const repaired = repairPhysicalEdge(resolvedStart, resolvedEnd);\n    __a2Event(\"edge-result\", { edgeIndex: index, start: __a2Point(start), end: __a2Point(end), resolvedStart: __a2Point(resolvedStart), resolvedEnd: __a2Point(resolvedEnd), repairedVertexCount: repaired?.length ?? 0 });\n    if (!repaired) return null;\n    normalized.push(...repaired.slice(0, -1));"
);
traced = traced.replace(
  "  return deduplicated.length >= 3 && area(deduplicated) >= MIN_AREA ? deduplicated : null;",
  "  const normalizedArea = area(deduplicated);\n  __a2Event(\"normalize-result\", { normalizedVertexCount: deduplicated.length, normalizedArea, meetsMinArea: normalizedArea >= MIN_AREA });\n  return deduplicated.length >= 3 && normalizedArea >= MIN_AREA ? deduplicated : null;"
);
traced = traced.replace(
  "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;",
  "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    if (site.provinceId === \"pontus-amisos\") { __a2Trace.active = true; __a2Trace.provinceId = site.provinceId; __a2Trace.edges = []; __a2Trace.repairs = []; __a2Trace.events = []; __a2Event(\"raw-polygon\", { vertexCount: rawPolygon?.length ?? 0, rawArea: rawPolygon ? __a2Area(rawPolygon) : null, site: __a2Point(site.point) }); }\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;\n    if (site.provinceId === \"pontus-amisos\") __a2Event(\"post-normalize\", { polygonVertexCount: polygon?.length ?? 0, polygonArea: polygon ? __a2Area(polygon) : null });"
);
traced = traced.replace(
  "    result.set(site.provinceId, polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));",
  "    const serializedPolygon = polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);\n    if (site.provinceId === \"pontus-amisos\") __a2Event(\"serialized\", { vertexCount: serializedPolygon.length, area: __a2Area(serializedPolygon) });\n    result.set(site.provinceId, serializedPolygon);"
);
traced += "\nexport function __getA2Trace() { return globalThis.__A2_TRACE; }\n";

writeFileSync(tempPath, traced, "utf8");

try {
  const mod = await import(`${pathToFileURL(tempPath).href}?a2=${Date.now()}`);
  let buildError = null;
  let result = null;
  try {
    result = mod.buildAnatoliaPhase2DAssets([]);
  } catch (error) {
    buildError = { name: error?.name ?? "Error", message: error?.message ?? String(error) };
  }
  const trace = mod.__getA2Trace();
  const raw = trace.events.find((event) => event.type === "raw-polygon");
  const normalized = trace.events.find((event) => event.type === "normalize-result");
  const postNormalize = trace.events.find((event) => event.type === "post-normalize");
  const serialized = trace.events.find((event) => event.type === "serialized");
  if (!raw) throw new Error("A2 raw-polygon trace event missing");
  const finalGeometry = result?.geometries?.find((geometry) => geometry.identity.provinceId === "pontus-amisos")?.polygons?.[0] ?? null;
  const area = (polygon) => { let sum = 0; for (let i = 0; i < polygon.length; i += 1) { const n = polygon[(i + 1) % polygon.length]; sum += polygon[i][0] * n[1] - n[0] * polygon[i][1]; } return Math.abs(sum) / 2; };
  console.log(JSON.stringify({
    provinceId: "pontus-amisos",
    buildError,
    raw: { vertexCount: raw.vertexCount, area: raw.rawArea, site: raw.site },
    normalized: normalized ? { vertexCount: normalized.normalizedVertexCount, area: normalized.normalizedArea, meetsMinArea: normalized.meetsMinArea } : null,
    postNormalize: postNormalize ?? null,
    serialized: serialized ?? null,
    finalGeometry: finalGeometry ? { vertexCount: finalGeometry.length, area: area(finalGeometry) } : null,
    edgeResults: trace.events.filter((event) => event.type === "edge-result"),
    repairEvents: trace.events.filter((event) => event.type.startsWith("repair-")),
  }, null, 2));
} finally {
  rmSync(tempPath, { force: true });
  rmSync(tempRoot, { recursive: true, force: true });
}
