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
    id: data.id,

    provinceId:
      data.provinceId,

    position:
      data.position ?? {
        x: 0,
        y: 0,
      },

    bounds:
      data.bounds ?? {
        width: 0,
        height: 0,
      },

    polygon:
      data.polygon ?? [],
  });
}