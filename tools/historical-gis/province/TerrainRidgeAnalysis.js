/**
 * Local DEM morphology analysis used to distinguish ridge/divide corridors
 * from arbitrary high ground. It is deliberately raster-source agnostic.
 */

function finite(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number)) throw new Error(`${name} must be finite`);
  return number;
}

function clamp01(value) { return Math.min(1, Math.max(0, Number(value))); }

const DIRECTIONS = Object.freeze([
  [-1, -1], [0, -1], [1, -1],
  [-1, 0],            [1, 0],
  [-1, 1],  [0, 1],  [1, 1],
]);

export class RidgeWatershedAnalyzer {
  constructor({ elevationAt, stepDegrees = 0.01, ridgeProminenceMeters = 120 } = {}) {
    if (typeof elevationAt !== "function") throw new Error("elevationAt must be a function");
    this.elevationAt = elevationAt;
    this.stepDegrees = finite(stepDegrees, "stepDegrees");
    this.ridgeProminenceMeters = finite(ridgeProminenceMeters, "ridgeProminenceMeters");
    if (this.stepDegrees <= 0 || this.ridgeProminenceMeters <= 0) throw new Error("ridge analysis thresholds must be > 0");
    this.cache = new Map();
  }

  analyze(node) {
    const lon = finite(node?.lon, "node.lon");
    const lat = finite(node?.lat, "node.lat");
    const cacheKey = node?.id ?? `${lon}:${lat}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

    const center = this.elevationAt({ lon, lat });
    if (!Number.isFinite(center)) return this.#cache(cacheKey, nullAnalysis());

    const samples = [];
    for (const [dx, dy] of DIRECTIONS) {
      const sampleLon = lon + dx * this.stepDegrees;
      const sampleLat = lat + dy * this.stepDegrees;
      const elevation = this.elevationAt({ lon: sampleLon, lat: sampleLat });
      if (Number.isFinite(elevation)) samples.push({ dx, dy, elevation });
    }
    if (samples.length < 4) return this.#cache(cacheKey, nullAnalysis());

    const mean = samples.reduce((sum, sample) => sum + sample.elevation, 0) / samples.length;
    const tpiMeters = center - mean;
    const prominenceScore = clamp01(tpiMeters / this.ridgeProminenceMeters);

    const downslope = samples
      .filter((sample) => center - sample.elevation > 0)
      .map((sample) => ({
        angle: Math.atan2(sample.dy, sample.dx),
        drop: center - sample.elevation,
      }));

    let opposingScore = 0;
    for (let i = 0; i < downslope.length; i += 1) {
      for (let j = i + 1; j < downslope.length; j += 1) {
        let delta = Math.abs(downslope[i].angle - downslope[j].angle);
        delta = Math.min(delta, Math.PI * 2 - delta);
        opposingScore = Math.max(opposingScore, (delta / Math.PI) * Math.min(1, (downslope[i].drop + downslope[j].drop) / (2 * this.ridgeProminenceMeters)));
      }
    }

    const ridgeAffinity = clamp01(0.55 * prominenceScore + 0.45 * opposingScore);
    const result = Object.freeze({
      elevation: center,
      meanNeighbourElevation: mean,
      tpiMeters,
      prominenceScore,
      watershedDivideScore: clamp01(opposingScore),
      ridgeAffinity,
      ridgeCost: 1 - ridgeAffinity,
      sampleCount: samples.length,
    });
    return this.#cache(cacheKey, result);
  }

  #cache(key, value) { this.cache.set(key, value); return value; }
}

function nullAnalysis() {
  return Object.freeze({
    elevation: null,
    meanNeighbourElevation: null,
    tpiMeters: 0,
    prominenceScore: 0,
    watershedDivideScore: 0,
    ridgeAffinity: 0,
    ridgeCost: 1,
    sampleCount: 0,
  });
}

export function measureRidgeAlignment(path, analyzer) {
  if (!Array.isArray(path) || path.length === 0) throw new Error("path must contain at least one node");
  if (!analyzer || typeof analyzer.analyze !== "function") throw new Error("analyzer must implement analyze()");
  const samples = path.map((node) => analyzer.analyze(node));
  const scores = samples.map((sample) => sample.ridgeAffinity);
  const average = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const sorted = [...scores].sort((a, b) => a - b);
  const percentile = (p) => sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
  return Object.freeze({
    ridgeAlignmentScore: average,
    ridgeDeviationScore: 1 - average,
    ridgeAlignmentP10: percentile(0.10),
    ridgeAlignmentP50: percentile(0.50),
    ridgeAlignmentP90: percentile(0.90),
    samples: scores.length,
  });
}
