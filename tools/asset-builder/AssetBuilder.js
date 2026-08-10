import {
  runGeometryPipeline,
} from "./pipelines/GeometryPipeline.js";

import {
  runProvincePipeline,
} from "./pipelines/ProvincePipeline.js";

import {
  log,
  success,
} from "./shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Asset Builder
 * ============================================================================
 *
 * Entry point of the complete
 * Asset Build System.
 */

export function buildAssets() {
  log(
    "Starting Asset Builder..."
  );

  const geometryAssets =
    runGeometryPipeline();

  runProvincePipeline(
    geometryAssets
  );

  success(
    "Asset Builder finished successfully."
  );
}