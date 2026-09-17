import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const TARGET = "pontus-amisos";
const sourcePath = process.env.A2_V15_SOURCE_FILE;
const sourceSHA = process.env.A2_V15_SOURCE_SHA;
assert.ok(sourcePath && sourceSHA);
const source = fs.readFileSync(sourcePath, "utf8");

const instrument = (text) => {
  const prelude = `\nconst __A2_RECORDS=[];\nconst __a2Area=(p)=>{let s=0;for(let i=0;i<p.length;i+=1){const n=p[(i+1)%p.length];s+=p[i][0]*n[1]-n[0]*p[i][1]}return Math.abs(s)/2};\nconst __a2Record=(stage,payload={})=>__A2_RECORDS.push({stage,...payload});\n`;
  let s = text.replace("const rawAnchor = (item) =>", `${prelude}\nconst TARGET_PROVINCE_ID = "${TARGET}";\nconst rawAnchor = (item) =>`);
  s = s.replace("function clipCellToLand(cell, anchorPoint) {", "function clipCellToLand(cell, anchorPoint) { __a2Record('clip-input',{anchorPoint:[...anchorPoint],cellVertexCount:cell.length});");
  s = s.replace("  return selected ? [selected] : [];\n}", "  __a2Record('clip-output',{candidateCount:candidates.length,containingCount:containing.length,candidateAreas:candidates.map(__a2Area).sort((a,b)=>b-a),selectedArea:selected?__a2Area(selected):null,selectedVertexCount:selected?.length??0});\n  return selected ? [selected] : [];\n}");
  s = s.replace("function repairPhysicalEdge(start, end, depth = 0) {\n  if (edgeIsPhysical(start, end)) return [start, end];", "function repairPhysicalEdge(start, end, depth = 0) {\n  __a2Record('repair-enter',{depth,start:[...start],end:[...end],inputLength:Math.hypot(end[0]-start[0],end[1]-start[1])});\n  if (edgeIsPhysical(start, end)) { __a2Record('repair-physical',{depth,start:[...start],end:[...end]}); return [start,end]; }");
  s = s.replace("  if (depth >= MAX_EDGE_REPAIR_DEPTH) return null;", "  if (depth >= MAX_EDGE_REPAIR_DEPTH) { __a2Record('repair-max-depth',{depth,start:[...start],end:[...end]}); return null; }");
  s = s.replace("  const boundary = resolvePhysicalGeometryBoundaryPoint(interpolate(start, end, invalidFraction));\n  if (!boundary) return null;", "  const invalidPoint=interpolate(start,end,invalidFraction);\n  const boundary=resolvePhysicalGeometryBoundaryPoint(invalidPoint);\n  __a2Record('repair-resolution',{depth,invalidFraction,invalidPoint:[...invalidPoint],boundary:boundary?[...boundary]:null});\n  if (!boundary) return null;");
  s = s.replace("  const resolved = boundary.map((value) => Number(value.toFixed(7)));\n  if (Math.hypot(resolved[0] - start[0], resolved[1] - start[1]) <= EPS\n    || Math.hypot(resolved[0] - end[0], resolved[1] - end[1]) <= EPS) return null;", "  const resolved=boundary.map((value)=>Number(value.toFixed(7)));\n  const startDistance=Math.hypot(resolved[0]-start[0],resolved[1]-start[1]);\n  const endDistance=Math.hypot(resolved[0]-end[0],resolved[1]-end[1]);\n  __a2Record('repair-resolved',{depth,resolved:[...resolved],startDistance,endDistance});\n  if(startDistance<=EPS||endDistance<=EPS){__a2Record('repair-zero-progress',{depth,resolved:[...resolved]});return null;}");
  s = s.replace("function normalizePhysicalBoundary(polygon) {\n  const normalized = [];", "function normalizePhysicalBoundary(polygon) {\n  __a2Record('normalize-input',{vertexCount:polygon.length,area:__a2Area(polygon),polygon:polygon.map(p=>[...p])});\n  const normalized=[];");
  s = s.replace("    if (!resolvedStart || !resolvedEnd) return null;\n    const repaired = repairPhysicalEdge(resolvedStart, resolvedEnd);\n    if (!repaired) return null;", "    __a2Record('normalize-edge',{edgeIndex:index,start:[...start],end:[...end],resolvedStart:resolvedStart?[...resolvedStart]:null,resolvedEnd:resolvedEnd?[...resolvedEnd]:null});\n    if(!resolvedStart||!resolvedEnd){__a2Record('normalize-endpoint-failure',{edgeIndex:index});return null;}\n    const repaired=repairPhysicalEdge(resolvedStart,resolvedEnd);\n    if(!repaired){__a2Record('normalize-edge-repair-failure',{edgeIndex:index});return null;}\n    __a2Record('normalize-edge-result',{edgeIndex:index,repairedPointCount:repaired.length,repairedArea:__a2Area(repaired)});");
  s = s.replace("  return deduplicated.length >= 3 && area(deduplicated) >= MIN_AREA ? deduplicated : null;\n}", "  const postDedupArea=__a2Area(deduplicated);\n  __a2Record('normalize-output',{normalizedVertexCount:normalized.length,deduplicatedVertexCount:deduplicated.length,postDedupArea,minArea:MIN_AREA,areaCollapse:postDedupArea<MIN_AREA,polygon:deduplicated.map(p=>[...p])});\n  return deduplicated.length>=3&&postDedupArea>=MIN_AREA?deduplicated:null;\n}");
  s = s.replace("function buildPartition(sites, weights) {\n  const result = new Map();\n  for (let index = 0; index < sites.length; index += 1) {", "function buildPartition(sites, weights) {\n  const result=new Map();\n  const targetIndex=sites.findIndex(site=>site.provinceId===TARGET_PROVINCE_ID);\n  const order=targetIndex>=0?[targetIndex,...sites.map((_,i)=>i).filter(i=>i!==targetIndex)]:sites.map((_,i)=>i);\n  for(const index of order){");
  s = s.replace("    const rawPolygon = clipCellToLand(cell, site.point)[0];\n    const polygon = rawPolygon ? normalizePhysicalBoundary(rawPolygon) : null;", "    const rawPolygon=clipCellToLand(cell,site.point)[0];\n    if(site.provinceId===TARGET_PROVINCE_ID)__a2Record('partition-raw',{provinceId:site.provinceId,vertexCount:rawPolygon?.length??0,area:rawPolygon?__a2Area(rawPolygon):null,polygon:rawPolygon?.map(p=>[...p])??null});\n    const polygon=rawPolygon?normalizePhysicalBoundary(rawPolygon):null;\n    if(site.provinceId===TARGET_PROVINCE_ID){__a2Record('partition-normalized',{valid:Boolean(polygon),vertexCount:polygon?.length??0,area:polygon?__a2Area(polygon):null,polygon:polygon?.map(p=>[...p])??null});throw new Error('A2 telemetry stop after Amisos');}");
  s = s.replace(/export \{([^}]*)\};\s*$/, "export {$1, __A2_RECORDS};\n");
  return s;
};

