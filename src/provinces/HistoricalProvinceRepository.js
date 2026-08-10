import { getProvinces } from "./ProvinceQueries.js";
import { updateProvince } from "./ProvinceRepository.js";

function normalizeName(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function getIsoFromGeometryId(geometryId) {
  const prefix = "geometry_country_";
  if (!geometryId?.startsWith(prefix)) return null;
  return geometryId.slice(prefix.length);
}

function findCountryByHistoricalName(province, registry) {
  const countries = registry?.countries ?? {};
  const aliases = registry?.countryAliases ?? {};
  const candidates = [
    province.historical?.subject,
    province.historical?.sourceName,
    province.name,
  ]
    .map(normalizeName)
    .filter(Boolean);

  if (!candidates.length) return null;

  for (const [countryId, country] of Object.entries(countries)) {
    const names = [
      countryId,
      country?.id,
      country?.name,
      country?.title,
      ...(aliases[countryId] ?? []),
    ].map(normalizeName).filter(Boolean);

    if (candidates.some((candidate) => names.includes(candidate))) {
      return countryId;
    }
  }

  return null;
}

function resolveHistoricalOwner(province, registry) {
  const provinceOwnership = registry?.provinceOwnership ?? {};
  const sourceFeatureOwnership = registry?.sourceFeatureOwnership ?? {};
  const geometryOwnership = registry?.geometryOwnership ?? {};
  const geometryIso = getIsoFromGeometryId(province.geometryId);
  const sourceFeatureId = province.historical?.sourceFeatureId ?? null;

  return (
    provinceOwnership[province.id] ??
    (sourceFeatureId ? sourceFeatureOwnership[sourceFeatureId] : null) ??
    findCountryByHistoricalName(province, registry) ??
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
