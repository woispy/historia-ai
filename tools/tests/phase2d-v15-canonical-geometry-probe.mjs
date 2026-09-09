import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");
const TARGETS = ["lydia-smyrna", "ionia-ayasuluk", "caria-pecin", "caria-halikarnassos", "pontus-sinop", "pontus-amisos"];
function area(p){let s=0;for(let i=0;i<p.length;i++){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1];}return Math.abs(s)/2;}
function run(raw){const code=`if (${raw}) { const original=Number.prototype.toFixed; Number.prototype.toFixed=function(d){if(d===5)return String(Number(this));return original.call(this,d)}; } const m=await import(${JSON.stringify(`${CANONICAL_ROOT}/tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js`)}); const r=m.buildAnatoliaPhase2DAssets([]); process.stdout.write(JSON.stringify(Object.fromEntries(r.geometries.map(g=>[g.identity.provinceId,g.polygons[0]]))));`;const c=spawnSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8",maxBuffer:64*1024*1024});if(c.status!==0)throw new Error(c.stderr);return JSON.parse(c.stdout);}
const serialized=run(false);const raw=run(true);assert.equal(Object.keys(serialized).length,38);assert.equal(Object.keys(raw).length,38);
const report=Object.fromEntries(TARGETS.map(id=>{const r=raw[id],s=serialized[id];return[id,{rawVertexCount:r.length,rawArea:area(r),serializedVertexCount:s.length,serializedArea:area(s),areaDelta:area(s)-area(r),rawMeetsMinArea:area(r)>=0.00005,serializedMeetsMinArea:area(s)>=0.00005}] }));
console.log(JSON.stringify({geometryCount:38,targets:report},null,2));
