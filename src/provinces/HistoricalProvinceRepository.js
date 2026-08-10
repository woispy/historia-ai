import { getProvinces } from "./ProvinceQueries.js";
import { updateProvince } from "./ProvinceRepository.js";

function getIsoFromGeometryId(geometryId) {
  const prefix = "geometry_country_";
  if (!geometryId?.startsWith(prefix)) return null;
  return geometryId.slice(prefix.length);
}

function resolveHistoricalOwner(province, registry) {
  const provinceOwnership = registry?.provinceOwnership ?? {};
  const geometryOwnership = registry?.geometryOwnership ?? {};
  const geometryIso = getIsoFromGeometryId(province.geometryId);
  const sourceFeatureId = province.historical?.sourceFeatureId ?? null;

  return (
    provinceOwnership[province.id] ??
    (sourceFeatureId ? provinceOwnership[sourceFeatureId] : null) ??
    geometryOwnership[geometryIso] ??
    province.owner ??
    registry?.defaultCountryId ??
    "local_polities"
  );
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
    ) {
      continue;
    }

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
