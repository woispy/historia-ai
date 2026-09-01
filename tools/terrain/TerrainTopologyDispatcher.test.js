import assert from "node:assert/strict";
import { createTerrainTopology } from "../../src/map/rendering/terrain/TerrainTopologyDispatcher.js";
import { validateTerrainIndexTopology } from "../../src/map/rendering/terrain/TerrainTopologyValidator.js";

const size=5;
const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());
const cases=[
  ["base",{},0],
  ["edge-stitch-2to1",{north:"neighbor-coarser"},1],
  ["corner-ne",{north:"neighbor-coarser",east:"neighbor-coarser"},2],
  ["corner-se",{east:"neighbor-coarser",south:"neighbor-coarser"},2],
  ["corner-sw",{south:"neighbor-coarser",west:"neighbor-coarser"},2],
  ["corner-nw",{west:"neighbor-coarser",north:"neighbor-coarser"},2],
];

function area(indices){
  let total=0;
  for(let i=0;i<indices.length;i+=3){
    const a=indices[i],b=indices[i+1],c=indices[i+2];
    const ax=a%size,ay=Math.floor(a/size),bx=b%size,by=Math.floor(b/size),cx=c%size,cy=Math.floor(c/size);
    total+=Math.abs((bx-ax)*(cy-ay)-(by-ay)*(cx-ax))/2;
  }
  return total;
}

for(const [variant,edges,transitionCount] of cases){
  const topology=createTerrainTopology({size,edges,variant});
  assert.equal(topology.variant,variant);
  assert.deepEqual(topology.edges,{
    north:edges.north??"same",east:edges.east??"same",south:edges.south??"same",west:edges.west??"same",
  });
  assert.deepEqual(topology.transitionEdges,[...Object.keys(topology.edges)].filter(edge=>topology.edges[edge]!=="same"&&topology.edges[edge]!=="boundary"));
  assert.equal(topology.transitionEdges.length,transitionCount);
  assert.ok(topology.indices instanceof Uint32Array);
  assert.equal(topology.vertexCount,size*size);
  assert.equal(area(topology.indices),16,`${variant} area`);
  validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions});
}

assert.throws(()=>createTerrainTopology({size,variant:"base",edges:{north:"neighbor-coarser"}}),/Base topology cannot encode/);
assert.throws(()=>createTerrainTopology({size,variant:"edge-stitch-2to1",edges:{north:"neighbor-coarser",east:"neighbor-coarser"}}),/exactly one/);
assert.throws(()=>createTerrainTopology({size,variant:"corner-ne",edges:{north:"neighbor-coarser",east:"neighbor-finer"}}),/requires neighbor-coarser/);
assert.throws(()=>createTerrainTopology({size,variant:"unknown"}),/Unknown terrain topology variant/);

console.log("Phase E terrain topology dispatcher: PASS");
