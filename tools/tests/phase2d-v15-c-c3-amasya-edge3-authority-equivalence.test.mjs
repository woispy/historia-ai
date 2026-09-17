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

for (const sample of replay.interiorSamples) {
  assert.equal(
    classifyAmasyaBoundaryPoint({
      isLakeInterior: sample.lakeInterior,
      isLand: sample.physicalLand,
    }),
    "LAKE_INTERIOR",
  );
  assert.equal(sample.resolvedIsFinal, true);
  assert.deepEqual(sample.resolved, sample.shoreline);
  assert.equal(
    isFinalAmasyaBoundaryPoint({ isLakeBoundary: sample.resolvedIsFinal }),
    true,
  );
}

assert.equal(replay.endpointEnd.lakeInterior, true);
assert.equal(replay.endpointEnd.resolvedIsFinal, true);
assert.deepEqual(replay.endpointEnd.resolved, replay.endpointEnd.shoreline);

console.log(
  "C3 Edge-3 authority equivalence replay passed: 257 samples / 9 lake interiors / 9 shoreline recoveries / 0 invalid.",
);
