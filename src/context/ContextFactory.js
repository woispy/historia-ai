/**
 * ============================================================================
 * Historia AI
 * Context Factory
 * ============================================================================
 *
 * Creates an immutable AI Context.
 */

export function createContext({
  type,

  selection,

  subject,

  world,

  metadata = {},
}) {
  return Object.freeze({
    type,

    selection,

    subject,

    world,

    metadata,
  });
}