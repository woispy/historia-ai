const REVIEW_STATUSES = new Set(["reviewed", "verified"]);

function error(message) {
  return { code: "authority-contract", message };
}

export function validatePoliticalGeographyAuthority({ coverage, provinces, provenance, topology = null } = {}) {
  const errors = [];
  if (!coverage || coverage.schemaVersion !== 1) errors.push(error("coverage.schemaVersion must be 1"));
  if (!provinces || provinces.schemaVersion !== 1) errors.push(error("provinces.schemaVersion must be 1"));
  if (!provenance || provenance.schemaVersion !== 1) errors.push(error("provenance.schemaVersion must be 1"));

  if (coverage?.coverageId !== provinces?.coverageId || coverage?.coverageId !== provenance?.coverageId) {
    errors.push(error("coverageId must match across coverage, provinces and provenance manifests"));
  }

  const entries = provinces?.provinces ?? [];
  const ids = entries.map((entry) => String(entry?.provinceId ?? ""));
  if (!entries.length) errors.push(error("authority manifest must declare provinces"));
  if (Number.isFinite(coverage?.declaredProvinceCount) && entries.length !== coverage.declaredProvinceCount) {
    errors.push(error(`declared province count mismatch: expected ${coverage.declaredProvinceCount}, got ${entries.length}`));
  }
  if (new Set(ids).size !== ids.length) errors.push(error("province IDs must be unique"));
  if (ids.some((id) => !id)) errors.push(error("province IDs must be non-empty"));

  const sourceCandidates = provenance?.sourceCandidates ?? [];
  if (!Array.isArray(sourceCandidates)) errors.push(error("provenance.sourceCandidates must be an array"));
  if (provenance?.requiredSource?.status !== "ready") errors.push(error("required historical province source is not ready"));
  if (coverage?.status !== "ready" || provinces?.status !== "ready" || provenance?.status !== "ready") {
    errors.push(error("authority manifests must all be ready"));
  }
  if (entries.some((entry) => !REVIEW_STATUSES.has(entry?.reviewStatus))) {
    errors.push(error("every production province geometry must be reviewed or verified"));
  }
  if (entries.some((entry) => entry?.geometryStatus !== "authoritative")) {
    errors.push(error("every production province geometry must be authoritative"));
  }
  if (coverage?.promotion?.ready !== true) errors.push(error("coverage promotion.ready must be true"));
  if (coverage?.promotion?.fallbackProvinceCount !== 0) errors.push(error("fallbackProvinceCount must be zero"));
  if (coverage?.promotion?.overlapCount !== 0) errors.push(error("overlapCount must be zero"));
  if (coverage?.promotion?.internalGapCount !== 0) errors.push(error("internalGapCount must be zero"));
  if (coverage?.promotion?.sharedEdgeMismatchCount !== 0) errors.push(error("sharedEdgeMismatchCount must be zero"));
  if (coverage?.promotion?.provenanceErrorCount !== 0) errors.push(error("provenanceErrorCount must be zero"));
  if (topology == null) errors.push(error("authoritative political topology is required"));

  return { valid: errors.length === 0, errors, provinceCount: entries.length };
}

export function assertPoliticalGeographyAuthorityReady(input) {
  const result = validatePoliticalGeographyAuthority(input);
  if (!result.valid) throw new Error(`Political Geography Authority is not ready: ${result.errors.map((item) => item.message).join("; ")}`);
  return result;
}
