function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }
}

function geometryType(geometry) {
  return typeof geometry?.type === "string" ? geometry.type : null;
}

function coordinateCount(coordinates) {
  if (!Array.isArray(coordinates)) return 0;
  if (coordinates.length === 0) return 0;
  if (Array.isArray(coordinates[0])) {
    return coordinates.reduce((sum, value) => sum + coordinateCount(value), 0);
  }
  return coordinates.length >= 2 && coordinates.every(Number.isFinite) ? 1 : 0;
}

function geometryPartCount(geometry) {
  if (!geometry) return 0;
  if (geometry.type === "Polygon") return 1;
  if (geometry.type === "MultiPolygon") return Array.isArray(geometry.coordinates) ? geometry.coordinates.length : 0;
  return 0;
}

function sourceArea(properties) {
  const value = properties?.Area ?? properties?.area ?? properties?.AREA;
  return Number.isFinite(value) ? value : null;
}

function temporalStatus(candidate, targetYear) {
  if (!Number.isInteger(candidate?.fromYear) || !Number.isInteger(candidate?.toYear)) {
    return "invalid";
  }
  return candidate.fromYear <= targetYear && targetYear <= candidate.toYear
    ? "applicable"
    : "not-applicable";
}

function identityIndex(reconciliation) {
  const matched = new Map();
  const ambiguous = new Map();

  for (const record of reconciliation.reconciled) {
    matched.set(String(record.sourceFeatureId), {
      canonicalEntityId: record.canonicalEntityId,
      identityStatus: "matched",
      matchMethod: record.matchMethod ?? null,
      confidence: record.confidence ?? null,
    });
  }

  for (const record of reconciliation.ambiguous) {
    ambiguous.set(String(record.sourceFeatureId), {
      canonicalEntityId: null,
      identityStatus: "ambiguous",
      matchMethod: "ambiguous",
      confidence: null,
      candidateEntityIds: Array.isArray(record.entityIds) ? record.entityIds : [],
    });
  }

  return { matched, ambiguous };
}

export function buildHistoricalGeometryEvidenceInventory({
  sourceId,
  version = null,
  scenarioDate,
  targetYear,
  candidates,
  reconciliation,
}) {
  if (!sourceId || typeof sourceId !== "string") {
    throw new Error("sourceId is required.");
  }
  if (typeof scenarioDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(scenarioDate)) {
    throw new Error("scenarioDate must be an ISO date string (YYYY-MM-DD).");
  }
  if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9999) {
    throw new Error("targetYear must be an integer between 1 and 9999.");
  }
  assertArray(candidates, "candidates");
  if (!reconciliation || typeof reconciliation !== "object") {
    throw new Error("reconciliation is required.");
  }
  assertArray(reconciliation.reconciled, "reconciliation.reconciled");
  assertArray(reconciliation.ambiguous, "reconciliation.ambiguous");
  assertArray(reconciliation.unresolved, "reconciliation.unresolved");

  const { matched, ambiguous } = identityIndex(reconciliation);
  const records = candidates.map((candidate) => {
    const sourceFeatureId = String(candidate.sourceFeatureId);
    const match = ambiguous.get(sourceFeatureId) ?? matched.get(sourceFeatureId) ?? null;
    const geometry = candidate.geometry ?? null;
    const type = geometryType(geometry);

    return {
      sourceFeatureId,
      sourceName: candidate.name,
      wikidataId: candidate.wikidataId ?? null,
      seshatId: candidate.seshatId ?? null,
      fromYear: candidate.fromYear,
      toYear: candidate.toYear,
      temporalStatus: temporalStatus(candidate, targetYear),
      geometryType: type,
      geometryPartCount: geometryPartCount(geometry),
      coordinateCount: coordinateCount(geometry?.coordinates),
      areaKm2: sourceArea(candidate.properties),
      canonicalEntityId: match?.canonicalEntityId ?? null,
      identityStatus: match?.identityStatus ?? "unresolved",
      candidateEntityIds: match?.candidateEntityIds ?? [],
      matchMethod: match?.matchMethod ?? null,
      confidence: match?.confidence ?? null,
      reviewStatus: "unreviewed",
      promotionStatus: "not-promoted",
    };
  });

  return {
    schemaVersion: 1,
    id: "historical_gis_1326_geometry_evidence_inventory",
    scenarioDate,
    targetYear,
    authorityStatus: "evidence-only",
    purpose:
      "Inventory source geometry candidates and their reconciled identity state before canonical historical political geography promotion.",
    source: { sourceId, version },
    records,
    summary: {
      candidateCount: records.length,
      polygonCount: records.filter((record) => record.geometryType === "Polygon").length,
      multiPolygonCount: records.filter((record) => record.geometryType === "MultiPolygon").length,
      missingGeometryCount: records.filter((record) => record.geometryType === null).length,
      matchedCount: records.filter((record) => record.identityStatus === "matched").length,
      ambiguousCount: records.filter((record) => record.identityStatus === "ambiguous").length,
      unresolvedCount: records.filter((record) => record.identityStatus === "unresolved").length,
    },
    promotion: {
      status: "not-promoted",
      reason:
        "Inventory describes source evidence only; geometry remains non-canonical until temporal, identity, cross-source, topology, provenance, confidence, and review gates pass.",
    },
  };
}
