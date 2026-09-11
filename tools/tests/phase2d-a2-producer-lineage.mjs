import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
const fixture = join(root, "src/map/data/generated/anatolia-hydrography-10m.json");
const commit = "6b7424125eee4a1c72925b7a1780c68e695e9ba3";
const worktree = "/tmp/a2-producer-lineage-6b742412";
rmSync(worktree, { recursive: true, force: true });
spawnSync("git", ["worktree", "add", "--detach", worktree, commit], { cwd: root, stdio: "inherit" });
try {
  mkdirSync(join(worktree, "src/map/data/generated"), { recursive: true });
  cpSync(fixture, join(worktree, "src/map/data/generated/anatolia-hydrography-10m.json"));
  const builder = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const original = readFileSync(builder, "utf8");
  const needle = "return polygon;";
  assert.ok(original.includes(needle), "builder polygon return marker missing");
  const injected = original.replace(needle, `if (Array.isArray(polygon) && polygon.length >= 3) {\n    const p = polygon; let s = 0;\n    for (let i = 0; i < p.length; i += 1) { const n = p[(i + 1) % p.length]; s += p[i][0] * n[1] - n[0] * p[i][1]; }\n    if (process.env.A2_TRACE_PROVINCE === "pontus-amisos") console.error("A2_TRACE_POWER_CELL", JSON.stringify({ vertexCount: p.length, area: Math.abs(s) / 2, polygon: p }));\n  }\n  ${needle}`);
  writeFileSync(builder, injected);
  const code = `const m=await import(${JSON.stringify(`file://${builder}`)}+'?a2producer='+Date.now()); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos geometry missing'); const p=g.polygons?.[0]??[]; let s=0; for(let i=0;i<p.length;i++){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]} process.stdout.write(JSON.stringify({commit:${JSON.stringify(commit)},vertexCount:p.length,area:Math.abs(s)/2,polygon:p,siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion}));`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024, env: { ...process.env, A2_TRACE_PROVINCE: "pontus-amisos" } });
  process.stdout.write(child.stdout);
  process.stderr.write(child.stderr);
  if (child.status !== 0) process.exitCode = child.status;
} finally {
  spawnSync("git", ["worktree", "remove", "--force", worktree], { cwd: root, stdio: "inherit" });
}
