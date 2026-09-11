import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");
const fixture = join(root, "src/map/data/generated/anatolia-hydrography-10m.json");
const checkpoints = [
  ["5f48731eec9804e99abd9ce60ea7f0b5d3ef5713", "V0_5f_correct-old"],
  ["bdf166a42bdccf1ce4669488f3a84c97b9e2dc2e", "V1_bdf_broken-new"],
  ["3021b2d1104c8ea9e9f700435c453adf5f1ae4e8", "V2_3021_correct-new"],
];
const worktreeBase = "/tmp/a2-counterfactual";
rmSync(worktreeBase, { recursive: true, force: true });
mkdirSync(worktreeBase, { recursive: true });

function area(polygon) {
  let s = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const n = polygon[(i + 1) % polygon.length];
    s += polygon[i][0] * n[1] - n[0] * polygon[i][1];
  }
  return Math.abs(s) / 2;
}

function run(commit, label) {
  const wt = join(worktreeBase, label);
  const add = spawnSync("git", ["worktree", "add", "--detach", wt, commit], { cwd: root, encoding: "utf8" });
  assert.equal(add.status, 0, add.stderr || add.stdout);
  try {
    mkdirSync(join(wt, "src/map/data/generated"), { recursive: true });
    cpSync(fixture, join(wt, "src/map/data/generated/anatolia-hydrography-10m.json"));
    const builder = join(wt, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
    const source = readFileSync(builder, "utf8");
    const marker = "const solved=solveWeights(controlSites)";
    assert.ok(source.includes(marker), `${label}: builder marker missing`);
    const trace = `const __a2TraceOriginalBuildPartition=buildPartition; buildPartition=(sites,weights)=>{const r=__a2TraceOriginalBuildPartition(sites,weights);const g=r.get("pontus-amisos");if(g)console.error("A2_STAGE_FINAL",JSON.stringify({stage:"partition",label:${JSON.stringify(label)},vertexCount:g.length,area:${"area"}(g),polygon:g}));return r;};`;
    writeFileSync(builder, source.replace(marker, `${trace} ${marker}`));
    const code = `const m=await import(${JSON.stringify(`file://${builder}`)}+'?counterfactual='+Date.now()); const r=m.buildAnatoliaPhase2DAssets(); const g=r.geometries.find(x=>x.identity.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos missing'); const p=g.polygons?.[0]??[]; process.stdout.write(JSON.stringify({commit:${JSON.stringify(commit)},label:${JSON.stringify(label)},vertexCount:p.length,area:${"area"}(p),polygon:p,siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion}));`;
    const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: wt, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
    process.stderr.write(child.stderr);
    if (child.status !== 0) return { commit, label, error: child.stderr || child.stdout || `exit ${child.status}` };
    return JSON.parse(child.stdout);
  } finally {
    spawnSync("git", ["worktree", "remove", "--force", wt], { cwd: root, stdio: "inherit" });
  }
}

const results = checkpoints.map(([commit, label]) => run(commit, label));
console.log(JSON.stringify({ phase: "A2 counterfactual land/half-plane checkpoints", results }, null, 2));
