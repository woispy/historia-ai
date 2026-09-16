/** Candidate-only review telemetry for P6.1 physical evidence. */
export function buildP61ReviewTelemetry(scoredEdges, { suspiciousPenalty = 0.65 } = {}) {
  if (!Array.isArray(scoredEdges)) throw new TypeError("scoredEdges must be an array");
  if (!Number.isFinite(suspiciousPenalty) || suspiciousPenalty < 0 || suspiciousPenalty > 1) {
    throw new RangeError("suspiciousPenalty must be between 0 and 1");
  }

  const suspiciousEdgeIds = scoredEdges
    .filter((edge) => edge.disposition === "challenge-candidate"
      || (edge.physicalPenalty != null && edge.physicalPenalty >= suspiciousPenalty))
    .map((edge) => edge.edgeId)
    .sort();
  const unscoredEdgeIds = scoredEdges
    .filter((edge) => edge.disposition === "unscored")
    .map((edge) => edge.edgeId)
    .sort();

  return Object.freeze({
    schemaVersion: 1,
    phase: "P6.1-review",
    authoritative: false,
    candidateOnly: true,
    edgeCount: scoredEdges.length,
    scoredEdgeCount: scoredEdges.filter((edge) => edge.evidenceSampleCount > 0).length,
    suspiciousEdgeCount: suspiciousEdgeIds.length,
    unscoredEdgeCount: unscoredEdgeIds.length,
    suspiciousEdgeIds,
    unscoredEdgeIds,
  });
}
