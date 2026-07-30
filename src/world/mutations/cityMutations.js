import { getCity } from "../queries";

export function setCityUnderSiege(gameState, cityId, underSiege = true) {
  const city = getCity(gameState, cityId);

  if (!city) {
    return gameState;
  }

  return {
    ...gameState,

    world: {
      ...gameState.world,

      cities: {
        ...gameState.world.cities,

        byId: {
          ...gameState.world.cities.byId,

          [cityId]: {
            ...city,

            status: {
              ...city.status,

              underSiege,
            },
          },
        },
      },
    },
  };
}