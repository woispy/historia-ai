import assert from "node:assert/strict";
import { auditHistoricalEntityEvidence } from "../historical-gis/HistoricalEntityEvidenceAudit.js";

const matrixRecords = [
  {
    entityId: "ottoman-beylik",
    displayName: "Osmanlı Beyliği",
    region: "Anatolia",
    tier: 1,
    existenceAtScenarioStart: "supported",
    controlAtScenarioStart: "supported",
    confidence: 0.95,
  },
  {
    entityId: "byzantine-empire",
    displayName: "Bizans İmparatorluğu",
    region: "Byzantine Empire",
    tier: 1,
    existenceAtScenarioStart: "supported",
    controlAtScenarioStart: "supported-in-general; province-level reconciliation pending",
    confidence: 0.85,
  },
  {
    entityId: "esrefogullari",
    displayName: "Eşrefoğulları",
    region: "Anatolia",
    tier: 1,
    existenceAtScenarioStart: "supported",
    controlAtScenarioStart: "supported",
    confidence: 0.9,
  },
];

const candidates = [
  {
    sourceFeatureId: "p1",
    name: "Ottoman Beylik",
    fromYear: 1299,
    toYear: 1326,
    wikidataId: "Q100",
    seshatId: "S1",
    geometry: { type: "Polygon", coordinates: [] },
  },
  {
    sourceFeatureId: "p2",
    name: "Byzantine Empire",
    fromYear: 1204,
    toYear: 1453,
    wikidataId: "Q12544",
    seshatId: "S2",
    geometry: null,
  },
];

const reconciliation = {
  reconciled: [
    {
      sourceFeatureId: "p1",
      canonicalEntityId: "ottoman-beylik",
      matchMethod: "wikidata",
    },
    {
      sourceFeatureId: "p2",
      canonicalEntityId: "byzantine-empire",
      matchMethod: "name",
    },
  ],
  unresolved: [
    {
      sourceFeatureId: "p3",
      candidateName: "Unknown Polity",
      reason: "No reconciliation rule matched the source candidate.",
    },
  ],
  ambiguous: [],
};

const report = auditHistoricalEntityEvidence({
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  matrixRecords,
  candidates,
  reconciliation,
});

assert.equal(report.schemaVersion, 1);
assert.equal(report.authorityStatus, "evidence-only");
assert.equal(report.entities.length, 3);
assert.equal(report.reconciliationSummary.candidateCount, 2);
assert.equal(report.reconciliationSummary.reconciledCount, 2);
assert.equal(report.reconciliationSummary.unresolvedCount, 1);

const ottoman = report.entities.find((entity) => entity.entityId === "ottoman-beylik");
assert.equal(ottoman.identityStatus, "matched");
assert.equal(ottoman.temporalStatus, "applicable");
assert.equal(ottoman.geometryStatus, "available");
assert.equal(ottoman.sourceRecords.length, 1);
assert.equal(ottoman.sourceRecords[0].matchMethod, "wikidata");
assert.equal(ottoman.promotionStatus, "not-promoted");

const byzantine = report.entities.find((entity) => entity.entityId === "byzantine-empire");
assert.equal(byzantine.identityStatus, "matched");
assert.equal(byzantine.geometryStatus, "none");
assert.equal(byzantine.sourceRecords[0].geometryAvailable, false);

const esref = report.entities.find((entity) => entity.entityId === "esrefogullari");
assert.equal(esref.identityStatus, "no-source-record");
assert.equal(esref.temporalStatus, "no-source-record");
assert.equal(esref.geometryStatus, "none");
assert.equal(esref.confidence, 0.9);

assert.throws(
  () =>
    auditHistoricalEntityEvidence({
      scenarioDate: "1326-04-07",
      targetYear: 1326,
      matrixRecords,
      candidates: null,
      reconciliation,
    }),
  /candidates must be an array/,
);

assert.throws(
  () =>
    auditHistoricalEntityEvidence({
      scenarioDate: "1326-04-07",
      targetYear: 0,
      matrixRecords,
      candidates,
      reconciliation,
    }),
  /targetYear must be an integer/,
);

console.log("Historical entity evidence audit contracts: PASS");
