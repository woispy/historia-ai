import assert from "node:assert/strict";
import { createTerrainSpatialIndex } from "./TerrainSpatialIndex.js";
const index=createTerrainSpatialIndex({bounds:{minX:26,minY:36,maxX:45,maxY:42},maxLod:4});
function assertBalanced(tiles){for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){const a=tiles[i],b=tiles[j];const vertical=Math.abs(a.bounds.maxX-b.bounds.minX)<1e-12||Math.abs(b.bounds.maxX-a.bounds.minX)<1e-12;const horizontal=Math.abs(a.bounds.maxY-b.bounds.minY)<1e-12||Math.abs(b.bounds.maxY-a.bounds.minY)<1e-12;const touch=vertical?Math.max(a.bounds.minY,b.bounds.minY)<Math.min(a.bounds.maxY,b.bounds.maxY)-1e-12:horizontal&&Math.max(a.bounds.minX,b.bounds.minX)<Math.min(a.bounds.maxX,b.bounds.maxX)-1e-12;if(touch)assert.ok(Math.abs(a.lod-b.lod)<=1,`unbalanced ${a.lod}/${b.lod}`);}}
const selected=index.select({cameraX:35,cameraY:39,viewDistance:2,maxTiles:64});assert.ok(selected.length>0);assert.ok(selected.length<=64);assert.ok(selected.some(tile=>tile.lod===4));assertBalanced(selected);for(const tile of selected){assert.ok(tile.bounds.minX>=26&&tile.bounds.maxX<=45);assert.ok(tile.bounds.minY>=36&&tile.bounds.maxY<=42);}
const tight=index.select({cameraX:35,cameraY:39,viewDistance:2,maxTiles:1});assert.ok(tight.length<=1);
assert.throws(()=>index.select({cameraX:35,cameraY:39,viewDistance:2,maxTiles:2}),/tile budget cannot satisfy/);
assert.throws(()=>index.select({cameraX:35,cameraY:39,viewDistance:0}),/positive view distance/);assert.throws(()=>createTerrainSpatialIndex({bounds:{minX:1,minY:1,maxX:1,maxY:2}}),/Invalid spatial bounds/);
console.log("Phase E terrain spatial LOD balance: PASS");
