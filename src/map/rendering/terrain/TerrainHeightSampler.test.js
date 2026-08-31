import assert from "node:assert/strict";
import { createTerrainHeightSampler } from "./TerrainHeightSampler.js";

const sampler = createTerrainHeightSampler({ bounds:{minX:30,minY:40,maxX:31,maxY:41}, width:3, height:3, spacingX:30, spacingY:30, samples:Float32Array.from([0,10,20,10,20,30,20,30,40]) });
assert.equal(sampler.sampleHeight(30,40), 0); assert.equal(sampler.sampleHeight(31,41), 40); assert.equal(sampler.sampleHeight(30.5,40.5), 20);
const point = sampler.sample(30.5,40.5); assert.deepEqual(point, { x:30, y:30, height:20 });
assert.throws(() => sampler.sampleHeight(30.5,40.5), /invalid/);
console.log("Phase E terrain height sampler: PASS");
