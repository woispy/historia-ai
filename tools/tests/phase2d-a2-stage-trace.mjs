import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.GITHUB_WORKSPACE || process.cwd();
const fixture = join(root, "src/map/data/generated/anatolia-hydrography-10m.json");
const checkpoints = [
  ["5f48731eec9804e99abd9ce60ea7f0b5d3ef5713", "V0_old-land_correct-halfplane"],
  ["bdf166a42bdccf1ce4669488f3a84c97b9e2dc2e", "V1_new-land_broken-halfplane"],
  ["3021b2d1104c8ea9e9f700435c453adf5f1ae4e8", "V2_new-land_correct-halfplane"],
  ["6b7424125eee4a1c72925b7a1780c68e695e9ba3", "CANONICAL"],
];

function polygonArea(polygon) {
  if (!Array.isArray(polygon) || polygon.length < 3) return null;
  let sum = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const next = polygon[(i + 1) % polygon.length];
    sum += polygon[i][0] * next[1] - next[0] * polygon[i][1];
  }
  return Math.abs(sum) / 2;
}

function instrument(source) {
  const needles = [
    "const rawPolygon=clipCellToLand(cell,site.point)[0];",
    "const rawPolygon = clipCellToLand(cell, site.point)[0];",
  ];
  const needle = needles.find((value) => source.includes(value));
  assert.ok(needle, "buildPartition rawPolygon marker missing");
  const trace = `${needle}\n    if (site.provinceId === \"pontus-amisos\") { console.error(\"A2_STAGE_RAW\", JSON.stringify({ vertexCount: rawPolygon?.length ?? 0, area: polygonArea(rawPolygon), polygon: rawPolygon })); }`;
  let instrumented = source.replace(needle, trace);
  const normalizedNeedles = [
    "const normalizedPolygon=rawPolygon?normalizePhysicalBoundary(rawPolygon):null;",
    "const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;",
    "const polygon=rawPolygon?normalizePhysicalBoundary(rawPolygon):null;",
  ];
  const normalizedNeedle = normalizedNeedles.find((value) => instrumented.includes(value));
  if (normalizedNeedle) {
    instrumented = instrumented.replace(normalizedNeedle, `${normalizedNeedle}\n    if (site.provinceId === \"pontus-amisos\") { console.error(\"A2_STAGE_NORMALIZED\", JSON.stringify({ vertexCount: normalizedPolygon?.length ?? polygon?.length ?? 0, area: polygonArea(normalizedPolygon ?? polygon), polygon: normalizedPolygon ?? polygon })); }`);
  }
  const resultNeedles = [
    "result.set(site.provinceId,polygon.map(([x,y])=>[x,y]));",
    "result.set(site.provinceId, polygon.map(([x, y]) => [Number(x.toFixed(5)), Number(y.toFixed(5))]));",
  ];
  const resultNeedle = resultNeedles.find((value) => instrumented.includes(value));
  if (resultNeedle) {
    instrumented = instrumented.replace(resultNeedle, `if (site.provinceId === \"pontus-amisos\") { console.error(\"A2_STAGE_FINAL\", JSON.stringify({ vertexCount: polygon?.length ?? 0, area: polygonArea(polygon), polygon })); }\n    ${resultNeedle}`);
  }
  return instrumented;
}

const output = [];
for (const [commit, label] of checkpoints) {
  const worktree = `/tmp/a2-stage-trace-${label}`;
  rmSync(worktree, { recursive: true, force: true });
  const wt = spawnSync("git", ["worktree", "add", "--detach", worktree, commit], { cwd: root, encoding: "utf8" });
  assert.equal(wt.status, 0, wt.stderr || wt.stdout);
  try {
    mkdirSync(join(worktree, "src/map/data/generated"), { recursive: true });
    cpSync(fixture, join(worktree, "src/map/data/generated/anatolia-hydrography-10m.json"));
    const builder = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
    const original = readFileSync(builder, "utf8");
    writeFileSync(builder, instrument(original));
    const code = `import(${JSON.stringify(`file://${builder}`)}+'?a2stage='+Date.now()).then(async m=>{const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity?.provinceId==='pontus-amisos'||x.identity?.id==='pontus-amisos'); if(g){const p=g.polygons?.[0]??[]; process.stdout.write(JSON.stringify({vertexCount:p.length,area:${polygonArea.toString()}(p),polygon:p}));}}).catch(e=>{console.error('A2_STAGE_ERROR',e.message);process.exitCode=1;});`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: worktree, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: process.env });
    output.push({ commit, label, status: child.status, stdout: child.stdout, stderr: child.stderr });
  } finally {
    spawnSync("git", ["worktree", "remove", "--force", worktree], { cwd: root, stdio: "inherit" });
  }
}
process.stdout.write(JSON.stringify(output, null, 2));
