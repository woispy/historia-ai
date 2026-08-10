/**
 * ============================================================================
 * Historia AI
 * Geometry Repository
 * ============================================================================
 *
 * Stores Geometry Assets used by the runtime.
 *
 * Responsibilities
 * ----------------
 * - Store Geometry Assets
 * - Provide lookup operations
 * - Provide immutable CRUD operations
 */

export function createGeometryRepository() {
  return {
    byId: {},

    allIds: [],
  };
}

/**
 * ============================================================================
 * CRUD
 * ============================================================================
 */

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

  delete byId[
    geometryId
  ];

  return {
    byId,

    allIds:
      repository.allIds.filter(
        (id) =>
          id !==
          geometryId
      ),
  };
}

/**
 * ============================================================================
 * Queries
 * ============================================================================
 */

export function findGeometryById(
  repository,
  geometryId
) {
  return (
    repository.byId[
      geometryId
    ] ?? null
  );
}

export function findAllGeometries(
  repository
) {
  return repository.allIds.map(
    (id) =>
      repository.byId[id]
  );
}

export function hasGeometry(
  repository,
  geometryId
) {
  return Object.prototype.hasOwnProperty.call(
    repository.byId,
    geometryId
  );
}

export function countGeometries(
  repository
) {
  return repository.allIds.length;
}

export function isGeometryRepositoryEmpty(
  repository
) {
  return (
    repository.allIds.length ===
    0
  );
}