import assert from "node:assert/strict";

import { createGame } from "../../src/bootstrap/GameBootstrap.js";
import { GameEngine } from "../../src/engine/index.js";

const session = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "Action Identity Test" } },
});

assert.equal(session.state.actionSequence, 0);

const first = GameEngine.queueAction(session, "Bursa pazarlarında tahıl denetimi başlat.");
const second = GameEngine.queueAction(first, "Yeni bir elçi heyeti gönder.");

assert.equal(first.state.actionSequence, 1);
assert.equal(second.state.actionSequence, 2);
assert.equal(second.state.pendingActions.length, 2);
assert.notEqual(second.state.pendingActions[0].id, second.state.pendingActions[1].id);

const removed = GameEngine.removeAction(second, second.state.pendingActions[0].id);
const requeued = GameEngine.queueAction(removed, "Gümrük gelirlerini artırmak için yeni düzenleme hazırla.");

assert.equal(requeued.state.actionSequence, 3);
assert.equal(requeued.state.pendingActions.length, 2);
assert.equal(requeued.state.pendingActions[0].id, second.state.pendingActions[1].id);
assert.notEqual(requeued.state.pendingActions[1].id, second.state.pendingActions[1].id);
assert.equal(requeued.state.pendingActions[1].sequence, 3);

const replay = GameEngine.queueAction(session, "Bursa pazarlarında tahıl denetimi başlat.");
assert.equal(replay.state.actionSequence, 1);
assert.equal(replay.state.pendingActions[0].id, first.state.pendingActions[0].id);

console.log("action-identity-integrity.test.js: all assertions passed");
