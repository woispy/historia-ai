import { buildIndexedProvincePack } from "../../src/map/rendering/gpu/ProvinceGpuPack.js";
import { encodeGpuProvincePack, GPU_PROVINCE_PACK_MAGIC, GPU_PROVINCE_PACK_VERSION } from "../../src/map/rendering/gpu/GpuProvincePackFormat.js";

const PROVINCE_COUNT = 15_001;
const EXPECTED_NON_RENDERABLE = 19;
const EXPECTED_RENDERABLE = PROVINCE_COUNT - EXPECTED_NON_RENDERABLE;

function makeSquare(index) {
  const x = (index % 250) * 0.8;
  const y = Math.floor(index / 250) * 0.8;
  return [[x, y], [x + 0.7, y], [x + 0.7, y + 0.7], [x, y + 0.7]];
}

function makeFixtureProvince(index) {
  const id = `stress-${String(index).padStart(5, "0")}`;
  if (index % 811 === 0) {
    return {
      province: { identity: { id } },
      geometry: { polygons: [[[index * 0.001, 0], [index * 0.001 + 1, 0], [index * 0.001 + 2, 0]]] },
    };
  }
  if (index % 977 === 0) {
    return {
      province: { identity: { id } },
      geometry: { polygons: [[[index * 0.001, 0], [index * 0.001 + 1, 1], [index * 0.001 + 2, 0], [index * 0.001 + 1, -1]]] },
    };
  }
  if (index % 613 === 0) {
    return {
      province: { identity: { id } },
      geometry: { polygons: [[[index * 0.001, 0], [index * 0.001 + 1, 0], [index * 0.001 + 2, 0], [index * 0.001 + 3, 0]]] },
    };
  }
  return { province: { identity: { id } }, geometry: { polygons: [makeSquare(index)] } };
}

const entries = Array.from({ length: PROVINCE_COUNT }, (_, index) => makeFixtureProvince(index));
const build = () => buildIndexedProvincePack(entries, {
  tileSize: 10,
  quantization: 1e6,
  onProgress: (event) => {
    if (event.phase === "province-complete" && (event.provinceIndex + 1) % 1000 === 0) {
      console.log(`15K GPU stress progress=${event.provinceIndex + 1}/${event.provinceCount} renderable=${event.geometryStatus} vertices=${event.vertexCount} indices=${event.indexCount}`);
    }
  },
});

const started = Date.now();
const packA = build();
const buildMs = Date.now() - started;

if (packA.version !== 2) throw new Error(`Unexpected pack version: ${packA.version}`);
if (packA.provinces.length !== PROVINCE_COUNT) throw new Error(`Province count mismatch: expected=${PROVINCE_COUNT} actual=${packA.provinces.length}`);
if (packA.diagnostics.renderableProvinceCount !== EXPECTED_RENDERABLE) throw new Error(`Renderable count mismatch: expected=${EXPECTED_RENDERABLE} actual=${packA.diagnostics.renderableProvinceCount}`);
if (packA.diagnostics.nonRenderableProvinceCount !== EXPECTED_NON_RENDERABLE) throw new Error(`Non-renderable count mismatch: expected=${EXPECTED_NON_RENDERABLE} actual=${packA.diagnostics.nonRenderableProvinceCount}`);
if (!packA.indices.length || packA.indices.length % 3 !== 0) throw new Error("15K stress pack has no triangle-aligned index buffer.");
if (!packA.tiles.length) throw new Error("15K stress pack generated no spatial tiles.");

const ids = packA.provinces.map((province) => province.provinceId);
if (new Set(ids).size !== PROVINCE_COUNT) throw new Error("15K stress pack contains duplicate province identities.");
for (const province of packA.provinces) {
  if (!province.bounds || !Object.values(province.bounds).every(Number.isFinite)) throw new Error(`Invalid bounds for ${province.provinceId}`);
  if (province.lodRanges.length !== 4) throw new Error(`LOD contract failure for ${province.provinceId}`);
  for (const range of province.lodRanges) {
    if (range.firstIndex % 3 !== 0 || range.indexCount % 3 !== 0) throw new Error(`Triangle alignment failure for ${province.provinceId}`);
    if (range.firstIndex < 0 || range.firstIndex + range.indexCount > packA.indices.length) throw new Error(`Out-of-range LOD for ${province.provinceId}`);
  }
}
for (const index of packA.indices) if (index >= packA.vertices.length / 2) throw new Error(`Out-of-bounds index ${index}`);
for (const value of packA.vertices) if (!Number.isFinite(value)) throw new Error("Non-finite stress vertex detected.");

const binary = encodeGpuProvincePack(packA);
if (binary.length < 64) throw new Error(`Encoded GPU pack unexpectedly small: ${binary.length}`);
const view = new DataView(binary.buffer, binary.byteOffset, binary.byteLength);
for (let i = 0; i < GPU_PROVINCE_PACK_MAGIC.length; i += 1) if (binary[i] !== GPU_PROVINCE_PACK_MAGIC[i]) throw new Error("GPU binary magic mismatch.");
if (view.getUint32(8, true) !== GPU_PROVINCE_PACK_VERSION) throw new Error("GPU binary version mismatch.");
if (view.getUint32(32, true) !== PROVINCE_COUNT) throw new Error(`GPU binary province header mismatch: ${view.getUint32(32, true)}`);

const secondStarted = Date.now();
const packB = build();
const secondBuildMs = Date.now() - secondStarted;
if (packA.vertices.length !== packB.vertices.length || packA.indices.length !== packB.indices.length) throw new Error("15K build is non-deterministic in buffer lengths.");
for (let i = 0; i < packA.vertices.length; i += 1) if (packA.vertices[i] !== packB.vertices[i]) throw new Error(`15K vertex determinism failure at ${i}`);
for (let i = 0; i < packA.indices.length; i += 1) if (packA.indices[i] !== packB.indices[i]) throw new Error(`15K index determinism failure at ${i}`);
for (let i = 0; i < PROVINCE_COUNT; i += 1) {
  if (packA.provinces[i].provinceId !== packB.provinces[i].provinceId) throw new Error(`15K province order determinism failure at ${i}`);
}

const memory = process.memoryUsage();
console.log(`15K+ province stress: PASS (${PROVINCE_COUNT} provinces; renderable=${packA.diagnostics.renderableProvinceCount}; non-renderable=${packA.diagnostics.nonRenderableProvinceCount}; vertices=${packA.vertices.length / 2}; indices=${packA.indices.length}; tiles=${packA.tiles.length}; binary=${binary.length}B; build1=${buildMs}ms; build2=${secondBuildMs}ms; heap=${Math.round(memory.heapUsed / 1024 / 1024)}MiB; rss=${Math.round(memory.rss / 1024 / 1024)}MiB; determinism=full-buffer).`);
