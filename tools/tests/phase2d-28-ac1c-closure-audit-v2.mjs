import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const CANONICAL_ROOT = process.env.CANONICAL_ROOT;
assert.ok(CANONICAL_ROOT);
const A1 = ["lydia-smyrna","ionia-ayasuluk","caria-pecin","caria-halikarnassos","pontus-sinop"];
const AMISOS = "pontus-amisos";
const AMASYA = "pontus-amasya";
const MIN_AREA = 0.00005;
const area = (p) => Math.abs(p.reduce((s, a, i) => { const b=p[(i+1)%p.length]; return s+a[0]*b[1]-b[0]*a[1]; },0))/2;

const canonicalPath = path.join(CANONICAL_ROOT,"tools/historical-gis/AnatoliaPhase2DGeometryBuilder.js");
let src = fs.readFileSync(canonicalPath,"utf8");
const prelude = `const __CLOSURE={raw:new Map()}; const __TARGETS=new Set(${JSON.stringify([...A1,AMISOS])});\n`;
const needle = "    const centroid = polygonCentroid(cell);";
assert.ok(src.includes(needle),"canonical capture anchor missing");
src = prelude + src.replace(needle,"    if (__TARGETS.has(sites[siteIndex].provinceId) && !__CLOSURE.raw.has(sites[siteIndex].provinceId)) __CLOSURE.raw.set(sites[siteIndex].provinceId,{siteIndex,site:sites[siteIndex],cell});\n"+needle);
src = src.replace("export { isPhysicalLandPoint };","export { isPhysicalLandPoint, __CLOSURE };");
const temp=path.join(path.dirname(canonicalPath),`.closure-${process.pid}.mjs`); fs.writeFileSync(temp,src); let canonical;
try { canonical=await import(`file://${temp}?v=${process.pid}`); } finally { fs.rmSync(temp,{force:true}); }
canonical.buildAnatoliaPhase2DAssets([]);
const raw=canonical.__CLOSURE.raw;
const a1=A1.map(id=>{const r=raw.get(id);assert.ok(r,`missing ${id}`);return {id,vertices:r.cell.length,area:area(r.cell),belowMinArea:area(r.cell)<MIN_AREA};});
assert.ok(a1.every(x=>x.belowMinArea));
const amisos=raw.get(AMISOS); assert.ok(amisos);
const v15Path=path.resolve("tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
let vsrc=fs.readFileSync(v15Path,"utf8").replace("export { isPhysicalLandPoint };","export { isPhysicalLandPoint, normalizePhysicalBoundary };");
const vt=path.join(path.dirname(v15Path),`.closure-v15-${process.pid}.mjs`);fs.writeFileSync(vt,vsrc);let v15;try{v15=await import(`file://${vt}?v=${process.pid}`);}finally{fs.rmSync(vt,{force:true});}
const norm=v15.normalizePhysicalBoundary(amisos.cell);assert.ok(norm);
const a2={canonicalRawArea:area(amisos.cell),v15NormalizedArea:area(norm),areaRatio:area(norm)/area(amisos.cell),reportedTinyArea:2.27e-13,tinyAreaReproduced:Math.abs(area(norm)-2.27e-13)<1e-12};assert.equal(a2.tinyAreaReproduced,false);
const authority=await import(`file://${path.resolve("tools/historical-gis/recovery/physical-land-authority.mjs")}?v=${process.pid}`);
const runtime=await import(`file://${path.resolve("src/map/data/AnatoliaPhysicalAtlasRuntime.js")}?v=${process.pid}`);
const lakes=runtime.ANATOLIA_PHYSICAL_ATLAS_RUNTIME?.lakes??[];assert.ok(lakes.length>0);
const ring=lakes[0].rings?.[0]??lakes[0].coordinates;assert.ok(ring?.length>=3);
const lp=ring.reduce((s,p)=>[s[0]+p[0],s[1]+p[1]],[0,0]).map(v=>v/ring.length);
const c={provinceId:AMASYA,lakeCount:lakes.length,lakeProbe:lp,isLakeInteriorPoint:authority.isLakeInteriorPoint(lp),isPhysicalLandPoint:authority.isPhysicalLandPoint(lp),isPhysicalGeometryBoundaryPoint:authority.isPhysicalGeometryBoundaryPoint(lp),isFinalPhysicalGeometryBoundaryPoint:authority.isFinalPhysicalGeometryBoundaryPoint(lp)};
assert.equal(c.isLakeInteriorPoint,true);assert.equal(c.isPhysicalLandPoint,false);assert.equal(c.isPhysicalGeometryBoundaryPoint,true);assert.equal(c.isFinalPhysicalGeometryBoundaryPoint,false);
console.log(JSON.stringify({phase:"2.8-C closure audit",productionChanges:false,A1:a1,A2:a2,C:c,closure:{A1:true,A2:true,C:true}},null,2));
