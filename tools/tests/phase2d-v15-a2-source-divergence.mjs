import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
if (!CANONICAL_ROOT) throw new Error("CANONICAL_ROOT is required");

function area(polygon) {
  if (!polygon?.length) return 0;
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const n = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * n[1] - n[0] * polygon[i][1];
  }
  return Math.abs(sum) / 2;
}

function canonicalRaw() {
  const builder = join(CANONICAL_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const code = `const original=Number.prototype.toFixed; Number.prototype.toFixed=function(d){if(d===5)return String(Number(this));return original.call(this,d)}; const m=await import(${JSON.stringify(pathToFileURL(builder).href)}); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity.provinceId===\"pontus-amisos\"); process.stdout.write(JSON.stringify(g.polygons[0]));`;
  const c = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (c.status !== 0) throw new Error(c.stderr || "canonical probe failed");
  return JSON.parse(c.stdout);
}

const sourcePath = join(process.cwd(), "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const source = readFileSync(sourcePath, "utf8");
const tempPath = join(dirname(sourcePath), `.AnatoliaPhase2DGeometryBuilderV15.a2-source.${process.pid}.mjs`);
const prelude = `\nconst __A2=[];\nfunction __a2Area(p){if(!p?.length)return 0;let s=0;for(let i=0;i<p.length;i+=1){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]}return Math.abs(s)/2}\nfunction __a2Rec(stage,payload={}){__A2.push({stage,...payload})}\n`;
let traced = source.replace("const BBOX = [25.45, 35.72, 44.85, 42.35];", "const BBOX = [25.45, 35.72, 44.85, 42.35];" + prelude);
traced = traced.replace(
  "function buildPartition(sites, weights) {\n  const result = new Map();",
  "function buildPartition(sites, weights) {\n  const result = new Map();\n  __a2Rec(\"build-partition-start\", { weightAmisos: weights[\"pontus-amisos\"] ?? null });"
);
traced = traced.replace(
  "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;",
  "    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    if (site.provinceId === \"pontus-amisos\") __a2Rec(\"partition-raw\", { vertexCount: rawPolygon?.length ?? 0, area: __a2Area(rawPolygon), polygon: rawPolygon ?? null, site: site.point, weight: weights[site.provinceId] ?? null });\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;\n    if (site.provinceId === \"pontus-amisos\") __a2Rec(\"partition-normalized\", { vertexCount: polygon?.length ?? 0, area: __a2Area(polygon), polygon: polygon ?? null });"
);
traced = traced.replace(
  "  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };",
  "  return { weights, partition, iterations: MAX_WEIGHT_ITERATIONS };"
);
traced += "\nexport function __getA2(){return __A2;}\n";
writeFileSync(tempPath, traced, "utf8");
try {
  const mod = await import(`${pathToFileURL(tempPath).href}?a2=${Date.now()}`);
  let error = null;
  let result = null;
  try { result = mod.buildAnatoliaPhase2DAssets([]); } catch (e) { error = { name: e?.name ?? "Error", message: e?.message ?? String(e) }; }
  const records = mod.__getA2();
  const rawRecords = records.filter(r => r.stage === "partition-raw");
  const normalizedRecords = records.filter(r => r.stage === "partition-normalized");
  console.log(JSON.stringify({
    provinceId: "pontus-amisos",
    canonicalRaw: (() => { const p=canonicalRaw(); return {vertexCount:p.length,area:area(p)}; })(),
    v15: {
      error,
      buildPartitionPasses: records.filter(r=>r.stage==="build-partition-start").length,
      amisosRawPasses: rawRecords.map(r=>({vertexCount:r.vertexCount,area:r.area,weight:r.weight,site:r.site,polygon:r.polygon})),
      amisosNormalizedPasses: normalizedRecords.map(r=>({vertexCount:r.vertexCount,area:r.area,polygon:r.polygon})),
      finalGeometry: result?.geometries?.find(g=>g.identity.provinceId==="pontus-amisos")?.polygons?.[0] ?? null
    }
  }, null, 2));
} finally { rmSync(tempPath,{force:true}); }
