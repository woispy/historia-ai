import assert from "node:assert/strict";
import { validateHoleBridge } from "../historical-gis/HoleBridgeValidator.js";

const outer = [[0,0],[10,0],[10,10],[0,10]];
const hole = [[3,3],[5,3],[5,5],[3,5]];

assert.equal(validateHoleBridge({ outerRing: outer, holeRing: hole, outerIndex: 0, holeIndex: 0 }).valid, true);
assert.equal(validateHoleBridge({ outerRing: outer, holeRing: hole, outerIndex: 2, holeIndex: 0 }).valid, false);
assert.equal(validateHoleBridge({ outerRing: outer, holeRing: [[-2,3],[-1,3],[-1,4],[-2,4]], outerIndex: 0, holeIndex: 0 }).valid, false);

console.log("Hole bridge validator contract passed: visible, crossing, and outside candidates are distinguished.");
