/**
 * Converts the 1326 candidate review package into a deterministic,
 * candidate-only QA ledger. The ledger records evidence and provenance;
 * it never promotes historical geometry or topology to authority.
 */
function requireCandidatePackage(reviewPackage) {
  if (!reviewPackage || reviewPackage.authoritative !== false) {
    throw new TypeError("reviewPackage must remain non-authoritative");
  }
  if (reviewPackage.phase !== "1326-CANDIDATE-EVIDENCE-PILOT") {
    throw new RangeError("unsupported review package phase");
  }
  return reviewPackage;
}

function freezeRecord(record) {
  return Object.freeze({
    ...record,
    historicalEvidence: Object.freeze({ ...record.historicalEvidence }),
    physicalEvidence: Object.freeze({ ...record.physicalEvidence }),
    topologyEvidence: Object.freeze({ ...record.topologyEvidence }),
    review: Object.freeze({ ...record.review }),
  });
}

export function build1326HistoricalQALedger(reviewPackage) {
  const packageData = requireCandidatePackage(reviewPackage);
  const edgeEvidence = packageData.layers?.p61EdgeEvidence ?? [];
  const reviews = packageData.layers?.adjacencyReviewTelemetry?.reviews ?? [];
  const reviewByEdgeId = new Map(reviews.map((review) => [review.edgeId, review]));

  const records = edgeEvidence.map((edge) => {
    const review = reviewByEdgeId.get(edge.edgeId);
    return freezeRecord({
      edgeId: edge.edgeId,
      source: edge.source,
      target: edge.target,
      scenarioDate: packageData.scenarioDate,
      authoritative: false,
      historicalEvidence: {
        t3ReferencePointCount: edge.t3ReferencePointCount ?? 0,
        t3ReferencePointIds: [...(edge.t3ReferencePointIds ?? [])],
        strongestReferenceImportance: edge.strongestReferenceImportance ?? null,
        lockedReferenceCount: edge.lockedReferenceCount ?? 0,
        constraintReferenceCount: edge.constraintReferenceCount ?? 0,
      },
      physicalEvidence: {
        terrainSource: packageData.terrainSource,
        physicalSupport: edge.physicalSupport ?? null,
        physicalPenalty: edge.physicalPenalty ?? null,
        evidenceSampleCount: edge.evidenceSampleCount ?? 0,
        channelMeans: edge.channelMeans ?? null,
      },
      topologyEvidence: {
        candidateOnly: edge.candidateOnly === true,
        disposition: edge.disposition,
      },
      review: {
        disposition: review?.disposition ?? edge.disposition,
        reasons: [...(review?.reasons ?? edge.reviewFlags ?? [])].sort(),
      },
    });
  });

  const counts = {
    edgeCount: records.length,
    retainCandidateCount: records.filter((record) => record.review.disposition === "retain-candidate").length,
    challengeCandidateCount: records.filter((record) => record.review.disposition === "challenge-candidate").length,
    unscoredCount: records.filter((record) => record.review.disposition === "unscored").length,
  };

  return Object.freeze({
    schemaVersion: 1,
    phase: "1326-HISTORICAL-QA-LEDGER",
    scenarioDate: packageData.scenarioDate,
    region: packageData.region,
    authoritative: false,
    candidateOnly: true,
    provenance: Object.freeze({
      sourcePhase: packageData.phase,
      terrainSource: packageData.terrainSource,
      sourceSchemaVersion: packageData.schemaVersion,
    }),
    counts: Object.freeze(counts),
    records: Object.freeze(records),
  });
}
