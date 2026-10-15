function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }
}

function assertScenarioDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("scenarioDate must be an ISO date string (YYYY-MM-DD).");
  }
}

function candidateTemporalStatus(candidate, targetYear) {
  if (!Number.isInteger(candidate?.fromYear) || !Number.isInteger(candidate?.toYear)) {
    return "invalid";
  }

  return candidate.fromYear <= targetYear && targetYear <= candidate.toYear
    ? "applicable"
    : "not-applicable";
}

function geometryStatus(records) {
  if (records.length === 0) return "none";
  if (records.some((record) => record.geometry !== null && record.geometry !== undefined)) {
    return "available";
  }
  return "none";
}

function sourceRecord(candidate, targetYear, matchMethod = null) {
  return {
    sourceFeatureId: candidate.sourceFeatureId,
    sourceName: candidate.name,
    matchMethod,
    temporalStatus: candidateTemporalStatus(candidate, targetYear),
    fromYear: candidate.fromYear,
    toYear: candidate.toYear,
    wikidataId: candidate.wikidataId ?? null,
    seshatId: candidate.seshatId ?? null,
    geometryAvailable: candidate.geometry !== null && candidate.geometry !== undefined,
  };
}

export function auditHistoricalEntityEvidence({
  scenarioDate,
  targetYear,
  matrixRecords,
  candidates,
  reconciliation,
}) {
  assertScenarioDate(scenarioDate);
  if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9999) {
    throw new Error("targetYear must be an integer between 1 and 9999.");
  }
  assertArray(matrixRecords, "matrixRecords");
  assertArray(candidates, "candidates");
  if (!reconciliation || typeof reconciliation !== "object") {
    throw new Error("reconciliation is required.");
  }
  assertArray(reconciliation.reconciled, "reconciliation.reconciled");
  assertArray(reconciliation.unresolved, "reconciliation.unresolved");
  assertArray(reconciliation.ambiguous, "reconciliation.ambiguous");

  const candidateById = new Map(
    candidates.map((candidate) => [String(candidate.sourceFeatureId), candidate]),
  );

  const matchedByEntity = new Map();
  for (const match of reconciliation.reconciled) {
    const candidate = candidateById.get(String(match.sourceFeatureId));
    if (!candidate) continue;
    if (!matchedByEntity.has(match.canonicalEntityId)) matchedByEntity.set(match.canonicalEntityId, []);
    matchedByEntity.get(match.canonicalEntityId).push({ candidate, matchMethod: match.matchMethod });
  }

  const ambiguousByEntity = new Map();
  for (const match of reconciliation.ambiguous) {
    for (const entityId of match.entityIds ?? []) {
      if (!ambiguousByEntity.has(entityId)) ambiguousByEntity.set(entityId, []);
      const candidate = candidateById.get(String(match.sourceFeatureId));
      if (candidate) ambiguousByEntity.get(entityId).push({ candidate, matchMethod: "ambiguous" });
    }
  }

  const entities = matrixRecords.map((record) => {
    const matched = matchedByEntity.get(record.entityId) ?? [];
    const ambiguous = ambiguousByEntity.get(record.entityId) ?? [];
    const allRecords = [...matched, ...ambiguous];

    let identityStatus = "no-source-record";
    if (ambiguous.length > 0) identityStatus = "ambiguous";
    else if (matched.length > 0) identityStatus = "matched";

    const temporalStatuses = allRecords.map(({ candidate }) =>
      candidateTemporalStatus(candidate, targetYear),
    );
    const temporalStatus =
      temporalStatuses.length === 0
        ? "no-source-record"
        : temporalStatuses.every((status) => status === "applicable")
          ? "applicable"
          : temporalStatuses.some((status) => status === "applicable")
            ? "mixed"
            : "not-applicable";

    return {
      entityId: record.entityId,
      displayName: record.displayName,
      region: record.region ?? null,
      tier: record.tier ?? null,
      existenceStatus: record.existenceAtScenarioStart ?? "unknown",
      controlStatus: record.controlAtScenarioStart ?? "unknown",
      identityStatus,
      sourceRecords: allRecords.map(({ candidate, matchMethod }) =>
        sourceRecord(candidate, targetYear, matchMethod),
      ),
      temporalStatus,
      geometryStatus: geometryStatus(allRecords.map(({ candidate }) => candidate)),
      confidence: record.confidence ?? null,
      promotionStatus: "not-promoted",
    };
  });

  return {
    schemaVersion: 1,
    id: "historical_gis_1326_entity_evidence_audit",
    scenarioDate,
    targetYear,
    authorityStatus: "evidence-only",
    purpose:
      "Audit source identity, temporal applicability, and geometry availability before canonical historical geography promotion.",
    entities,
    reconciliationSummary: {
      candidateCount: candidates.length,
      reconciledCount: reconciliation.reconciled.length,
      unresolvedCount: reconciliation.unresolved.length,
      ambiguousCount: reconciliation.ambiguous.length,
    },
    promotion: {
      status: "not-promoted",
      reason:
        "Audit output does not establish canonical political boundaries, ownership, control, or province geometry.",
    },
  };
}
