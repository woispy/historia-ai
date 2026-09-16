import { evaluateTerrainEvidence } from "./TerrainEvidenceAdapter.js";

/**
 * T3-E: associates T3 reference points with terrain/hydrography evidence.
 * The sampler is injected so this layer can consume DEM/hydrography later
 * without coupling T3 to a particular acquisition source. Results remain
 * physical constraints/evidence and never become political authority.
 */
export function associateT3ReferencePointsWithTerrain(t3Result, sampleProvider, { retainThreshold = 0.55 } = {}) {
  if (t3Result?.phase !== "T3-C" || t3Result?.authoritative !== false) {
    throw new Error("T3-E requires a non-authoritative T3-C result");
  }
  if (typeof sampleProvider !== "function") throw new TypeError("sampleProvider must be a function");
  if (!Number.isFinite(retainThreshold) || retainThreshold < 0 || retainThreshold > 1) {
    throw new RangeError("retainThreshold must be between 0 and 1");
  }

  const associations = [];
  for (const feature of t3Result.features ?? []) {
    for (const reference of feature.points ?? []) {
      const point = reference.point;
      const samples = sampleProvider({
        point,
        featureId: feature.featureId,
        sourceIndex: reference.sourceIndex,
        pointType: reference.pointType,
      }) ?? [];
      if (!Array.isArray(samples)) throw new TypeError("sampleProvider must return an array");

      const evaluation = samples.length ? evaluateTerrainEvidence(samples[0]) : null;
      const meanCost = samples.length
        ? samples.reduce((sum, sample) => sum + evaluateTerrainEvidence(sample).totalCost, 0) / samples.length
        : null;
      const support = meanCost == null ? null : Math.max(0, 1 - Math.min(1, meanCost));

      associations.push({
        referencePointId: `${feature.featureId}:${reference.sourceIndex}`,
        featureId: feature.featureId,
        sourceIndex: reference.sourceIndex,
        pointType: reference.pointType,
        locked: reference.locked === true,
        constraintId: reference.constraintId ?? null,
        sampleCount: samples.length,
        meanCost,
        physicalSupport: support,
        disposition: support == null
          ? "unscored"
          : support >= retainThreshold
            ? "terrain-supported"
            : "terrain-constrained",
        channelMeans: evaluation?.channels ?? null,
      });
    }
  }

  return Object.freeze({
    schemaVersion: 1,
    phase: "T3-E",
    authoritative: false,
    status: "candidate-physical-evidence",
    retainThreshold,
    associations,
    diagnostics: {
      referencePointCount: associations.length,
      scoredPointCount: associations.filter((item) => item.sampleCount > 0).length,
      terrainSupportedCount: associations.filter((item) => item.disposition === "terrain-supported").length,
      terrainConstrainedCount: associations.filter((item) => item.disposition === "terrain-constrained").length,
    },
  });
}
