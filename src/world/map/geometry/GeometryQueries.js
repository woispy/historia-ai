/**
 * ============================================================================
 * Historia AI
 * Geometry Queries
 * ============================================================================
 */

export function getGeometry(
  repository,
  geometryId
) {
  return (
    repository.byId[
      geometryId
    ] ?? null
  );
}

export function getGeometries(
  repository
) {
  return repository.allIds.map(
    (id) =>
      repository.byId[id]
  );
}

export function getGeometryByProvince(
  repository,
  provinceId
) {
  return (
    getGeometries(
      repository
    ).find(
      (geometry) =>
        geometry.provinceId ===
        provinceId
    ) ?? null
  );
}