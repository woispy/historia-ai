import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLodRings, analyzeRing, normalizeRing } from "../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const provinceId = "pontus-amisos";

function signedArea(ring) {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

function bbox(ring) {
  if (!ring.length) return null;
  return {
    minX: Math.min(...ring.map((p) => p[0])),
    minY: Math.min(...ring.map((p) => p[1])),
    maxX: Math.max(...ring.map((p) => p[0])),
    maxY: Math.max(...ring.map((p) => p[1])),
  };
}

const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometry = (runtime.geometries ?? []).find((item) => String(item.identity?.provinceId ?? item.identity?.id) === provinceId);
if (!geometry) throw new Error(`Missing runtime geometry for ${provinceId}`);
const raw = geometry.polygons?.[0] ?? [];
if (raw.length < 3) throw new Error(`Runtime geometry for ${provinceId} has insufficient vertices: ${raw.length}`);

const normalized = normalizeRing(raw);
const lods = buildLodRings(raw);

console.log("A2_AMISOS_FORENSIC_TRACE");
console.log(`province=${provinceId}`);
console.log(`runtime_raw vertices=${raw.length} signedArea=${signedArea(raw)} bbox=${JSON.stringify(bbox(raw))}`);
console.log(`gpu_normalize_lod0 vertices=${normalized.length} signedArea=${signedArea(normalized)} diagnostics=${JSON.stringify(analyzeRing(raw))}`);

for (const [lod, ring] of lods.entries()) {
  const normalizedLod = normalizeRing(ring);
  const diagnostics = analyzeRing(ring);
  console.log(`gpu_lod${lod} vertices=${ring.length} normalizedVertices=${normalizedLod.length} signedArea=${diagnostics.signedArea} triangulable=${diagnostics.triangulable} reason=${diagnostics.reason} bbox=${JSON.stringify(bbox(normalizedLod))}`);
}

const tinyThreshold = 1e-10;
const suspicious = [];
const push = (stage, area) => {
  if (Math.abs(area) <= tinyThreshold) suspicious.push({ stage, area });
};
push("runtime_raw", signedArea(raw));
push("gpu_normalize_lod0", signedArea(normalized));
for (const [lod, ring] of lods.entries()) push(`gpu_lod${lod}`, signedArea(normalizeRing(ring)));
console.log(`tiny_area_threshold=${tinyThreshold}`);
console.log(`tiny_area_hits=${JSON.stringify(suspicious)}`);
console.log("A2_AMISOS_FORENSIC_TRACE_END");
