import { getProvinces } from "./ProvinceQueries.js";
import { updateProvince } from "./ProvinceRepository.js";
import { resolveHistoricalCountryId } from "../world/historical/HistoricalCountryResolver.js";

function getIsoFromGeometryId(geometryId) {
  const prefix = "geometry_country_";
  if (!geometryId?.startsWith(prefix)) return null;
  return geometryId.slice(prefix.length);
}

function findCountryByHistoricalName(province, registry) {
  const countries = registry?.countries ?? {};
  const candidates = [
    province.historical?.subject,
    province.historical?.sourceName,
    province.name,
  ];

  for (const candidate of candidates) {
    const resolved = resolveHistoricalCountryId(candidate, countries);
    if (resolved && countries[resolved]) return resolved;
  }

  return null;
}

function resolveHistoricalOwner(province, registry) {
  const provinceOwnership = registry?.provinceOwnership ?? {};
  const sourceFeatureOwnership = registry?.sourceFeatureOwnership ?? {};
  const geometryOwnership = registry?.geometryOwnership ?? {};
  const geometryIso = getIsoFromGeometryId(province.geometryId);
  const sourceFeatureId = province.historical?.sourceFeatureId ?? null;

  const explicitProvinceOwner = provinceOwnership[province.id];
  if (explicitProvinceOwner && registry?.countries?.[explicitProvinceOwner]) return explicitProvinceOwner;

  const explicitSourceOwner = sourceFeatureId ? sourceFeatureOwnership[sourceFeatureId] : null;
  if (explicitSourceOwner && registry?.countries?.[explicitSourceOwner]) return explicitSourceOwner;

  const historicalNameOwner = findCountryByHistoricalName(province, registry);
  if (historicalNameOwner) return historicalNameOwner;

  const geometryOwner = geometryOwnership[geometryIso];
  if (geometryOwner && registry?.countries?.[geometryOwner]) return geometryOwner;

  if (province.owner && registry?.countries?.[province.owner]) return province.owner;
  if (registry?.defaultCountryId && registry.countries?.[registry.defaultCountryId]) return registry.defaultCountryId;

  return "local_polities";
}

export function createHistoricalProvinceRepository(repository, historicalRegistry) {
  if (!repository || !historicalRegistry) return repository;

  let nextRepository = repository;
  for (const province of getProvinces(repository)) {
    const countryId = resolveHistoricalOwner(province, historicalRegistry);
    const historicalDate = historicalRegistry.date ?? null;
    const historicalSource = historicalRegistry.source ?? historicalRegistry.method ?? null;

    if (
      province.owner === countryId &&
      province.controller === countryId &&
      province.historicalDate === historicalDate &&
      province.historicalSource === historicalSource
    ) continue;

    nextRepository = updateProvince(
      nextRepository,
      Object.freeze({
        ...province,
        owner: countryId,
        controller: countryId,
        historicalDate,
        historicalSource,
      }),
    );
  }

  return nextRepository;
}
