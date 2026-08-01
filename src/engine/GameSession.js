/**
 * ============================================================================
 * Historia AI
 * GameSession
 * ============================================================================
 *
 * Represents one active game session.
 *
 * This object is the root of the entire game runtime.
 */

export function createGameSession({
  scenario,
  world,
  runtime,
  player = {},
  settings = {},
}) {
  if (!scenario) {
    throw new Error(
      "GameSession requires a scenario."
    );
  }

  if (!world) {
    throw new Error(
      "GameSession requires a world."
    );
  }

  if (!runtime) {
    throw new Error(
      "GameSession requires a runtime."
    );
  }

  return Object.freeze({
    id: crypto.randomUUID(),

    version: 1,

    createdAt:
      new Date().toISOString(),

    scenario,

    world,

    runtime,

    player,

    settings,

    statistics: {
      totalTurns: 0,

      totalPlayTime: 0,
    },
  });
}