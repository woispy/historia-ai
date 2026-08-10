/**
 * ============================================================================
 * Historia AI
 * Geometry Asset Loader
 * ============================================================================
 *
 * Loads Geometry Assets declared in
 * the generated manifest.
 */

import {
  loadGeometryManifest,
} from "./GeometryManifestLoader.js";

export function loadGeometryAssets() {
  return loadGeometryManifest();
}