/** Shared terrain evidence adapter for P6.1/P6.2. It converts DEM-derived samples into bounded physical resistance without making terrain a political authority. */
import { adaptDemSample, composeCostSamples } from "./CostAdapters.js";
import { createCostField } from "./CostField.js";

function finiteOrDefault(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp01(value) {
  return Math.min(1, Math.max(0, finiteOrDefault(value)));
}

export function normalizeTerrainEvidence({ slopeDegrees = 0, slopeNormalized, ridgeAffinity = 0, mountainResistance = 0, riverPenalty = 0, lakePenalty = 0, coastPenalty = 0 } = {}) {
  const dem = adaptDemSample({
    slopeDegrees: finiteOrDefault(slopeDegrees),
    slopeNormalized: slopeNormalized == null ? undefined : clamp01(slopeNormalized),
    ridgeAffinity: clamp01(ridgeAffinity),
    mountainResistance: clamp01(mountainResistance),
  });
  const hydro = {
    river: clamp01(riverPenalty),
    lake: clamp01(lakePenalty),
    coast: clamp01(coastPenalty),
  };
  const channels = composeCostSamples(dem, hydro);
  return Object.freeze({
    channels: Object.freeze(channels),
    terrain: Object.freeze({ slope: channels.slope, ridge: channels.ridge, mountain: channels.mountain }),
    hydrography: Object.freeze({ river: channels.river, lake: channels.lake, coast: channels.coast }),
  });
}

export function evaluateTerrainEvidence(sample, weights = {}) {
  const evidence = normalizeTerrainEvidence(sample);
  const field = createCostField({ weights });
  const evaluation = field.evaluate(evidence.channels);
  return Object.freeze({ ...evidence, totalCost: evaluation.total, weights: evaluation.weights });
}

export function aggregateTerrainEvidence(samples, weights = {}) {
  if (!Array.isArray(samples) || samples.length === 0) throw new RangeError("samples must be non-empty");
  const evaluated = samples.map((sample) => evaluateTerrainEvidence(sample, weights));
  const totalCost = evaluated.reduce((sum, item) => sum + item.totalCost, 0);
  const averageChannels = {};
  for (const channel of ["slope", "ridge", "mountain", "river", "lake", "coast"]) {
    averageChannels[channel] = evaluated.reduce((sum, item) => sum + item.channels[channel], 0) / evaluated.length;
  }
  return Object.freeze({
    sampleCount: evaluated.length,
    totalCost,
    meanCost: totalCost / evaluated.length,
    averageChannels: Object.freeze(averageChannels),
    samples: evaluated,
  });
}
