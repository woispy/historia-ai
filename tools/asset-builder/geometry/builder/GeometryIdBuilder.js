import {
  buildStableId,
} from "../../shared/ids/index.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry ID Builder
 * ============================================================================
 *
 * Builds deterministic Geometry IDs.
 *
 * Geometry-specific responsibility:
 * --------------------------------
 * Defines the priority of Natural Earth
 * properties used to generate IDs.
 *
 * Stable ID generation itself is delegated
 * to the shared ID utilities.
 */

export function buildGeometryId(
  feature
) {
  const properties =
    feature.properties ?? {};

  return buildStableId({
    prefix:
      "geometry_country",

    candidates: [
      properties.ADM0_A3,
      properties.ADM0_A3_US,
      properties.BRK_A3,
      properties.SOV_A3,
      properties.ISO_A3,
      properties.NAME_EN,
      properties.NAME,
      properties.NE_ID,
    ],

    fallback:
      () =>
        crypto.randomUUID(),
  });
}