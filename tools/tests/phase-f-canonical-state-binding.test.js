import assert from "node:assert/strict";

import { createGame } from "../../src/bootstrap/GameBootstrap.js";
import { handleAction } from "../../src/systems/Action/handlers/ActionHandler.js";

const session = createGame({
  scenarioId: "1300",
  player: { countryId: "ottomans", character: { name: "State Binding Test" } },
  settings: { randomSeed: "canonical-state-binding" },
});

const cityId = session.state.cities.allIds[0];
assert.ok(cityId, "A bootstrap city is required for the state-binding test.");

const beforeStateCity = session.state.cities.byId[cityId];
const beforeWorldCity = session.world.repositories.cities.byId[cityId];
assert.deepEqual(beforeStateCity, beforeWorldCity);

const action = {
  id: "state-binding-action",
  type: "player",
  source: "player",
  status: "pending",
  text: `siege ${cityId}`,
  interpretation: {
    intent: "military.siege",
    entities: { city: cityId },
  },
};

const after = handleAction(session, action);
const afterStateCity = after.state.cities.byId[cityId];
const afterWorldCity = after.world.repositories.cities.byId[cityId];

assert.equal(afterStateCity.status?.underSiege, true);
assert.equal(afterStateCity.status?.siegeTurns, 0);
assert.deepEqual(afterWorldCity, beforeWorldCity);
assert.notDeepEqual(afterStateCity, beforeStateCity);

const constructionSession = {
  ...session,
  state: {
    ...session.state,
    simulation: {
      ...session.state.simulation,
      treasury: 500,
    },
  },
};

const constructionAction = {
  ...action,
  id: "construction-binding-action",
  text: `build ${cityId}`,
  interpretation: {
    intent: "construction.build",
    entities: { city: cityId },
  },
};

const afterConstruction = handleAction(constructionSession, constructionAction);
const builtStateCity = afterConstruction.state.cities.byId[cityId];
const builtWorldCity = afterConstruction.world.repositories.cities.byId[cityId];

assert.equal(builtStateCity.buildings.length, beforeStateCity.buildings?.length ?? 0 + 1);
assert.deepEqual(builtWorldCity, beforeWorldCity);
assert.notDeepEqual(builtStateCity, beforeStateCity);

console.log("phase-f-canonical-state-binding.test.js: all assertions passed");
