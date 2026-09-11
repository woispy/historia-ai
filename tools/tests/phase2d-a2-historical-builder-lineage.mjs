import { spawnSync } from "node:child_process";
import { join } from "node:path";
import assert from "node:assert/strict";

const roots = JSON.parse(process.env.A2_HISTORICAL_ROOTS ?? "[]");
assert.ok(roots.length, "A2_HISTORICAL_ROOTS is required");

function runRoot(root) {
  const builder = join(root.path, "tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const code = `const m=await import(${JSON.stringify(`file://${builder}`)}+'?a2lineage='+Date.now()); const r=m.buildAnatoliaPhase2DAssets([]); const g=r.geometries.find(x=>x.identity.provinceId==='pontus-amisos'); if(!g) throw new Error('Amisos geometry missing'); const p=g.polygons?.[0]??[]; let s=0; for(let i=0;i<p.length;i++){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]} process.stdout.write(JSON.stringify({vertexCount:p.length,area:Math.abs(s)/2,polygon:p,siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,geometryVersion:r.geometryVersion}));`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", code], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (child.status !== 0) return { error: child.stderr || child.stdout || `exit ${child.status}` };
  return JSON.parse(child.stdout);
}

const results = roots.map((root) => ({ commit: root.commit, path: root.path, ...runRoot(root) }));
console.log(JSON.stringify({ phase: "A2 historical builder lineage", provinceId: "pontus-amisos", results }, null, 2));
