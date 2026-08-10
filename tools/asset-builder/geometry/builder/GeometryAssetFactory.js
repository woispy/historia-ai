import {
  buildAssetHeader,
} from "../../shared/header/AssetHeaderBuilder.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Asset Factory
 * ============================================================================
 *
 * Creates immutable Historia Geometry Assets.
 */

export function createGeometryAsset({
  metadata,
  geometry,
  bounds,
  center,
}) {
  return Object.freeze({
    header:
      buildAssetHeader({
        assetType:
          "geometry",

        provider:
          metadata.provider,

        dataset:
          metadata.dataset,
      }),

    ...metadata,

    geometryType:
      geometry.type,

    center,

    bounds,

    polygons:
      geometry.polygons,
  });
}