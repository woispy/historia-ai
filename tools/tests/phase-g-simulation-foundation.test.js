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
const replaySecond = nextSimulationRandom(replayFirst.state);

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

console.log("phase-g-simulation-foundation.test.js: all assertions passed");
