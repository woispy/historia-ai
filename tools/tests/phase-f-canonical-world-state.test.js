import assert from "node:assert/strict";

import { createGame } from "../../src/bootstrap/GameBootstrap.js";
import { assertWorldState } from "../../src/state/WorldState.js";
import { GameEngine } from "../../src/engine/index.js";

const session = createGame({
  scenarioId: "1300",
  player: {
    countryId: "ottomans",
    character: {
      name: "Phase F Canonical State Test",
    },
  },
});

const state = session.state;

assert.equal(state.schemaVersion, 1);
assert.equal(state.scenarioId, "1300");
assert.equal(state.playerCountryId, "ottomans");
assert.ok(state.time?.currentDate);
assert.ok(state.geography);
assert.ok(state.provinces?.byId);
assert.ok(state.countries?.byId);
assert.ok(state.cities?.byId);
assert.ok(state.simulation);
assert.equal(state.events.length, 0);
assert.equal(state.timeline.length, 0);
assert.equal(state.pendingActions.length, 0);
assert.equal(state.runtime, undefined);

assert.equal(assertWorldState(state), true);

for (const collectionName of ["provinces", "countries", "cities"]) {
  assert.equal(Object.isFrozen(state[collectionName]), true);
  assert.equal(Object.isFrozen(state[collectionName].byId), true);
  assert.equal(Object.isFrozen(state[collectionName].allIds), true);
}

assert.equal(Object.isFrozen(state), true);
assert.equal(Object.isFrozen(state.time), true);
assert.equal(Object.isFrozen(state.time.currentDate), true);

const originalWorldCities = JSON.stringify(session.world.repositories.cities);
const originalCityCount = session.world.repositories.cities.allIds.length;
const originalStateCities = JSON.stringify(state.cities);

const advanced = GameEngine.advance(session, "week", 1);

assert.notEqual(advanced.state, state);
assert.equal(JSON.stringify(session.world.repositories.cities), originalWorldCities);
assert.equal(session.world.repositories.cities.allIds.length, originalCityCount);
assert.notEqual(JSON.stringify(advanced.state.cities), originalStateCities);
assert.equal(Object.isFrozen(advanced.state), true);
assert.equal(Object.isFrozen(advanced.state.cities), true);

// Renderer-facing repositories are seed/read-only data. Simulation changes
// belong exclusively to the canonical state.
assert.equal(
  JSON.stringify(advanced.world.repositories.cities),
  originalWorldCities,
);

// A canonical entity cannot be silently added outside its indexed collection.
assert.throws(
  () => assertWorldState({
    ...state,
    cities: {
      ...state.cities,
      byId: {
        ...state.cities.byId,
        orphan_city: { id: "orphan_city" },
      },
    },
  }),
  /unindexed entity/
);

// Duplicate IDs are rejected at canonical-state construction time.
assert.throws(
  () => assertWorldState({
    ...state,
    provinces: {
      byId: state.provinces.byId,
      allIds: [...state.provinces.allIds, state.provinces.allIds[0]],
    },
  }),
  /duplicate or invalid id/
);

console.log("phase-f-canonical-world-state.test.js: all assertions passed");
