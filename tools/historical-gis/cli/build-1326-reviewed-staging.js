import fs from "node:fs/promises";
import path from "node:path";

const SCENARIO_DATE = "1326-04-07";
const MATRIX_PATH = path.resolve("data/gis/1326/evidence-matrix.json");
const RECON_PATH = path.resolve("data/build/gis/1326/cliopatria-entity-reconciliation.json");
const DEFAULT_OUTPUT = path.resolve("data/build/gis/1326/reviewed-staging/manifest.json");

function readArg(name) {
  const i = process.argv.indexOf(name);
  return i < 0 ? null : process.argv[i + 1] ?? null;
}

const matrix = JSON.parse(await fs.readFile(MATRIX_PATH, "utf8"));
const reconciliation = JSON.parse(await fs.readFile(RECON_PATH, "utf8"));

if (matrix.scenarioDate !== SCENARIO_DATE) throw new Error("1326 evidence matrix scenario date mismatch.");
if (matrix.authorityStatus !== "evidence-only") throw new Error("Evidence matrix must remain evidence-only.");
if (reconciliation.scenarioDate !== SCENARIO_DATE) throw new Error("Reconciliation scenario date mismatch.");
if (reconciliation.promotion !== "BLOCKED") throw new Error("Reconciliation must remain promotion-blocked.");

const reconciliationByEntity = new Map((reconciliation.results ?? []).map((item) => [item.entityId, item]));
const manualReviewEntities = new Set((reconciliation.manualReview ?? []).map((item) => item.entityId));

const entities = (matrix.records ?? []).map((record) => {
  const reconciliationRecord = reconciliationByEntity.get(record.entityId);
  if (!reconciliationRecord) throw new Error(`Missing reconciliation record: ${record.entityId}`);

  const geometryStatus = record.geometryStatus ?? "unknown";
  if (geometryStatus === "authoritative") {
    throw new Error(`Authoritative geometry cannot enter reviewed staging: ${record.entityId}`);
  }

  return {
    entityId: record.entityId,
    displayName: record.displayName,
    tier: record.tier,
    historicalEvidence: {
      existenceAtScenarioStart: record.existenceAtScenarioStart,
      controlAtScenarioStart: record.controlAtScenarioStart,
      confidence: record.confidence,
    },
    identity: {
      reconciliationStatus: reconciliationRecord.status,
      candidateCount: reconciliationRecord.candidateCount,
      manualReview: manualReviewEntities.has(record.entityId),
      candidates: reconciliationRecord.candidates ?? [],
    },
    geometry: {
      geometryStatus,
      sourceAuthority: geometryStatus === "pending-source-acquisition" ? "missing" : "candidate-evidence",
      geometryGeneration: "forbidden",
    },
    staging: {
      authorityStatus: "reviewed-evidence-staging",
      promotion: "BLOCKED",
      nextGate: geometryStatus === "pending-source-acquisition"
        ? "traceable-geometry-acquisition"
        : "candidate-geometry-review",
    },
  };
});

const manifest = {
  schemaVersion: 1,
  id: "historia_ai_1326_reviewed_evidence_staging",
  scenarioDate: SCENARIO_DATE,
  authorityStatus: "reviewed-evidence-staging",
  promotion: "BLOCKED",
  canonicalMapbinMutation: false,
  syntheticGeometry: false,
  source: {
    evidenceMatrix: "data/gis/1326/evidence-matrix.json",
    reconciliation: "data/build/gis/1326/cliopatria-entity-reconciliation.json",
    sourceId: reconciliation.sourceId ?? "cliopatria-v0.2.0",
  },
  entities,
  nextGate: "geometry acquisition/review -> physical-land validation -> topology validation -> canonical promotion review",
};

const output = path.resolve(process.cwd(), readArg("--output") ?? DEFAULT_OUTPUT);
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(manifest, null, 2) + "\n");

console.log(JSON.stringify({
  scenarioDate: SCENARIO_DATE,
  entityCount: entities.length,
  missingGeometry: entities.filter(x => x.geometry.geometryStatus === "pending-source-acquisition").map(x => x.entityId),
  manualReview: entities.filter(x => x.identity.manualReview).map(x => x.entityId),
  authorityStatus: manifest.authorityStatus,
  promotion: manifest.promotion,
  canonicalMapbinMutation: manifest.canonicalMapbinMutation,
  output,
}, null, 2));
