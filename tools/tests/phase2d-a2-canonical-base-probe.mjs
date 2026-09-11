import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const repoRoot = process.cwd();
const commit = "837ec8dd2d878ceb227f609c3da481610b54d0db";
const worktree = "/tmp/a2-canonical-base-837";
const fixture = join(repoRoot, "src/map/data/generated/anatolia-hydrography-10m.json");

rmSync(worktree, { recursive: true, force: true });
const add = spawnSync("git", ["worktree", "add", "--detach", worktree, commit], { encoding: "utf8" });
assert.equal(add.status, 0, add.stderr || add.stdout);

try {
  mkdirSync(join(worktree, "src/map/data/generated"), { recursive: true });
  cpSync(fixture, join(worktree, "src/map/data/generated/anatolia-hydrography-10m.json"));

  // Forensic-only harness patch: the 837 builder aborts the entire build when
  // an unrelated province (currently Nicaea) has no fallback geometry. Replace
  // that throw with a continue so the historical builder can finish constructing
  // the remaining provinces, allowing us to measure Amisos without changing the
  // historical algorithm itself.
  const builder = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const original = readFileSync(builder, "utf8");
  const marker = 'if (fallback.length < 3) throw new Error(`Phase 2D produced no physically valid geometry for ${metadata.id}`);';
  assert.equal((original.match(new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length, 1, "expected canonical 837 fallback throw marker exactly once");
  writeFileSync(builder, original.replace(marker, "if (fallback.length < 3) continue;"));

  const code = `const m=await import(${JSON.stringify(`file://${builder}`)}+'?a2base='+Date.now()); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos geometry missing'); const p=g.polygons?.[0]??[]; let s=0; for(let i=0;i<p.length;i++){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]} process.stdout.write(JSON.stringify({commit:${JSON.stringify(commit)},vertexCount:p.length,area:Math.abs(s)/2,polygon:p,siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion,fallbackProvinceCount:r.fallbackProvinceCount}));`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (child.status !== 0) {
    console.error(child.stderr || child.stdout || `exit ${child.status}`);
    process.exit(child.status || 1);
  }
  console.log(JSON.stringify({ phase: "A2 canonical-base 837 Amisos probe", result: JSON.parse(child.stdout) }, null, 2));
} finally {
  spawnSync("git", ["worktree", "remove", "--force", worktree], { encoding: "utf8" });
}
