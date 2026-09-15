/**
 * Worker thread for parallel province packing
 */

import { parentPort, workerData } from "node:worker_threads";
import { buildIndexedProvincePack } from "./ProvinceGpuPackStable.js";
import { triangulateRingOptimized } from "./TriangulationOptimized.js";

const { workerIndex } = workerData;

const MessageType = {
  PACK_PROVINCES: "PACK_PROVINCES",
  RESULT: "RESULT",
  ERROR: "ERROR",
  PROGRESS: "PROGRESS",
};

parentPort?.on("message", async (msg) => {
  if (msg.type === "PACK_PROVINCES") {
    const { entries, options } = msg;

    try {
      // Use the optimized triangulation
      const { triangulateRing } = await import("./TriangulationOptimized.js");

      // Override the triangulation function in the packer
      const pack = await buildIndexedProvincePackWithOptimized(msg.entries, {
        ...msg.options,
        triangulateRing,
      });

      parentPort?.postMessage({ type: "RESULT", pack, workerIndex: workerData.workerIndex });
    } catch (error) {
      parentPort?.postMessage({ type: "ERROR", error: error.message, workerIndex: workerData.workerIndex });
    }
  }
});

/**
 * Build indexed province pack with custom triangulation function
 */
async function buildIndexedProvincePackWithOptimized(entries = [], options = {}) {
  const { triangulateRing } = await import("./TriangulationOptimized.js");

  const tileSize = Number(options.tileSize ?? 10);
  const quantization = Number(options.quantization ?? 1e6);
  const onProgress = typeof options.onProgress === "function" ? options.onProgress : null;

  if (!Number.isFinite(tileSize) || tileSize <= 0 || !Number.isFinite(quantization) || quantization <= 0) {
    throw new Error("Invalid GPU pack options.");
  }

  const vertices = [];
  const indices = [];
  const vertexMap = new Map();
  const provinces = [];
  const tiles = new Map();
  const vertex = (p) => {
    const key = `${Math.round(p[0] * quantization)},${Math.round(p[1] * quantization)}`;
    const old = vertexMap.get(key);
    if (old !== undefined) return old;
    const id = vertices.length / 2;
    vertices.push(p[0], p[1]);
    vertexMap.set(key, id);
    return id;
  };

  const provinces = [];
  const tiles = new Map();
  const vertex = (p) => {
    const key = `${Math.round(p[0] * quantization)},${Math.round(p[1] * quantization)}`;
    const old = vertexMap.get(key);
    if (old !== undefined) return old;
    const id = vertices.length / 2;
    vertices.push(p[0], p[1]);
    vertexMap.set(key, id);
    return id;
  };

  const provincesResult = [];
  const tiles = new Map();

  for (let provinceIndex = 0; provinceIndex < entries.length; provinceIndex += 1) {
    const entry = entries[provinceIndex];
    const provinceId = String(entry?.province?.identity?.id ?? entry?.province?.id ?? entry?.id ?? provinceIndex);
    const geometryAsset = entry?.geometry ?? entry;
    const polygons = geometryAsset?.polygons ?? geometryAsset?.geometry?.polygons ?? [];

    const provinceTilesStart = tiles.size;
    const diagnosticRings = [];
    const bounds = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    let renderable = false;
    let triangulablePolygonCount = 0;
    let nonRenderableRingCount = 0;
    let firstNonRenderableReason = null;

    onProgress?.({ phase: "province-start", provinceIndex, provinceId, provinceCount: entries.length, polygonCount: polygons.length, vertexCount: vertices.length / 2, indexCount: indices.length });

    const lods = polygons.map((polygon) => buildLodRingsOptimized(polygon));

    for (let lod = 0; lod < 4; lod += 1) {
      const firstIndex = indices.length;
      for (let polygonIndex = 0; polygonIndex < lods.length; polygonIndex += 1) {
        const ring = lods[polygonIndex]?.[lod];
        if (!ring?.length) continue;
        updateBounds(bounds, ring);
        const diagnostics = analyzeRingOptimized(ring);
        diagnosticRings.push(Object.freeze({ polygonIndex, lod, ...diagnostics }));
        const triangleIndices = diagnostics.triangulable ? triangulateRingOptimized(ring, { provinceId, polygonIndex, lod }) : [];
        if (triangleIndices.length) {
          triangulablePolygonCount += 1;
          renderable = true;
          for (const index of triangleIndices) indices.push(vertex(ring[index]));
        } else {
          nonRenderableRingCount += 1;
          firstNonRenderableReason ??= diagnostics.reason;
        }
      }
      const indexCount = indices.length - firstIndex;
      if (indexCount % 3) throw new Error(`LOD${lod} range is not triangle aligned for ${provinceId}`);
      ranges.push(Object.freeze({ firstIndex, indexCount }));
      onProgress?.({ phase: "lod-complete", provinceIndex, provinceId, provinceCount: entries.length, polygonCount: polygons.length, lod, vertexCount: vertices.length / 2, indexCount: indices.length, lodIndexCount: indexCount, renderable });
    }

    if (!Number.isFinite(bounds.minX)) {
      throw new Error(`GPU province has invalid geometry bounds: province=${provinceId}`);
    }

    const provincesResult = {
      provinceIndex,
      provinceId,
      bounds: Object.freeze(bounds),
      geometryStatus: renderable ? "renderable" : "non-renderable",
      renderable,
      triangulablePolygonCount,
      nonRenderableRingCount,
      nonRenderableReason: renderable ? null : firstNonRenderableReason,
      diagnostics: Object.freeze(diagnosticRings),
      lodRanges: Object.freeze(ranges),
    };

    provincesResult.push(Object.freeze(provincesResult));

    for (let x = Math.floor(bounds.minX / tileSize); x <= Math.floor(bounds.maxX / tileSize); x += 1) {
      for (let y = Math.floor(bounds.minY / tileSize); y <= Math.floor(bounds.maxY / tileSize); y += 1) {
        const key = `${x}:${y}`;
        if (!tiles.has(key)) tiles.set(key, { tileId: key, x, y, provinceIndices: [] });
        tiles.get(key).provinceIndices.push(provinceIndex);
      }
    }

    onProgress?.({ phase: "province-complete", provinceIndex, provinceId, provinceCount: entries.length, polygonCount: polygons.length, vertexCount: vertices.length / 2, indexCount: indices.length, geometryStatus: renderable ? "renderable" : "non-renderable", nonRenderableReason: renderable ? null : firstNonRenderableReason });
  }

  if (!indices.length) throw new Error("GPU province pack contains no renderable triangles.");
  for (let i = 0; i < indices.length; i += 1) if (indices[i] < 0 || indices[i] >= vertices.length / 2) throw new Error(`GPU index out of bounds at ${i}`);
  for (let i = 0; i < vertices.length; i += 1) if (!Number.isFinite(vertices[i])) throw new Error(`GPU vertex is not finite at ${i}`);

  const renderableProvinceCount = provinces.filter((p) => p.renderable).length;
  const nonRenderableProvinceCount = provinces.length - renderableProvinceCount;

  return Object.freeze({
    version: 2,
    tileSize,
    quantization,
    vertices: new Float32Array(vertices),
    indices: new Uint32Array(indices),
    provinces: Object.freeze(provinces),
    tiles: Object.freeze([...tiles.values()].map((tile) => Object.freeze({ ...tile, provinceIndices: Object.freeze([...new Set(tile.provinceIndices)].sort((a, b) => a - b)) }))),
    diagnostics: Object.freeze({ renderableProvinceCount, nonRenderableProvinceCount }),
  });
}

