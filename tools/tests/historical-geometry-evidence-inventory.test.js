import assert from "node:assert/strict";
import { buildHistoricalGeometryEvidenceInventory } from "../historical-gis/HistoricalGeometryEvidenceInventory.js";

const candidates = [
  {
    sourceFeatureId: "ottoman-1",
    name: "Ottoman Beylik",
    fromYear: 1300,
    toYear: 1330,
    wikidataId: "Q1",
    seshatId: "S1",
    geometry: {
      type: "Polygon",
      coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    },
    areaKm2: 12.5,
  },
  {
    sourceFeatureId: "byzantine-1",
    name: "Byzantine Empire",
    fromYear: 1200,
    toYear: 1400,
    wikidataId: "Q2",
    seshatId: "S2",
    geometry: null,
    areaKm2: null,
  },
  {
    sourceFeatureId: "ambiguous-1",
    name: "Ambiguous Polity",
    fromYear: 1200,
    toYear: 1400,
    wikidataId: null,
    seshatId: null,
    geometry: {
      type: "MultiPolygon",
      coordinates: [
        [[[0, 0], [1, 0], [1, 1], [0, 0]]],
        [[[2, 2], [3, 2], [3, 3], [2, 2]]],
      ],
    },
    areaKm2: 20,
  },
];

const reconciliation = {
  reconciled: [
    {
      sourceFeatureId: "ottoman-1",
      canonicalEntityId: "ottoman-beylik",
      matchMethod: "wikidata",
      confidence: 0.98,
    },
    {
      sourceFeatureId: "byzantine-1",
      canonicalEntityId: "byzantine-empire",
      matchMethod: "wikidata",
      confidence: 0.95,
    },
  ],
  unresolved: [],
  ambiguous: [
    {
      sourceFeatureId: "ambiguous-1",
      candidateName: "Ambiguous Polity",
      entityIds: ["ottoman-beylik", "byzantine-empire"],
    },
  ],
};

const inventory = buildHistoricalGeometryEvidenceInventory({
  sourceId: "cliopatria-v0.2.0",
  version: "v0.2.0",
  scenarioDate: "1326-04-07",
  targetYear: 1326,
  candidates,
  reconciliation,
});

assert.equal(inventory.authorityStatus, "evidence-only");
assert.equal(inventory.promotion.status, "not-promoted");
assert.equal(inventory.records.length, 3);

const ottoman = inventory.records.find((record) => record.sourceFeatureId === "ottoman-1");
assert.equal(ottoman.geometryType, "Polygon");
assert.equal(ottoman.geometryPartCount, 1);
assert.equal(ottoman.coordinateCount, 4);
assert.equal(ottoman.temporalStatus, "applicable");
assert.equal(ottoman.identityStatus, "matched");
assert.equal(ottoman.canonicalEntityId, "ottoman-beylik");
assert.equal(ottoman.confidence, 0.98);
assert.equal(ottoman.reviewStatus, "unreviewed");

const byzantine = inventory.records.find((record) => record.sourceFeatureId === "byzantine-1");
assert.equal(byzantine.geometryType, null);
assert.equal(byzantine.geometryPartCount, 0);
assert.equal(byzantine.coordinateCount, 0);
assert.equal(byzantine.identityStatus, "matched");
assert.equal(byzantine.canonicalEntityId, "byzantine-empire");

const ambiguous = inventory.records.find((record) => record.sourceFeatureId === "ambiguous-1");
assert.equal(ambiguous.geometryType, "MultiPolygon");
assert.equal(ambiguous.geometryPartCount, 2);
assert.equal(ambiguous.identityStatus, "ambiguous");
assert.equal(ambiguous.canonicalEntityId, null);
assert.deepEqual(ambiguous.candidateEntityIds, ["ottoman-beylik", "byzantine-empire"]);

assert.deepEqual(inventory.summary, {
  candidateCount: 3,
  polygonCount: 1,
  multiPolygonCount: 1,
  missingGeometryCount: 1,
  matchedCount: 2,
  ambiguousCount: 1,
  unresolvedCount: 0,
});

assert.throws(
  () => buildHistoricalGeometryEvidenceInventory({
    sourceId: "cliopatria-v0.2.0",
    scenarioDate: "1326-04-07",
    targetYear: 1326,
    candidates: [],
    reconciliation: { reconciled: [], unresolved: [] },
  }),
  /reconciliation\.ambiguous must be an array/,
);

console.log("historical geometry evidence inventory tests passed");
