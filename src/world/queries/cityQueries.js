export function getCity(gameState, cityId) {
  return gameState.world.cities.byId[cityId] ?? null;
}

export function getCities(gameState) {
  return gameState.world.cities.allIds.map(
    (id) => gameState.world.cities.byId[id]
  );
}

export function getCityOwner(gameState, cityId) {
  return getCity(gameState, cityId)?.owner ?? null;
}

export function isCityUnderSiege(gameState, cityId) {
  return getCity(gameState, cityId)?.status?.underSiege ?? false;
}