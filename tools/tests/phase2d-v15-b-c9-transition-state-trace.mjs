import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
const V15_ROOT=process.env.V15_ROOT; assert.ok(V15_ROOT,"V15_ROOT is required");
const EDGES=[
["B-01",[29.87953,40.72476],[29.88817,40.72993]],["B-02",[29.88817,40.72993],[29.91915,40.71851]],["B-03",[29.94879,40.71649],[29.96697,40.7418]],["B-04",[29.87953,40.72476],[29.85423,40.7623]],["B-05",[29.96697,40.7418],[29.94879,40.71649]],["B-06",[29.99643,40.72103],[30.01852,40.70688]],["B-07",[30.01852,40.70688],[29.99643,40.72103]],["B-08",[30.02342,40.70087],[30.06008,40.71516]],["B-09",[29.91915,40.71851],[29.88817,40.72993]]];
const d=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
async function load(){const p=path.join(V15_ROOT,"tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");const s=fs.readFileSync(p,"utf8");const marker="function buildPartition(sites, weights) {";assert.ok(s.includes(marker));const injected=s.replace(marker,"export { repairPhysicalEdge, resolvePhysicalGeometryBoundaryPoint, isPhysicalGeometryBoundaryPoint };\n\n"+marker);const t=path.join(path.dirname(p),`.b-c9.${process.pid}.mjs`);fs.writeFileSync(t,injected);try{return await import(`file://${t}?c9=${process.pid}`)}finally{fs.rmSync(t,{force:true})}}
const v15=await load();
function sample(edge){const [,a,b]=edge;const rows=[];for(let i=1;i<64;i++){const t=i/64;const p=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];if(!v15.isPhysicalGeometryBoundaryPoint(p)) rows.push({t,point:p,resolved:v15.resolvePhysicalGeometryBoundaryPoint(p)});if(rows.length>=2)break;}return rows;}
const out=[];for(const e of EDGES){const samples=sample(e);const transitions=[];for(const s of samples){let result=null;try{result=v15.repairPhysicalEdge(s.point,[e[1],e[2]],0)}catch(error){result={error:String(error)}}transitions.push({sampleT:s.t,resolved:s.resolved,repairResult:result});}out.push({caseId:e[0],transitions});}
console.log(JSON.stringify({phase:"B-C9 transition-state consumption trace",rows:out},null,2));