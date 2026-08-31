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
    country: { color: "#123456" },
    geometry: { polygons: [square] },
  },
  {
    province: { id: "beta" },
    country: { color: "#abcdef" },
    geometry: { polygons: [concave, square] },
  },
]);

assert.equal(geometry.provinceIds.length, 2);
assert.equal(geometry.vertexCount, 21);
assert.equal(geometry.triangleCount, 7);
assert.equal(geometry.positions.length, geometry.vertexCount * 2);
assert.equal(geometry.provinceIndices.length, geometry.vertexCount);
assert.equal(geometry.colors.length, geometry.vertexCount * 4);
assert.deepEqual([...geometry.colors.slice(0, 4)], [18, 52, 86, 255]);
assert.deepEqual([...geometry.colors.slice(6 * 4, 6 * 4 + 4)], [171, 205, 239, 255]);
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
assert.ok(geometry.colors instanceof Uint8Array);

// GPU must preserve the same finite 360x180 world as SvgRenderer's
// preserveAspectRatio="xMidYMid meet" contract, including tall/square canvases.
assert.deepEqual(getGpuViewportWorld(1000, 500, 1), [180, 90]);
assert.deepEqual(getGpuViewportWorld(1000, 1000, 1), [180, 90]);
assert.deepEqual(getGpuViewportWorld(500, 1000, 1), [180, 90]);
assert.deepEqual(getGpuViewportWorld(1000, 500, 2), [90, 45]);
assert.deepEqual(getGpuViewportWorld(1000, 1000, 48), [3.75, 1.875]);

const shaders = getProvinceGpuShaderSources();
assert.match(shaders.vertex, /#version 300 es/);
assert.match(shaders.vertex, /layout\(location = 0\) in vec2 a_position/);
assert.match(shaders.vertex, /layout\(location = 1\) in uint a_provinceIndex/);
assert.match(shaders.vertex, /layout\(location = 2\) in vec4 a_color/);
assert.match(shaders.vertex, /u_camera/);
assert.match(shaders.fragment, /u_selectedProvince/);
assert.match(shaders.fragment, /out vec4 outColor/);

console.log("Province GPU geometry tests passed: normalization, triangulation, packing, political colors, finite-world viewport parity and WebGL2 shader contract.");
