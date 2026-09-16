import assert from "node:assert/strict";

import { encodeMapBin, inspectMapBin } from "../build/mapbin-encoder.js";
import { BinaryMapAssetSource } from "../../src/map/runtime/BinaryMapAssetSource.js";

function signedArea(points) {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  return area * 0.5;
}

const convex = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
const concave = [[0, 0], [3, 0], [3, 3], [1.5, 1], [0, 3], [0, 0]];
const retraced = [[0, 0], [2, 0], [2, 2], [0, 2], [2, 2], [0, 0]];

const buffer = encodeMapBin([
  { province: { identity: { id: 1, color: "112233" } }, geometry: { polygons: [convex] } },
  { province: { identity: { id: 2, color: "445566" } }, geometry: { polygons: [concave] } },
  { province: { identity: { id: 3, color: "778899" } }, geometry: { polygons: [retraced] } },
]);

const header = inspectMapBin(buffer);
assert.equal(header.provinceCount, 3);
assert.equal(header.tileCount, 2, "retraced/degenerate geometry must not become a tile");
assert.equal(header.lodRangeCount, 3);

const source = BinaryMapAssetSource.fromArrayBuffer(buffer);
assert.equal(source.provinceCount, 3);
assert.equal(source.tileCount, 2);
assert.equal(source.geometryPointCount, 11);

const convexRange = source.getProvinceGeometryRange(0, 0);
const concaveRange = source.getProvinceGeometryRange(1, 0);
assert.equal(convexRange.tileCount, 1);
assert.equal(concaveRange.tileCount, 1);
assert.equal(source.getProvinceGeometryRange(2, 0).tileCount, 0);

assert.equal(source.getProvinceGeometryRange(0, 1), null, "unsupported LOD must not address another province");
assert.equal(source.getProvinceGeometryRange(1, 1), null, "unsupported LOD must not address another province");

const concaveTile = source.tileRecord(concaveRange.tileOffset);
const concavePoints = source.geometryView(concaveTile[0], concaveTile[1]);
const points = [];
for (let i = 0; i < concavePoints.length; i += 2) points.push([concavePoints[i], concavePoints[i + 1]]);
assert.ok(Math.abs(signedArea(points)) > 1, "concave source geometry must survive mapbin normalization");

console.log("Mapbin geometry contract passed: normalization, concave preservation, and LOD ownership are guarded.");
