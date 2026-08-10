import {
  log,
  success,
} from "../../shared/index.js";

import {
  GeometryConverterConfig,
} from "../config/GeometryConverterConfig.js";

import {
  readNaturalEarthDataset,
} from "../providers/natural-earth/NaturalEarthReader.js";

import {
  runGeometryConversionPipeline,
} from "./GeometryConversionPipeline.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Converter
 * ============================================================================
 *
 * Converts external Geometry datasets into
 * Historia Geometry Assets.
 */

export function convertGeometry() {
  log(
    `Provider: ${GeometryConverterConfig.provider}`
  );

  log(
    `Dataset: ${GeometryConverterConfig.dataset}`
  );

  const geoJson =
    loadDataset();

  const assets =
    runGeometryConversionPipeline({
      geoJson,

      provider:
        GeometryConverterConfig.provider,

      dataset:
        GeometryConverterConfig.dataset,
    });

  success(
    `Built ${assets.length} Geometry Assets.`
  );

  return assets;
}

function loadDataset() {
  switch (
    GeometryConverterConfig.provider
  ) {
    case "natural-earth":
      return readNaturalEarthDataset(
        GeometryConverterConfig.dataset
      );

    default:
      throw new Error(
        `Unsupported provider: ${GeometryConverterConfig.provider}`
      );
  }
}