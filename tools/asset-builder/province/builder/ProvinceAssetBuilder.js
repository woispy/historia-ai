import {
  buildAssetHeader,
} from "../../shared/index.js";

import {
  buildProvinceMetadata,
} from "./ProvinceMetadataBuilder.js";

import {
  buildProvinceProperties,
} from "./ProvincePropertyBuilder.js";

import {
  createProvinceAsset,
} from "./ProvinceAssetFactory.js";

/**
 * ============================================================================
 * Historia AI
 * Province Asset Builder
 * ============================================================================
 *
 * Builds immutable Province Assets
 * from Geometry Assets.
 *
 * Pipeline
 * --------
 *
 * Geometry Asset
 *       ↓
 * Metadata Builder
 *       ↓
 * Property Builder
 *       ↓
 * Asset Factory
 *       ↓
 * Province Asset
 */

export function buildProvinceAsset(
  geometryAsset
) {
  if (!geometryAsset) {
    throw new Error(
      "Geometry Asset is required."
    );
  }

  const header =
    buildAssetHeader({
      assetType:
        "province",

      provider:
        geometryAsset.provider,

      dataset:
        geometryAsset.dataset,
    });

  const metadata =
    buildProvinceMetadata(
      geometryAsset
    );

  const properties =
    buildProvinceProperties(
      geometryAsset
    );

  return createProvinceAsset({
    header,

    metadata,

    properties,
  });
}