/**
 * ============================================================================
 * Historia AI
 * Province Asset Loader
 * ============================================================================
 *
 * Loads generated Province Assets declared
 * in the generated manifest.
 */

import {
  loadProvinceManifest,
} from "./ProvinceManifestLoader.js";

export function loadProvinceAssets() {
  const assets =
    loadProvinceManifest();

  if (
    !Array.isArray(
      assets
    )
  ) {
    throw new Error(
      "Province Manifest must return an array."
    );
  }

  return assets.filter(
    (asset) => asset != null
  );
}