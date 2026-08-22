import { useEffect, useMemo, useState } from "react";
import { getProvinces } from "../../provinces";
import { getCities } from "../../cities";
import { getGeometry } from "../../world/map/geometry";
import { bootstrapGeometry } from "../../world/map/geometry/GeometryBootstrap.js";
import { ANATOLIA_PROVINCE_METADATA } from "../data/AnatoliaProvinceMetadata.js";
import { createHistoricalPoliticalMapModel } from "../../world/map/historical/HistoricalPoliticalMapModel";
import { createHistoricalWorldPoliticalPresentation } from "../../world/map/historical/HistoricalWorldPoliticalCoverage";

const HISTORICAL_1300_DATE = "1300-01-01";
const CURATED_ANATOLIA_IDS = new Set(ANATOLIA_PROVINCE_METADATA.map((province) => province.id));

function getScenarioStartDate(gameSession) {
  return gameSession?.scenario?.startDate
    ?? gameSession?.world?.scenario?.startDate
    ?? null;
}

function getGeometryBootstrapKey(gameSession, scenarioDate) {
  return `${gameSession?.id ?? "none"}:${scenarioDate ?? "none"}`;
}

function getCuratedProvinceId(geometry, geometryId) {
  const candidates = [
    geometry?.metadata?.sourceFeatureId,
    geometry?.identity?.provinceId,
    geometry?.identity?.id,
    geometryId,
  ];

  return candidates.find((candidate) => CURATED_ANATOLIA_IDS.has(candidate)) ?? null;
}

export function buildHistoricalWorldSourceProvinces(sourceProvinces, geometryRepository) {
  const byId = new Map(sourceProvinces.map((province) => [province.id, province]));

  for (const geometryId of geometryRepository?.allIds ?? []) {
    const geometry = getGeometry(geometryRepository, geometryId);
    if (!geometry?.polygons?.length) continue;

    // Phase 2D geometry carries a stable curated sourceFeatureId. Reconcile
    // that identity before the historical political model runs so the 38
    // curated Anatolia provinces can never silently fall back to neutral land
    // merely because a loader changed the runtime geometry key.
    const curatedProvinceId = getCuratedProvinceId(geometry, geometryId);
    const provinceId = curatedProvinceId ?? geometryId;

    if (byId.has(provinceId)) {
      if (curatedProvinceId) {
        const existing = byId.get(provinceId);
        byId.set(provinceId, {
          ...existing,
          name: geometry.metadata?.name ?? existing.name ?? provinceId,
          geometryId,
        });
      }
      continue;
    }

    byId.set(provinceId, {
      id: provinceId,
      name: geometry.metadata?.name ?? provinceId,
      type: "province",
      geometryId,
      owner: null,
      controller: null,
    });
  }

  // Make the 38 curated identities explicit even when a runtime repository
  // exposes a geometry through a non-curated alias. This is intentionally
  // geometry-backed: no synthetic province is created without real geometry.
  for (const metadata of ANATOLIA_PROVINCE_METADATA) {
    if (byId.has(metadata.id)) continue;

    const geometry = getGeometry(geometryRepository, metadata.id);
    if (!geometry?.polygons?.length) continue;

    byId.set(metadata.id, {
      id: metadata.id,
      name: metadata.name,
      type: "province",
      geometryId: metadata.id,
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
      // These are the curated Phase 2D 1300 Anatolia provinces. They use the
      // dedicated P0 physical atlas as their political coastline authority.
      historicalProvince: {
        ...historicalEntry.historicalProvince,
        geometryAuthority: "anatolia-curated",
      },
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
    // This record carries source-derived historical presentation state, but
    // its geometry belongs to the global historical GIS source. It must never
    // be mistaken for one of the 38 curated Anatolia province geometries when
    // choosing the political coastline clip.
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
      geometryAuthority: "world-source",
    },
    geometry,
  };
}

export function useWorldMap(gameSession) {
  const scenarioDate = getScenarioStartDate(gameSession);
  const existingGeometry = gameSession?.world?.map?.geometry ?? null;
  const bootstrapKey = getGeometryBootstrapKey(gameSession, scenarioDate);
  const [geometryBootstrapState, setGeometryBootstrapState] = useState(() => ({
    key: bootstrapKey,
    repository: existingGeometry,
    error: null,
  }));

  useEffect(() => {
    if (!gameSession || existingGeometry) {
      return undefined;
    }

    let ignore = false;

    bootstrapGeometry(scenarioDate)
      .then((repository) => {
        if (ignore) return;
        setGeometryBootstrapState({
          key: bootstrapKey,
          repository,
          error: null,
        });
      })
      .catch((error) => {
        if (ignore) return;
        console.error("[useWorldMap] Historical geometry bootstrap failed:", error);
        setGeometryBootstrapState({
          key: bootstrapKey,
          repository: null,
          error,
        });
      });

    return () => {
      ignore = true;
    };
  }, [bootstrapKey, existingGeometry, gameSession, scenarioDate]);

  return useMemo(() => {
    if (!gameSession) return { provinces: [], cities: [], geometryLoading: false, geometryError: null };

    const provinceRepository = gameSession.world.repositories.provinces;
    const cityRepository = gameSession.world.repositories.cities;
    const countryRepository = gameSession.world.repositories.countries;
    const sourceProvinces = getProvinces(provinceRepository);
    const cities = getCities(cityRepository);
    const geometryRepository = existingGeometry
      ?? (geometryBootstrapState.key === bootstrapKey ? geometryBootstrapState.repository : null);
    const geometryError = geometryBootstrapState.key === bootstrapKey
      ? geometryBootstrapState.error
      : null;

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
  }, [gameSession, scenarioDate, existingGeometry, bootstrapKey, geometryBootstrapState]);
}
