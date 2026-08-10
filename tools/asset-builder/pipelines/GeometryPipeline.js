import {
  convertGeometry,
} from "../geometry/converter/GeometryConverter.js";

import {
  buildGeometryManifest,
} from "../geometry/manifest/GeometryAssetManifestBuilder.js";

import {
  validateGeometryAssets,
} from "../geometry/validation/GeometryDuplicateValidator.js";

import {
  GeometryConverterConfig,
} from "../geometry/config/GeometryConverterConfig.js";

import {
  cleanOutputDirectory,
  writeAssets,
  log,
  success,
} from "../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Pipeline
 * ============================================================================
 *
 * Executes the complete Geometry Asset Pipeline.
 *
 * Pipeline
 * --------
 *
 * Clean Output
 *      ↓
 * Read Dataset
 *      ↓
 * Parse Geometry
 *      ↓
 * Build Assets
 *      ↓
 * Validate Assets
 *      ↓
 * Write Assets
 *      ↓
 * Generate Manifest
 */

export function runGeometryPipeline() {
  log(
    "Running Geometry Pipeline..."
  );

  cleanOutputDirectory(
    GeometryConverterConfig.output
  );

  const assets =
    convertGeometry();

  const report =
    validateGeometryAssets(
      assets
    );

  log(
    `Validation: ${report.unique}/${report.assets} unique Geometry IDs`
  );

  writeAssets({
    directory:
      GeometryConverterConfig.output,

    assets,

    getFileName:
      (asset) =>
        `${asset.id}.json`,
  });

  buildGeometryManifest(
    GeometryConverterConfig.output
  );

  success(
    `Geometry Pipeline completed (${assets.length} assets).`
  );

  return assets;
}