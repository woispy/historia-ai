/** Phase E terrain geometry LOD contract. */
export const TERRAIN_LODS = Object.freeze([
  Object.freeze({ level: 0, name: "world", geometry: "low-topology", maxDistance: Infinity, grid: 9 }),
  Object.freeze({ level: 1, name: "regional", geometry: "simplified-borders", maxDistance: 220, grid: 17 }),
  Object.freeze({ level: 2, name: "province", geometry: "detailed-province", maxDistance: 80, grid: 33 }),
  Object.freeze({ level: 3, name: "city", geometry: "high-detail", maxDistance: 24, grid: 65 }),
  Object.freeze({ level: 4, name: "close", geometry: "terrain-hydrology-settlement", maxDistance: 8, grid: 129 }),
]);
export function terrainLodForDistance(distance) {
  if (!Number.isFinite(distance) || distance < 0) throw new Error("Terrain LOD distance must be a non-negative finite number.");
  for (let i = TERRAIN_LODS.length - 1; i >= 0; i -= 1) if (distance <= TERRAIN_LODS[i].maxDistance) return TERRAIN_LODS[i].level;
  return 0;
}
export function terrainLod(level) { const lod = TERRAIN_LODS[level]; if (!lod) throw new Error(`Unknown terrain LOD: ${level}`); return lod; }
