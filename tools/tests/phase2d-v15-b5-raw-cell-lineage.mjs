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

function dist(a,b){return Math.hypot(a[0]-b[0],a[1]-b[1]);}
function area(poly){let s=0;for(let i=0;i<poly.length;i+=1){const a=poly[i],b=poly[(i+1)%poly.length];s+=a[0]*b[1]-b[0]*a[1];}return Math.abs(s)/2;}
function midpoint(edge){return [(edge.start[0]+edge.end[0])/2,(edge.start[1]+edge.end[1])/2];}
function nearestSiteIndices(point,sites,count=2){return sites.map((site,index)=>({index,distance:dist(point,site.point)})).sort((a,b)=>a.distance-b.distance).slice(0,count).map((item)=>item.index);}
function directedVertexDistance(a,b){if(!a?.length||!b?.length)return Infinity;return Math.max(...a.map((p)=>Math.min(...b.map((q)=>dist(p,q)))));}
function symmetricVertexDistance(a,b){return Math.max(directedVertexDistance(a,b),directedVertexDistance(b,a));}

function captureCanonicalUniverse(){
  const sourcePath=path.join(CANONICAL_ROOT,"tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
  const source=fs.readFileSync(sourcePath,"utf8");
  const marker="  const polygonsByProvince = Object.fromEntries(\n";
  const injected=source.replace(marker,"  globalThis.__B5_CAPTURED_SITES = sites.map((site) => ({ ...site, point: [...site.point] }));\n  globalThis.__B5_CAPTURED_RECORDS = [];\n\n"+marker).replace("    const cell = buildVoronoiCell(siteIndex, sites);\n","    const cell = buildVoronoiCell(siteIndex, sites);\n    globalThis.__B5_CAPTURED_RECORDS.push({ siteIndex, site: sites[siteIndex], cell });\n").replace("export { isPhysicalLandPoint };","export { isPhysicalLandPoint };\nexport function __b5GetCapture() { return { sites: globalThis.__B5_CAPTURED_SITES ?? [], records: globalThis.__B5_CAPTURED_RECORDS ?? [] }; }");
  assert.notEqual(injected,source,"B5 instrumentation did not modify canonical source");
  const tempPath=path.join(path.dirname(sourcePath),`.b5-canonical.${process.pid}.mjs`);fs.writeFileSync(tempPath,injected,"utf8");
  try{const code=`import * as m from ${JSON.stringify(`file://${tempPath}?b5=${process.pid}`)}; m.buildAnatoliaPhase2DAssets([]); process.stdout.write(JSON.stringify(m.__b5GetCapture()));`;const child=spawnSync(process.execPath,["--input-type=module","-e",code],{encoding:"utf8",maxBuffer:64*1024*1024});if(child.status!==0)throw new Error(child.stderr||`canonical capture exited ${child.status}`);return JSON.parse(child.stdout);}finally{fs.rmSync(tempPath,{force:true});}
}

function loadV15PowerCell(){
  const sourcePath=path.join(process.cwd(),"tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
  const source=fs.readFileSync(sourcePath,"utf8");
  const injected=source.replace("function buildPartition(sites, weights) {","export { powerCell };\n\nfunction buildPartition(sites, weights) {");
  assert.notEqual(injected,source,"B5 V15 instrumentation did not expose powerCell");
  const tempPath=path.join(path.dirname(sourcePath),`.b5-v15.${process.pid}.mjs`);fs.writeFileSync(tempPath,injected,"utf8");
  try{return import(`file://${tempPath}?b5=${process.pid}`);}finally{setTimeout(()=>fs.rmSync(tempPath,{force:true}),0);}
}

const canonical=captureCanonicalUniverse();
assert.ok(canonical.sites.length>0,"Canonical site universe is empty");
const v15=await loadV15PowerCell();
const sites=canonical.sites;
const canonicalByIndex=new Map(canonical.records.map((record)=>[record.siteIndex,record]));
const zeroWeights=Object.fromEntries(sites.map((site,index)=>[site.provinceId??`__site_${index}`,0]));
const v15ByIndex=new Map();
for(let siteIndex=0;siteIndex<sites.length;siteIndex+=1){const cell=v15.powerCell(siteIndex,sites,zeroWeights);if(cell.length>=3)v15ByIndex.set(siteIndex,{siteIndex,site:sites[siteIndex],cell});}

const matrix=FAILURE_EDGES.map((edge)=>{
  const mid=midpoint(edge);
  const nearest=nearestSiteIndices(mid,sites,2);
  const candidateRecords=nearest.map((siteIndex)=>{
    const c=canonicalByIndex.get(siteIndex);
    const v=v15ByIndex.get(siteIndex);
    return {siteIndex,provinceId:sites[siteIndex]?.provinceId??null,kind:sites[siteIndex]?.kind??null,sitePoint:sites[siteIndex]?.point??null,canonical:c?{vertexCount:c.cell.length,area:area(c.cell),cell:c.cell}:null,v15:v?{vertexCount:v.cell.length,area:area(v.cell),cell:v.cell}:null,vertexDistance:c&&v?symmetricVertexDistance(c.cell,v.cell):null,areaDelta:c&&v?Math.abs(area(c.cell)-area(v.cell)):null};
  });
  return { ...edge, midpoint:mid, nearestSiteIndices:nearest, candidates:candidateRecords };
});

const comparable=matrix.flatMap((item)=>item.candidates).filter((x)=>x.canonical&&x.v15);
const maxVertexDistance=comparable.reduce((m,x)=>Math.max(m,x.vertexDistance),0);
const maxAreaDelta=comparable.reduce((m,x)=>Math.max(m,x.areaDelta),0);
const identicalWithin1eMinus9=comparable.filter((x)=>x.vertexDistance<=1e-9&&x.areaDelta<=1e-12).length;
const identicalWithin1eMinus7=comparable.filter((x)=>x.vertexDistance<=1e-7&&x.areaDelta<=1e-10).length;

console.log(JSON.stringify({phase:"B5 — raw-cell lineage under canonical 5,633-site universe",canonicalSiteCount:sites.length,rawCellsCompared:comparable.length,maxVertexDistance,maxAreaDelta,identicalWithin1eMinus9,identicalWithin1eMinus7,matrix},null,2));
