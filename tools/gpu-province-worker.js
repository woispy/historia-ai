import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRing, buildIndexedProvincePack } from "../src/map/rendering/gpu/ProvinceGpuPack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const index = Number(process.argv[2]);
if (!Number.isInteger(index) || index < 0) throw new Error(`Invalid province index: ${process.argv[2]}`);

const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const provinces = runtime.provinces ?? [];
const province = provinces[index];
if (!province) throw new Error(`Province index ${index} does not exist.`);
const provinceId = String(province.identity?.id ?? province.id ?? index);
const geometry = geometryById.get(provinceId);
if (!geometry) throw new Error(`No geometry for province=${provinceId}.`);

const polygons = geometry.polygons ?? [];
const rawVertices = polygons.reduce((sum, polygon) => sum + (Array.isArray(polygon) ? polygon.length : 0), 0);
const started = Date.now();
console.log(`GPU province worker start index=${index} province=${provinceId} polygons=${polygons.length} rawVertices=${rawVertices}`);

const ringDiagnostics = polygons.map((polygon, polygonIndex) => ({ polygonIndex, ...analyzeRing(polygon) }));
const pack = buildIndexedProvincePack([{ province, geometry }], {
  tileSize: 10,
  quantization: 1e6,
  onProgress: (event) => {
    if (event.phase === "province-start" || event.phase === "province-complete") {
      console.log(`GPU province worker ${event.phase} province=${provinceId} lod=${event.lod ?? "all"} status=${event.geometryStatus ?? (event.renderable === false ? "non-renderable" : "renderable")} vertices=${event.vertexCount} indices=${event.indexCount}`);
    }
  },
});

const packedProvince = pack.provinces[0];
if (!packedProvince) throw new Error(`GPU worker omitted province=${provinceId}.`);
if (!packedProvince.bounds || !Object.values(packedProvince.bounds).every(Number.isFinite)) throw new Error(`Invalid bounds province=${provinceId}.`);
if (packedProvince.renderable) {
  if (!pack.indices.length || pack.indices.length % 3 !== 0) throw new Error(`Invalid worker index buffer for province=${provinceId}.`);
  for (const indexValue of pack.indices) if (indexValue >= pack.vertices.length / 2) throw new Error(`Out-of-bounds index=${indexValue} province=${provinceId}.`);
  for (const value of pack.vertices) if (!Number.isFinite(value)) throw new Error(`Non-finite vertex province=${provinceId}.`);
  console.log(`GPU province worker PASS province=${provinceId} status=renderable vertices=${pack.vertices.length / 2} indices=${pack.indices.length} elapsed=${Date.now() - started}ms`);
} else {
  const reason = packedProvince.nonRenderableReason ?? ringDiagnostics[0]?.reason ?? "unknown";
  console.log(`GPU province worker PASS province=${provinceId} status=non-renderable reason=${reason} elapsed=${Date.now() - started}ms`);
}
