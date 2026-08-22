import { useEffect, useMemo, useState } from "react";
import { getProvinces } from "../../provinces";
import { getCities } from "../../cities";
import { getGeometry } from "../../world/map/geometry";
import { bootstrapGeometry } from "../../world/map/geometry/GeometryBootstrap.js";
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
  const scenarioDate = getScenarioStartDate(gameSession);
  const [geometryRepository, setGeometryRepository] = useState(
    () => gameSession?.world?.map?.geometry ?? null,
  );
  const [geometryError, setGeometryError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const existingGeometry = gameSession?.world?.map?.geometry ?? null;

    setGeometryRepository(existingGeometry);
    setGeometryError(null);

    if (!gameSession || existingGeometry) {
      return () => {
        ignore = true;
      };
    }

    bootstrapGeometry(scenarioDate)
      .then((repository) => {
        if (ignore) return;
        setGeometryRepository(repository);
      })
      .catch((error) => {
        if (ignore) return;
        console.error("[useWorldMap] Historical geometry bootstrap failed:", error);
        setGeometryError(error);
      });

    return () => {
      ignore = true;
    };
  }, [gameSession, scenarioDate]);

  return useMemo(() => {
    if (!gameSession) return { provinces: [], cities: [], geometryLoading: false, geometryError: null };

    const provinceRepository = gameSession.world.repositories.provinces;
    const cityRepository = gameSession.world.repositories.cities;
    const countryRepository = gameSession.world.repositories.countries;
    const sourceProvinces = getProvinces(provinceRepository);
    const cities = getCities(cityRepository);

    // MapFactory intentionally defers geometry construction. Until the lazy
    // historical runtime asset resolves, keep the map mounted with no
    // political/province entries instead of dereferencing a null repository.
    if (!geometryRepository) {
      return {
        provinces: [],
        cities,
        geometryLoading: !geometryError,
        geometryError,
      };
    }

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

    return { provinces, cities, geometryLoading: false, geometryError: null };
  }, [gameSession, scenarioDate, geometryRepository, geometryError]);
}
