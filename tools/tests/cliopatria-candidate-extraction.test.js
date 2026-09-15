import assert from "node:assert/strict";
import {
  extractCliopatriaCandidates,
  groupCliopatriaCandidatesByEntity,
} from "../historical-gis/CliopatriaCandidateExtractor.js";

const feature = (properties, id, geometry = { type: "Polygon", coordinates: [] }) => ({
  type: "Feature",
  id,
  properties,
  geometry,
});

const fixture = {
  type: "FeatureCollection",
  features: [
    feature(
      {
        Name: "Test Polity",
        FromYear: 1300,
        ToYear: 1350,
        Type: "POLITY",
        Wikidata: "Q1",
        SeshatID: "S1",
        Area: 123.45,
      },
      "p1",
    ),
    feature(
      {
        Name: "Expired Polity",
        FromYear: 1200,
        ToYear: 1300,
        Type: "POLITY",
      },
      "p2",
    ),
    feature(
      {
        Name: "Composite Relation",
        FromYear: 1300,
        ToYear: 1350,
        Type: "RELATION",
      },
      "r1",
    ),
    feature(
      {
        Name: "Invalid Interval",
        FromYear: 1350,
        ToYear: 1300,
        Type: "POLITY",
      },
      "p3",
    ),
    feature(
      {
        Name: "Missing End",
        FromYear: 1300,
        Type: "POLITY",
      },
      "p4",
    ),
  ],
};

const result = extractCliopatriaCandidates(fixture, 1326);
assert.equal(result.candidates.length, 1);
assert.equal(result.candidates[0].name, "Test Polity");
assert.equal(result.candidates[0].sourceFeatureId, "p1");
assert.equal(result.candidates[0].wikidataId, "Q1");
assert.equal(result.candidates[0].seshatId, "S1");
assert.equal(result.candidates[0].areaKm2, 123.45);
assert.equal(result.excluded.length, 3);
assert.equal(result.excluded.some((item) => item.sourceFeatureId === "r1"), true);

const grouped = groupCliopatriaCandidatesByEntity(result.candidates);
assert.equal(grouped.length, 1);
assert.deepEqual(grouped[0].names, ["Test Polity"]);
assert.deepEqual(grouped[0].wikidataIds, ["Q1"]);
assert.deepEqual(grouped[0].seshatIds, ["S1"]);

assert.throws(
  () => extractCliopatriaCandidates({ type: "FeatureCollection", features: [] }, 0),
  /targetYear must be an integer/,
);

console.log("Cliopatria candidate extraction contracts: PASS");
