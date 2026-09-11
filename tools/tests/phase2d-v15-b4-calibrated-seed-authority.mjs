import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT, "CANONICAL_ROOT is required");

const FAILURE_EDGES = [
  { caseId: "B-01", provinceId: "bithynia-nicomedia", start: [29.87953,40.72476], end: [29.88817,40.72993] },
  { caseId: "B-02", provinceId: "bithynia-nicomedia", start: [29.88817,40.72993], end: [29.91915,40.71851] },
  { caseId: "B-03", provinceId: "bithynia-nicomedia", start: [29.94879,40.71649], end: [29.96697,40.7418] },
  { caseId: "B-04", provinceId: "bithynia-nicomedia", start: [29.87953,40.72476], end: [29.85423,40.7623] },
  { caseId: "B-05", provinceId: "bithynia-nicomedia", start: [29.96697,40.7418], end: [29.94879,40.71649] },
  { caseId: "B-06", provinceId: "bithynia-nicomedia", start: [29.99643,40.72103], end: [30.01852,40.70688] },
  { caseId: "B-07", provinceId: "bithynia-nicomedia", start: [30.01852,40.70688], end: [29.99643,40.72103] },
  { caseId: "B-08", provinceId: "bithynia-nicomedia", start: [30.02342,40.70087], end: [30.06008,40.71516] },
  { caseId: "B-09", provinceId: "bithynia-nicaea", start: [29.91915,40.71851], end: [29.88817,40.72993] },
];
const SAMPLE_COUNT = 64;
const TOPOLOGY_TOLERANCE = 2e-6;
function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function endpointMatch(a0,a1,b0,b1){return (dist(a0,b0)<=TOPOLOGY_TOLERANCE&&dist(a1,b1)<=TOPOLOGY_TOLERANCE)||(dist(a0,b1)<=TOPOLOGY_TOLERANCE&&dist(a1,b0)<=TOPOLOGY_TOLERANCE);}
function findEdge(edge,records){for(const record of records){for(let index=0;index<record.cell.length;index+=1){const p0=record.cell[index],p1=record.cell[(index+1)%record.cell.length];if(endpointMatch(edge.start,edge.end,p0,p1))return{siteIndex:record.siteIndex,provinceId:record.site?.provinceId??null,edgeIndex:index,p0,p1};}}return null;}
function firstInvalid(edge,predicate){for(let index=0;index<=SAMPLE_COUNT;index+=1){const fraction=index/SAMPLE_COUNT;const point=[edge.start[0]+(edge.end[0]-edge.start[0])*fraction,edge.start[1]+(edge.end[1]-edge.start[1])*fraction];if(!predicate(point))return{sampleIndex:index,fraction,point};}return null;}
function captureCanonicalUniverse(){
  const sourcePath=path.join(CANONICAL_ROOT,"tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const source=fs.readFileSync(sourcePath,"utf8");
  const marker="  const polygonsByProvince = Object.fromEntries(\n";
  const injected=source.replace(marker,"  globalThis.__B4_CAPTURED_SITES = sites.map((site) => ({ ...site, point: [...site.point] }));\n  globalThis.__B4_CAPTURED_RECORDS = [];\n\n"+marker).replace("    const cell = buildVoronoiCell(siteIndex, sites);\n","    const cell = buildVoronoiCell(siteIndex, sites);\n    if (sites[siteIndex]?.provinceId) globalThis.__B4_CAPTURED_RECORDS.push({ siteIndex, site: sites[siteIndex], cell });\n").replace("export { isPhysicalLandPoint };","export { isPhysicalLandPoint };\nexport function __b4GetCapture() { return { sites: globalThis.__B4_CAPTURED_SITES ?? [], records: globalThis.__B4_CAPTURED_RECORDS ?? [] }; }");
  assert.notEqual(injected,source,"B4 instrumentation did not modify canonical source");
  const tempPath=path.join(path.dirname(sourcePath),`.b4-canonical.${process.pid}.mjs`);fs.writeFileSync(tempPath,injected,"utf8");
  try{const code=`import * as m from ${JSON.stringify(`file://${tempPath}?b4=${process.pid}`)}; const r=m.buildAnatoliaPhase2DAssets([]); process.stdout.write(JSON.stringify(m.__b4GetCapture()));`;const child=spawnSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8",maxBuffer:64*1024*1024});if(child.status!==0)throw new Error(child.stderr||`canonical capture exited ${child.status}`);return JSON.parse(child.stdout);}finally{fs.rmSync(tempPath,{force:true});}
}
function loadV15PowerCell(){
  const sourcePath=path.join(process.cwd(),"tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source=fs.readFileSync(sourcePath,"utf8");
  const injected=source.replace("function buildPartition(sites, weights) {","export { powerCell };\n\nfunction buildPartition(sites, weights) {");
  assert.notEqual(injected,source,"B4 V15 instrumentation did not expose powerCell");
  const tempPath=path.join(path.dirname(sourcePath),`.b4-v15.${process.pid}.mjs`);fs.writeFileSync(tempPath,injected,"utf8");
  try{return import(`file://${tempPath}?b4=${process.pid}`);}finally{setTimeout(()=>fs.rmSync(tempPath,{force:true}),0);}
}
const canonical=captureCanonicalUniverse();
const sites=canonical.sites;const canonicalRecords=canonical.records;
assert.ok(sites.length>0,"Canonical site universe is empty");
const v15=await loadV15PowerCell();
const authority=await import("../historical-gis/recovery/physical-land-authority.mjs");
const zeroWeights=Object.fromEntries(sites.map((site,index)=>[site.provinceId??`__site_${index}`,0]));
const v15Records=[];
for(let siteIndex=0;siteIndex<sites.length;siteIndex+=1){const cell=v15.powerCell(siteIndex,sites,zeroWeights);if(cell.length>=3)v15Records.push({siteIndex,site:sites[siteIndex],cell});}
const matrix=FAILURE_EDGES.map((edge)=>{const canonicalHit=findEdge(edge,canonicalRecords);const v15Hit=findEdge(edge,v15Records);const canonicalAuthority=firstInvalid(edge,canonical.isPhysicalLandPoint??(()=>true));const v15Authority=firstInvalid(edge,authority.isPhysicalGeometryBoundaryPoint);return{...edge,canonicalHit,v15Hit,calibratedPowerCellMatch:Boolean(v15Hit),calibratedSameOwnerSeed:Boolean(canonicalHit&&v15Hit&&canonicalHit.siteIndex===v15Hit.siteIndex),canonicalFirstInvalid:canonicalAuthority,v15FirstInvalid:v15Authority,authorityDivergence:Boolean(canonicalAuthority)!==Boolean(v15Authority),endpointAuthority:{start:{canonical:canonical.isPhysicalLandPoint(edge.start),v15:authority.isPhysicalGeometryBoundaryPoint(edge.start)},end:{canonical:canonical.isPhysicalLandPoint(edge.end),v15:authority.isPhysicalGeometryBoundaryPoint(edge.end)}}};});
const summary={phase:"B4 — calibrated seed-universe equivalence",canonicalSiteCount:sites.length,canonicalPoliticalSiteCount:sites.filter((site)=>Boolean(site.provinceId)).length,v15CalibratedSiteCount:sites.length,counts:{canonicalEdgesFound:matrix.filter((item)=>item.canonicalHit).length,v15EdgesFoundWithSameCanonicalSeedUniverse:matrix.filter((item)=>item.v15Hit).length,sameOwnerSeed:matrix.filter((item)=>item.calibratedSameOwnerSeed).length,authorityDivergence:matrix.filter((item)=>item.authorityDivergence).length},matrix};
console.log(JSON.stringify(summary,null,2));
