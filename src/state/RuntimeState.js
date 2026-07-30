import { createGameTime } from "../systems/Time";

/**
 * ============================================================================
 * Historia AI
 * RuntimeState
 * ============================================================================
 *
 * Represents the mutable runtime state of an active game session.
 *
 * This model intentionally excludes:
 * - world
 * - player
 * - settings
 *
 * Those objects belong to GameSession.
 */

export function createRuntimeState() {
  return {
    time: createGameTime(),

    timeline: [],

    pendingActions: [],
  };
}