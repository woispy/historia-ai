import { useMemo } from "react";
import { getProvinces } from "../../provinces";
import { getCities } from "../../cities";
import { getGeometry } from "../../world/map/geometry";
import { createHistoricalPoliticalMapModel } from "../../world/map/historical/HistoricalPoliticalMapModel";
import { createHistoricalWorldPoliticalPresentation } from "../../world/map/historical/HistoricalWorldPoliticalCoverage";

const HISTORICAL_1300_DATE = "1300-01-01";

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
}

function buildHistoricalWorldSourceProvinces(sourceProvinces, geometryRepository) {
  const byId = new Map(sourceProvinces.map((province) => [province.id, province]));

  for (const geometryId of geometryRepository?.allIds ?? []) {
    if (byId.has(geometryId)) continue;
    const geometry = getGeometry(geometryRepository, geometryId);
    if (!geometry?.polygons?.length) continue;

    byId.set(geometryId, {
      id: geometryId,
      name: geometry.metadata?.name ?? geometryId,
      type: "province",
      geometryId,
      owner: null,
      controller: null,
    });
  }

  return [...byId.values()];
}

function createHistoricalWorldEntry(province, geometry, historicalEntry) {
  if (historicalEntry?.historicalProvince) {
    return {
      ...historicalEntry,
      geometry,
    };
  }

  const political = createHistoricalWorldPoliticalPresentation(geometry);
  const sourceName = geometry?.metadata?.name ?? province.name ?? province.id;

  return {
    province: {
      ...province,
      name: sourceName,
      geometryId: province.geometryId ?? province.id,
    },
    country: political,
    sourceCountry: null,
    historicalPolitical: political,
    historicalProvince: {
      id: province.id,
      type: "province",
      name: sourceName,
      polityId: political.id === "local_polities" ? null : political.id,
      controlStatus: political.id === "local_polities" ? "historical-source-unresolved" : "historical-source-derived",
      controlConfidence: geometry?.metadata?.borderPrecision >= 3 ? "high" : "medium",
      controlNote: geometry?.metadata?.name
        ? `Source-derived 1300 GIS coverage: ${geometry.metadata.name}`
        : "Source-derived 1300 GIS coverage",
      timeModel: "historical",
      sourceType: "historical-runtime",
    },
    geometry,
  };
}

export function useWorldMap(gameSession) {
  return useMemo(() => {
    if (!gameSession) return { provinces: [], cities: [] };

    const provinceRepository = gameSession.world.repositories.provinces;
    const cityRepository = gameSession.world.repositories.cities;
    const countryRepository = gameSession.world.repositories.countries;
    const geometryRepository = gameSession.world.map.geometry;
    const sourceProvinces = getProvinces(provinceRepository);
    const scenarioDate = getScenarioStartDate(gameSession);
    const isHistorical1300 = scenarioDate === HISTORICAL_1300_DATE;

    // A dated world map is geometry-driven. The historical runtime asset contains
    // world-scale polygons, including their physical coastlines; the small
    // simulation province repository is only a gameplay subset and must not be
    // allowed to leave the rest of the world's land transparent.
    const historicalSourceProvinces = isHistorical1300
      ? buildHistoricalWorldSourceProvinces(sourceProvinces, geometryRepository)
      : sourceProvinces;

    const historicalModel = createHistoricalPoliticalMapModel({
      date: scenarioDate,
      provinces: historicalSourceProvinces,
      countryRepository,
    });

    const historicalById = historicalModel
      ? new Map(historicalModel.map((entry) => [entry.province.id, entry]))
      : null;

    const provinces = historicalSourceProvinces.map((province) => {
      const geometry = province.geometryId
        ? getGeometry(geometryRepository, province.geometryId)
        : null;
      const historical = historicalById?.get(province.id) ?? null;

      if (isHistorical1300) {
        return createHistoricalWorldEntry(province, geometry, historical);
      }

      return historical
        ? {
          ...historical,
          geometry,
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
          geometry,
        };
    });

    const cities = getCities(cityRepository);

    return { provinces, cities };
  }, [gameSession]);
}
