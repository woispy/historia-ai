import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack } from "../../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";
import { encodeGpuProvincePack } from "../../../src/map/rendering/gpu/GpuProvincePackFormat.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const inputPath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const outputDir = path.join(root, "src/world/map/assets/historical/1300/generated");
const outputPath = path.join(outputDir, "provinces.gpu.bin");

const runtime = JSON.parse(await fs.readFile(inputPath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province) => ({ province, geometry: geometryById.get(String(province.identity?.id)) })).filter((entry) => entry.geometry);
if (!entries.length) throw new Error("Historical runtime contains no geometry suitable for GPU packing.");

const pack = buildIndexedProvincePack(entries, { tileSize: 10, quantization: 1e6 });
const binary = encodeGpuProvincePack(pack);
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, Buffer.from(binary));

console.log(`GPU pack: ${entries.length} provinces, ${pack.tiles.length} tiles, ${pack.vertices.length / 2} vertices, ${pack.indices.length} indices.`);
console.log(`GPU pack written: ${path.relative(root, outputPath)}`);