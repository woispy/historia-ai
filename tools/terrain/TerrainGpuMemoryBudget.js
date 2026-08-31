function assertBytes(value, name) { if (!Number.isSafeInteger(value) || value < 1) throw new Error(`${name} must be a positive safe integer.`); }

export function createTerrainGpuMemoryBudget({ maxBytes = 256 * 1024 * 1024 } = {}) {
  assertBytes(maxBytes, "maxBytes");
  const allocations = new Map();
  const allocate = (tileId, bytes) => { if (typeof tileId !== "string" || !tileId) throw new Error("Terrain tile ID is required."); assertBytes(bytes, "bytes"); if (allocations.has(tileId)) throw new Error("Terrain tile GPU allocation already exists."); if (usedBytes() + bytes > maxBytes) return false; allocations.set(tileId, bytes); return true; };
  const release = (tileId) => { if (!allocations.has(tileId)) throw new Error("Terrain tile GPU allocation does not exist."); const bytes = allocations.get(tileId); allocations.delete(tileId); return bytes; };
  const usedBytes = () => [...allocations.values()].reduce((sum, bytes) => sum + bytes, 0);
  return Object.freeze({ maxBytes, allocate, release, usedBytes, availableBytes: () => maxBytes - usedBytes(), snapshot: () => Object.freeze([...allocations.entries()].map(([tileId, bytes]) => Object.freeze({ tileId, bytes }))) });
}
