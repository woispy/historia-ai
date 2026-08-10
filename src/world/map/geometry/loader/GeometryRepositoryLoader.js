/**
 * ============================================================================
 * Historia AI
 * Geometry Repository Loader
 * ============================================================================
 *
 * Creates a Geometry Repository from
 * generated Geometry Assets.
 */

import {
  loadGeometryAssets,
} from "./GeometryAssetLoader.js";

import {
  createGeometryRepository,
  addGeometry,
} from "../GeometryRepository.js";

export function loadGeometryRepository() {
  let repository =
    createGeometryRepository();

  const assets =
    loadGeometryAssets();

  for (const asset of assets) {
    repository =
      addGeometry(
        repository,
        asset
      );
  }

  return repository;
}