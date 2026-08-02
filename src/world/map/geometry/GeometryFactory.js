/**
 * ============================================================================
 * Historia AI
 * Geometry Factory
 * ============================================================================
 *
 * Creates one immutable geometry model.
 */

export function createGeometry(data) {
  if (!data) {
    throw new Error(
      "Geometry data is required."
    );
  }

  if (!data.id) {
    throw new Error(
      "Geometry id is required."
    );
  }

  return Object.freeze({
    ...data,
  });
}