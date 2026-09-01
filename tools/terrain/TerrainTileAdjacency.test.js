import assert from "node:assert/strict";
import { deriveTerrainTileAdjacency, assertTerrainAdjacencyBalance, toTerrainDrawPlanAdjacency } from "./TerrainTileAdjacency.js";

const tiles=[
  {id:"coarse",lod:1,x:0,y:0,bounds:{minX:0,maxX:1,minY:0,maxY:2},resident:true},
  {id:"fine-a",lod:2,x:2,y:0,bounds:{minX:1,maxX:1.5,minY:0,maxY:1},resident:true},
  {id:"fine-b",lod:2,x:2,y:2,bounds:{minX:1,maxX:1.5,minY:1,maxY:2},resident:false},
];
const adjacency=deriveTerrainTileAdjacency(tiles);

// Relation names describe the neighbor relative to the current tile.
assert.equal(adjacency[0].neighbors.east.mode,"neighbor-finer");
assert.equal(adjacency[1].neighbors.west.mode,"neighbor-coarser");
assert.equal(adjacency[2].neighbors.west.mode,"neighbor-coarser");
assert.equal(adjacency[1].neighbors.north.mode,"same");
assert.equal(adjacency[2].neighbors.south.mode,"same");
assert.equal(adjacency[0].neighbors.north,null);

// A coarse edge can touch multiple finer tiles; none may be silently overwritten.
assert.deepEqual(adjacency[0].edgeSegments.east.map(r=>r.tileIndex),[1,2]);
assert.deepEqual(adjacency[0].edgeSegments.east.map(r=>[r.overlapStart,r.overlapEnd]),[[0,1],[1,2]]);
assert.deepEqual(adjacency[1].edgeSegments.west.map(r=>r.tileIndex),[0]);
assert.deepEqual(adjacency[2].edgeSegments.west.map(r=>r.tileIndex),[0]);

// Every detected shared frontier must be represented from both tiles.
for(const ref of adjacency[0].edgeSegments.east){
  assert.ok(adjacency[ref.tileIndex].edgeSegments.west.some(reverse=>reverse.tileIndex===0));
}
assertTerrainAdjacencyBalance(adjacency);

const planAdjacency=toTerrainDrawPlanAdjacency(adjacency[0],adjacency);
assert.deepEqual(planAdjacency.east,[
  {id:"fine-a",lod:2,resident:true,overlapStart:0,overlapEnd:1,mode:"neighbor-finer"},
  {id:"fine-b",lod:2,resident:false,overlapStart:1,overlapEnd:2,mode:"neighbor-finer"},
]);
assert.equal(planAdjacency.north,null);

// A missing target must fail closed even if the caller supplies a malformed derived set.
assert.throws(
  ()=>toTerrainDrawPlanAdjacency(
    {tile:tiles[0],neighbors:{north:null,east:{tileIndex:1},south:null,west:null},edgeSegments:{north:[],east:[{tileIndex:1,overlapStart:0,overlapEnd:1,mode:"neighbor-finer"}],south:[],west:[]}},
    [{tile:tiles[0],neighbors:{north:null,east:{tileIndex:1},south:null,west:null},edgeSegments:{north:[],east:[{tileIndex:1,overlapStart:0,overlapEnd:1,mode:"neighbor-finer"}],south:[],west:[]}}],
  ),
  /missing tile/,
);

// Diagonal-only contact is not an edge adjacency.
const diagonal=deriveTerrainTileAdjacency([
  {id:"a",lod:1,x:0,y:0,bounds:{minX:0,maxX:1,minY:0,maxY:1}},
  {id:"b",lod:1,x:1,y:1,bounds:{minX:1,maxX:2,minY:1,maxY:2}},
]);
assert.deepEqual(diagonal[0].neighbors,{north:null,east:null,south:null,west:null});
assert.deepEqual(diagonal[1].neighbors,{north:null,east:null,south:null,west:null});
assert.deepEqual(diagonal[0].edgeSegments,{north:[],east:[],south:[],west:[]});

// A two-level LOD jump is invalid for the 2:1 terrain contract.
const unbalanced=[
  {id:"a",lod:0,x:0,y:0,bounds:{minX:0,maxX:1,minY:0,maxY:1}},
  {id:"b",lod:2,x:1,y:0,bounds:{minX:1,maxX:2,minY:0,maxY:1}},
];
const bad=deriveTerrainTileAdjacency(unbalanced);
assert.throws(()=>toTerrainDrawPlanAdjacency(bad[0],bad),/2:1 LOD balance/);

// Invalid inputs must fail closed rather than silently producing partial topology.
assert.throws(()=>deriveTerrainTileAdjacency(null),/requires an array/);
assert.throws(()=>deriveTerrainTileAdjacency([{lod:1,x:0,y:0,bounds:{minX:0,minY:0,maxX:Infinity,maxY:1}}]),/Invalid terrain tile/);
assert.throws(()=>deriveTerrainTileAdjacency([{lod:1,x:0,y:0,bounds:{minX:1,minY:0,maxX:1,maxY:1}}]),/Invalid terrain tile bounds/);

console.log("Phase E terrain adjacency to draw-plan contract: PASS");
