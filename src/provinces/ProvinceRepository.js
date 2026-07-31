/**
 * ============================================================================
 * Province Repository
 * ============================================================================
 */

export function createProvinceRepository() {
  return {
    byId: {},
    allIds: [],
  };
}

export function addProvince(repository, province) {
  if (repository.byId[province.id]) {
    throw new Error(
      `Province "${province.id}" already exists.`
    );
  }

  return {
    byId: {
      ...repository.byId,
      [province.id]: province,
    },

    allIds: [
      ...repository.allIds,
      province.id,
    ],
  };
}

export function updateProvince(repository, province) {
  if (!repository.byId[province.id]) {
    throw new Error(
      `Province "${province.id}" does not exist.`
    );
  }

  return {
    byId: {
      ...repository.byId,
      [province.id]: province,
    },

    allIds: repository.allIds,
  };
}

export function removeProvince(
  repository,
  provinceId
) {
  if (!repository.byId[provinceId]) {
    return repository;
  }

  const nextById = {
    ...repository.byId,
  };

  delete nextById[provinceId];

  return {
    byId: nextById,

    allIds: repository.allIds.filter(
      (id) => id !== provinceId
    ),
  };
}