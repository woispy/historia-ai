/**
 * ============================================================================
 * Historia AI
 * Decision Model
 * ============================================================================
 *
 * Represents one player decision.
 */

export function createDecisionModel({
  id,

  text,

  type,

  status,

  createdAt,

  updatedAt,

  turn,

  metadata = {},
}) {
  return Object.freeze({
    id,

    text,

    type,

    status,

    createdAt,

    updatedAt,

    turn,

    metadata,
  });
}