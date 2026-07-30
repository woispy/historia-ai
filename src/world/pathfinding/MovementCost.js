import { getProvinceTerrain } from "../queries";

export function getMovementCost(gameState, provinceId) {
  const terrain = getProvinceTerrain(gameState, provinceId);

  if (!terrain) {
    return 1;
  }

  return terrain.movementCost;
}