/**
 * Historia AI — Cost Field
 *
 * P3 foundation. Defines a deterministic, composable physical resistance
 * field. GIS/DEM data stays outside this module; adapters provide normalized
 * samples to the field.
 */

export const COST_CHANNELS = Object.freeze([
  "slope",
  "ridge",
  "mountain",
  "river",
  "lake",
  "coast",
]);

const DEFAULT_WEIGHTS = Object.freeze({
  slope: 1,
  ridge: 1,
  mountain: 1,
  river: 1,
  lake: 1,
  coast: 1,
});

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function nonNegative(value, name) {
  const number = finite(value, name);
  if (number < 0) throw new Error(`${name} must be >= 0`);
  return number;
}

function channelValues(values = {}) {
  return Object.fromEntries(COST_CHANNELS.map((channel) => [
    channel,
    nonNegative(values[channel] ?? 0, `cost.${channel}`),
  ]));
}

/** Shortest wrapped longitudinal delta in degrees. */
export function wrappedLongitudeDelta(fromLon, toLon) {
  const from = finite(fromLon, "fromLon");
  const to = finite(toLon, "toLon");
  return ((to - from + 540) % 360) - 180;
}

export function createCostField({ weights = DEFAULT_WEIGHTS, sample = null, metadata = {} } = {}) {
  const normalizedWeights = Object.fromEntries(COST_CHANNELS.map((channel) => [
    channel,
    nonNegative(weights[channel] ?? DEFAULT_WEIGHTS[channel], `weight.${channel}`),
  ]));

  const evaluate = (values = {}) => {
    const channels = channelValues(values);
    let total = 0;
    for (const channel of COST_CHANNELS) total += channels[channel] * normalizedWeights[channel];
    return { total, channels, weights: { ...normalizedWeights } };
  };

  return Object.freeze({
    weights: Object.freeze(normalizedWeights),
    metadata: Object.freeze({ ...metadata }),
    evaluate,
    sample: typeof sample === "function" ? sample : null,
  });
}

export function combineCostSamples(samples, weights = DEFAULT_WEIGHTS) {
  if (!Array.isArray(samples)) throw new Error("samples must be an array");
  const field = createCostField({ weights });
  return samples.reduce((sum, sample) => sum + field.evaluate(sample).total, 0);
}

export function costAlongPath(points, sampler, options = {}) {
  if (!Array.isArray(points) || points.length < 2) throw new Error("points must contain at least two positions");
  if (typeof sampler !== "function") throw new Error("sampler must be a function");
  const field = createCostField(options);
  let total = 0;
  const segments = [];
  for (let index = 1; index < points.length; index += 1) {
    const a = points[index - 1];
    const b = points[index];
    const sample = sampler(a, b, index - 1);
    const evaluation = field.evaluate(sample);
    const dx = wrappedLongitudeDelta(a.lon, b.lon);
    const dy = finite(b.lat, "point.lat") - finite(a.lat, "point.lat");
    const length = Math.hypot(dx, dy);
    const cost = evaluation.total * length;
    total += cost;
    segments.push({ index: index - 1, length, ...evaluation, cost });
  }
  return { total, segments };
}
