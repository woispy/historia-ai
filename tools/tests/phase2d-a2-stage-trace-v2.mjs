import assert from "node:assert/strict";
import { ANATOLIA_PROVINCE_METADATA } from "../../src/map/data/AnatoliaProvinceMetadata.js";
import { ANATOLIA_PHYSICAL_ATLAS } from "../../src/map/data/AnatoliaPhysicalAtlas.js";
import { ANATOLIA_PHYSICAL_ATLAS_RUNTIME } from "../../src/map/data/AnatoliaPhysicalAtlasRuntime.js";
import { buildAnatoliaPhase2DAssets, isPhysicalLandPoint } from "../historical-gis/AnatoliaPhase2DGeometryBuilder.js";
const TARGET="pontus-amisos";
const metadata=ANATOLIA_PROVINCE_METADATA.find((e)=>e.id===TARGET); assert.ok(metadata);
function area(p){let s=0;for(let i=0;i<p.length;i+=1){const a=p[i],b=p[(i+1)%p.length];s+=a[0]*b[1]-b[0]*a[1];}return s/2;}
function edges(p){return p.map((a,i)=>{const b=p[(i+1)%p.length];return Math.hypot(b[0]-a[0],b[1]-a[1]);});}
function round(p){return p.map(([x,y])=>[Number(x.toFixed(5)),Number(y.toFixed(5))]);}
function desc(label,p){const e=edges(p);return {label,vertexCount:p.length,signedArea:area(p),area:Math.abs(area(p)),minEdge:Math.min(...e),maxEdge:Math.max(...e),duplicateVertices:p.length-new Set(p.map(([x,y])=>`${x}:${y}`)).size,vertices:p};}
const result=buildAnatoliaPhase2DAssets([]); const geometry=result.geometries.find((e)=>e.identity?.provinceId===TARGET); assert.ok(geometry); assert.ok(geometry.polygons.length);
console.log(JSON.stringify({phase:"A2 — canonical Amisos stage trace",target:TARGET,metadataCentroid:metadata.centroid,atlasLandPolygonCount:ANATOLIA_PHYSICAL_ATLAS.landPolygons.length,runtimeLakeCount:ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length,builder:{siteCount:result.siteCount,politicalSiteCount:result.politicalSiteCount,polygonCount:result.polygonCount,fallbackProvinceCount:result.fallbackProvinceCount},polygonCount:geometry.polygons.length,allPhysical:geometry.polygons.every((p)=>p.every(isPhysicalLandPoint)),stages:geometry.polygons.map((p,index)=>({index,exported:desc("exported",p),roundedAgain:desc("rounded-again",round(p))}))},null,2));
