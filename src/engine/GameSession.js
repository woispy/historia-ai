/**
 * ============================================================================
 * Historia AI
 * GameSession
 * ============================================================================
 *
 * Purpose
 * -------
 * Represents a single active game session.
 *
 * A GameSession contains every runtime object required to play the game.
 *
 * It does NOT execute game logic.
 *
 * Responsibilities
 * ----------------
 * - Store scenario information
 * - Store world instance
 * - Store game state
 * - Store player information
 * - Store session settings
 * - Store metadata
 *
 * Called by
 * ----------
 * GameBootstrap
 *
 * Calls
 * -----
 * None
 */

export function createGameSession({
  scenario,
  world,
  state,
  player = {},
  settings = {},
}) {
  if (!scenario) {
    throw new Error("GameSession requires a scenario.");
  }

  if (!world) {
    throw new Error("GameSession requires a world.");
  }

  if (!state) {
    throw new Error("GameSession requires a game state.");
  }

  return {
    id: crypto.randomUUID(),

    version: 1,

    createdAt: new Date().toISOString(),

    scenario,

    world,

    state,

    player,

    settings,

    statistics: {
      totalTurns: 0,
      totalPlayTime: 0,
    },
  };
}