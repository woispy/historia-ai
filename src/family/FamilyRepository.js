/**
 * ============================================================================
 * Family Repository
 * ============================================================================
 */

export function createFamilyRepository() {
  return {
    byId: {},
    allIds: [],
  };
}

export function addFamily(repository, family) {
  if (repository.byId[family.id]) {
    throw new Error(
      `Family "${family.id}" already exists.`
    );
  }

  return {
    byId: {
      ...repository.byId,
      [family.id]: family,
    },

    allIds: [
      ...repository.allIds,
      family.id,
    ],
  };
}

export function updateFamily(repository, family) {
  if (!repository.byId[family.id]) {
    throw new Error(
      `Family "${family.id}" does not exist.`
    );
  }

  return {
    byId: {
      ...repository.byId,
      [family.id]: family,
    },

    allIds: repository.allIds,
  };
}

export function removeFamily(repository, familyId) {
  if (!repository.byId[familyId]) {
    return repository;
  }

  const nextById = {
    ...repository.byId,
  };

  delete nextById[familyId];

  return {
    byId: nextById,

    allIds: repository.allIds.filter(
      (id) => id !== familyId
    ),
  };
}