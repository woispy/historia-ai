import fs from "node:fs/promises";
import { buildLodRings, triangulateRing } from "../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";

const runtime = JSON.parse(await fs.readFile("src/world/map/assets/historical/1300/runtime.json", "utf8"));
const geometries = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const failures = [];
let rings = 0;
let sourceVertices = 0;
let canonicalized = 0;

for (const province of runtime.provinces ?? []) {
  const id = String(province.identity?.id);
  const polygons = geometries.get(id)?.polygons ?? [];
  for (const [polygonIndex, source] of polygons.entries()) {
    sourceVertices += Array.isArray(source) ? source.length : 0;
    for (const [lod, ring] of buildLodRings(source).entries()) {
      rings += 1;
      if (ring.length !== source.length) canonicalized += 1;
      try {
        triangulateRing(ring, {
          provinceId: id,
          polygonIndex,
          lod,
          maxOperations: 250_000,
        });
      } catch (error) {
        failures.push({
          id,
          polygonIndex,
          lod,
          before: source.length,
          after: ring.length,
          code: error?.code ?? "GPU_TOPOLOGY_UNKNOWN",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
}

console.log(`GPU topology diagnostic: provinces=${runtime.provinces?.length ?? 0}, polygons=${(runtime.geometries ?? []).reduce((count, geometry) => count + (geometry.polygons?.length ?? 0), 0)}, lodRings=${rings}, sourceVertices=${sourceVertices}, canonicalizedRings=${canonicalized}, failures=${failures.length}`);

if (failures.length) {
  for (const failure of failures.slice(0, 50)) {
    console.error(`GPU TOPOLOGY FAILURE code=${failure.code} province=${failure.id} polygon=${failure.polygonIndex} lod=${failure.lod} vertices=${failure.before}->${failure.after}: ${failure.message}`);
  }
  throw new Error(`GPU topology diagnostic found ${failures.length} failing rings; firstCode=${failures[0].code}; firstProvince=${failures[0].id}; firstPolygon=${failures[0].polygonIndex}; firstLod=${failures[0].lod}`);
}

console.log("GPU topology diagnostic passed: every runtime province ring is triangulable across all four LODs within the deterministic operation budget.");
