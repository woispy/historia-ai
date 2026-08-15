import assert from "node:assert/strict";

import { createGame } from "../../src/bootstrap/GameBootstrap.js";
import { GameEngine } from "../../src/engine/index.js";
import { deserializeGame, serializeGame } from "../../src/save/SaveSerializer.js";

const session = createGame({
  scenarioId: "1300",
  player: {
    countryId: "ottomans",
    character: {
      name: "Runtime Test Character",
    },
  },
});

assert.equal(session.version, 2);
assert.ok(session.state);
assert.equal(session.runtime, undefined);
assert.equal(session.state.time.currentDate.year, 1300);
assert.equal(session.state.time.currentDate.month, 1);
assert.equal(session.statistics.totalTurns, 0);

const advanced = GameEngine.advance(session, "month", 6);

assert.equal(advanced.state.time.currentDate.year, 1300);
assert.equal(advanced.state.time.currentDate.month, 7);
assert.equal(advanced.state.time.lastUnit, "month");
assert.equal(advanced.state.time.lastAmount, 6);
assert.equal(advanced.statistics.totalTurns, 1);
assert.equal(session.state.time.currentDate.month, 1);
assert.equal(session.statistics.totalTurns, 0);

const queued = GameEngine.queueAction(
  advanced,
  "Gümrük gelirlerini artırmak için yeni bir ticaret düzenlemesi hazırla."
);

assert.equal(queued.state.pendingActions.length, 1);
assert.equal(queued.state.pendingActions[0].status, "pending");
assert.equal(advanced.state.pendingActions.length, 0);

assert.throws(
  () => GameEngine.advance(session, "fortnight", 1),
  /Unsupported turn unit/
);

assert.throws(
  () => GameEngine.advance(session, "week", 0),
  /Turn amount must be a positive integer/
);

const saveData = serializeGame(advanced);
assert.equal(saveData.version, 2);
assert.equal(deserializeGame(saveData).state.time.currentDate.month, 7);

assert.throws(
  () => deserializeGame({
    version: 1,
    session,
  }),
  /Unsupported save version/
);

assert.throws(
  () => deserializeGame({
    version: 2,
    session: {
      ...session,
      state: undefined,
      runtime: {},
    },
  }),
  /legacy runtime model/
);

console.log("runtime-engine.test.js: all assertions passed");
