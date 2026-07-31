/**
 * ============================================================================
 * Historia AI
 * Selection Model
 * ============================================================================
 *
 * Represents the currently selected object.
 */

export function createSelectionModel({
  type,

  id,
}) {
  return Object.freeze({
    type,

    id,
  });
}