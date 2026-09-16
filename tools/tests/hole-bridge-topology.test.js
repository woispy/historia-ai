import assert from "node:assert/strict";
import { triangulateMultiRingPolygon } from "../historical-gis/HoleAwareTriangulator.js";

const cases = [
  { name: "concave outer", outer: [[0,0],[12,0],[12,10],[7,10],[6,6],[5,10],[0,10]], holes: [[[2,2],[4,2],[4,4],[2,4]]], area: 116 },
  { name: "two holes", outer: [[0,0],[14,0],[14,12],[0,12]], holes: [[[2,2],[4,2],[4,4],[2,4]],[[8,6],[11,6],[11,9],[8,9]]], area: 131 },
];

function area(r){let a=0;for(let i=0;i<r.length;i++){const p=r[i],q=r[(i+1)%r.length];a+=p[0]*q[1]-q[0]*p[1]}return Math.abs(a/2)}
for(const c of cases){
  const source=[c.outer,...c.holes].map(r=>r.map(p=>[...p]));
  let result;
  try { result=triangulateMultiRingPolygon({outerRing:c.outer,holes:c.holes}); }
  catch(error){ assert.fail(`${c.name}: bridge construction rejected test geometry: ${error.message}`); }
  assert.ok(result.indices.length>0,`${c.name}: no mesh`);
  assert.deepEqual(c.outer,source[0],`${c.name}: outer mutated`);
  assert.deepEqual(c.holes,source.slice(1),`${c.name}: hole mutated`);
  let covered=0;
  for(let i=0;i<result.indices.length;i+=3) covered+=area([result.vertices[result.indices[i]],result.vertices[result.indices[i+1]],result.vertices[result.indices[i+2]]]);
  assert.ok(Math.abs(covered-c.area)<1e-7,`${c.name}: expected ${c.area}, got ${covered}`);
}
console.log("Hole bridge topology regression suite completed.");
