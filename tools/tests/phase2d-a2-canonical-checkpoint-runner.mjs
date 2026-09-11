import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");
const fixture = join(root, "src/map/data/generated/anatolia-hydrography-10m.json");
const checkpoints = JSON.parse(process.env.A2_CHECKPOINTS ?? "[]");
assert.ok(checkpoints.length, "A2_CHECKPOINTS is required");

const out = [];
for (const commit of checkpoints) {
  const worktree = `/tmp/a2-checkpoint-${commit.slice(0, 8)}`;
  rmSync(worktree, { recursive: true, force: true });
  const wt = spawnSync("git", ["worktree", "add", "--detach", worktree, commit], { cwd: root, encoding: "utf8" });
  if (wt.status !== 0) {
    out.push({ commit, error: wt.stderr || wt.stdout || `worktree exit ${wt.status}` });
    continue;
  }
  try {
    mkdirSync(join(worktree, "src/map/data/generated"), { recursive: true });
    spawnSync("cp", [fixture, join(worktree, "src/map/data/generated/anatolia-hydrography-10m.json")], { encoding: "utf8" });
    const builder = join(worktree, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
    let source = readFileSync(builder, "utf8");
    const loop = "for (const metadata of ANATOLIA_PROVINCE_METADATA) {";
    assert.ok(source.includes(loop), `${commit}: metadata loop missing`);
    source = source.replace(loop, "for (const metadata of ANATOLIA_PROVINCE_METADATA.filter((item) => item.id === 'pontus-amisos')) {");
    writeFileSync(builder, source);
    const code = `const m=await import(${JSON.stringify(`file://${builder}`)}+'?a2checkpoint='+Date.now()); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos geometry missing'); const p=g.polygons?.[0]??[]; let s=0; for(let i=0;i<p.length;i++){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]} process.stdout.write(JSON.stringify({commit:${JSON.stringify(commit)},vertexCount:p.length,area:Math.abs(s)/2,polygon:p,siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion,fallbackProvinceCount:r.fallbackProvinceCount}));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024, env: { ...process.env } });
    if (child.status !== 0) out.push({ commit, error: child.stderr || child.stdout || `builder exit ${child.status}` });
    else out.push(JSON.parse(child.stdout));
  } finally {
    spawnSync("git", ["worktree", "remove", "--force", worktree], { cwd: root, stdio: "inherit" });
  }
}

console.log(JSON.stringify({ phase: "A2 focused canonical checkpoint runner", provinceId: "pontus-amisos", checkpoints: out }, null, 2));
