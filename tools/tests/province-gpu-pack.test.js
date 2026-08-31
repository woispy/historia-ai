import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province) => ({ province, geometry: geometryById.get(String(province.identity?.id)) })).filter((entry) => entry.geometry);
if (!entries.length) throw new Error("GPU pack test found no historical province geometry.");

const options = {
  tileSize: 10,
  quantization: 1e6,
  onProgress: (event) => {
    if (event.phase === "province-start") console.log(`GPU province start: ${event.provinceIndex + 1}/${event.provinceCount} ${event.provinceId} polygons=${event.polygonCount} vertices=${event.vertexCount} indices=${event.indexCount}`);
    if (event.phase === "province-complete") console.log(`GPU province complete: ${event.provinceIndex + 1}/${event.provinceCount} ${event.provinceId} status=${event.geometryStatus} vertices=${event.vertexCount} indices=${event.indexCount}`);
  },
};
const startedAt = Date.now();
let pack;
try {
  pack = buildIndexedProvincePack(entries, options);
} catch (error) {
  throw new Error(`GPU province pack build failed after ${Date.now() - startedAt}ms: ${error.message}`, { cause: error });
}
const buildMs = Date.now() - startedAt;

if (pack.version !== 2 || pack.tileSize !== 10 || pack.quantization !== 1e6) throw new Error("Unexpected GPU pack header.");
if (pack.vertices.length === 0 || pack.indices.length === 0) throw new Error("GPU pack is empty.");
if (pack.indices.length % 3 !== 0) throw new Error("GPU index buffer is not triangle aligned.");
if (pack.provinces.length !== entries.length) throw new Error(`GPU pack province count mismatch: expected=${entries.length} actual=${pack.provinces.length}`);
if (pack.diagnostics.renderableProvinceCount + pack.diagnostics.nonRenderableProvinceCount !== entries.length) throw new Error("GPU pack geometry status counts do not reconcile.");

const expectedIds = entries.map((entry) => String(entry.province?.identity?.id ?? entry.province?.id));
const actualIds = pack.provinces.map((province) => province.provinceId);
if (new Set(actualIds).size !== actualIds.length) throw new Error("GPU pack contains duplicate province identities.");
for (const id of expectedIds) if (!actualIds.includes(id)) throw new Error(`GPU pack lost historical province identity: ${id}`);

const vertexCount = pack.vertices.length / 2;
let renderableCount = 0;
let nonRenderableCount = 0;
for (const province of pack.provinces) {
  if (!province.provinceId) throw new Error(`GPU province ${province.provinceIndex} has no stable id.`);
  if (!province.bounds) throw new Error(`GPU province ${province.provinceId} has no bounds.`);
  const { minX, minY, maxX, maxY } = province.bounds;
  if (![minX, minY, maxX, maxY].every(Number.isFinite) || minX > maxX || minY > maxY) throw new Error(`Invalid bounds for ${province.provinceId}.`);
  if (province.lodRanges.length !== 4) throw new Error(`Expected 4 LOD ranges for ${province.provinceId}.`);
  const totalProvinceIndices = province.lodRanges.reduce((sum, range) => sum + range.indexCount, 0);
  if (province.renderable) {
    renderableCount += 1;
    if (totalProvinceIndices <= 0) throw new Error(`Renderable province has no GPU triangles: ${province.provinceId}`);
  } else {
    nonRenderableCount += 1;
    if (totalProvinceIndices !== 0) throw new Error(`Non-renderable province unexpectedly owns GPU triangles: ${province.provinceId}`);
    if (!province.nonRenderableReason) throw new Error(`Non-renderable province has no diagnostic reason: ${province.provinceId}`);
    if (!province.diagnostics.length) throw new Error(`Non-renderable province has no ring diagnostics: ${province.provinceId}`);
  }
  for (const range of province.lodRanges) {
    if (range.firstIndex < 0 || range.indexCount < 0 || range.firstIndex + range.indexCount > pack.indices.length) {
      throw new Error(`Invalid LOD range for ${province.provinceId}: first=${range.firstIndex} count=${range.indexCount} total=${pack.indices.length}`);
    }
    if (range.firstIndex % 3 !== 0 || range.indexCount % 3 !== 0) throw new Error(`Unaligned LOD range for ${province.provinceId}`);
  }
}
if (renderableCount !== pack.diagnostics.renderableProvinceCount || nonRenderableCount !== pack.diagnostics.nonRenderableProvinceCount) throw new Error("GPU geometry status diagnostics mismatch.");
for (let i = 0; i < pack.indices.length; i += 1) if (pack.indices[i] >= vertexCount) throw new Error(`Out-of-bounds GPU index ${pack.indices[i]} at ${i}.`);
for (let i = 0; i < pack.vertices.length; i += 1) if (!Number.isFinite(pack.vertices[i])) throw new Error(`Non-finite GPU vertex detected at ${i}.`);

const fixture = [
  { id: "fixture", geometry: { polygons: [[[0, 0], [2, 0], [2, 1], [1, 2], [0, 1]]] } },
];
const fixtureA = buildIndexedProvincePack(fixture, { tileSize: 10, quantization: 1e6 });
const fixtureB = buildIndexedProvincePack(fixture, { tileSize: 10, quantization: 1e6 });
if (fixtureA.vertices.length !== fixtureB.vertices.length || fixtureA.indices.length !== fixtureB.indices.length) throw new Error("GPU fixture is not deterministic in length.");
for (let i = 0; i < fixtureA.vertices.length; i += 1) if (fixtureA.vertices[i] !== fixtureB.vertices[i]) throw new Error(`GPU fixture vertices are non-deterministic at ${i}`);
for (let i = 0; i < fixtureA.indices.length; i += 1) if (fixtureA.indices[i] !== fixtureB.indices[i]) throw new Error(`GPU fixture indices are non-deterministic at ${i}`);

const degenerateFixture = [{ id: "degenerate-fixture", geometry: { polygons: [[[0, 0], [1, 0], [2, 0], [0, 0]]] } }];
const degeneratePack = buildIndexedProvincePack(degenerateFixture, { tileSize: 10, quantization: 1e6 });
if (degeneratePack.provinces[0].geometryStatus !== "non-renderable") throw new Error("Degenerate fixture was not classified as non-renderable.");
if (degeneratePack.indices.length !== 0) throw new Error("Degenerate fixture produced GPU triangles.");

console.log(`GPU province pack integrity: PASS (${entries.length} provinces, renderable=${renderableCount}, non-renderable=${nonRenderableCount}, ${vertexCount} vertices, ${pack.indices.length} indices, ${pack.tiles.length} tiles, build=${buildMs}ms; determinism=fixture; degeneracy=classified).`);
