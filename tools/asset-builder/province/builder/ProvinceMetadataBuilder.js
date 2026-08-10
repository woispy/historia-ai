import {
  buildProvinceId,
} from "./ProvinceIdBuilder.js";

/**
 * ============================================================================
 * Historia AI
 * Province Metadata Builder
 * ============================================================================
 *
 * Builds immutable Province metadata.
 */

export function buildProvinceMetadata(
  geometryAsset
) {
  if (!geometryAsset) {
    throw new Error(
      "Geometry Asset is required."
    );
  }

  return {
    id:
      buildProvinceId(
        geometryAsset
      ),

    name:
      geometryAsset.name,
  };
}