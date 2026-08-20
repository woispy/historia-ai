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

let warningCount = 0;
const originalWarn = console.warn;
console.warn = (...args) => {
  if (String(args[0]).includes("Initial save skipped")) {
    warningCount += 1;
    return;
  }
  originalWarn(...args);
};

try {
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
  assert.equal(warningCount, 1, "Expected the simulated save failure to be handled as a warning");

  currentGame.clearCurrentGame();
  rejectSave = false;
} finally {
  console.warn = originalWarn;
}

console.log("new-game-startup.test.js: game initialization succeeds even when browser save persistence fails");
