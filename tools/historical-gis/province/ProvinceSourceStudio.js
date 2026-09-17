/**
 * Historia AI — P8 Province Source Studio (dataset editor core)
 *
 * The editorial authoring workflow for reviewed province boundary sources.
 * Build-time only; runtime polygon mutation is forbidden by the authority
 * contract. The studio connects the editorial process to the existing
 * authority systems:
 *
 *  - createSourceDocumentTemplate: pre-fills a source document with every
 *    declared province ID from the coverage manifest; geometry stays empty
 *    (pending) until reviewed boundaries are entered.
 *  - validateSourceDocumentProgress: fail-closed per-province validation
 *    (declared ID, provenance, ring validity, bbox containment) with a
 *    partial-progress report. Partial documents are authoring state, never
 *    promotable: promotable becomes true only when every declared province
 *    carries reviewed/verified geometry.
 *
 * The studio never invents geometry and never writes to the golden fixture;
 * it only validates and reports.
 */

import { validateProvinceRing } from "./ProvinceSourceImporter.js";

const ALLOWED_REVIEW_STATUSES = new Set(["reviewed", "verified"]);

function ringInsideBbox(ring, bbox) {
  const [minX, minY, maxX, maxY] = bbox;
  return ring.every(([lon, lat]) => lon >= minX && lon <= maxX && lat >= minY && lat <= maxY);
}

/**
 * Build an empty source document template with every declared province ID
 * from the coverage/provinces manifests. Geometry is left empty so the
 * editorial team enters reviewed boundaries one province at a time.
 */
export function createSourceDocumentTemplate({ coverage, provinces, sourceId, sourceRef, reviewStatus = "draft" } = {}) {
  if (!coverage || coverage.schemaVersion !== 1) throw new Error("coverage.schemaVersion must be 1");
  if (!provinces || provinces.schemaVersion !== 1) throw new Error("provinces.schemaVersion must be 1");
  if (coverage.coverageId !== provinces.coverageId) throw new Error("coverageId mismatch between coverage and provinces manifests");
  if (typeof sourceId !== "string" || !sourceId.trim()) throw new Error("template needs a non-empty sourceId");
  if (typeof sourceRef !== "string" || !sourceRef.trim()) throw new Error("template needs a non-empty sourceRef");

  return {
    sourceId,
    sourceRef,
    reviewStatus,
    coverageId: coverage.coverageId,
    provinces: (provinces.provinces ?? []).map((entry) => ({
      provinceId: entry.provinceId,
      sourceRef: "",
      confidence: null,
      reviewStatus: "pending",
      geometryStatus: "pending",
      ring: [],
    })),
  };
}

/**
 * Per-province, fail-closed progress validation for a partially authored
 * source document. Returns a progress report; never throws for incomplete
 * provinces (that is the point of partial authoring) but always reports
 * every violation.
 */
export function validateSourceDocumentProgress({ coverage, provinces, sourceDocument, tolerance } = {}) {
  if (!coverage || coverage.schemaVersion !== 1) throw new Error("coverage.schemaVersion must be 1");
  if (!provinces || provinces.schemaVersion !== 1) throw new Error("provinces.schemaVersion must be 1");
  if (coverage.coverageId !== provinces.coverageId) throw new Error("coverageId mismatch between coverage and provinces manifests");
  if (!sourceDocument || typeof sourceDocument !== "object") throw new Error("sourceDocument must be an object");
  if (!Array.isArray(sourceDocument.provinces)) throw new Error("sourceDocument.provinces must be an array");

  const declaredIds = (provinces.provinces ?? []).map((entry) => String(entry?.provinceId ?? ""));
  const declaredSet = new Set(declaredIds);
  const bbox = coverage.bbox;

  const byProvince = new Map();
  const structuralErrors = [];
  const seen = new Set();
  for (const entry of sourceDocument.provinces) {
    const provinceId = String(entry?.provinceId ?? "");
    if (!provinceId) {
      structuralErrors.push("source document contains a province without provinceId");
      continue;
    }
    if (seen.has(provinceId)) {
      structuralErrors.push(`duplicate province entry ${provinceId}`);
      continue;
    }
    seen.add(provinceId);

    const errors = [];
    if (!declaredSet.has(provinceId)) {
      errors.push("not declared in the coverage manifest");
      byProvince.set(provinceId, { provinceId, declared: false, ready: false, errors });
      continue;
    }
    if (!ALLOWED_REVIEW_STATUSES.has(entry.reviewStatus)) {
      errors.push(`reviewStatus must be "reviewed" or "verified" (got ${JSON.stringify(entry.reviewStatus ?? null)})`);
    }
    const confidence = Number(entry.confidence);
    if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      errors.push("confidence must be in [0, 1]");
    }
    if (typeof entry.sourceRef !== "string" || !entry.sourceRef.trim()) {
      errors.push("province needs a sourceRef citation");
    }
    if (!Array.isArray(entry.ring) || entry.ring.length === 0) {
      errors.push("ring is empty (geometry pending)");
    } else {
      const ringCheck = validateProvinceRing(entry.ring, tolerance);
      if (!ringCheck.valid) errors.push(...ringCheck.errors.map((message) => `ring invalid: ${message}`));
      else if (Array.isArray(bbox) && bbox.length === 4 && !ringInsideBbox(entry.ring, bbox)) {
        errors.push("ring is outside the declared coverage bbox");
      }
    }
    byProvince.set(provinceId, { provinceId, declared: true, ready: errors.length === 0, errors });
  }

  for (const id of declaredIds) {
    if (!byProvince.has(id)) {
      byProvince.set(id, { provinceId: id, declared: true, ready: false, errors: ["missing from source document (pending)"] });
    }
  }

  const report = declaredIds.map((id) => byProvince.get(id));
  const ready = report.filter((item) => item.ready).length;
  return {
    coverageId: coverage.coverageId,
    sourceId: sourceDocument.sourceId ?? null,
    total: declaredIds.length,
    ready,
    pending: declaredIds.length - ready,
    promotable: ready === declaredIds.length && declaredIds.length > 0 && structuralErrors.length === 0,
    structuralErrors,
    provinces: report,
  };
}
