import {
  warning,
} from "../../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Duplicate Validator
 * ============================================================================
 *
 * Validates Geometry Assets and detects
 * duplicate Geometry IDs.
 *
 * Responsibilities
 * ----------------
 * - Detect duplicate IDs.
 * - Report duplicate count.
 * - Provide validation statistics.
 *
 * Future
 * ------
 * This validator will also validate:
 *
 * - Empty polygons
 * - Invalid bounds
 * - Invalid centers
 * - Missing metadata
 * - Invalid geometry types
 */

export function validateGeometryAssets(
  assets
) {
  const idMap =
    new Map();

  let duplicates =
    0;

  for (const asset of assets) {
    const count =
      idMap.get(
        asset.id
      ) ?? 0;

    idMap.set(
      asset.id,
      count + 1
    );
  }

  for (const [
    id,
    count,
  ] of idMap) {
    if (count <= 1) {
      continue;
    }

    duplicates +=
      count - 1;

    warning(
      `Duplicate Geometry ID: ${id} (${count} occurrences)`
    );
  }

  return {
    assets:
      assets.length,

    unique:
      idMap.size,

    duplicates,
  };
}