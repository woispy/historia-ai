import path from "node:path";

import {
  readJson,
} from "../../../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Natural Earth Dataset Resolver
 * ============================================================================
 */

const MANIFEST_PATH =
  "./src/world/map/source/geometry/natural-earth/manifest.json";

export function resolveNaturalEarthDataset(
  datasetId
) {
  const manifest =
    readJson(
      MANIFEST_PATH
    );

  const dataset =
    manifest.datasets.find(
      (item) =>
        item.id === datasetId
    );

  if (!dataset) {
    throw new Error(
      `Natural Earth dataset "${datasetId}" not found.`
    );
  }

  return {
    ...dataset,

    provider:
      manifest.provider,

    version:
      manifest.version,

    projection:
      manifest.projection,

    absolutePath:
      path.resolve(
        "./src/world/map/source/geometry/natural-earth",
        dataset.file
      ),
  };
}