import assert from "node:assert/strict";
import { createTerrainHeightSampler } from "../terrain/TerrainHeightSampler.js";
import { bindProvinceGeometryToTerrain } from "./ProvinceTerrainBinding.js";

const geometry = { positions: new Float32Array([30,40,31,40,30,41]), provinceIndices: new Uint32Array([0,0,0]), colors: new Uint8Array(12), provinceIds: Object.freeze(["p0"]), drawRanges: Object.freeze([{ provinceIndex:0, provinceId:"p0", first:0, count:3 }]), bounds: Object.freeze([{ minX:30,minY:40,maxX:31,maxY:41 }]), triangleCount:1 };
const sampler = createTerrainHeightSampler({ bounds:{minX:30,minY:40,maxX:31,maxY:41}, width:3, height:3, spacingX:30, spacingY:30, samples:Float32Array.from([0,10,20,10,20,30,20,30,40]) });
const bound = bindProvinceGeometryToTerrain(geometry, { terrainTileId:"3/10/20", sampler, heightScale:2 });
assert.deepEqual(Array.from(bound.positions3D), [0,0,0,60,0,20,0,60,40]);
assert.equal(bound.vertexCount, 3); assert.equal(bound.terrainTileId, "3/10/20");
assert.throws(() => bindProvinceGeometryToTerrain(geometry, { sampler:{ sample:() => ({ x:NaN,y:0,height:1 }) } }), /invalid terrain coordinates/);
console.log("Phase E province terrain binding: PASS");
