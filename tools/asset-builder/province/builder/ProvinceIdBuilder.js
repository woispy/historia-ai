import {
  buildStableId,
} from "../../shared/index.js";

/**
 * ============================================================================
 * Historia AI
 * Province ID Builder
 * ============================================================================
 *
 * Generates stable Province IDs.
 */

export function buildProvinceId(
  geometry
) {
  return buildStableId({
    prefix:
      "province",

    candidates: [
      geometry.id,
      geometry.name,
    ],

    fallback:
      () =>
        crypto.randomUUID(),
  });
}