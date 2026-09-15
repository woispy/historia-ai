import assert from "node:assert/strict";
import { reconcileHistoricalGeometryEvidence } from "../historical-gis/HistoricalGeometryReconciliation.js";

const baseRecord = {
  sourceFeatureId: "feature-1",
  sourceName: "Osmanlı",
  wikidataId: "Q1",
  seshatId: "S1",
  temporalStatus: "applicable",
  geometryType: "Polygon",
  geometryPartCount: 1,
  coordinateCount: 20,
  areaKm2: 100000,
  identityStatus: "matched",
  canonicalEntityId: "ottoman-beylik",
  matchMethod: "wikidata",
  confidence: 0.95,
  reviewStatus: "unreviewed",
};

function inventory(sourceId, version, records = [baseRecord]) {
  return {
    schemaVersion: 1,
    scenarioDate: "1326-04-07",
    targetYear: 1326,
    source: { sourceId, version },
    records,
  };
}

const single = reconcileHistoricalGeometryEvidence({
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  inventories: [inventory("cliopatria-v0.2.0", "v0.2.0")],
});
assert.equal(single.authorityStatus, "evidence-only");
assert.equal(single.records.length, 1);
assert.equal(single.records[0].comparison.status, "candidate");
assert.equal(single.records[0].comparison.geometryCount, 1);
assert.equal(single.promotion.status, "not-promoted");

const corroborated = reconcileHistoricalGeometryEvidence({
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  inventories: [
    inventory("cliopatria-v0.2.0", "v0.2.0"),
    inventory("openhistoricalmap-snapshot", "snapshot-1", [
      { ...baseRecord, sourceFeatureId: "ohm-1", areaKm2: 110000 },
    ]),
  ],
});
assert.equal(corroborated.records[0].comparison.status, "corroborated");
assert.deepEqual(corroborated.records[0].comparison.sourceIds, ["cliopatria-v0.2.0", "openhistoricalmap-snapshot"]);
assert.equal(corroborated.records[0].comparison.conflictFlags.length, 0);

const discrepancy = reconcileHistoricalGeometryEvidence({
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  inventories: [
    inventory("source-a", "1"),
    inventory("source-b", "1", [
      { ...baseRecord, sourceFeatureId: "feature-2", areaKm2: 250000 },
    ]),
  ],
});
assert.equal(discrepancy.records[0].comparison.status, "needs-review");
assert.ok(discrepancy.records[0].comparison.conflictFlags.includes("area-discrepancy-candidate"));

const unresolved = reconcileHistoricalGeometryEvidence({
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  inventories: [
    inventory("source-a", "1", [
      { ...baseRecord, canonicalEntityId: null, identityStatus: "unresolved" },
    ]),
  ],
});
assert.equal(unresolved.records.length, 0);

const filtered = reconcileHistoricalGeometryEvidence({
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  inventories: [inventory("source-a", "1", [{ ...baseRecord, temporalStatus: "not-applicable" }])],
});
assert.equal(filtered.records.length, 0);

assert.throws(
  () => reconcileHistoricalGeometryEvidence({
    scenarioDate: "1326-04-07",
    targetYear: 1326,
    inventories: [inventory("source-a", "1")],
    areaDifferenceThreshold: 2,
  }),
  /areaDifferenceThreshold/,
);

console.log("Historical geometry reconciliation tests passed.");
