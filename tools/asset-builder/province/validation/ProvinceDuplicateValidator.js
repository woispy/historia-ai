import {
  warning,
} from "../../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Province Duplicate Validator
 * ============================================================================
 *
 * Detects duplicated Province IDs.
 */

export function validateProvinceAssets(
  assets
) {
  const ids =
    new Set();

  let duplicates =
    0;

  for (const asset of assets) {
    const id =
      asset.identity.id;

    if (
      ids.has(id)
    ) {
      duplicates++;

      warning(
        `Duplicate Province ID: ${id}`
      );

      continue;
    }

    ids.add(id);
  }

  return {
    assets:
      assets.length,

    unique:
      ids.size,

    duplicates,
  };
}