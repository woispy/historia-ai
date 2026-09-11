import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
const id="pontus-amisos"; const r=buildAnatoliaPhase2DAssets([]); const m=ANATOLIA_PROVINCE_METADATA.find(x=>x.id===id); const g=r.geometries.find(x=>x.identity?.provinceId===id); assert.ok(m&&g);
const signed=(p)=>p.reduce((s,a,i)=>{const b=p[(i+1)%p.length];return s+a[0]*b[1]-b[0]*a[1]},0)/2; const round=(p)=>p.map(([x,y])=>[Number(x.toFixed(5)),Number(y.toFixed(5))]);
const stats=(p)=>{const e=p.map((a,i)=>{const b=p[(i+1)%p.length];return Math.hypot(b[0]-a[0],b[1]-a[1])});return {n:p.length,signedArea:signed(p),area:Math.abs(signed(p)),minEdge:Math.min(...e),maxEdge:Math.max(...e),vertices:p}};
console.log(JSON.stringify({phase:"A2 exact representation trace",target:id,metadataCentroid:m.centroid,builderSummary:{siteCount:r.siteCount,politicalSiteCount:r.politicalSiteCount,polygonCount:r.polygonCount,fallbackProvinceCount:r.fallbackProvinceCount},polygons:g.polygons.map((p,i)=>{const q=round(p);return {index:i,exported:stats(p),rounded:stats(q),allPhysical:p.every(x=>x.every(isPhysicalLandPoint)),vertexDelta:p.map((x,j)=>({i:j,dx:q[j][0]-x[0],dy:q[j][1]-x[1]}))}})},null,2));
