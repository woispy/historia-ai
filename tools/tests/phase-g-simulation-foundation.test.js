import assert from "node:assert/strict";

import { createGame } from "../../src/bootstrap/GameBootstrap.js";
import { GameEngine } from "../../src/engine/index.js";
import {
  createSimulationRandom,
  nextSimulationRandom,
  seedSimulationRandom,
} from "../../src/systems/Simulation/SimulationRandom.js";

const seed = seedSimulationRandom("1300", "ottomans");
assert.ok(Number.isInteger(seed));
assert.ok(seed > 0);

const first = nextSimulationRandom(seed);
const second = nextSimulationRandom(first.state);
const replayFirst = nextSimulationRandom(seed);
const replaySecond = nextSimulationRandom(first.state);

assert.deepEqual(first, replayFirst);
assert.deepEqual(second, replaySecond);
assert.notEqual(first.state, second.state);

const streamA = createSimulationRandom("phase-g");
const streamB = createSimulationRandom("phase-g");
assert.equal(streamA.next(), streamB.next());
assert.equal(streamA.next(), streamB.next());
assert.equal(streamA.getState(), streamB.getState());

const sessionA = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "Replay Test" } },
});
const sessionB = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "Replay Test" } },
});

assert.equal(sessionA.state.simulation.simulationSeed, sessionB.state.simulation.simulationSeed);
assert.equal(sessionA.state.simulation.rngState, sessionB.state.simulation.rngState);

const replayA = GameEngine.advance(sessionA, "month", 1);
const replayB = GameEngine.advance(sessionB, "month", 1);

assert.deepEqual(replayA.state.simulation, replayB.state.simulation);
assert.deepEqual(replayA.state.timeline, replayB.state.timeline);
assert.equal(replayA.state.simulation.rngState, replayB.state.simulation.rngState);

const actionText = "Gümrük gelirlerini artırmak için yeni bir ticaret düzenlemesi hazırla.";
const queuedA = GameEngine.queueAction(replayA, actionText);
const queuedB = GameEngine.queueAction(replayB, actionText);
assert.deepEqual(queuedA.state.pendingActions, queuedB.state.pendingActions);
assert.match(queuedA.state.pendingActions[0].id, /^action-/);

const differentAction = GameEngine.queueAction(
  replayA,
  "Bursa pazarlarında tahıl denetimi başlat."
);
assert.notEqual(
  queuedA.state.pendingActions[0].id,
  differentAction.state.pendingActions[0].id
);

const month = GameEngine.advance(sessionA, "month", 1);
const sixMonths = GameEngine.advance(sessionA, "month", 6);
const year = GameEngine.advance(sessionA, "year", 1);

assert.ok(month.state.simulation.income > 0);
assert.ok(month.state.simulation.expenses > 0);
assert.ok(sixMonths.state.simulation.income >= month.state.simulation.income * 5);
assert.ok(year.state.simulation.income >= month.state.simulation.income * 11);
assert.ok(month.state.simulation.population > 0);
assert.ok(sixMonths.state.simulation.population > 0);
assert.ok(year.state.simulation.population > 0);

console.log("phase-g-simulation-foundation.test.js: all assertions passed");
