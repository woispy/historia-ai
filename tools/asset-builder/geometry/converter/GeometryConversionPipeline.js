import {
  parseGeometry,
} from "../parser/GeometryParser.js";

import {
  buildGeometryAsset,
} from "../builder/GeometryAssetBuilder.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Conversion Pipeline
 * ============================================================================
 */

export function runGeometryConversionPipeline({
  geoJson,
  provider,
  dataset,
}) {
  if (
    !geoJson ||
    !Array.isArray(
      geoJson.features
    )
  ) {
    throw new Error(
      "Invalid GeoJSON FeatureCollection."
    );
  }

  const assets = [];

  for (const feature of geoJson.features) {
    const geometry =
      parseGeometry(
        feature.geometry
      );

    const asset =
      buildGeometryAsset({
        feature,

        geometry,

        provider,

        dataset,
      });

    assets.push(
      asset
    );
  }

  return assets;
}