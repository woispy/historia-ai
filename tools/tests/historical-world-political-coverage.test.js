import assert from "node:assert/strict";
import {
  createHistoricalWorldPoliticalPresentation,
  getHistoricalWorldCoverageStatus,
  resolveHistoricalWorldPolityId,
} from "../../src/world/map/historical/HistoricalWorldPoliticalCoverage.js";

const cases = [
  ["Byzantine Empire", "byzantium"],
  ["Golden Horde", "golden-horde"],
  ["Ilkhanate", "ilkhanate"],
  ["Yuan Dynasty", "yuan"],
  ["Delhi Sultanate — Khalji", "delhi"],
  ["Kingdom of France", "france"],
  ["Kingdom of England", "england"],
  ["Republic of Venice", "venice"],
];

for (const [subject, expected] of cases) {
  const geometry = { metadata: { subject, name: subject, borderPrecision: 2 } };
  assert.equal(resolveHistoricalWorldPolityId(geometry), expected);
  const presentation = createHistoricalWorldPoliticalPresentation(geometry);
  assert.equal(presentation.id, expected);
  assert.equal(presentation.timeModel, "historical");
  assert.equal(presentation.sourceType, "historical-runtime");
  assert.ok(/^#[0-9a-f]{6}$/i.test(presentation.color));
}

const unresolvedGeometry = {
  metadata: {
    subject: "Uncatalogued Local Region",
    name: "Uncatalogued Local Region",
    borderPrecision: 1,
  },
};

assert.equal(resolveHistoricalWorldPolityId(unresolvedGeometry), "local_polities");
assert.equal(getHistoricalWorldCoverageStatus(unresolvedGeometry).covered, true);
assert.equal(getHistoricalWorldCoverageStatus(unresolvedGeometry).unresolved, true);
assert.equal(createHistoricalWorldPoliticalPresentation(unresolvedGeometry).sourceType, "historical-runtime");

console.log("Historical world political coverage tests passed: source-derived and unresolved land both receive historical presentation.");
