/**
 * Historia AI — Parallel Province Packer
 */

import { Worker } from "node:worker_threads";
import { cpus } from "node:os";
import { fileURLToPath } from "node:url";
import { buildIndexedProvincePack } from "./ProvinceGpuPackStable.js";

const WORKER_PATH = fileURLToPath(new URL("./ProvincePackWorker.js", import.meta.url));

function chunkEntries(entries, chunkCount) {
  const chunks = [];
  const chunkSize = Math.ceil(entries.length / chunkCount);
  for (let start = 0; start < entries.length; start += chunkSize) chunks.push(entries.slice(start, start + chunkSize));
  return chunks;
}

function runWorker(entries, options, timeoutMs) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(WORKER_PATH, { workerData: { entries, options } });
    let settled = false;
    let timer = null;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      worker.terminate().catch(() => {});
      fn(value);
    };
    if (timeoutMs > 0) timer = setTimeout(() => finish(reject, new Error(`Province pack worker timed out after ${timeoutMs}ms`)), timeoutMs);
    worker.on("message", (msg) => {
      if (msg?.type === "result") finish(resolve, msg.pack);
      else if (msg?.type === "error") finish(reject, new Error(msg.message));
    });
    worker.on("error", (error) => finish(reject, error));
    worker.on("exit", (code) => {
      if (!settled && code !== 0) finish(reject, new Error(`Province pack worker exited with code ${code}`));
    });
  });
}

function mergePacks(packs) {
  if (packs.length === 1) return packs[0];
  const vertices = [];
  const indices = [];
  const provinces = [];
  const tiles = new Map();
  let vertexOffset = 0;
  let provinceOffset = 0;
  let renderableProvinceCount = 0;
  let nonRenderableProvinceCount = 0;
  for (const pack of packs) {
    for (const value of pack.vertices) vertices.push(value);
    for (const value of pack.indices) indices.push(value + vertexOffset);
    for (const province of pack.provinces) {
      provinces.push({ ...province, provinceIndex: province.provinceIndex + provinceOffset, lodRanges: province.lodRanges.map((range) => ({ firstIndex: range.firstIndex + indices.length - pack.indices.length, indexCount: range.indexCount })) });
    }
    for (const tile of pack.tiles) {
      const key = `${tile.x}:${tile.y}`;
      if (!tiles.has(key)) tiles.set(key, { tileId: key, x: tile.x, y: tile.y, provinceIndices: [] });
      for (const provinceIndex of tile.provinceIndices) tiles.get(key).provinceIndices.push(provinceIndex + provinceOffset);
    }
    renderableProvinceCount += pack.diagnostics.renderableProvinceCount;
    nonRenderableProvinceCount += pack.diagnostics.nonRenderableProvinceCount;
    vertexOffset += pack.vertices.length / 2;
    provinceOffset += pack.provinces.length;
  }
  return Object.freeze({
    version: 2,
    tileSize: packs[0].tileSize,
    quantization: packs[0].quantization,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    provinces: Object.freeze(provinces),
    tiles: Object.freeze([...tiles.values()].map((tile) => Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) }))),
    diagnostics: Object.freeze({ renderableProvinceCount, nonRenderableProvinceCount }),
  });
}

export async function buildIndexedProvincePackParallel(entries = [], options = {}) {
  if (!Array.isArray(entries)) throw new TypeError("entries must be an array");
  const workerCount = Math.max(1, Number(options.workerCount ?? Math.max(1, cpus().length - 1)));
  const timeoutMs = Number(options.timeoutMs ?? 0);
  if (workerCount <= 1 || entries.length < 2) return buildIndexedProvincePack(entries, options);
  const chunks = chunkEntries(entries, workerCount);
  try {
    const packs = await Promise.all(chunks.map((chunk) => runWorker(chunk, options, timeoutMs)));
    return mergePacks(packs);
  } catch {
    return buildIndexedProvincePack(entries, options);
  }
}

export { mergePacks, chunkEntries };
export default buildIndexedProvincePackParallel;
