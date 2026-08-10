/**
 * ============================================================================
 * Historia AI
 * Province Property Builder
 * ============================================================================
 *
 * Builds Province references from
 * Geometry Assets.
 */

export function buildProvinceProperties(
  geometryAsset
) {
  if (!geometryAsset) {
    throw new Error(
      "Geometry Asset is required."
    );
  }

  return {
    geometryId:
      geometryAsset.id,
  };
}