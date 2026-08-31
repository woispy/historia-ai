import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack, buildLodRings, analyzeRing, normalizeRing } from "../../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";
import { encodeGpuProvincePack } from "../../../src/map/rendering/gpu/GpuProvincePackFormat.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputPath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const outputDir = path.join(root, "src/world/map/assets/historical/1300/generated");
const outputPath = path.join(outputDir, "provinces.gpu.bin");

const diagnosticsForRing = (ring) => {
  const normalized = normalizeRing(ring);
  const diagnostics = analyzeRing(normalized);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let nonFinite = 0;
  for (const point of normalized) {
    if (!Number.isFinite(point[0]) || !Number.isFinite(point[1])) {
      nonFinite += 1;
      continue;
    }
    minX = Math.min(minX, point[0]);
    minY = Math.min(minY, point[1]);
    maxX = Math.max(maxX, point[0]);
    maxY = Math.max(maxY, point[1]);
  }
  return {
    inputVertices: Array.isArray(ring) ? ring.length : 0,
    normalizedVertices: normalized.length,
    signedArea: diagnostics.signedArea,
    nonFinite,
    simple: diagnostics.simple,
    triangulable: diagnostics.triangulable,
    reason: diagnostics.reason,
    bbox: normalized.length && nonFinite === 0 ? { minX, minY, maxX, maxY } : null,
  };
};

const runtime = JSON.parse(await fs.readFile(inputPath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province) => ({ province, geometry: geometryById.get(String(province.identity?.id)) })).filter((entry) => entry.geometry);
if (!entries.length) throw new Error("Historical runtime contains no geometry suitable for GPU packing.");

let ringCount = 0;
let vertexCount = 0;
let nonRenderableRingCount = 0;
let nonRenderableProvinceCount = 0;
const nonRenderable = [];

for (const [provinceIndex, entry] of entries.entries()) {
  const provinceId = String(entry.province?.identity?.id ?? entry.province?.id ?? provinceIndex);
  let provinceRenderable = false;
  for (const [polygonIndex, polygon] of (entry.geometry?.polygons ?? []).entries()) {
    for (const [lod, ring] of buildLodRings(polygon).entries()) {
      if (ring.length < 3) {
        nonRenderableRingCount += 1;
        nonRenderable.push({ provinceId, polygonIndex, lod, diagnostics: diagnosticsForRing(ring) });
        continue;
      }
      const diagnostics = diagnosticsForRing(ring);
      ringCount += 1;
      vertexCount += diagnostics.normalizedVertices;
      if (diagnostics.nonFinite) {
        throw new Error(`GPU geometry preflight found non-finite coordinates: province=${provinceId} polygon=${polygonIndex} lod=${lod}; diagnostics=${JSON.stringify(diagnostics)}`);
      }
      if (diagnostics.triangulable) {
        provinceRenderable = true;
      } else {
        nonRenderableRingCount += 1;
        nonRenderable.push({ provinceId, polygonIndex, lod, diagnostics });
      }
    }
  }
  if (!provinceRenderable) nonRenderableProvinceCount += 1;
}

if (nonRenderable.length) {
  for (const item of nonRenderable) {
    console.log(`GPU geometry preflight NON_RENDERABLE province=${item.provinceId} polygon=${item.polygonIndex} lod=${item.lod} reason=${item.diagnostics.reason} area=${item.diagnostics.signedArea} vertices=${item.diagnostics.normalizedVertices}`);
  }
}
console.log(`GPU geometry preflight: PASS (${ringCount} analyzable rings, ${vertexCount} vertices; non-renderable rings=${nonRenderableRingCount}, provinces=${nonRenderableProvinceCount}).`);

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
console.log(`GPU pack: ${entries.length} provinces, renderable=${pack.diagnostics.renderableProvinceCount}, non-renderable=${pack.diagnostics.nonRenderableProvinceCount}, tiles=${pack.tiles.length}, vertices=${pack.vertices.length / 2}, indices=${pack.indices.length}.`);
console.log(`GPU pack build: ${buildMs}ms; heap=${Math.round(memory.heapUsed / 1024 / 1024)}MiB; rss=${Math.round(memory.rss / 1024 / 1024)}MiB.`);
console.log(`GPU pack written: ${path.relative(root, outputPath)}`);
