import { getProvince } from "./provinceQueries";
import { getTerrain } from "./terrainQueries";

export function getProvinceTerrain(gameState, provinceId) {
  const province = getProvince(gameState, provinceId);

  if (!province) {
    return null;
  }

  return getTerrain(gameState, province.terrain);
}

export function areNeighbours(gameState, provinceA, provinceB) {
  const province = getProvince(gameState, provinceA);

  if (!province) {
    return false;
  }

  return province.neighbours.includes(provinceB);
}