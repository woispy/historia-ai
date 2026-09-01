import assert from "node:assert/strict";

import { createGame } from "../../src/bootstrap/GameBootstrap.js";
import { assertWorldState } from "../../src/state/WorldState.js";
import { createSelection } from "../../src/selection/SelectionFactory.js";
import { createSelectionRepository, setSelection } from "../../src/selection/SelectionRepository.js";
import { SelectionTypes } from "../../src/selection/SelectionTypes.js";
import { getSelectedProvince } from "../../src/selection/SelectionQueries.js";

const session = createGame({
  scenarioId: "1300",
  player: {
    countryId: "ottomans",
    character: {
      name: "Phase F Province Binding Test",
    },
  },
});

const state = session.state;

assert.equal(assertWorldState(state), true);

const provinceIds = state.provinces.allIds;
assert.ok(provinceIds.length > 0, "canonical state must contain provinces");

const geometryIds = new Set(state.geography.geometryIds);
for (const provinceId of provinceIds) {
  const province = state.provinces.byId[provinceId];
  assert.equal(province.id, provinceId);
  assert.ok(Array.isArray(province.cities));

  if (province.geometryId != null) {
    assert.ok(
      geometryIds.has(province.geometryId),
      `province ${provinceId} must resolve to canonical geometry ${province.geometryId}`,
    );
  }
}

let boundCityCount = 0;
for (const cityId of state.cities.allIds) {
  const city = state.cities.byId[cityId];
  if (!city.province) continue;

  boundCityCount += 1;
  assert.ok(state.provinces.byId[city.province]);
  assert.ok(state.provinces.byId[city.province].cities.includes(cityId));
}

assert.ok(boundCityCount > 0, "scenario must contain at least one province-bound city");

for (const provinceId of provinceIds) {
  for (const cityId of state.provinces.byId[provinceId].cities) {
    assert.equal(state.cities.byId[cityId]?.province, provinceId);
  }
}

const provinceId = provinceIds.find((id) => state.provinces.byId[id].cities.length > 0) ?? provinceIds[0];
const selection = createSelection({ type: SelectionTypes.PROVINCE, id: provinceId });
const selectionRepository = setSelection(createSelectionRepository(), selection);

assert.equal(getSelectedProvince(selectionRepository, state), state.provinces.byId[provinceId]);
assert.equal(
  getSelectedProvince(
    setSelection(createSelectionRepository(), createSelection({ type: SelectionTypes.PROVINCE, id: "missing-province" })),
    state,
  ),
  null,
);
assert.equal(
  getSelectedProvince(
    setSelection(createSelectionRepository(), createSelection({ type: SelectionTypes.COUNTRY, id: "ottomans" })),
    state,
  ),
  null,
);

// A city may not reference a province that is absent from canonical state.
const firstCityId = state.cities.allIds.find((id) => state.cities.byId[id]?.province);
const firstCity = state.cities.byId[firstCityId];
assert.throws(
  () => assertWorldState({
    ...state,
    cities: {
      ...state.cities,
      byId: {
        ...state.cities.byId,
        [firstCityId]: { ...firstCity, province: "missing-province" },
      },
    },
  }),
  /references unknown province/,
);

// The reverse index must agree with City.province.
const firstProvinceId = firstCity.province;
const originalMembership = state.provinces.byId[firstProvinceId].cities;
assert.throws(
  () => assertWorldState({
    ...state,
    provinces: {
      ...state.provinces,
      byId: {
        ...state.provinces.byId,
        [firstProvinceId]: {
          ...state.provinces.byId[firstProvinceId],
          cities: originalMembership.slice(1),
        },
      },
    },
  }),
  /inconsistent city membership/,
);

// The canonical province collection is immutable after construction.
assert.equal(Object.isFrozen(state.provinces), true);
assert.equal(Object.isFrozen(state.provinces.byId), true);
assert.equal(Object.isFrozen(state.provinces.allIds), true);
assert.equal(Object.isFrozen(state.provinces.byId[provinceId]), true);
assert.equal(Object.isFrozen(state.provinces.byId[provinceId].cities), true);

// Renderer-facing repositories remain unchanged and do not receive the
// canonical reverse membership index.
assert.notEqual(session.world.repositories.provinces.byId[provinceId], state.provinces.byId[provinceId]);

console.log("phase-f-province-state-binding.test.js: all assertions passed");
