import {
  log,
  success,
} from "../../shared/index.js";

import {
  runProvinceConversionPipeline,
} from "./ProvinceConversionPipeline.js";

/**
 * ============================================================================
 * Historia AI
 * Province Converter
 * ============================================================================
 *
 * Converts Geometry Assets into
 * immutable Provincia Assets.
 *
 * Pipeline
 * --------
 *
 * Geometry Assets
 *        ↓
 * Province Conversion Pipeline
 *        ↓
 * Province Assets
 */

export function convertProvinces(
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

  log(
    "Converting Province Assets..."
  );

  const provinceAssets =
    runProvinceConversionPipeline(
      geometryAssets
    );

  success(
    `Built ${provinceAssets.length} Province Assets.`
  );

  return provinceAssets;
}