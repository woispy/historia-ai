import fs from "node:fs/promises";
import { buildLodRings, triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";

const runtime = JSON.parse(await fs.readFile("src/world/map/assets/historical/1300/runtime.json", "utf8"));
const geometries = new Map((runtime.geometries ?? []).map((g) => [String(g.identity?.provinceId ?? g.identity?.id), g]));
const failures = [];
let rings = 0;
let sourceVertices = 0;
let canonicalized = 0;
for (const province of runtime.provinces ?? []) {
  const id = String(province.identity?.id);
  for (const [polygonIndex, source] of (geometries.get(id)?.polygons ?? []).entries()) {
    sourceVertices += Array.isArray(source) ? source.length : 0;
    for (const [lod, ring] of buildLodRings(source).entries()) {
      rings += 1;
      if (ring.length !== source.length) canonicalized += 1;
      try { triangulateRing(ring, { provinceId: id, polygonIndex, lod }); }
      catch (error) { failures.push({ id, polygonIndex, lod, before: source.length, after: ring.length, message: error instanceof Error ? error.message : String(error) }); }
    }
  }
}
console.log(`GPU topology diagnostic: provinces=${runtime.provinces?.length ?? 0}, polygons=${(runtime.geometries ?? []).reduce((n, g) => n + (g.polygons?.length ?? 0), 0)}, lodRings=${rings}, sourceVertices=${sourceVertices}, canonicalizedRings=${canonicalized}, failures=${failures.length}`);
if (failures.length) {
  for (const f of failures.slice(0, 25)) console.error(`GPU TOPOLOGY FAILURE province=${f.id} polygon=${f.polygonIndex} lod=${f.lod} vertices=${f.before}->${f.after}: ${f.message}`);
  throw new Error(`GPU topology diagnostic found ${failures.length} failing rings.`);
}
console.log("GPU topology diagnostic passed: every runtime province ring is triangulable across all four LODs.");
