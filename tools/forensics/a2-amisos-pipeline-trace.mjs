import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLodRings, analyzeRing, normalizeRing } from "../../src/map/rendering/gpu/ProvinceGpuPackBuilderV2.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const runtimePath = path.join(root, "src/world/map/assets/historical/1300/runtime.json");
const provinceId = "pontus-amisos";
const tinyThreshold = 1e-10;

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

function areaSummary(ring) {
  const area = signedArea(ring);
  return {
    vertices: ring.length,
    signedArea: area,
    absArea: Math.abs(area),
    tiny: Math.abs(area) <= tinyThreshold,
    bbox: bbox(ring),
  };
}

const runtime = JSON.parse(await fs.readFile(runtimePath, "utf8"));
const geometry = (runtime.geometries ?? []).find((item) => String(item.identity?.provinceId ?? item.identity?.id) === provinceId);
if (!geometry) throw new Error(`Missing runtime geometry for ${provinceId}`);
const polygons = Array.isArray(geometry.polygons) ? geometry.polygons.filter((ring) => Array.isArray(ring) && ring.length >= 3) : [];
if (!polygons.length) throw new Error(`Runtime geometry for ${provinceId} has no polygon rings`);

const report = {
  province: provinceId,
  runtimePolygonCount: polygons.length,
  runtimePolygons: polygons.map((ring, polygonIndex) => ({ polygonIndex, ...areaSummary(ring) })),
  gpuPolygons: [],
  tinyThreshold,
};

for (const [polygonIndex, raw] of polygons.entries()) {
  const normalized = normalizeRing(raw);
  const diagnostics = analyzeRing(raw);
  const lods = buildLodRings(raw);
  const gpu = {
    polygonIndex,
    raw: areaSummary(raw),
    normalized: { ...areaSummary(normalized), diagnostics },
    lods: [],
  };
  for (const [lod, ring] of lods.entries()) {
    const normalizedLod = normalizeRing(ring);
    const lodDiagnostics = analyzeRing(ring);
    gpu.lods.push({
      lod,
      raw: areaSummary(ring),
      normalized: { ...areaSummary(normalizedLod), diagnostics: lodDiagnostics },
    });
  }
  report.gpuPolygons.push(gpu);
}

const suspicious = [];
const inspect = (stage, polygonIndex, area) => {
  if (Math.abs(area) <= tinyThreshold) suspicious.push({ stage, polygonIndex, area });
};
for (const [polygonIndex, ring] of polygons.entries()) inspect("runtime_raw", polygonIndex, signedArea(ring));
for (const gpu of report.gpuPolygons) {
  inspect("gpu_normalize_lod0", gpu.polygonIndex, gpu.normalized.signedArea);
  for (const lod of gpu.lods) inspect(`gpu_lod${lod.lod}`, gpu.polygonIndex, lod.normalized.signedArea);
}
report.tinyAreaHits = suspicious;

const output = JSON.stringify(report, null, 2);
console.log("A2_AMISOS_FORENSIC_TRACE");
console.log(output);
console.log("A2_AMISOS_FORENSIC_TRACE_END");
if (process.env.GITHUB_STEP_SUMMARY) {
  await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, `## A2 Amisos forensic trace\n\n\`\`\`json\n${output}\n\`\`\`\n`);
}
await fs.writeFile(path.join(root, "a2-amisos-forensic-report.json"), output + "\n");
