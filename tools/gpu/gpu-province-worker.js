import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeRing, buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometryById = new Map((runtime.geometries ?? []).map((geometry) => [String(geometry.identity?.provinceId ?? geometry.identity?.id), geometry]));
const entries = (runtime.provinces ?? []).map((province, index) => ({ province, geometry: geometryById.get(String(province.identity?.id)), index })).filter((entry) => entry.geometry);

const index = Number(process.argv[2]);
if (!Number.isInteger(index) || index < 0 || index >= entries.length) throw new Error(`Invalid GPU province diagnostic index: ${process.argv[2]}`);
const entry = entries[index];
const provinceId = String(entry.province?.identity?.id ?? entry.province?.id ?? index);
const startedAt = Date.now();

try {
  const rings = (entry.geometry?.polygons ?? []).flatMap((polygon) => Array.isArray(polygon) ? [polygon] : []);
  const ringDiagnostics = rings.map((ring, polygonIndex) => ({ polygonIndex, ...analyzeRing(ring) }));
  const pack = buildIndexedProvincePack([entry], { tileSize: 10, quantization: 1e6 });
  const province = pack.provinces[0];
  if (!province) throw new Error("isolated pack omitted province identity");
  if (!province.bounds || !Object.values(province.bounds).every(Number.isFinite)) throw new Error("isolated pack has invalid bounds");
  if (province.renderable) {
    if (!pack.indices.length) throw new Error("renderable isolated pack has no triangles");
    if (pack.indices.length % 3 !== 0) throw new Error("isolated index buffer is not triangle aligned");
    for (const value of pack.vertices) if (!Number.isFinite(value)) throw new Error("isolated pack contains non-finite vertex");
    for (const indexValue of pack.indices) if (indexValue >= pack.vertices.length / 2) throw new Error(`isolated pack index out of bounds: ${indexValue}`);
    console.log(`GPU province worker PASS ${provinceId} status=renderable build=${Date.now() - startedAt}ms vertices=${pack.vertices.length / 2} indices=${pack.indices.length}`);
  } else {
    const reasons = ringDiagnostics.map((item) => item.reason).filter(Boolean);
    console.log(`GPU province worker PASS ${provinceId} status=non-renderable reason=${province.nonRenderableReason ?? reasons[0] ?? "unknown"} build=${Date.now() - startedAt}ms`);
  }
} catch (error) {
  console.error(`GPU province worker FAIL ${provinceId} build=${Date.now() - startedAt}ms: ${error?.stack ?? error}`);
  process.exitCode = 1;
}