function buildLodRingsOptimized(ring, levels = [1, 0.5, 0.25, 0.125]) {
  const source = normalizeRing(ring);
  if (source.length < 3) return levels.map(() => source.slice());
  const output = [];
  let previous = source;
  for (let level = 0; level < levels.length; level += 1) {
    const factor = Number(levels[level]);
    const target = Math.min(previous.length, Math.max(3, Math.round(source.length * (Number.isFinite(factor) ? factor : 1))));
    const candidate = level === 0 ? source : simplifyRingOptimized(source, target);
    output.push(candidate);
    previous = candidate;
  }
  return output;
}

function simplifyRingOptimized(ring, target) {
  const source = normalizeRing(ring);
  if (source.length <= target || target < 3) return source;
  const step = source.length / target;
  const out = [];
  for (let i = 0; i < target; i += 1) out.push(source[Math.min(source.length - 1, Math.floor(i * step))]);
  const candidate = normalizeRing(out);
  return candidate.length >= 3 && Math.abs(signedArea(candidate)) > 1e-12 && isSimpleOptimized(candidate) ? candidate : source;
}

export function buildIndexedProvincePackWithOptimized(entries = [], options = {}) {
  // This is a placeholder - the actual implementation would be in the worker
  throw new Error("Use worker thread for optimized packing");
}
