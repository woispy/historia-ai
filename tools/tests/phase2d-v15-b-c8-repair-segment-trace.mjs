import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const V15_ROOT = process.env.V15_ROOT;
assert.ok(V15_ROOT, "V15_ROOT is required");
const SOURCE = path.join(V15_ROOT, "tools/historical-gis/AnatoliaPhase2DGeometryBuilderV15.js");
const EDGES = [["B-01",[29.87953,40.72476],[29.88817,40.72993]],["B-02",[29.88817,40.72993],[29.91915,40.71851]],["B-03",[29.94879,40.71649],[29.96697,40.7418]],["B-04",[29.87953,40.72476],[29.85423,40.7623]],["B-05",[29.96697,40.7418],[29.94879,40.71649]],["B-06",[29.99643,40.72103],[30.01852,40.70688]],["B-07",[30.01852,40.70688],[29.99643,40.72103]],["B-08",[30.02342,40.70087],[30.06008,40.71516]],["B-09",[29.91915,40.71851],[29.88817,40.72993]]];
const s=fs.readFileSync(SOURCE,"utf8");
const marker="function repairPhysicalEdge(start, end, depth = 0) {";
const helper=`function __bC8NearestBoundary(point) {\n  let best = null;\n  let bestDistance = Infinity;\n  PHYSICAL_LAND_POLYGONS.forEach((polygon, polygonIndex) => {\n    for (let segmentIndex=0; segmentIndex<polygon.length; segmentIndex++) {\n      const a=polygon[segmentIndex], b=polygon[(segmentIndex+1)%polygon.length];\n      const dx=b[0]-a[0], dy=b[1]-a[1], den=dx*dx+dy*dy;\n      const t=den<EPS?0:Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/den));\n      const q=[a[0]+dx*t,a[1]+dy*t]; const d=Math.hypot(point[0]-q[0],point[1]-q[1]);\n      if(d<bestDistance){bestDistance=d;best={kind:"land",polygonIndex,segmentIndex,point:q,distance:d};}\n    }\n  });\n  for (let lakeIndex=0; lakeIndex<ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes.length; lakeIndex++) {\n    const lake=ANATOLIA_PHYSICAL_ATLAS_RUNTIME.lakes[lakeIndex];\n    for (let ringIndex=0; ringIndex<(lake.rings??[lake.coordinates]).length; ringIndex++) {\n      const ring=(lake.rings??[lake.coordinates])[ringIndex];\n      for (let segmentIndex=0; segmentIndex<ring.length; segmentIndex++) {\n        const a=ring[segmentIndex], b=ring[(segmentIndex+1)%ring.length];\n        const dx=b[0]-a[0], dy=b[1]-a[1], den=dx*dx+dy*dy;\n        const t=den<EPS?0:Math.max(0,Math.min(1,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/den));\n        const q=[a[0]+dx*t,a[1]+dy*t]; const d=Math.hypot(point[0]-q[0],point[1]-q[1]);\n        if(d<bestDistance){bestDistance=d;best={kind:"lake",lakeIndex,ringIndex,segmentIndex,point:q,distance:d};}\n      }\n    }\n  }\n  return best;\n}\n`;
let injected=s.replace(marker,helper+marker);
assert.notEqual(injected,s);
injected=injected.replace("const resolved = boundary.map((value) => Number(value.toFixed(7)));", "const resolved = boundary.map((value) => Number(value.toFixed(7)));\n  globalThis.__B_C8_TRACE ??= [];\n  globalThis.__B_C8_TRACE.push({ depth, start, end, invalidFraction, sample: interpolate(start, end, invalidFraction), resolved, nearestBoundary: __bC8NearestBoundary(resolved) });");
injected += "\nexport { repairPhysicalEdge };\n";
const temp=path.join(path.dirname(SOURCE),`.b-c8-${process.pid}.mjs`);fs.writeFileSync(temp,injected);
try {
  const mod=await import(`file://${temp}?bC8=${process.pid}`);
  const results=[];
  for(const [caseId,start,end] of EDGES){ globalThis.__B_C8_TRACE=[]; let result=null; try{result=mod.repairPhysicalEdge(start,end);}catch(error){results.push({caseId,error:String(error),trace:globalThis.__B_C8_TRACE});continue;} const trace=globalThis.__B_C8_TRACE; results.push({caseId,result,trace}); }
  console.log(JSON.stringify({phase:"B-C8 repair boundary segment identity",results},null,2));
} finally {fs.rmSync(temp,{force:true});}
