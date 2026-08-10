/**
 * ============================================================================
 * Historia AI
 * Geometry Property Builder
 * ============================================================================
 *
 * Builds provider-independent Geometry properties.
 *
 * This module is responsible only for copying
 * descriptive properties from the source dataset.
 */

export function buildGeometryProperties({
  feature,
  provider,
  dataset,
}) {
  const properties =
    feature.properties ?? {};

  return {
    name:
      properties.NAME ??
      properties.NAME_EN ??
      properties.ADMIN ??
      null,

    provider,

    dataset,
  };
}