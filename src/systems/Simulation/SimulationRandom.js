/**
 * Deterministic PRNG used by gameplay simulation.
 *
 * Simulation outcomes must be reproducible from saved state. Do not use
 * Math.random() inside simulation processors because it makes replay,
 * debugging and save/load verification non-deterministic.
 */

function hashSeed(value) {
  const text = String(value ?? "historia-ai");
  let hash = 2166136261;

  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function createSimulationRandom(seed = "historia-ai") {
  let state = hashSeed(seed) || 1;

  return {
    next() {
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      return state / 4294967296;
    },

    getState() {
      return state >>> 0;
    },
  };
}

export function normalizeRandomState(value, fallback = 1) {
  const state = Number(value);
  if (Number.isInteger(state) && state > 0 && state <= 0xffffffff) {
    return state >>> 0;
  }

  return fallback >>> 0 || 1;
}

export function nextSimulationRandom(state) {
  let nextState = normalizeRandomState(state);
  nextState ^= nextState << 13;
  nextState ^= nextState >>> 17;
  nextState ^= nextState << 5;
  nextState >>>= 0;

  return {
    value: nextState / 4294967296,
    state: nextState,
  };
}

export function seedSimulationRandom(scenarioId, countryId) {
  return createSimulationRandom(`${scenarioId ?? "scenario"}:${countryId ?? "observer"}`).getState();
}
