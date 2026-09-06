/**
 * Historia AI — Physical Cost Adapters
 *
 * Converts heterogeneous physical/GIS samples into the normalized P3 cost
 * channels. Adapters are pure and data-source agnostic: DEM, hydrography and
 * watershed providers can feed these functions without coupling the solver to
 * a concrete asset format.
 */

import { COST_CHANNELS } from "./CostField.js";

const CHANNEL_SET = new Set(COST_CHANNELS);

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function clamp01(value, name) {
  return Math.min(1, Math.max(0, finite(value, name)));
}

function positive(value, name) {
  const number = finite(value, name);
  if (number < 0) throw new Error(`${name} must be >= 0`);
  return number;
}

export function normalizeCostChannels(values = {}) {
  const result = {};
  for (const channel of COST_CHANNELS) result[channel] = clamp01(values[channel] ?? 0, `cost.${channel}`);
  return result;
}

/**
 * DEM adapter. slope is normalized from degrees unless slopeNormalized is
 * supplied. ridgeAffinity represents how strongly the cell belongs to a
 * watershed/ridge corridor; ridge cost is inverted so high affinity is cheap.
 */
export function adaptDemSample({ slopeDegrees = 0, slopeNormalized, ridgeAffinity = 0, mountainResistance = 0 } = {}) {
  const slope = slopeNormalized == null
    ? Math.min(1, positive(slopeDegrees, "slopeDegrees") / 45)
    : clamp01(slopeNormalized, "slopeNormalized");
  return normalizeCostChannels({
    slope,
    ridge: 1 - clamp01(ridgeAffinity, "ridgeAffinity"),
    mountain: mountainResistance,
  });
}

/** Hydrography adapter. riverPenalty is a normalized crossing resistance. */
export function adaptHydrographySample({ riverPenalty = 0, lakePenalty = 0, coastPenalty = 0 } = {}) {
  return normalizeCostChannels({
    river: riverPenalty,
    lake: lakePenalty,
    coast: coastPenalty,
  });
}

/**
 * Direction-aware river adapter. Parallel travel is cheap while crossing a
 * river is expensive. riverNormal is the local bank-normal vector in the
 * same coordinate basis as direction; values are normalized internally.
 */
export function adaptRiverDirectionalSample({
  basePenalty = 0,
  riverNormal = null,
  direction = null,
  parallelCost = 0.15,
  crossingCost = 1,
} = {}) {
  const base = clamp01(basePenalty, "basePenalty");
  if (!riverNormal || !direction) return normalizeCostChannels({ river: base });

  const nx = finite(riverNormal.x, "riverNormal.x");
  const ny = finite(riverNormal.y, "riverNormal.y");
  const dx = finite(direction.x, "direction.x");
  const dy = finite(direction.y, "direction.y");
  const normalLength = Math.hypot(nx, ny);
  const directionLength = Math.hypot(dx, dy);
  if (normalLength === 0 || directionLength === 0) return normalizeCostChannels({ river: base });

  const alignment = Math.abs((nx * dx + ny * dy) / (normalLength * directionLength));
  const directional = parallelCost + (crossingCost - parallelCost) * alignment;
  return normalizeCostChannels({ river: Math.max(base, directional) });
}

/** Merge independently supplied adapters; later values overwrite earlier ones. */
export function composeCostSamples(...samples) {
  return samples.reduce((merged, sample) => {
    if (!sample) return merged;
    for (const [key, value] of Object.entries(sample)) {
      if (!CHANNEL_SET.has(key)) continue;
      merged[key] = clamp01(value, `cost.${key}`);
    }
    return merged;
  }, {});
}

export function assertCostChannelNames(values = {}) {
  for (const key of Object.keys(values)) {
    if (!CHANNEL_SET.has(key)) throw new Error(`unknown cost channel: ${key}`);
  }
  return true;
}
