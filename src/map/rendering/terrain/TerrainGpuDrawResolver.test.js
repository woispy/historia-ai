import assert from "node:assert/strict";
import { createTerrainDrawPlan } from "./TerrainDrawPlan.js";
import { resolveTerrainGpuDraw } from "./TerrainGpuDrawResolver.js";
const positions=new Float32Array(Array.from({length:25},(_,i)=>[i%5,Math.floor(i/5)]).flat());
const plan=createTerrainDrawPlan({tile:{id:"t"},lod:2,adjacency:{north:{id:"n",lod:1,resident:true}},resident:true});
const draw=resolveTerrainGpuDraw({size:5,drawPlan:plan,positions});assert.equal(draw.drawable,true);assert.equal(draw.tileId,"t");assert.ok(draw.indexCount>0);assert.equal(draw.edges.north,"neighbor-coarser");
const deferred=createTerrainDrawPlan({tile:{id:"t2"},lod:2,adjacency:{},resident:false});assert.deepEqual(resolveTerrainGpuDraw({size:5,drawPlan:deferred}),{drawable:false,reason:"not-resident"});
console.log("Phase E GPU draw resolution: PASS");
