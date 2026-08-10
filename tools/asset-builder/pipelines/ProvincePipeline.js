import {
  convertProvinces,
} from "../province/converter/index.js";

import {
  ProvinceConverterConfig,
} from "../province/config/index.js";

import {
  buildProvinceManifest,
} from "../province/manifest/index.js";

import {
  validateProvinceAssets,
} from "../province/validation/index.js";

import {
  writeAssets,
  log,
  success,
} from "../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Province Pipeline
 * ============================================================================
 *
 * Converts Geometry Assets into
 * Province Assets.
 */

export function runProvincePipeline(
  geometryAssets
) {
  log(
    "Running Province Pipeline..."
  );

  const provinceAssets =
    convertProvinces(
      geometryAssets
    );

  writeAssets({
    directory:
      ProvinceConverterConfig.output,

    assets:
      provinceAssets,

    getFileName:
      (asset) =>
        `${asset.identity.id}.json`,
  });

  const validation =
    validateProvinceAssets(
      provinceAssets
    );

  log(
    `Validation: ${validation.unique}/${validation.assets} unique Province IDs`
  );

  buildProvinceManifest(
    ProvinceConverterConfig.output
  );

  success(
    `Province Pipeline completed (${provinceAssets.length} assets).`
  );

  return provinceAssets;
}