const tempDir=path.dirname(sourcePath);
const tempPath=path.join(tempDir,`.a2-v15-source-${process.pid}.mjs`);
fs.writeFileSync(tempPath,instrument(source),"utf8");
try{
  const mod=await import(`file://${tempPath}`);
  let failure=null;
  try{mod.buildAnatoliaPhase2DAssets();}catch(error){failure=error;}
  assert.ok(failure);
  assert.match(String(failure.message),/A2 telemetry stop after Amisos|invalid physical-land geometry/);
  const records=mod.__A2_RECORDS;
  assert.ok(records.some(r=>r.stage==='partition-raw'));
  const raw=records.find(r=>r.stage==='partition-raw');
  const normalized=records.find(r=>r.stage==='normalize-output');
  const report={migrationId:'MIG-2.8-A2',targetProvince:TARGET,sourcePath,sourceSHA,telemetryOnly:true,mutation:false,rawArea:raw?.area??null,normalizedArea:normalized?.postDedupArea??null,minArea:normalized?.minArea??null,collapseObserved:Boolean(raw?.area!=null&&normalized?.postDedupArea!=null&&normalized.postDedupArea<(normalized.minArea??0)),edgeRecords:records.filter(r=>r.stage.startsWith('normalize-')),repairRecords:records.filter(r=>r.stage.startsWith('repair-')),records};
  fs.mkdirSync('artifacts/phase2.8-c',{recursive:true});
  fs.writeFileSync('artifacts/phase2.8-c/a2-amisos-edge-telemetry.json',JSON.stringify(report,null,2));
  console.log(JSON.stringify({...report,records:undefined},null,2));
}finally{fs.rmSync(tempPath,{force:true});}
