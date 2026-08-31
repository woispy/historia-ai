import fs from "node:fs/promises";
import { normalizeRing, triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";

const path = "src/world/map/assets/historical/1300/runtime.json";
const runtime = JSON.parse(await fs.readFile(path, "utf8"));
const geometries = new Map((runtime.geometries ?? []).map((g) => [String(g.identity?.provinceId ?? g.identity?.id), g]));
const failures = [];
let rings = 0;
let normalized = 0;
let repaired = 0;
for (const province of runtime.provinces ?? []) {
  const id = String(province.identity?.id);
  for (let polygonIndex = 0; polygonIndex < (geometries.get(id)?.polygons ?? []).length; polygonIndex += 1) {
    const source = geometries.get(id).polygons[polygonIndex];
    for (let lod = 0; lod < 4; lod += 1) {
      const ring = normalizeRing(source);
      const before = Array.isArray(source) ? source.length : 0;
      rings += 1;
      normalized += ring.length;
      if (ring.length !== before) repaired += 1;
      try { triangulateRing(ring, { provinceId: id, polygonIndex, lod }); }
      catch (error) { failures.push({ id, polygonIndex, lod, before, after: ring.length, message: error instanceof Error ? error.message : String(error) }); }
    }
  }
}
console.log(`GPU topology diagnostic: provinces=${runtime.provinces?.length ?? 0}, rings=${rings}, normalizedVertices=${normalized}, canonicalizedRings=${repaired}, failures=${failures.length}`);
if (failures.length) {
  for (const failure of failures.slice(0, 25)) console.error(`GPU TOPOLOGY FAILURE province=${failure.id} polygon=${failure.polygonIndex} lod=${failure.lod} vertices=${failure.before}->${failure.after}: ${failure.message}`);
  throw new Error(`GPU topology diagnostic found ${failures.length} failing rings.`);
}
console.log("GPU topology diagnostic passed: every runtime province ring is triangulable across all four LODs.");
