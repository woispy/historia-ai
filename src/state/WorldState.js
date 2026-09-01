/**
 * ============================================================================
 * Historia AI
 * Canonical World State
 * ============================================================================
 *
 * The simulation state is the sole authoritative mutable representation of
 * gameplay entities. World repositories remain the immutable spatial/data
 * source used to bootstrap the state and render the map.
 *
 * Renderer-facing world repositories must never be mutated by simulation
 * processors. Simulation processors replace records in this state instead.
 */

import { createDeterministicRng, assertDeterministicRng } from "../systems/Simulation/DeterministicRng.js";

function cloneValue(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return value;
  }

  seen.add(value);

  for (const child of Object.values(value)) {
    deepFreeze(child, seen);
  }

  return Object.freeze(value);
}

function cloneRepository(repository) {
  if (!repository || typeof repository !== "object") {
    throw new Error("Canonical world state requires a repository.");
  }

  const byId = cloneValue(repository.byId ?? {});
  const allIds = [...(repository.allIds ?? Object.keys(byId))];

  const idSet = new Set();
  for (const id of allIds) {
    if (!id || idSet.has(id)) {
      throw new Error(`Canonical world state contains a duplicate or invalid id: ${String(id)}`);
    }
    idSet.add(id);

    if (!Object.prototype.hasOwnProperty.call(byId, id)) {
      throw new Error(`Canonical world state is missing entity record: ${String(id)}`);
    }
  }

  for (const id of Object.keys(byId)) {
    if (!idSet.has(id)) {
      throw new Error(`Canonical world state contains an unindexed entity: ${id}`);
    }
  }

  return { byId, allIds };
}

function bindProvinceCityMembership(provinces, cities) {
  const cityIdsByProvince = new Map();

  for (const cityId of cities.allIds) {
    const city = cities.byId[cityId];
    const provinceId = city?.province;

    if (!provinceId) continue;

    if (!provinces.byId[provinceId]) {
      throw new Error(
        `Canonical world state city "${cityId}" references unknown province "${provinceId}".`,
      );
    }

    const provinceCityIds = cityIdsByProvince.get(provinceId) ?? [];
    provinceCityIds.push(cityId);
    cityIdsByProvince.set(provinceId, provinceCityIds);
  }

  const byId = {};
  for (const provinceId of provinces.allIds) {
    const province = provinces.byId[provinceId];
    const cityIds = cityIdsByProvince.get(provinceId) ?? [];

    byId[provinceId] = {
      ...province,
      cities: cityIds,
    };
  }

  return { byId, allIds: provinces.allIds };
}

function createGeography(world) {
  const map = world?.map;

  return {
    date: map?.historical?.date ?? null,
    geometryIds: [...(map?.geometry?.allIds ?? [])],
    provinceIds: [...(map?.provinces?.allIds ?? [])],
    regionIds: [...(map?.regions?.allIds ?? [])],
  };
}

export function createWorldState({
  world,
  time,
  scenarioId = null,
  playerCountryId = null,
  playerCharacterId = null,
  randomSeed = 1,
  simulation = {},
} = {}) {
  if (!world) throw new Error("World is required to create WorldState.");
  if (!time) throw new Error("Time is required to create WorldState.");

  const repositories = world.repositories;
  if (!repositories) {
    throw new Error("World repositories are required to create WorldState.");
  }

  const provinces = cloneRepository(repositories.provinces);
  const countries = cloneRepository(repositories.countries);
  const cities = cloneRepository(repositories.cities);

  const state = {
    schemaVersion: 1,
    scenarioId,
    playerCountryId,
    playerCharacterId,
    time: cloneValue(time),
    geography: createGeography(world),
    provinces: bindProvinceCityMembership(provinces, cities),
    countries,
    cities,
    populations: {},
    economies: {},
    diplomacy: {},
    military: {},
    events: [],
    timeline: [],
    pendingActions: [],
    random: createDeterministicRng(randomSeed),
    simulation: cloneValue(simulation),
  };

  return deepFreeze(state);
}

export function assertWorldState(state) {
  if (!state || typeof state !== "object") {
    throw new TypeError("WorldState must be an object.");
  }

  if (state.schemaVersion !== 1) {
    throw new Error(`Unsupported WorldState schema version: ${String(state.schemaVersion)}.`);
  }

  for (const collection of ["provinces", "countries", "cities"]) {
    cloneRepository(state[collection]);
  }

  if (!state.time?.currentDate) {
    throw new Error("WorldState requires a current date.");
  }

  if (!state.geography || typeof state.geography !== "object") {
    throw new Error("WorldState requires canonical geography metadata.");
  }

  assertDeterministicRng(state.random);

  const provinces = state.provinces;
  const cities = state.cities;
  const expectedProvinceIds = new Map();

  for (const cityId of cities.allIds) {
    const provinceId = cities.byId[cityId]?.province;
    if (!provinceId) continue;

    if (!provinces.byId[provinceId]) {
      throw new Error(
        `WorldState city "${cityId}" references unknown province "${provinceId}".`,
      );
    }

    const ids = expectedProvinceIds.get(provinceId) ?? [];
    ids.push(cityId);
    expectedProvinceIds.set(provinceId, ids);
  }

  for (const provinceId of provinces.allIds) {
    const actual = provinces.byId[provinceId]?.cities;
    const expected = expectedProvinceIds.get(provinceId) ?? [];

    if (!Array.isArray(actual)) {
      throw new Error(`WorldState province "${provinceId}" requires a city membership array.`);
    }

    if (actual.length !== expected.length || actual.some((id, index) => id !== expected[index])) {
      throw new Error(`WorldState province "${provinceId}" has inconsistent city membership.`);
    }

    for (const cityId of actual) {
      if (!cities.byId[cityId]) {
        throw new Error(
          `WorldState province "${provinceId}" references unknown city "${cityId}".`,
        );
      }

      if (cities.byId[cityId].province !== provinceId) {
        throw new Error(
          `WorldState city "${cityId}" is not bound to province "${provinceId}".`,
        );
      }
    }
  }

  return true;
}

export { deepFreeze, bindProvinceCityMembership };
