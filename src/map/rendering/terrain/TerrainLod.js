/**
 * Phase E terrain geometry LOD contract.
 *
 * LOD is a geometry decision, not a presentation-only hint. The selected
 * terrain mesh is always paired with a spatial tile and the shared physical
 * land mask. LOD thresholds are deliberately expressed in camera distance so
 * the policy remains renderer/backend independent.
 */

export const TERRAIN_LODS = Object.freeze([
  Object.freeze({ level: 0, name: "world", geometry: "low-topology", maxDistance: Infinity, grid: 9 }),
  Object.freeze({ level: 1, name: "regional", geometry: "simplified-borders", maxDistance: 220, grid: 17 }),
  Object.freeze({ level: 2, name: "province", geometry: "detailed-province", maxDistance: 80, grid: 33 }),
  Object.freeze({ level: 3, name: "city", geometry: "high-detail", maxDistance: 24, grid: 65 }),
  Object.freeze({ level: 4, name: "close", geometry: "terrain-hydrology-settlement", maxDistance: 8, grid: 129 }),
]);

export function terrainLodForDistance(distance) {
  if (!Number.isFinite(distance) || distance < 0) throw new Error("Terrain LOD distance must be a non-negative finite number.");
  for (let index = TERRAIN_LODS.length - 1; index >= 0; index -= 1) {
    const lod = TERRAIN_LODS[index];
    if (distance <= lod.maxDistance) return lod.level;
  }
  return 0;
}

export function terrainLod(level) {
  const lod = TERRAIN_LODS[level];
  if (!lod) throw new Error(`Unknown terrain LOD: ${level}`);
  return lod;
}
