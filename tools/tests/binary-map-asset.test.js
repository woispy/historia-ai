import assert from "node:assert/strict";
import { BinaryMapAssetSource } from "../../src/map/runtime/BinaryMapAssetSource.js";
import { ProvinceSoA } from "../../src/map/runtime/ProvinceSoA.js";
import { encodeMapBin } from "../build/mapbin-encoder.js";

const authoritative = [
  { province: { id: 101 }, country: { id: 7, color: "112233" }, geometry: { polygons: [[[10, 20], [14, 20], [12, 24]]] } },
  { province: { id: 202 }, country: { id: 8, color: "aabbcc" }, geometry: { polygons: [[[-5, -4], [-1, -4], [-1, 0], [-5, 0]]] } },
];

const buffer = encodeMapBin(authoritative);
const source = BinaryMapAssetSource.fromArrayBuffer(buffer);
assert.equal(source.provinceCount, authoritative.length);
assert.equal(source.tileCount, authoritative.length);
assert.equal(source.geometryPointCount, 7);
assert.equal(source.getProvinceId(0), 101);
assert.equal(source.getProvinceId(1), 202);
assert.equal(source.indexOf(202), 1);
assert.deepEqual(Array.from(source.geometryView(0, 3)), [10,20,14,20,12,24]);
assert.deepEqual(Array.from(source.geometryView(3, 4)), [-5,-4,-1,-4,-1,0,-5,0]);
assert.deepEqual(Array.from(source.tileRecord(0)), [0,3,0,0,0,0]);
assert.deepEqual(Array.from(source.tileRecord(1)), [3,4,1,0,0,0]);
assert.deepEqual(Array.from(source.lodRecord(0)), [0,1,0,0]);
assert.deepEqual(Array.from(source.lodRecord(1)), [1,1,0,0]);
assert.equal(source.ids.buffer, buffer);
assert.equal(source.owner.buffer, buffer);
assert.equal(source.minX.buffer, buffer);
assert.equal(source.centerX.buffer, buffer);
assert.equal(source.geometry.buffer, buffer);
assert.equal(source.tileIndex.buffer, buffer);
assert.equal(source.lodRanges.buffer, buffer);
assert.equal(source.palette.buffer, buffer);

const soa = ProvinceSoA.fromBinary(buffer, source.header);
for (const field of ["ids","owner","minX","minY","maxX","maxY","centerX","centerY"]) assert.equal(soa[field].buffer, buffer);
assert.equal(soa.ids[0], 101);
assert.equal(soa.owner[1], 8);
assert.equal(soa.minX[0], 10);
assert.equal(soa.maxY[1], 0);
assert.equal(soa.centerX[0], 12);
assert.equal(soa.centerY[1], -2);

for (let i = 0; i < authoritative.length; i += 1) {
  const points = authoritative[i].geometry.polygons.flat();
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  assert.equal(source.minX[i], Math.min(...xs));
  assert.equal(source.minY[i], Math.min(...ys));
  assert.equal(source.maxX[i], Math.max(...xs));
  assert.equal(source.maxY[i], Math.max(...ys));
}

console.log("Binary map asset contract passed: authoritative geometry, IDs, bounds, tile/LOD ranges and zero-copy typed views are equivalent.");
