import assert from "node:assert/strict";
import { encodeMapBin, inspectMapBin } from "../build/mapbin-encoder.js";
import { BinaryMapAssetSource } from "../../src/map/runtime/BinaryMapAssetSource.js";

const COUNT = 15000;
const POINTS = 32;
const entries = Array.from({ length: COUNT }, (_, i) => {
  const id = i + 1;
  const cx = -179 + (i % 150) * 2.4;
  const cy = -89 + Math.floor(i / 150) * 1.8;
  const polygon = Array.from({ length: POINTS }, (_, p) => {
    const a = (p / POINTS) * Math.PI * 2;
    const r = 0.45 + 0.04 * Math.sin(p * 3 + i * 0.01);
    return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  });
  return { province: { identity: { id }, ownership: { ownerId: (i % 991) + 1 } }, geometry: { identity: { provinceId: id }, polygons: [polygon] } };
});

const buffer = encodeMapBin(entries);
const header = inspectMapBin(buffer);
const source = BinaryMapAssetSource.fromArrayBuffer(buffer);

assert.equal(header.provinceCount, COUNT);
assert.equal(source.provinceCount, COUNT);
assert.equal(source.tileCount, COUNT);
assert.equal(source.geometryPointCount, COUNT * POINTS);
assert.equal(source.ids.buffer, buffer);
assert.equal(source.geometry.buffer, buffer);
assert.equal(source.tileIndex.buffer, buffer);
assert.equal(source.lodRanges.buffer, buffer);
assert.equal(source.getProvinceId(COUNT - 1), COUNT);
assert.equal(source.indexOf(COUNT), COUNT - 1);

const maxIndexCount = source.geometryPointCount * 3;
assert.ok(maxIndexCount > 1_000_000, "15k fixture must exercise million-scale index capacity");
assert.ok(header.totalByteLength < 64 * 1024 * 1024, "stress fixture should remain comfortably below 64 MiB");

console.log(JSON.stringify({
  dataset: "15k",
  provinces: source.provinceCount,
  tiles: source.tileCount,
  geometryPoints: source.geometryPointCount,
  estimatedTriangleFanIndices: maxIndexCount,
  bytes: header.totalByteLength,
  zeroCopy: true,
}, null, 2));
