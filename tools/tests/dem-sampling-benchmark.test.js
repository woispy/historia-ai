import assert from "node:assert/strict";
import { createDEMSamplerEvidenceProvider } from "../historical-gis/province/DEMSamplerEvidenceBridge.js";
import { DEM_SAMPLING_BENCHMARK_CONTRACT, runDEMSamplingBenchmark } from "../historical-gis/province/DEMSamplingBenchmark.js";

function createSampler() {
  return {
    elevation(lon, lat) {
      return 500 + Math.round(lon * 100) + Math.round(lat * 10);
    },
  };
}

function makeNodes(count, repeats = 0) {
  return Array.from({ length: count }, (_, index) => {
    const coordinateIndex = repeats && index >= count - repeats ? index - repeats : index;
    return { lon: 30 + (coordinateIndex % 100) * 0.001, lat: 40 + Math.floor(coordinateIndex / 100) * 0.001 };
  });
}

const pilotNodes = makeNodes(4, 2);
const pilot = runDEMSamplingBenchmark(createDEMSamplerProvider(), pilotNodes);

function createDEMSamplerProvider() {
  return createDEMSamplerEvidenceProvider(createSampler(), { cache: true });
}

assert.deepEqual(pilot, {
  logicalRequests: 4,
  uniqueCoordinates: 2,
  cacheHits: 2,
  cacheMisses: 2,
  elevationRequests: 18,
  validSamples: 4,
  invalidSamples: 0,
  coverage: 1,
});

const regionalNodes = makeNodes(1000, 250);
const regional = runDEMSamplingBenchmark(createDEMSamplerProvider(), regionalNodes);
assert.equal(regional.logicalRequests, 1000);
assert.equal(regional.uniqueCoordinates, 750);
assert.equal(regional.cacheHits, 250);
assert.equal(regional.cacheMisses, 750);
assert.equal(regional.elevationRequests, 750 * 9);
assert.equal(regional.validSamples, 1000);
assert.equal(regional.invalidSamples, 0);
assert.equal(regional.coverage, 1);

const scaleNodes = makeNodes(15000, 5000);
const scale = runDEMSamplingBenchmark(createDEMSamplerProvider(), scaleNodes);
assert.equal(scale.logicalRequests, 15000);
assert.equal(scale.uniqueCoordinates, 10000);
assert.equal(scale.cacheHits, 5000);
assert.equal(scale.cacheMisses, 10000);
assert.equal(scale.elevationRequests, 90000);
assert.equal(scale.validSamples, 15000);
assert.equal(scale.invalidSamples, 0);
assert.equal(scale.coverage, 1);

assert.equal(DEM_SAMPLING_BENCHMARK_CONTRACT.authoritative, false);
assert.equal(DEM_SAMPLING_BENCHMARK_CONTRACT.politicalAuthority, false);
assert.deepEqual(DEM_SAMPLING_BENCHMARK_CONTRACT.metrics, [
  "logicalRequests",
  "uniqueCoordinates",
  "cacheHits",
  "cacheMisses",
  "elevationRequests",
  "validSamples",
  "invalidSamples",
  "coverage",
]);

console.log("DEM sampling benchmark contract passed: pilot=4 regional=1000 scale=15000.");
