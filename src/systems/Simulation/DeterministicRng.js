/**
 * Deterministic simulation RNG.
 *
 * Simulation randomness must be explicit state, never ambient process/global
 * randomness. The generator is a small 32-bit PRNG whose complete state can
 * be serialized and restored with a save game.
 */

const UINT32_RANGE = 0x100000000;

function normalizeSeed(seed) {
  if (typeof seed === "number" && Number.isFinite(seed)) {
    return (Math.trunc(seed) >>> 0) || 1;
  }

  const text = String(seed ?? "1");
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) || 1;
}

export function createDeterministicRng(seed = 1) {
  const normalizedSeed = normalizeSeed(seed);

  return {
    algorithm: "mulberry32",
    seed: normalizedSeed,
    state: normalizedSeed,
    calls: 0,
  };
}

export function nextDeterministicRandom(rng) {
  if (!rng || typeof rng !== "object") {
    throw new TypeError("Deterministic RNG state is required.");
  }

  const state = Number(rng.state) >>> 0;
  let nextState = (state + 0x6d2b79f5) >>> 0;
  let value = nextState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  const result = ((value ^ (value >>> 14)) >>> 0) / UINT32_RANGE;

  return {
    value: result,
    rng: {
      ...rng,
      state: nextState,
      calls: (Number(rng.calls) || 0) + 1,
    },
  };
}

export function randomInt(rng, min, max) {
  if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
    throw new RangeError("randomInt requires integer min/max with max >= min.");
  }

  const { value, rng: nextRng } = nextDeterministicRandom(rng);
  return {
    value: min + Math.floor(value * (max - min + 1)),
    rng: nextRng,
  };
}

export function assertDeterministicRng(rng) {
  if (!rng || rng.algorithm !== "mulberry32") {
    throw new Error("Unsupported deterministic RNG algorithm.");
  }
  if (!Number.isInteger(rng.seed) || !Number.isInteger(rng.state)) {
    throw new Error("Deterministic RNG requires integer seed and state.");
  }
  if (!Number.isInteger(rng.calls) || rng.calls < 0) {
    throw new Error("Deterministic RNG requires a non-negative call counter.");
  }

  return true;
}

export { normalizeSeed };
