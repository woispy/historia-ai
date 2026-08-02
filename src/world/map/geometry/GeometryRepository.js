/**
 * ============================================================================
 * Historia AI
 * Geometry Repository
 * ============================================================================
 */

export function createGeometryRepository() {
  return {
    byId: {},

    allIds: [],
  };
}

export function addGeometry(
  repository,
  geometry
) {
  return {
    byId: {
      ...repository.byId,

      [geometry.id]: geometry,
    },

    allIds:
      repository.allIds.includes(
        geometry.id
      )
        ? repository.allIds
        : [
            ...repository.allIds,
            geometry.id,
          ],
  };
}

export function updateGeometry(
  repository,
  geometry
) {
  return {
    ...repository,

    byId: {
      ...repository.byId,

      [geometry.id]: geometry,
    },
  };
}

export function removeGeometry(
  repository,
  geometryId
) {
  const byId = {
    ...repository.byId,
  };

  delete byId[geometryId];

  return {
    byId,

    allIds:
      repository.allIds.filter(
        (id) =>
          id !== geometryId
      ),
  };
}