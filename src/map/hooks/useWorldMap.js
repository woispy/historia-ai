import { useMemo } from "react";
import { getProvinces } from "../../provinces";
import { getCities } from "../../cities";
import { getGeometry } from "../../world/map/geometry";
import { loadHistoricalGeometryRepository } from "../../world/map/geometry/loader/index.js";
import { ANATOLIA_PROVINCE_METADATA } from "../data/AnatoliaProvinceMetadata.js";
import { createHistoricalPoliticalMapModel } from "../../world/map/historical/HistoricalPoliticalMapModel";

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
}

const HISTORICAL_1300_DATE = "1300-01-01";

function createHistoricalAnatoliaProvinceFallbacks(sourceProvinces, date) {
  if (date !== HISTORICAL_1300_DATE) return sourceProvinces;

  const sourceIds = new Set(sourceProvinces.map((province) => province.id));
  const missingAnatoliaProvinces = ANATOLIA_PROVINCE_METADATA
    .filter((metadata) => !sourceIds.has(metadata.id))
    .map((metadata) => ({
      id: metadata.id,
      name: metadata.name,
      geometryId: metadata.id,
      owner: metadata.countryId ?? null,
      controller: metadata.historicalControl?.controllerAt1300 ?? null,
      historical: Object.freeze({
        classification: "curated-regional-gameplay-overlay",
        sourceType: "historical-runtime",
        historicalDate: HISTORICAL_1300_DATE,
      }),
      historicalDate: HISTORICAL_1300_DATE,
      historicalSource: "historia-ai-curated-cartography",
    }));

  return missingAnatoliaProvinces.length
    ? [...sourceProvinces, ...missingAnatoliaProvinces]
    : sourceProvinces;
}

function resolveGeometryRepository(gameSession, date) {
  const sourceRepository = gameSession?.world?.map?.geometry ?? null;
  if (date !== HISTORICAL_1300_DATE) return sourceRepository;

  // The dated political compositor must read the dated GIS runtime asset
  // directly. The map factory already bootstraps this repository, but resolving
  // it here as well prevents a stale/modern geometry repository from silently
  // becoming the visual source for the 1300 historical layer.
  return loadHistoricalGeometryRepository(date) ?? sourceRepository;
}

export function useWorldMap(gameSession) {
  return useMemo(() => {
    if (!gameSession) return { provinces: [], cities: [] };

    const provinceRepository = gameSession.world.repositories.provinces;
    const cityRepository = gameSession.world.repositories.cities;
    const countryRepository = gameSession.world.repositories.countries;
    const geometryRepository = resolveGeometryRepository(gameSession, getScenarioStartDate(gameSession));
    const date = getScenarioStartDate(gameSession);
    const sourceProvinces = getProvinces(provinceRepository);
    const historicalSourceProvinces = createHistoricalAnatoliaProvinceFallbacks(
      sourceProvinces,
      date,
    );
    const historicalModel = createHistoricalPoliticalMapModel({
      date,
      provinces: historicalSourceProvinces,
      countryRepository,
    });

    const historicalById = historicalModel
      ? new Map(historicalModel.map((entry) => [entry.province.id, entry]))
      : null;

    const provinces = historicalSourceProvinces.map((province) => {
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
