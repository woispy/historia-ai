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

function createSessionId() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  // `crypto.randomUUID()` is unavailable in some non-secure browser contexts.
  // Keep new-game startup functional there without weakening the session's
  // uniqueness requirements for normal browser/Node runtimes.
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));
    return [
      hex.slice(0, 4).join(""),
      hex.slice(4, 6).join(""),
      hex.slice(6, 8).join(""),
      hex.slice(8, 10).join(""),
      hex.slice(10, 16).join(""),
    ].join("-");
  }

  return `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

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
    id: createSessionId(),
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
