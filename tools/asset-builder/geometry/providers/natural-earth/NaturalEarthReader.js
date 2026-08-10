import {
  readJson,
} from "../../../shared/index.js";

import {
  resolveNaturalEarthDataset,
} from "./NaturalEarthDatasetResolver.js";

/**
 * ============================================================================
 * Historia AI
 * Natural Earth Reader
 * ============================================================================
 */

export function readNaturalEarthDataset(
  datasetId
) {
  const dataset =
    resolveNaturalEarthDataset(
      datasetId
    );

  return readJson(
    dataset.absolutePath
  );
}