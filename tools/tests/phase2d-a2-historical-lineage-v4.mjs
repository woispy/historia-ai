import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const canonical = "d485105d9fbde1933238e9121393a7fc07e1e3dd";
const fixture = join(root, "src/map/data/generated/anatolia-hydrography-10m.json");
const checkpoints = [
  ["5f48731eec9804e99abd9ce60ea7f0b5d3ef5713", "V0_old-land_correct-halfplane"],
  ["bdf166a42bdccf1ce4669488f3a84c97b9e2dc2e", "V1_new-land_broken-halfplane"],
  ["3021b2d1104c8ea9e9f700435c453adf5f1ae4e8", "V2_new-land_correct-halfplane"],
  [canonical, "CANONICAL_D485"],
];

function area(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return null;
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * next[1] - next[0] * polygon[i][1];
  }
  return Math.abs(sum) / 2;
}

function instrument(source) {
  let output = source;
  const traces = [
    ["const rawPolygon=clipCellToLand(cell,site.point)[0];", "const rawPolygon = clipCellToLand(cell, site.point)[0];"],
    ["const normalizedPolygon=rawPolygon?normalizePhysicalBoundary(rawPolygon):null;", "const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;", "const polygon=rawPolygon?normalizePhysicalBoundary(rawPolygon):null;"],
  ];
  const rawNeedle = traces[0].find((needle) => output.includes(needle));
  assert.ok(rawNeedle, "raw clip marker not found");
  output = output.replace(rawNeedle, `${rawNeedle}
    if (site.provinceId === "pontus-amisos") console.error("A2_STAGE_RAW", JSON.stringify({ vertexCount: rawPolygon?.length ?? 0, area: polygonAreaForTrace(rawPolygon), polygon: rawPolygon }));`);
  const normalizedNeedle = traces[1].find((needle) => output.includes(needle));
  if (normalizedNeedle) {
    output = output.replace(normalizedNeedle, `${normalizedNeedle}
    if (site.provinceId === "pontus-amisos") console.error("A2_STAGE_NORMALIZED", JSON.stringify({ vertexCount: (typeof normalizedPolygon !== "undefined" ? normalizedPolygon : polygon)?.length ?? 0, area: polygonAreaForTrace(typeof normalizedPolygon !== "undefined" ? normalizedPolygon : polygon), polygon: typeof normalizedPolygon !== "undefined" ? normalizedPolygon : polygon }));`);
  }
  const finalNeedles = [
    "result.set(site.provinceId,polygon.map(([x,y])=>[x,y]));",
    "result.set(site.provinceId, polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));",
  ];
  const finalNeedle = finalNeedles.find((needle) => output.includes(needle));
  if (finalNeedle) {
    output = output.replace(finalNeedle, `if (site.provinceId === "pontus-amisos") console.error("A2_STAGE_FINAL", JSON.stringify({ vertexCount: polygon?.length ?? 0, area: polygonAreaForTrace(polygon), polygon }));\n    ${finalNeedle}`);
  }
  const prelude = `function polygonAreaForTrace(polygon){ if(!Array.isArray(polygon)||polygon.length<3)return null; let s=0; for(let i=0;i<polygon.length;i+=1){const n=polygon[(i+1)%polygon.length];s+=polygon[i][0]*n[1]-n[0]*polygon[i][1];} return Math.abs(s)/2;}\n`;
  return prelude + output;
}

function runCheckpoint(commit, label) {
  const wt = join("/tmp", `a2-lineage-${label}`);
  rmSync(wt, { recursive: true, force: true });
  const add = spawnSync("git", ["worktree", "add", "--detach", wt, commit], { cwd: root, encoding: "utf8" });
  if (add.status !== 0) return { commit, label, error: add.stderr || add.stdout || `worktree add exit ${add.status}` };
  try {
    mkdirSync(join(wt, "src/map/data/generated"), { recursive: true });
    cpSync(fixture, join(wt, "src/map/data/generated/anatolia-hydrography-10m.json"));
    const builder = join(wt, label === "CANONICAL_D485" ? "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js" : "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
    if (!requireFile(builder)) return { commit, label, error: `builder missing: ${builder}` };
    const original = readFileSync(builder, "utf8");
    let instrumented;
    try { instrumented = instrument(original); } catch (error) { return { commit, label, error: `instrumentation unavailable: ${error.message}` }; }
    const tempBuilder = join(wt, "tools/historical-gis", `.a2-lineage-${process.pid}.mjs`);
    writeFileSync(tempBuilder, instrumented, "utf8");
    const code = `const m=await import(${JSON.stringify(`file://${tempBuilder}`)}+'?a2='+Date.now()); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries?.find(x=>x.identity?.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos geometry missing'); const p=g.polygons?.[0]??[]; process.stdout.write(JSON.stringify({commit:${JSON.stringify(commit)},label:${JSON.stringify(label)},vertexCount:p.length,area:${area.toString()}(p),siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion}));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: wt, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    return { commit, label, status: child.status, stdout: child.stdout, stderr: child.stderr };
  } finally {
    spawnSync("git", ["worktree", "remove", "--force", wt], { cwd: root, stdio: "inherit" });
  }
}

function requireFile(file) {
  try { readFileSync(file); return true; } catch { return false; }
}

const fetch = spawnSync("git", ["fetch", "--no-tags", "origin", canonical, ...checkpoints.slice(0,3).map(([sha])=>sha)], { cwd: root, encoding: "utf8" });
assert.equal(fetch.status, 0, fetch.stderr || fetch.stdout);
assert.ok(requireFile(fixture), "runtime hydrography fixture missing; run build:assets first");

const results = checkpoints.map(([commit, label]) => runCheckpoint(commit, label));
const tinyHits = results.filter((result) => {
  const text = `${result.stdout || ""}\n${result.stderr || ""}`;
  return text.includes("2.27e-13") || /2\.27e-13/.test(text);
});

console.log(JSON.stringify({
  phase: "A2 historical checkpoint lineage execution",
  canonicalBaseline: canonical,
  targetArea: 2.27e-13,
  checkpoints: results,
  tinyAreaHits: tinyHits.length,
  conclusion: tinyHits.length > 0
    ? "A historical checkpoint execution produced the target tiny-area value and requires exact stage tracing."
    : "No executed checkpoint reproduced the target tiny-area value; producer lineage remains open.",
}, null, 2));
