import {
  getProvinces,
} from "./ProvinceQueries.js";

import {
  updateProvince,
} from "./ProvinceRepository.js";

function getIsoFromGeometryId(geometryId) {
  if (!geometryId?.startsWith("geometry_country_")) {
    return null;
  }

  return geometryId.slice("geometry_country_".length);
}

export function applyHistoricalProvinceOwnership(
  repository,
  historicalRegistry
) {
  if (!historicalRegistry) {
    return repository;
  }

  const ownership =
    historicalRegistry.geometryOwnership ?? {};

  let nextRepository = repository;

  for (const province of getProvinces(repository)) {
    const iso = getIsoFromGeometryId(
      province.geometryId
    );

    const countryId =
      ownership[iso] ??
      historicalRegistry.defaultCountryId ??
      "local_polities";

    if (
      province.owner === countryId &&
      province.controller === countryId
    ) {
      continue;
    }

    nextRepository = updateProvince(
      nextRepository,
      Object.freeze({
        ...province,
        owner: countryId,
        controller: countryId,
      })
    );
  }

  return nextRepository;
}
