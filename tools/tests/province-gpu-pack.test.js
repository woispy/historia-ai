import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack, buildLodRings, normalizeRing, triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province) => ({ province, geometry: geometryById.get(String(province.identity?.id)) })).filter((entry) => entry.geometry);
if (!entries.length) throw new Error("GPU pack test found no historical province geometry.");

let checkedRings = 0;
for (const entry of entries) {
  const provinceId = String(entry.province?.identity?.id ?? entry.province?.id ?? "unknown");
  for (const polygon of entry.geometry?.polygons ?? []) {
    const lods = buildLodRings(polygon);
    if (lods.length !== 4) throw new Error(`Expected four LODs for ${provinceId}`);
    for (let lod = 0; lod < lods.length; lod += 1) {
      const ring = normalizeRing(lods[lod]);
      if (ring.length < 3) continue;
      checkedRings += 1;
      triangulateRing(ring, { provinceId, lod });
    }
  }
}

const packA = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
const packB = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
if (packA.version !== 2 || packA.tileSize !== 10 || packA.quantization !== 1e6) throw new Error("Unexpected GPU pack header.");
if (packA.vertices.length === 0 || packA.indices.length === 0) throw new Error("GPU pack is empty.");
if (packA.indices.length % 3 !== 0) throw new Error("GPU index buffer is not triangle aligned.");
if (packA.vertices.length !== packB.vertices.length || packA.indices.length !== packB.indices.length) throw new Error("GPU pack is not deterministic in length.");
for (let i = 0; i < packA.vertices.length; i += 1) if (packA.vertices[i] !== packB.vertices[i]) throw new Error(`GPU vertices are non-deterministic at ${i}`);
for (let i = 0; i < packA.indices.length; i += 1) if (packA.indices[i] !== packB.indices[i]) throw new Error(`GPU indices are non-deterministic at ${i}`);
for (const province of packA.provinces) {
  for (const range of province.lodRanges) {
    if (range.firstIndex < 0 || range.indexCount < 0 || range.firstIndex + range.indexCount > packA.indices.length) throw new Error(`Invalid LOD range for ${province.provinceId}`);
    if (range.indexCount % 3 !== 0) throw new Error(`Unaligned LOD range for ${province.provinceId}`);
  }
}
for (const index of packA.indices) if (index >= packA.vertices.length / 2) throw new Error(`Out-of-bounds GPU index ${index}`);
for (const value of packA.vertices) if (!Number.isFinite(value)) throw new Error("Non-finite GPU vertex detected.");

console.log(`GPU province pack integrity: PASS (${entries.length} provinces, ${checkedRings} LOD rings, ${packA.vertices.length / 2} vertices, ${packA.indices.length} indices, ${packA.tiles.length} tiles).`);
