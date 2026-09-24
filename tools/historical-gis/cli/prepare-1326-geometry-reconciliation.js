import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SCENARIO_DATE = "1326-04-07";
const SOURCE_ID = "cliopatria-v0.2.0";

function arg(name, fallback = null) {
  const i = process.argv.indexOf(name);
  return i < 0 ? fallback : process.argv[i + 1] ?? fallback;
}
function required(name) {
  const value = arg(name);
  if (!value) throw new Error(`${name} <path> is required.`);
  return path.resolve(process.cwd(), value);
}
function canonicalJson(value) {
  return JSON.stringify(value);
}
function sha256(value) {
  return crypto.createHash("sha256").update(typeof value === "string" ? value : canonicalJson(value)).digest("hex");
}
function assertScreening(report) {
  if (report?.scenarioDate !== SCENARIO_DATE) throw new Error("Screening scenario date mismatch.");
  if (report?.source?.sourceId !== SOURCE_ID) throw new Error("Screening source identity mismatch.");
  if (report?.promotion !== "BLOCKED") throw new Error("Screening must remain promotion-blocked.");
  if (report?.screening?.notGeometryAuthority !== true) throw new Error("Screening must remain non-authoritative.");
  if (report?.screening?.noSyntheticGeometry !== true) throw new Error("Screening must remain synthetic-geometry-free.");
  if (!Array.isArray(report?.candidates)) throw new Error("Screening report must contain candidates[].");
}
function assertReconciliation(report) {
  if (report?.scenarioDate !== SCENARIO_DATE) throw new Error("Entity reconciliation scenario date mismatch.");
  if (report?.sourceId !== SOURCE_ID) throw new Error("Entity reconciliation source mismatch.");
  if (report?.promotion !== "BLOCKED") throw new Error("Entity reconciliation must remain promotion-blocked.");
}

const screeningPath = required("--screening");
const reconciliationPath = required("--reconciliation");
const outputPath = path.resolve(process.cwd(), arg("--output", "data/build/gis/1326/cliopatria-geometry-reconciliation.json"));

const screening = JSON.parse(await fs.readFile(screeningPath, "utf8"));
const reconciliation = JSON.parse(await fs.readFile(reconciliationPath, "utf8"));
assertScreening(screening);
assertReconciliation(reconciliation);

const candidateIndex = new Map((screening.candidates ?? []).map(candidate => [candidate.sourceFeatureIndex, candidate]));
const reconciliationIndex = new Map();
for (const entity of reconciliation.results ?? []) {
  for (const candidate of entity.candidates ?? []) {
    const list = reconciliationIndex.get(candidate.sourceFeatureIndex) ?? [];
    list.push({ entityId: entity.entityId, status: entity.status });
    reconciliationIndex.set(candidate.sourceFeatureIndex, list);
  }
}

const reviewQueue = (screening.candidates ?? []).map(candidate => {
  const entityMatches = reconciliationIndex.get(candidate.sourceFeatureIndex) ?? [];
  return {
    reviewId: `cliopatria-1326-feature-${candidate.sourceFeatureIndex}`,
    sourceFeatureIndex: candidate.sourceFeatureIndex,
    sourceFeatureId: candidate.sourceFeatureId,
    name: candidate.name,
    temporalApplicability: {
      fromYear: candidate.fromYear,
      toYear: candidate.toYear,
      scenarioDate: SCENARIO_DATE,
      passes: candidate.fromYear <= 1326 && 1326 <= candidate.toYear
    },
    spatialScreening: {
      anchorHits: candidate.anchorHits,
      geometryBbox: candidate.geometryBbox,
      geometryBboxCenter: candidate.geometryBboxCenter
    },
    entityReconciliation: {
      matches: entityMatches,
      status: entityMatches.length === 0 ? "unmatched" : entityMatches.length === 1 ? "single-match" : "multiple-matches"
    },
    sourceGeometry: {
      type: candidate.geometryAuthorityStatus,
      sha256: sha256(candidate),
      immutable: true
    },
    reviewRequirements: [
      "historical-entity-identity",
      "date-specific-political-applicability",
      "boundary-evidence-reconciliation",
      "physical-constraint-review-when-applicable",
      "topology-validation-after-reviewed-geometry",
      "provenance-and-confidence-assignment"
    ],
    reviewedGeometry: null,
    reviewStatus: "pending",
    promotion: "BLOCKED"
  };
});

const report = {
  schemaVersion: 1,
  kind: "historical-1326-political-geometry-reconciliation-queue",
  scenarioDate: SCENARIO_DATE,
  source: screening.source,
  authorityStatus: "candidate-review-only",
  policy: {
    purpose: "Prepare evidence packets for manual/research-backed geometry reconciliation without changing source geometry.",
    sourceGeometryIsAuthoritative: false,
    geometryMutationAllowed: false,
    syntheticGeometryAllowed: false,
    controlImpliesGeometry: false,
    reviewedGeometryRequiredBeforeCanonical: true
  },
  inputs: {
    screening: screeningPath.replace(/\\/g, "/"),
    reconciliation: reconciliationPath.replace(/\\/g, "/")
  },
  counts: {
    screenedCandidates: reviewQueue.length,
    entityLinkedCandidates: reviewQueue.filter(item => item.entityReconciliation.matches.length > 0).length,
    unmatchedCandidates: reviewQueue.filter(item => item.entityReconciliation.matches.length === 0).length,
    pendingReview: reviewQueue.length
  },
  reviewQueue,
  promotion: "BLOCKED"
};

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\\n`, "utf8");
console.log(JSON.stringify({ scenarioDate: SCENARIO_DATE, ...report.counts, outputPath, promotion: "BLOCKED" }, null, 2));
