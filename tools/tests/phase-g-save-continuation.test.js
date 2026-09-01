import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
};

const { createGame } = await import("../../src/bootstrap/GameBootstrap.js");
const { GameEngine } = await import("../../src/engine/index.js");
const { saveGame, loadGame } = await import("../../src/save/index.js");

function gameplayState(session) {
  return structuredClone(session.state);
}

const original = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "Save Continuation" } },
});

const prepared = GameEngine.queueAction(
  GameEngine.queueAction(original, "Bursa pazarlarında tahıl denetimi başlat."),
  "Yeni bir elçi heyeti gönder.",
);
const checkpoint = GameEngine.advance(prepared, "week", 1);

saveGame(checkpoint);
const restored = loadGame();

assert.ok(restored);
assert.equal(restored.version, checkpoint.version);
assert.deepEqual(gameplayState(restored), gameplayState(checkpoint));
assert.equal(restored.state.actionSequence, checkpoint.state.actionSequence);
assert.deepEqual(restored.state.pendingActions, checkpoint.state.pendingActions);
assert.equal(restored.state.simulation.simulationSeed, checkpoint.state.simulation.simulationSeed);
assert.equal(restored.state.simulation.rngState, checkpoint.state.simulation.rngState);

const continuedOriginal = GameEngine.advance(checkpoint, "week", 1);
const continuedRestored = GameEngine.advance(restored, "week", 1);

assert.deepEqual(gameplayState(continuedRestored), gameplayState(continuedOriginal));
assert.equal(continuedRestored.statistics.totalTurns, continuedOriginal.statistics.totalTurns);

console.log("phase-g-save-continuation.test.js: all assertions passed");
