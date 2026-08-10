import assert from "node:assert/strict";

const store = new Map();

globalThis.window = {
  sessionStorage: {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
  },
};

const newGame = await import("../../src/game/newGame.js?new-game-state-test=1");

newGame.resetNewGame();

newGame.updateNewGame({
  scenarioId: "1300",
  countryId: "ottomans",
  settings: {
    theme: "dark",
  },
});

assert.deepEqual(newGame.getNewGame(), {
  scenarioId: "1300",
  countryId: "ottomans",
  character: null,
  settings: {
    theme: "dark",
  },
});

assert.equal(store.has(newGame.STORAGE_KEY), true);

const reloaded = await import(
  "../../src/game/newGame.js?new-game-state-test=2"
);

assert.equal(reloaded.getNewGame().scenarioId, "1300");
assert.equal(reloaded.getNewGame().countryId, "ottomans");
assert.equal(reloaded.getNewGame().settings.theme, "dark");

reloaded.updateNewGame({
  character: {
    name: "Test Character",
  },
});

assert.equal(reloaded.getNewGame().character.name, "Test Character");
assert.equal(reloaded.getNewGame().scenarioId, "1300");
assert.equal(reloaded.getNewGame().countryId, "ottomans");

reloaded.resetNewGame();

assert.deepEqual(reloaded.getNewGame(), {
  scenarioId: null,
  countryId: null,
  character: null,
  settings: {},
});
assert.equal(store.has(reloaded.STORAGE_KEY), false);

console.log("new-game-state.test.js: all assertions passed");
