import {
  buildProvinceAsset,
} from "../builder/index.js";

/**
 * ============================================================================
 * Historia AI
 * Province Conversion Pipeline
 * ============================================================================
 *
 * Converts Geometry Assets into
 * immutable Province Assets.
 *
 * Pipeline
 * --------
 *
 * Geometry Asset
 *       ↓
 * Province Asset Builder
 *       ↓
 * Province Asset
 */

export function runProvinceConversionPipeline(
  geometryAssets
) {
  if (
    !Array.isArray(
      geometryAssets
    )
  ) {
    throw new Error(
      "Geometry Assets are required."
    );
  }

  return geometryAssets.map(
    (geometryAsset) =>
      buildProvinceAsset(
        geometryAsset
      )
  );
}