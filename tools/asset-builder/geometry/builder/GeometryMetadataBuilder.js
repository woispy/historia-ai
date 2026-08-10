import {
  buildGeometryId,
} from "./GeometryIdBuilder.js";

import {
  buildGeometryProperties,
} from "./GeometryPropertyBuilder.js";

/**
 * ============================================================================
 * Historia AI
 * Geometry Metadata Builder
 * ============================================================================
 *
 * Builds provider-independent Geometry metadata.
 *
 * Responsibilities
 * ----------------
 * - Generate stable Geometry IDs.
 * - Build Geometry properties.
 *
 * This module does NOT calculate
 * geometry information.
 */

export function buildGeometryMetadata({
  feature,
  provider,
  dataset,
}) {
  return {
    id:
      buildGeometryId(
        feature
      ),

    ...buildGeometryProperties({
      feature,

      provider,

      dataset,
    }),
  };
}