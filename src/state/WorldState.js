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
  simulation = {},
} = {}) {
  if (!world) throw new Error("World is required to create WorldState.");
  if (!time) throw new Error("Time is required to create WorldState.");

  const repositories = world.repositories;
  if (!repositories) {
    throw new Error("World repositories are required to create WorldState.");
  }

  const state = {
    schemaVersion: 1,
    scenarioId,
    playerCountryId,
    playerCharacterId,
    time: cloneValue(time),
    geography: createGeography(world),
    provinces: cloneRepository(repositories.provinces),
    countries: cloneRepository(repositories.countries),
    cities: cloneRepository(repositories.cities),
    populations: {},
    economies: {},
    diplomacy: {},
    military: {},
    events: [],
    timeline: [],
    pendingActions: [],
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

  return true;
}

export { deepFreeze };
