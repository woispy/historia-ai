import { useMemo } from "react";
import { getProvinces } from "../../provinces";
import { getCities } from "../../cities";
import { getGeometry } from "../../world/map/geometry";
import { createHistoricalPoliticalMapModel } from "../../world/map/historical/HistoricalPoliticalMapModel";

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
}

export function useWorldMap(gameSession) {
  return useMemo(() => {
    if (!gameSession) return { provinces: [], cities: [] };

    const provinceRepository = gameSession.world.repositories.provinces;
    const cityRepository = gameSession.world.repositories.cities;
    const countryRepository = gameSession.world.repositories.countries;
    const geometryRepository = gameSession.world.map.geometry;
    const sourceProvinces = getProvinces(provinceRepository);
    const historicalModel = createHistoricalPoliticalMapModel({
      date: getScenarioStartDate(gameSession),
      provinces: sourceProvinces,
      countryRepository,
    });

    const historicalById = historicalModel
      ? new Map(historicalModel.map((entry) => [entry.province.id, entry]))
      : null;

    const provinces = sourceProvinces.map((province) => {
      const historical = historicalById?.get(province.id) ?? null;
      return historical
        ? {
          ...historical,
          geometry: province.geometryId
            ? getGeometry(geometryRepository, province.geometryId)
            : null,
        }
        : {
          province,
          country: province.owner
            ? gameSession.world.repositories.countries.byId?.[province.owner] ?? null
            : null,
          sourceCountry: province.owner
            ? gameSession.world.repositories.countries.byId?.[province.owner] ?? null
            : null,
          historicalPolitical: null,
          geometry: province.geometryId
            ? getGeometry(geometryRepository, province.geometryId)
            : null,
        };
    });

    const cities = getCities(cityRepository);

    return { provinces, cities };
  }, [gameSession]);
}
