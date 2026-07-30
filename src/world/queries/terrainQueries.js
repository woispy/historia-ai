export function getTerrain(gameState, terrainId) {
  return gameState.world.map.terrain.byId[terrainId] ?? null;
}

export function getTerrains(gameState) {
  return gameState.world.map.terrain.allIds.map(
    (id) => gameState.world.map.terrain.byId[id]
  );
}