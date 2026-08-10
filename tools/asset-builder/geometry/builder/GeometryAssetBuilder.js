import {
  buildGeometryBounds,
} from "./GeometryBoundsBuilder.js";

import {
  buildGeometryCenter,
} from "./GeometryCenterBuilder.js";

import {
  buildGeometryMetadata,
} from "./GeometryMetadataBuilder.js";

import {
  createGeometryAsset,
} from "./GeometryAssetFactory.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Asset Builder
 * ============================================================================
 *
 * Coordinates the complete Geometry Asset
 * creation process.
 */

export function buildGeometryAsset({
  feature,
  geometry,
  provider,
  dataset,
}) {
  const geometryBounds =
    buildGeometryBounds(
      geometry.polygons
    );

  const geometryCenter =
    buildGeometryCenter(
      geometryBounds
    );

  const geometryMetadata =
    buildGeometryMetadata({
      feature,
      provider,
      dataset,
    });

  return createGeometryAsset({
    metadata:
      geometryMetadata,

    geometry,

    bounds:
      geometryBounds,

    center:
      geometryCenter,
  });
}