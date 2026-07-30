export function getProvince(gameState, provinceId) {
  return gameState.world.map.provinces.byId[provinceId] ?? null;
}

export function getProvinces(gameState) {
  return gameState.world.map.provinces.allIds.map(
    (id) => gameState.world.map.provinces.byId[id]
  );
}

export function getProvinceNeighbours(gameState, provinceId) {
  return (
    gameState.world.map.topology.adjacency[provinceId] ?? []
  );
}

export function getProvinceOwner(gameState, provinceId) {
  return getProvince(gameState, provinceId)?.owner ?? null;
}

export function getProvinceController(gameState, provinceId) {
  return getProvince(gameState, provinceId)?.controller ?? null;
}