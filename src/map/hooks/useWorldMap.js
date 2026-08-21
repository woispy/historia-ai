import { useMemo } from "react";
import { getProvinces } from "../../provinces";
import { getCities } from "../../cities";
import { getGeometry } from "../../world/map/geometry";
import { getCountry } from "../../countries";
import { ANATOLIA_PROVINCE_METADATA } from "../data/AnatoliaProvinceMetadata";
import { createHistoricalPoliticalRuntime } from "../../world/map/historical/HistoricalPoliticalRuntime";
import { createHistoricalPoliticalPresentation } from "../../world/map/historical/HistoricalPoliticalPresentation";

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
}

function buildHistoricalPoliticalIndex(gameSession) {
  const date = getScenarioStartDate(gameSession);

  // The current historical presentation contract is explicitly the 1300
  // start frame. Later dates must get a simulation-driven political layer
  // rather than reusing the 1300 placement metadata.
  if (date !== "1300-01-01") return null;

  const runtime = createHistoricalPoliticalRuntime({
    date,
    provinceMetadata: ANATOLIA_PROVINCE_METADATA,
  });

  return new Map(runtime.provinces.map((province) => [province.id, province]));
}

export function useWorldMap(gameSession) {
  return useMemo(() => {
    if (!gameSession) return { provinces: [], cities: [] };

    const provinceRepository = gameSession.world.repositories.provinces;
    const cityRepository = gameSession.world.repositories.cities;
    const countryRepository = gameSession.world.repositories.countries;
    const geometryRepository = gameSession.world.map.geometry;
    const historicalPoliticalIndex = buildHistoricalPoliticalIndex(gameSession);

    const provinces = getProvinces(provinceRepository).map((province) => {
      const sourceCountry = province.owner
        ? getCountry(countryRepository, province.owner)
        : null;
      const historicalProvince = historicalPoliticalIndex?.get(province.id) ?? null;
      const historicalPolityId = historicalProvince?.polityId ?? province.owner ?? null;
      const historicalCountry = historicalPolityId
        ? getCountry(countryRepository, historicalPolityId)
        : null;
      const historicalPolitical = historicalPoliticalIndex
        ? createHistoricalPoliticalPresentation({
          polityId: historicalPolityId,
          country: historicalCountry,
        })
        : null;

      return {
        province,
        // Historical scenarios render from historical polity presentation,
        // never from a modern Admin-0 country colour. `sourceCountry` remains
        // available to diagnostics without becoming a visual authority.
        country: historicalPolitical ?? sourceCountry,
        sourceCountry,
        historicalPolitical,
        geometry: province.geometryId
          ? getGeometry(geometryRepository, province.geometryId)
          : null,
      };
    });

    const cities = getCities(cityRepository);

    return { provinces, cities };
  }, [gameSession]);
}
