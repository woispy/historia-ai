import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack, buildLodRings, normalizeRing } from "../../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";
import { encodeGpuProvincePack } from "../../../src/map/rendering/gpu/GpuProvincePackFormat.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputPath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const outputDir = path.join(root, "src/world/map/assets/historical/1300/generated");
const outputPath = path.join(outputDir, "provinces.gpu.bin");

const signedArea = (ring) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
};

const diagnosticsForRing = (ring) => {
  const normalized = normalizeRing(ring);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let nonFinite = 0;
  for (const point of normalized) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) { nonFinite += 1; continue; }
    minX = Math.min(minX, point[0]); minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]); maxY = Math.max(maxY, point[1]);
  }
  return {
    inputVertices: Array.isArray(ring) ? ring.length : 0,
    normalizedVertices: normalized.length,
    signedArea: signedArea(normalized),
    nonFinite,
    bbox: normalized.length && nonFinite === 0 ? { minX, minY, maxX, maxY } : null,
  };
};

const runtime = JSON.parse(await fs.readFile(inputPath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province) => ({ province, geometry: geometryById.get(String(province.identity?.id)) })).filter((entry) => entry.geometry);
if (!entries.length) throw new Error("Historical runtime contains no geometry suitable for GPU packing.");

// Cheap structural preflight. Do not run O(n²) self-intersection analysis here:
// the production triangulator is the authoritative topology gate and reports the
// exact province/LOD on failure. This pass exists only to reject corrupt numbers.
let ringCount = 0;
let vertexCount = 0;
for (const [provinceIndex, entry] of entries.entries()) {
  const provinceId = String(entry.province?.identity?.id ?? entry.province?.id ?? provinceIndex);
  for (const [polygonIndex, polygon] of (entry.geometry?.polygons ?? []).entries()) {
    for (const [lod, ring] of buildLodRings(polygon).entries()) {
      if (ring.length < 3) continue;
      const diagnostics = diagnosticsForRing(ring);
      ringCount += 1;
      vertexCount += diagnostics.normalizedVertices;
      if (diagnostics.nonFinite || Math.abs(diagnostics.signedArea) <= 1e-10) {
        throw new Error(`GPU geometry preflight failed: province=${provinceId} polygon=${polygonIndex} lod=${lod}; diagnostics=${JSON.stringify(diagnostics)}`);
      }
    }
  }
}
console.log(`GPU geometry preflight: PASS (${ringCount} rings, ${vertexCount} vertices; linear checks).`);

const buildStartedAt = Date.now();
let pack;
try {
  pack = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
} catch (error) {
  throw new Error(`GPU pack build failed after ${Date.now() - buildStartedAt}ms: ${error.message}`, { cause: error });
}
const buildMs = Date.now() - buildStartedAt;

const binary = encodeGpuProvincePack(pack);
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, Buffer.from(binary));

const memory = process.memoryUsage();
console.log(`GPU pack: ${entries.length} provinces, ${pack.tiles.length} tiles, ${pack.vertices.length / 2} vertices, ${pack.indices.length} indices.`);
console.log(`GPU pack build: ${buildMs}ms; heap=${Math.round(memory.heapUsed / 1024 / 1024)}MiB; rss=${Math.round(memory.rss / 1024 / 1024)}MiB.`);
console.log(`GPU pack written: ${path.relative(root, outputPath)}`);
