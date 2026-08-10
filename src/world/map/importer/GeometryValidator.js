/**
 * ============================================================================
 * Historia AI
 * Geometry Validator
 * ============================================================================
 *
 * Validates raw geometry assets before they enter
 * the Geometry Engine.
 *
 * This validator knows nothing about repositories,
 * runtime models or rendering.
 *
 * It validates only the asset structure.
 */

function fail(
  geometry,
  message
) {
  const id =
    geometry?.provinceId ??
    geometry?.id ??
    "unknown";

  throw new Error(
    `Geometry "${id}" is invalid.\n${message}`
  );
}

/**
 * Validates a single geometry asset.
 */
export function validateGeometry(
  geometry
) {
  if (!geometry) {
    throw new Error(
      "Geometry asset is required."
    );
  }

  if (
    !geometry.provinceId
  ) {
    fail(
      geometry,
      "Missing provinceId."
    );
  }

  if (
    !Array.isArray(
      geometry.polygon
    )
  ) {
    fail(
      geometry,
      "Polygon must be an array."
    );
  }

  if (
    geometry.polygon.length ===
    0
  ) {
    fail(
      geometry,
      "Polygon cannot be empty."
    );
  }

  if (
    !geometry.position
  ) {
    fail(
      geometry,
      "Missing position."
    );
  }

  if (
    typeof geometry.position.x !==
    "number"
  ) {
    fail(
      geometry,
      "Position.x must be a number."
    );
  }

  if (
    typeof geometry.position.y !==
    "number"
  ) {
    fail(
      geometry,
      "Position.y must be a number."
    );
  }

  return geometry;
}

/**
 * Validates every geometry asset.
 */
export function validateGeometries(
  geometries
) {
  if (
    !Array.isArray(
      geometries
    )
  ) {
    throw new Error(
      "Geometry list must be an array."
    );
  }

  return geometries.map(
    validateGeometry
  );
}