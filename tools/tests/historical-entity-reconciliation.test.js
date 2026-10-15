import assert from "node:assert/strict";
import {
  reconcileHistoricalEntities,
  validateReconciliationRules,
} from "../historical-gis/HistoricalEntityReconciliation.js";

const rules = [
  {
    entityId: "ottoman-beylik",
    sourceMatches: [
      {
        sourceId: "cliopatria-v0.2.0",
        names: ["Ottoman Beylik"],
        matchStatus: "candidate",
      },
    ],
  },
  {
    entityId: "byzantine-empire",
    sourceMatches: [
      {
        sourceId: "cliopatria-v0.2.0",
        names: ["Byzantine Empire"],
        matchStatus: "candidate",
      },
    ],
  },
];

const candidates = [
  {
    sourceFeatureId: "p1",
    name: "Ottoman Beylik",
    wikidataId: null,
    seshatId: null,
  },
  {
    sourceFeatureId: "p2",
    name: "Byzantine Empire",
    wikidataId: null,
    seshatId: null,
  },
  {
    sourceFeatureId: "p3",
    name: "Unknown Polity",
    wikidataId: null,
    seshatId: null,
  },
];

const result = reconcileHistoricalEntities(candidates, rules);
assert.equal(result.reconciled.length, 2);
assert.equal(result.unresolved.length, 1);
assert.equal(result.ambiguous.length, 0);
assert.equal(result.reconciled[0].canonicalEntityId, "ottoman-beylik");
assert.equal(result.reconciled[0].matchMethod, "name");
assert.equal(result.promotion.status, "not-promoted");

const stableIdRules = [
  {
    entityId: "ottoman-beylik",
    sourceMatches: [
      {
        sourceId: "cliopatria-v0.2.0",
        names: ["Some Alias"],
        wikidataId: "Q100",
        matchStatus: "reviewed",
      },
    ],
  },
];
const stableResult = reconcileHistoricalEntities(
  [{ sourceFeatureId: "p4", name: "Wrong Name", wikidataId: "Q100", seshatId: null }],
  stableIdRules,
);
assert.equal(stableResult.reconciled[0].matchMethod, "wikidata");

const ambiguousRules = [
  {
    entityId: "a",
    sourceMatches: [{ sourceId: "s", names: ["Shared Name"], matchStatus: "candidate" }],
  },
  {
    entityId: "b",
    sourceMatches: [{ sourceId: "s", names: ["Shared Name"], matchStatus: "candidate" }],
  },
];
const ambiguousResult = reconcileHistoricalEntities(
  [{ sourceFeatureId: "p5", name: "Shared Name", wikidataId: null, seshatId: null }],
  ambiguousRules,
);
assert.equal(ambiguousResult.reconciled.length, 0);
assert.equal(ambiguousResult.ambiguous.length, 1);

assert.equal(validateReconciliationRules(rules).valid, true);
assert.equal(
  validateReconciliationRules([
    { entityId: "duplicate", sourceMatches: [] },
    { entityId: "duplicate", sourceMatches: [] },
  ]).valid,
  false,
);
assert.equal(
  validateReconciliationRules([{ entityId: "bad", sourceMatches: [{ sourceId: "s", names: [], matchStatus: "invalid" }] }]).valid,
  false,
);

console.log("Historical entity reconciliation contracts: PASS");
