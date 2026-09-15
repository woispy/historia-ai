function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array.`);
  }
}

function finite(value) {
  return Number.isFinite(value) ? value : null;
}

function geometryAvailable(record) {
  return record?.geometryType === "Polygon" || record?.geometryType === "MultiPolygon";
}

function areaRatioDifference(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  return Math.abs(a - b) / Math.max(a, b);
}

function compareCandidates(candidates, areaDifferenceThreshold) {
  const geometryCandidates = candidates.filter((candidate) => candidate.geometryAvailable);
  const sourceIds = [...new Set(candidates.map((candidate) => candidate.sourceId))];
  const geometryTypes = [...new Set(geometryCandidates.map((candidate) => candidate.geometryType))];
  const conflictFlags = [];

  if (geometryCandidates.length === 0) {
    conflictFlags.push("no-geometry-candidate");
  }
  if (geometryCandidates.length > 1) {
    conflictFlags.push("multiple-geometry-candidates");
  }
  if (geometryTypes.length > 1) {
    conflictFlags.push("geometry-type-difference");
  }

  for (let index = 0; index < geometryCandidates.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < geometryCandidates.length; otherIndex += 1) {
      const ratio = areaRatioDifference(
        geometryCandidates[index].areaKm2,
        geometryCandidates[otherIndex].areaKm2,
      );
      if (ratio !== null && ratio > areaDifferenceThreshold) {
        conflictFlags.push("area-discrepancy-candidate");
        index = geometryCandidates.length;
        break;
      }
    }
  }

  const uniqueFlags = [...new Set(conflictFlags)];
  let status = "candidate";
  if (uniqueFlags.includes("no-geometry-candidate")) status = "needs-review";
  if (uniqueFlags.some((flag) => flag !== "no-geometry-candidate")) status = "needs-review";
  if (sourceIds.length > 1 && status === "candidate") status = "corroborated";

  return {
    candidateCount: candidates.length,
    sourceCount: sourceIds.length,
    geometryCount: geometryCandidates.length,
    geometryTypes,
    sourceIds,
    status,
    conflictFlags: uniqueFlags,
  };
}

export function reconcileHistoricalGeometryEvidence({
  scenarioDate,
  targetYear,
  inventories,
  areaDifferenceThreshold = 0.35,
}) {
  if (typeof scenarioDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(scenarioDate)) {
    throw new Error("scenarioDate must be an ISO date string (YYYY-MM-DD).");
  }
  if (!Number.isInteger(targetYear) || targetYear < 1 || targetYear > 9999) {
    throw new Error("targetYear must be an integer between 1 and 9999.");
  }
  assertArray(inventories, "inventories");
  if (inventories.length === 0) throw new Error("inventories must not be empty.");
  if (!Number.isFinite(areaDifferenceThreshold) || areaDifferenceThreshold < 0 || areaDifferenceThreshold > 1) {
    throw new Error("areaDifferenceThreshold must be between 0 and 1.");
  }

  const grouped = new Map();
  for (const inventory of inventories) {
    if (inventory?.scenarioDate && inventory.scenarioDate !== scenarioDate) {
      throw new Error(`Inventory scenarioDate does not match: ${inventory.scenarioDate}.`);
    }
    if (inventory?.targetYear !== undefined && inventory.targetYear !== targetYear) {
      throw new Error(`Inventory targetYear does not match: ${inventory.targetYear}.`);
    }
    if (!inventory?.source?.sourceId || typeof inventory.source.sourceId !== "string") {
      throw new Error("Each inventory must declare source.sourceId.");
    }
    assertArray(inventory.records, "inventory.records");

    for (const record of inventory.records) {
      if (record.identityStatus !== "matched" || !record.canonicalEntityId) continue;
      if (record.temporalStatus !== "applicable") continue;

      const key = String(record.canonicalEntityId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push({
        sourceId: inventory.source.sourceId,
        sourceVersion: inventory.source.version ?? null,
        sourceFeatureId: String(record.sourceFeatureId),
        sourceName: record.sourceName ?? null,
        wikidataId: record.wikidataId ?? null,
        seshatId: record.seshatId ?? null,
        temporalStatus: record.temporalStatus,
        geometryAvailable: geometryAvailable(record),
        geometryType: record.geometryType ?? null,
        geometryPartCount: Number.isInteger(record.geometryPartCount) ? record.geometryPartCount : 0,
        coordinateCount: Number.isInteger(record.coordinateCount) ? record.coordinateCount : 0,
        areaKm2: finite(record.areaKm2),
        matchMethod: record.matchMethod ?? null,
        confidence: finite(record.confidence),
        reviewStatus: record.reviewStatus ?? "unreviewed",
        licenseStatus: inventory.source.licenseStatus ?? "unknown",
      });
    }
  }

  const records = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([canonicalEntityId, candidates]) => ({
    canonicalEntityId,
    sourceCandidates: candidates,
    comparison: compareCandidates(candidates, areaDifferenceThreshold),
    reviewStatus: "unreviewed",
    promotionStatus: "not-promoted",
  }));

  return {
    schemaVersion: 1,
    id: "historical_gis_1326_geometry_reconciliation",
    scenarioDate,
    targetYear,
    authorityStatus: "evidence-only",
    purpose:
      "Compare temporally applicable, identity-reconciled geometry evidence across sources without promoting any source geometry to canonical political geography.",
    methodology: {
      geometryComparisonStatus: "metadata-only",
      areaDifferenceThreshold,
      note:
        "This stage compares temporal applicability, identity, geometry availability/type, source provenance, and source-reported area. It does not infer polygon intersection, union, shared boundaries, or canonical extent.",
    },
    records,
    summary: {
      entityCount: records.length,
      corroboratedCount: records.filter((record) => record.comparison.status === "corroborated").length,
      needsReviewCount: records.filter((record) => record.comparison.status === "needs-review").length,
      geometryCandidateCount: records.reduce((sum, record) => sum + record.comparison.geometryCount, 0),
    },
    promotion: {
      status: "not-promoted",
      reason:
        "Cross-source reconciliation is evidence analysis only; canonical geometry requires reviewed provenance, geometry comparison, topology validation, confidence, and authority promotion gates.",
    },
  };
}
