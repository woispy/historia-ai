import assert from "node:assert/strict";
import {
  buildProvinceGpuGeometry,
  getGpuProvinceIndex,
  normalizeProvinceRing,
  triangulateProvinceRing,
} from "../../src/map/rendering/gpu/ProvinceGpuGeometry.js";
import {
  getGpuViewportWorld,
  getProvinceGpuShaderSources,
} from "../../src/map/rendering/gpu/ProvinceGpuRenderer.js";

const square = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
  [0, 0],
];

const concave = [
  [0, 0],
  [4, 0],
  [4, 4],
  [2, 2],
  [0, 4],
  [0, 0],
];

assert.deepEqual(normalizeProvinceRing(square), [
  [0, 0], [2, 0], [2, 2], [0, 2],
]);
assert.equal(triangulateProvinceRing(square).length, 6);
assert.equal(triangulateProvinceRing(concave).length, 9);
assert.equal(triangulateProvinceRing([...square].reverse()).length, 6);
assert.deepEqual(triangulateProvinceRing([[0, 0], [1, 1]]), []);
assert.throws(
  () => triangulateProvinceRing([[0, 0], [1, 1], [2, 2]]),
  /degenerate/,
);

const geometry = buildProvinceGpuGeometry([
  {
    province: { id: "alpha" },
    geometry: { polygons: [square] },
  },
  {
    province: { id: "beta" },
    geometry: { polygons: [concave, square] },
  },
]);

assert.equal(geometry.provinceIds.length, 2);
assert.equal(geometry.vertexCount, 21);
assert.equal(geometry.triangleCount, 7);
assert.equal(geometry.positions.length, geometry.vertexCount * 2);
assert.equal(geometry.provinceIndices.length, geometry.vertexCount);
assert.equal(getGpuProvinceIndex(geometry, "alpha"), 0);
assert.equal(getGpuProvinceIndex(geometry, "beta"), 1);
assert.equal(getGpuProvinceIndex(geometry, "missing"), -1);
assert.equal(geometry.drawRanges.length, 2);
assert.deepEqual(geometry.drawRanges[0], {
  provinceIndex: 0,
  provinceId: "alpha",
  first: 0,
  count: 6,
});
assert.deepEqual(geometry.bounds[0], {
  minX: 0,
  minY: 0,
  maxX: 2,
  maxY: 2,
});
assert.ok(geometry.positions instanceof Float32Array);
assert.ok(geometry.provinceIndices instanceof Uint32Array);

assert.deepEqual(getGpuViewportWorld(1000, 500, 1), [180, 90]);
assert.deepEqual(getGpuViewportWorld(1000, 1000, 1), [180, 180]);
assert.deepEqual(getGpuViewportWorld(1000, 500, 2), [90, 45]);

const shaders = getProvinceGpuShaderSources();
assert.match(shaders.vertex, /#version 300 es/);
assert.match(shaders.vertex, /layout\(location = 0\) in vec2 a_position/);
assert.match(shaders.vertex, /layout\(location = 1\) in uint a_provinceIndex/);
assert.match(shaders.vertex, /u_camera/);
assert.match(shaders.fragment, /u_selectedProvince/);
assert.match(shaders.fragment, /out vec4 outColor/);

console.log("Province GPU geometry tests passed: normalization, triangulation, packing, viewport mapping and WebGL2 shader contract.");
