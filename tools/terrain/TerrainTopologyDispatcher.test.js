import assert from "node:assert/strict";
import { createTerrainTopology } from "./TerrainTopologyDispatcher.js";
import { validateTerrainIndexTopology } from "../../src/map/rendering/terrain/TerrainTopologyValidator.js";
import { validateTerrainExactCellCoverage } from "../../src/map/rendering/terrain/TerrainTopologyExactCoverageValidator.js";
const size=5;
const positions=new Float32Array(Array.from({length:size*size},(_,i)=>[i%size,Math.floor(i/size)]).flat());
const cases=[
 ["base",{}],
 ["edge-stitch-2to1",{north:"neighbor-coarser"}],
 ["corner-ne",{north:"neighbor-coarser",east:"neighbor-coarser"}],
 ["corner-se",{east:"neighbor-coarser",south:"neighbor-coarser"}],
 ["corner-sw",{south:"neighbor-coarser",west:"neighbor-coarser"}],
 ["corner-nw",{west:"neighbor-coarser",north:"neighbor-coarser"}]
];
function area(indices){let total=0;for(let i=0;i<indices.length;i+=3){const a=indices[i],b=indices[i+1],c=indices[i+2];const ax=a%size,ay=Math.floor(a/size),bx=b%size,by=Math.floor(b/size),cx=c%size,cy=Math.floor(c/size);total+=Math.abs((bx-ax)*(cy-ay)-(by-ay)*(cx-ax))/2;}return total;}
for(const [variant,edges] of cases){const topology=createTerrainTopology({size,edges,variant});assert.equal(topology.variant,variant);assert.ok(topology.indices instanceof Uint32Array);validateTerrainIndexTopology({indices:topology.indices,vertexCount:topology.vertexCount,positions});assert.equal(area(topology.indices),16,`${variant} area`);const exact=validateTerrainExactCellCoverage({indices:topology.indices,positions,size});assert.equal(exact.completeExactCoverage,true,`${variant} exact coverage`);assert.equal(exact.uncoveredArea,0,`${variant} uncovered area`);assert.equal(exact.overlapArea,0,`${variant} overlap area`);}
assert.throws(()=>createTerrainTopology({size,variant:"base",edges:{north:"neighbor-coarser"}}),/Base topology cannot encode/);assert.throws(()=>createTerrainTopology({size,variant:"edge-stitch-2to1",edges:{north:"neighbor-coarser",east:"neighbor-coarser"}}),/exactly one/);assert.throws(()=>createTerrainTopology({size,variant:"corner-ne",edges:{north:"neighbor-coarser",east:"neighbor-finer"}}),/requires neighbor-coarser/);assert.throws(()=>createTerrainTopology({size,variant:"unknown"}),/Unknown terrain topology variant/);console.log("Phase E terrain topology dispatcher: PASS");
