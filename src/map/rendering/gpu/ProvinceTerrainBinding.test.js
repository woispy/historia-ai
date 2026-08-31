import assert from "node:assert/strict";
import { bindProvinceGeometryToTerrain } from "./ProvinceTerrainBinding.js";

const geometry = { positions: new Float32Array([30, 40, 31, 40, 30, 41]), provinceIndices: new Uint32Array([0,0,0]), colors: new Uint8Array(12), provinceIds: Object.freeze(["p0"]), drawRanges: Object.freeze([{ provinceIndex:0, provinceId:"p0", first:0, count:3 }]), bounds: Object.freeze([{ minX:30,minY:40,maxX:31,maxY:41 }]), triangleCount:1 };
const bound = bindProvinceGeometryToTerrain(geometry, { terrainTileId:"3/10/20", sampleHeight:(lon,lat,tile) => { assert.equal(tile,"3/10/20"); return lon + lat; }, heightScale:2 });
assert.deepEqual(Array.from(bound.positions3D), [30,40,140,31,40,142,30,41,142]);
assert.equal(bound.vertexCount, 3); assert.equal(bound.terrainTileId, "3/10/20");
assert.throws(() => bindProvinceGeometryToTerrain(geometry, { sampleHeight:() => NaN }), /invalid height/);
console.log("Phase E province terrain binding: PASS");
