import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack, buildLodRings } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const geometryDirectory = path.join(root, "src/world/map/assets/geometry");
const files = (await readdir(geometryDirectory)).filter((name) => /^geometry_country_.*\.json$/.test(name)).sort();

assert.equal(files.length, 242, "Global Natural Earth geometry foundation must contain the expected country asset set.");

let polygonCount = 0;
let vertexCount = 0;
const entries = [];
for (const file of files) {
  const asset = JSON.parse(await readFile(path.join(geometryDirectory, file), "utf8"));
  assert.ok(asset.id, `${file} needs a stable geometry identity.`);
  assert.ok(Array.isArray(asset.polygons) && asset.polygons.length > 0, `${file} needs polygon geometry.`);
  const polygons = asset.polygons.map((polygon) => {
    assert.ok(polygon.length >= 3, `${file} contains a degenerate polygon.`);
    assert.ok(polygon.every(([longitude, latitude]) => Number.isFinite(longitude) && Number.isFinite(latitude)), `${file} contains non-finite coordinates.`);
    polygonCount += 1;
    vertexCount += polygon.length;
    return polygon;
  });
  const lodA = polygons.flatMap((polygon) => buildLodRings(polygon));
  const lodB = polygons.flatMap((polygon) => buildLodRings(polygon));
  assert.deepEqual(lodA, lodB, `${file} LOD generation must be deterministic.`);
  entries.push({ province: { id: asset.id }, geometry: asset });
}

const pack = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
assert.equal(pack.provinces.length, files.length);
assert.ok(pack.diagnostics.renderableProvinceCount > 0);
assert.equal(pack.diagnostics.renderableProvinceCount + pack.diagnostics.nonRenderableProvinceCount, files.length);
assert.ok(pack.vertices.length > 0 && pack.indices.length > 0);
assert.equal(pack.indices.length % 3, 0);

console.log(`Global geometry foundation passed: ${files.length} assets, ${polygonCount} polygons, ${vertexCount} source vertices, renderable=${pack.diagnostics.renderableProvinceCount}, nonRenderable=${pack.diagnostics.nonRenderableProvinceCount}, packedVertices=${pack.vertices.length / 2}, packedIndices=${pack.indices.length}.`);
