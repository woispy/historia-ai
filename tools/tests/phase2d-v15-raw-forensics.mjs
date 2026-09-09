import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const TARGETS = new Set(["pontus-amasya", "lydia-smyrna", "ionia-ayasuluk", "caria-pecin", "caria-halikarnassos", "pontus-sinop", "pontus-amisos", "bithynia-nicomedia", "bithynia-nicaea"]);
const areaSource = `function __forensicArea(polygon) { let sum = 0; for (let i = 0; i < polygon.length; i += 1) { const n = polygon[(i + 1) % polygon.length]; sum += polygon[i][0] * n[1] - n[0] * polygon[i][1]; } return Math.abs(sum) / 2; }`;

function instrument(source) {
  const prelude = `\n${areaSource}\nconst __FORENSICS = [];\nconst __record = (stage, payload) => { if (!payload?.provinceId || ${JSON.stringify([...TARGETS])}.includes(payload.provinceId)) __FORENSICS.push({ stage, ...payload }); };\n`;
  let s = source.replace("const rawAnchor = (item) =>", `${prelude}\nconst rawAnchor = (item) =>`);
  s = s.replace("function clipCellToLand(cell, anchorPoint) {", "function clipCellToLand(cell, anchorPoint) { __record(\"clip-input\", { anchorPoint: [...anchorPoint], cellVertexCount: cell.length });");
  s = s.replace("  return selected ? [selected] : [];\n}", "  __record(\"clip-output\", { anchorPoint: [...anchorPoint], candidateCount: candidates.length, containingCount: containing.length, candidateAreas: candidates.map(__forensicArea).sort((a,b)=>b-a), selectedArea: selected ? __forensicArea(selected) : null, selectedVertexCount: selected?.length ?? 0 });\n  return selected ? [selected] : [];\n}");
  s = s.replace("function normalizePhysicalBoundary(polygon) {\n  const normalized = [];", "function normalizePhysicalBoundary(polygon) { __record(\"normalize-input\", { inputVertexCount: polygon.length, inputArea: __forensicArea(polygon) });\n  const normalized = [];");
  s = s.replace("    if (!resolvedStart || !resolvedEnd) return null;", "    if (!resolvedStart || !resolvedEnd) { __record(\"normalize-endpoint-failure\", { edgeIndex: index, start, end }); return null; }");
  s = s.replace("    if (!repaired) return null;", "    if (!repaired) { __record(\"normalize-edge-repair-failure\", { edgeIndex: index, start: resolvedStart, end: resolvedEnd }); return null; }");
  s = s.replace("  return deduplicated.length >= 3 && area(deduplicated) >= MIN_AREA ? deduplicated : null;\n}", "  const postDedupArea = __forensicArea(deduplicated);\n  __record(\"normalize-output\", { inputVertexCount: polygon.length, normalizedVertexCount: normalized.length, deduplicatedVertexCount: deduplicated.length, removedDuplicateCount: normalized.length - deduplicated.length, preDedupArea: __forensicArea(normalized), postDedupArea, minArea: MIN_AREA, vertexCollapse: deduplicated.length < 3, areaCollapse: postDedupArea < MIN_AREA });\n  return deduplicated.length >= 3 && postDedupArea >= MIN_AREA ? deduplicated : null;\n}");
  s = s.replace("    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;", "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    __record(\"partition-raw\", { provinceId: site.provinceId, vertexCount: rawPolygon?.length ?? 0, area: rawPolygon ? __forensicArea(rawPolygon) : null, polygon: rawPolygon ?? null });\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;\n    __record(\"partition-normalized\", { provinceId: site.provinceId, valid: Boolean(polygon), vertexCount: polygon?.length ?? 0, area: polygon ? __forensicArea(polygon) : null });");
  s = s.replace("    if (!polygon || !edgeOnPhysicalLand(polygon)) throw new Error(`Phase 2D V15 produced invalid physical-land geometry: ${site.provinceId}`);\n    result.set(site.provinceId, polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));", "    if (!polygon || !edgeOnPhysicalLand(polygon)) { __record(\"validation-failure\", { provinceId: site.provinceId, vertexCount: polygon?.length ?? 0, area: polygon ? __forensicArea(polygon) : null, polygon: polygon ?? null }); throw new Error(`Phase 2D V15 produced invalid physical-land geometry: ${site.provinceId}`); }\n    const serialized = polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]);\n    __record(\"serialization\", { provinceId: site.provinceId, preRoundVertexCount: polygon.length, preRoundArea: __forensicArea(polygon), postRoundVertexCount: serialized.length, postRoundArea: __forensicArea(serialized), polygon, serializedPolygon: serialized });\n    result.set(site.provinceId, serialized);");
  s = s.replace("export { isPhysicalLandPoint };", "export { isPhysicalLandPoint, __FORENSICS };");
  return s;
}

const sourcePath = path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const source = fs.readFileSync(sourcePath, "utf8");
const tempPath = path.join(path.dirname(sourcePath), `.AnatoliaPhase2DGeometryBuilderV15.forensics.${process.pid}.mjs`);
fs.writeFileSync(tempPath, instrument(source), "utf8");

let mod;
try {
  mod = await import(`file://${tempPath}`);
  let failure = null;
  try { mod.buildAnatoliaPhase2DAssets(); } catch (error) { failure = error; }
  assert.ok(failure, "Expected unmodified V15 pipeline to fail so forensic capture can execute");
  assert.match(String(failure.message), /Phase 2D V15 produced invalid physical-land geometry/);
  const records = mod.__FORENSICS;
  assert.ok(records.length > 0, "No V15 forensic records captured");
  const stageCounts = Object.fromEntries([...new Set(records.map((r) => r.stage))].map((stage) => [stage, records.filter((r) => r.stage === stage).length]));
  console.log(JSON.stringify({ failure: failure.message, stageCounts, records }, null, 2));
} finally {
  fs.rmSync(tempPath, { force: true });
}
