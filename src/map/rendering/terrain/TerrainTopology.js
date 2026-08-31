/**
 * Shared physical-topology contract for terrain and political/hydrology passes.
 *
 * Terrain is never allowed to invent a coastline. A tile can render only where
 * the authoritative physical land predicate says land exists. Border and
 * hydrology passes can consume the same edge signatures to avoid cracks.
 */
export function assertLandMaskContract(landMask) {
  if (!landMask || typeof landMask.contains !== "function") {
    throw new Error("Terrain requires a physical land mask with contains(x, y).");
  }
  return landMask;
}

export function clipTerrainSampleToLand({ x, y, height, landMask }) {
  assertLandMaskContract(landMask);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(height)) {
    throw new Error("Terrain samples must contain finite coordinates and height.");
  }
  return Object.freeze({ x, y, height, land: Boolean(landMask.contains(x, y)) });
}

export function buildTerrainEdgeSignature({ tile, heights, size }) {
  if (!tile?.id) throw new Error("Terrain edge signature requires a tile key.");
  if (!(heights instanceof Float32Array) || heights.length !== size * size) {
    throw new Error("Terrain edge signature requires a complete height grid.");
  }
  const top = [], right = [], bottom = [], left = [];
  for (let i = 0; i < size; i += 1) {
    top.push(heights[i]);
    right.push(heights[i * size + size - 1]);
    bottom.push(heights[(size - 1) * size + i]);
    left.push(heights[i * size]);
  }
  return Object.freeze({
    tileId: tile.id,
    top: Object.freeze(top),
    right: Object.freeze(right),
    bottom: Object.freeze(bottom),
    left: Object.freeze(left),
  });
}

export function sameTerrainEdge(a, b, tolerance = 1e-4) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (Math.abs(a[i] - b[i]) > tolerance) return false;
  return true;
}
