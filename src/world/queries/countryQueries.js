export function getCountry(gameState, countryId) {
  return gameState.world.countries.byId[countryId] ?? null;
}

export function getCountries(gameState) {
  return gameState.world.countries.allIds.map(
    (id) => gameState.world.countries.byId[id]
  );
}

export function getCountryCapital(gameState, countryId) {
  return getCountry(gameState, countryId)?.capital ?? null;
}

export function getCountryCities(gameState, countryId) {
  return getCountry(gameState, countryId)?.cities ?? [];
}