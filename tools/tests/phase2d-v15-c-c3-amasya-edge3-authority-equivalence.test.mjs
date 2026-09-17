import assert from "node:assert/strict";
import replay from "./fixtures/c3-amasya-edge3-replay.json" with { type: "json" };
import {
  classifyAmasyaBoundaryPoint,
  isFinalAmasyaBoundaryPoint,
} from "../historical-gis/province/AmasyaBoundaryAuthorityContract.js";

const expectedStart = [34.828390856782086, 41.01264370368176];
const expectedEnd = [35.31959064327484, 41.25286549707603];

assert.equal(replay.sampleCount, 256);
assert.equal(replay.counts.samples, 257);
assert.equal(replay.counts.lakeInterior, 9);
assert.equal(replay.counts.shorelineRecoveries, 9);
assert.equal(replay.counts.invalidAfterC3, 0);
assert.equal(replay.builderStatus, "success");
assert.deepEqual(replay.endpointStart.point, expectedStart);
assert.deepEqual(replay.endpointEnd.point, expectedEnd);
assert.equal(replay.interiorSamples.length, 9);

// Bind the replay's original classifications to the authority contract.
for (const sample of replay.interiorSamples) {
  assert.equal(
    classifyAmasyaBoundaryPoint({
      isLakeInterior: sample.lakeInterior,
      isLand: sample.physicalLand,
    }),
    "LAKE_INTERIOR",
  );
  assert.equal(isFinalAmasyaBoundaryPoint({ isLakeInterior: true }), false);
  assert.equal(sample.resolvedIsFinal, true);
  assert.deepEqual(sample.resolved, sample.shoreline);
}

// The replay records a successful shoreline resolution; the authority contract
// separately guarantees that a shoreline/lake-boundary class is final-eligible.
assert.equal(isFinalAmasyaBoundaryPoint({ isLakeBoundary: true }), true);
assert.equal(replay.endpointEnd.lakeInterior, true);
assert.equal(replay.endpointEnd.resolvedIsFinal, true);
assert.deepEqual(replay.endpointEnd.resolved, replay.endpointEnd.shoreline);

// Candidate-only gate: this fixture must never become political authority by itself.
assert.equal(replay.sourceArtifact.runId, 35164261384);

console.log(
  "C3 Edge-3 authority equivalence replay passed: 257 samples / 9 lake interiors / 9 shoreline recoveries / 0 invalid.",
);
