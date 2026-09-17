import assert from "node:assert/strict";
import {
  AMASYA_BOUNDARY_AUTHORITY_CONTRACT,
  classifyAmasyaBoundaryPoint,
  isFinalAmasyaBoundaryPoint,
  explainAmasyaBoundaryDecision,
} from "../historical-gis/province/AmasyaBoundaryAuthorityContract.js";

const cases = [
  [{ isLand: true }, "LAND", true],
  [{ isLakeBoundary: true, isWater: true }, "LAKE_BOUNDARY", true],
  [{ isLakeInterior: true, isWater: true }, "LAKE_INTERIOR", false],
  [{ isWater: true }, "WATER", false],
  [{}, "UNKNOWN", false],
];

for (const [point, expectedClass, expectedFinal] of cases) {
  assert.equal(classifyAmasyaBoundaryPoint(point), expectedClass);
  assert.equal(isFinalAmasyaBoundaryPoint(point), expectedFinal);
  const decision = explainAmasyaBoundaryDecision(point);
  assert.equal(decision.classification, expectedClass);
  assert.equal(decision.finalBoundary, expectedFinal);
  assert.equal(decision.candidateOnly, true);
  assert.equal(typeof decision.reason, "string");
}

assert.equal(AMASYA_BOUNDARY_AUTHORITY_CONTRACT.phase, "2.8-C");
assert.equal(AMASYA_BOUNDARY_AUTHORITY_CONTRACT.authoritativePoliticalGeometry, false);
assert.equal(AMASYA_BOUNDARY_AUTHORITY_CONTRACT.candidateOnly, true);
assert.deepEqual(AMASYA_BOUNDARY_AUTHORITY_CONTRACT.finalBoundaryClasses, ["LAND", "LAKE_BOUNDARY"]);
assert.deepEqual(AMASYA_BOUNDARY_AUTHORITY_CONTRACT.rejectedFinalClasses, ["LAKE_INTERIOR", "WATER", "UNKNOWN"]);

console.log("Amasya boundary authority matrix passed.");
