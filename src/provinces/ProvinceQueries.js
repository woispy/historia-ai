/**
 * ============================================================================
 * Province Queries
 * ============================================================================
 */

export function getProvinces(repository) {
  return repository.allIds.map(
    (id) => repository.byId[id]
  );
}

export function getProvince(
  repository,
  provinceId
) {
  return repository.byId[provinceId] ?? null;
}

export function getProvinceByName(
  repository,
  provinceName
) {
  return getProvinces(repository).find(
    (province) =>
      province.name === provinceName
  );
}

export function getCoastalProvinces(
  repository
) {
  return getProvinces(repository).filter(
    (province) => province.port
  );
}

export function getProvincesByOwner(
  repository,
  owner
) {
  return getProvinces(repository).filter(
    (province) =>
      province.owner === owner
  );
}

export function getProvincesByController(
  repository,
  controller
) {
  return getProvinces(repository).filter(
    (province) =>
      province.controller === controller
  );
}