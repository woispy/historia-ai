/**
 * ============================================================================
 * Historia AI
 * GameSession
 * ============================================================================
 *
 * GameSession is the single root runtime model for an active game.
 *
 * Runtime-only data belongs to `session.state`.
 * World data belongs to `session.world`.
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
    throw new Error("GameSession requires state.");
  }

  return Object.freeze({
    id: crypto.randomUUID(),
    version: 2,
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
  });
}
