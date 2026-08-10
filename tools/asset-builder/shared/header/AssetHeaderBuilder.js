/**
 * ============================================================================
 * Historia AI
 * Asset Header Builder
 * ============================================================================
 *
 * Builds the common header shared by every
 * Historia AI Asset.
 *
 * Every generated asset contains a standard
 * immutable header.
 */

const ASSET_VERSION = 1;

const GENERATOR =
  "Historia Asset Builder";

export function buildAssetHeader({
  assetType,
  provider,
  dataset,
}) {
  if (!assetType) {
    throw new Error(
      "Asset type is required."
    );
  }

  return Object.freeze({
    assetType,

    assetVersion:
      ASSET_VERSION,

    generator:
      GENERATOR,

    provider,

    dataset,

    generatedAt:
      new Date().toISOString(),
  });
}