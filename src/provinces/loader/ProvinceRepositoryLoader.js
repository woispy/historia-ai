/**
 * ============================================================================
 * Historia AI
 * Province Repository Loader
 * ============================================================================
 *
 * Builds the runtime Province Repository
 * from generated Province Assets.
 */

import {
  loadProvinceAssets,
} from "./ProvinceAssetLoader.js";

import {
  createProvince,
} from "../ProvinceFactory.js";

import {
  createProvinceRepository,
  addProvince,
} from "../ProvinceRepository.js";

export function loadProvinceRepository() {
  const assets =
    loadProvinceAssets();

  if (
    !Array.isArray(
      assets
    )
  ) {
    throw new Error(
      "Province Assets must be an array."
    );
  }

  let repository =
    createProvinceRepository();

  for (const asset of assets) {
    if (
      !asset ||
      !asset.identity
    ) {
      console.error(
        "Invalid Province Asset:",
        asset
      );

      throw new Error(
        "Invalid Province Asset."
      );
    }

    repository =
      addProvince(
        repository,
        createProvince(
          asset
        )
      );
  }

  return repository;
}