import assert from "node:assert/strict";

const sessionStore = new Map();

const sessionStorage = {
  getItem(key) {
    return sessionStore.has(key) ? sessionStore.get(key) : null;
  },
  setItem(key, value) {
    sessionStore.set(key, String(value));
  },
  removeItem(key) {
    sessionStore.delete(key);
  },
};

const localStore = new Map();
let rejectSave = false;

const localStorage = {
  getItem(key) {
    return localStore.has(key) ? localStore.get(key) : null;
  },
  setItem(key, value) {
    if (rejectSave) {
      throw new Error("Simulated browser storage failure");
    }
    localStore.set(key, String(value));
  },
  removeItem(key) {
    localStore.delete(key);
  },
};

globalThis.window = { sessionStorage };
globalThis.localStorage = localStorage;

// Import the exact module URLs used by the application. A previous version of
// this regression test added query strings and accidentally created duplicate
// ESM module instances, which hid the real shared new-game state.
const newGame = await import("../../src/game/newGame.js");
const initializer = await import("../../src/bootstrap/GameInitializer.js");
const currentGame = await import("../../src/game/currentGame.js");

newGame.resetNewGame();
newGame.updateNewGame({
  scenarioId: "1300",
  countryId: "ottomans",
  character: {
    name: "Startup Test Character",
    profile: {
      name: "Startup Test Character",
    },
    stats: {},
    personality: [],
  },
});

rejectSave = true;

const session = initializer.initializeGame();

assert.ok(session);
assert.equal(session.version, 2);
assert.ok(session.id);
assert.ok(session.state);
assert.equal(currentGame.getCurrentGame(), session);
assert.deepEqual(newGame.getNewGame(), {
  scenarioId: null,
  countryId: null,
  character: null,
  settings: {},
});

currentGame.clearCurrentGame();
rejectSave = false;

console.log("new-game-startup.test.js: game initialization succeeds even when browser save persistence fails");
