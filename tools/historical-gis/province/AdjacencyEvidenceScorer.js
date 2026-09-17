import { aggregateTerrainEvidence } from "./TerrainEvidenceAdapter.js";

/** Scores an existing P6.1 candidate edge with sampled physical evidence. Never promotes an edge to authoritative topology. */
export function scoreAdjacencyEdge(edge, samples = []) {
  if (!edge?.source || !edge?.target) throw new TypeError("edge requires source and target");
  const evidence = samples.length ? aggregateTerrainEvidence(samples) : null;
  const physicalPenalty = evidence ? evidence.meanCost : 0;
  const physicalSupport = evidence ? Math.max(0, 1 - Math.min(1, physicalPenalty)) : null;
  return Object.freeze({
    edgeId: edge.id ?? `adj:${edge.source}:${edge.target}`,
    source: edge.source,
    target: edge.target,
    candidateOnly: true,
    physicalSupport,
    physicalPenalty,
    evidenceSampleCount: evidence?.sampleCount ?? 0,
    channelMeans: evidence?.averageChannels ?? null,
    disposition: physicalSupport == null ? "unscored" : physicalSupport >= 0.55 ? "retain-candidate" : "challenge-candidate",
  });
}

export function scoreAdjacencyEdges(edges, sampleProvider = () => []) {
  if (!Array.isArray(edges)) throw new TypeError("edges must be an array");
  return edges.map((edge) => scoreAdjacencyEdge(edge, sampleProvider(edge) ?? []));
}

/** Builds explainable, candidate-only review telemetry without asserting historical authority. */
export function buildAdjacencyReviewTelemetry(edgeEvidence = []) {
  if (!Array.isArray(edgeEvidence)) throw new TypeError("edgeEvidence must be an array");
  const reviews = edgeEvidence.map((edge) => {
    const reasons = [];
    if (edge.evidenceSampleCount > 0) reasons.push("terrain-evidence-present");
    if (edge.evidenceSampleCount === 0) reasons.push("terrain-evidence-missing");
    if (edge.physicalSupport != null && edge.physicalSupport >= 0.55) reasons.push("physical-support-above-threshold");
    if (edge.physicalSupport != null && edge.physicalSupport < 0.55) reasons.push("physical-support-below-threshold");
    if (edge.t3ReferencePointCount > 0) reasons.push("t3-reference-support-present");
    if (edge.lockedReferenceCount > 0) reasons.push("locked-reference-near-edge");
    if (edge.constraintReferenceCount > 0) reasons.push("constraint-reference-near-edge");
    if (edge.disposition === "challenge-candidate") reasons.push("candidate-requires-review");
    if (edge.disposition === "unscored") reasons.push("candidate-unscored");
    return Object.freeze({
      edgeId: edge.edgeId,
      disposition: edge.disposition,
      candidateOnly: true,
      physicalSupport: edge.physicalSupport,
      evidenceSampleCount: edge.evidenceSampleCount,
      t3ReferencePointCount: edge.t3ReferencePointCount ?? 0,
      reasons: [...new Set(reasons)].sort(),
    });
  });

  return Object.freeze({
    schemaVersion: 1,
    authoritative: false,
    candidateOnly: true,
    edgeCount: reviews.length,
    retainCandidateCount: reviews.filter((edge) => edge.disposition === "retain-candidate").length,
    challengeCandidateCount: reviews.filter((edge) => edge.disposition === "challenge-candidate").length,
    unscoredCount: reviews.filter((edge) => edge.disposition === "unscored").length,
    reviews,
  });
}
