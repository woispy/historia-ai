import assert from "node:assert/strict";
import test from "node:test";
import {
  auditHistoricalPoliticalCoverage,
  pointInPolygon,
} from "../../src/world/map/historical/HistoricalPoliticalCoverageInvariants.js";

test("historical political coverage detects land gaps", () => {
  const landPolygons = [
    [[0, 0], [10, 0], [10, 10], [0, 10]],
  ];
  const politicalEntries = [
    { geometry: { polygons: [[[0, 0], [5, 0], [5, 10], [0, 10]]] } },
  ];

  const audit = auditHistoricalPoliticalCoverage({ landPolygons, politicalEntries });
  assert.equal(audit.landCoveragePass, false);
  assert.equal(audit.pass, false);
  assert.ok(audit.uncoveredLandSamples.length > 0);
});

test("historical political coverage detects sea leaks", () => {
  const landPolygons = [
    [[0, 0], [10, 0], [10, 10], [0, 10]],
  ];
  const politicalEntries = [
    { geometry: { polygons: [[[-1, -1], [11, -1], [11, 11], [-1, 11]]] } },
  ];

  const audit = auditHistoricalPoliticalCoverage({ landPolygons, politicalEntries });
  assert.equal(audit.seaLeakPass, false);
  assert.equal(audit.pass, false);
  assert.ok(audit.politicalSamplesOutsideLand.length > 0);
});

test("historical political coverage passes when land and political extents coincide", () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const audit = auditHistoricalPoliticalCoverage({
    landPolygons: [square],
    politicalEntries: [{ geometry: { polygons: [square] } }],
  });

  assert.equal(audit.pass, true);
  assert.equal(audit.landCoveragePass, true);
  assert.equal(audit.seaLeakPass, true);
});

test("point-in-polygon treats coastline points as covered", () => {
  assert.equal(pointInPolygon([0, 5], [[0, 0], [10, 0], [10, 10], [0, 10]]), true);
});
