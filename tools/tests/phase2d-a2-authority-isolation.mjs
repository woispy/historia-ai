import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = process.env.CANONICAL_ROOT;
assert.ok(root, "CANONICAL_ROOT is required");
const fixture = join(root, "src/map/data/generated/anatolia-hydrography-10m.json");
const commit = "bdf166a42bdccf1ce4669488f3a84c97b9e2dc2e";
const wt = "/tmp/a2-authority-isolation";
rmSync(wt, { recursive: true, force: true });
const add = spawnSync("git", ["worktree", "add", "--detach", wt, commit], { cwd: root, encoding: "utf8" });
assert.equal(add.status, 0, add.stderr || add.stdout);

try {
  mkdirSync(join(wt, "src/map/data/generated"), { recursive: true });
  cpSync(fixture, join(wt, "src/map/data/generated/anatolia-hydrography-10m.json"));
  const builder = join(wt, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const original = readFileSync(builder, "utf8");
  const currentLand = /const PARTITION_LAND_POLYGONS=PHYSICAL_LAND_POLYGONS\.filter\(polygon=>polygon\.length>=3&&Math\.abs\(\(polygon\.reduce\(\(sum,point,index\)=>\{const next=polygon\[\(index\+1\)%polygon\.length\];return sum\+point\[0\]\*next\[1\]-next\[0\]\*point\[1\];\},0\)\)\/2\)>=MIN_AREA\);/;
  const oldLand = "const PARTITION_LAND_POLYGONS=ANATOLIA_PHYSICAL_ATLAS.landPolygons.filter(polygon=>polygon.length>=3&&Math.abs((polygon.reduce((sum,point,index)=>{const next=polygon[(index+1)%polygon.length];return sum+point[0]*next[1]-next[0]*point[1];},0))/2)>=MIN_AREA);";
  assert.ok(currentLand.test(original), "current physical-land partition declaration missing");
  writeFileSync(builder, original.replace(currentLand, oldLand));

  const code = `const m=await import(${JSON.stringify(`file://${builder}`)}+'?authorityIsolation='+Date.now()); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos missing'); const p=g.polygons?.[0]??[]; let s=0; for(let i=0;i<p.length;i++){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]} process.stdout.write(JSON.stringify({mode:'BDF_WITH_OLD_ATLAS_LAND',commit:${JSON.stringify(commit)},vertexCount:p.length,area:Math.abs(s)/2,polygon:p,siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion}));`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { cwd: wt, encoding: "utf8", maxBuffer: 64*1024*1024 });
  process.stderr.write(child.stderr);
  if(child.status!==0){process.stdout.write(JSON.stringify({mode:'BDF_WITH_OLD_ATLAS_LAND',commit,error:child.stderr||child.stdout||`exit ${child.status}`}));process.exitCode=child.status;}
  else process.stdout.write(child.stdout);
} finally { spawnSync("git", ["worktree", "remove", "--force", wt], { cwd: root, stdio: "inherit" }); }
