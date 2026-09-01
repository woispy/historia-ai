import assert from "node:assert/strict";
import { BenchmarkSoakRecorder } from "../../src/map/runtime/BenchmarkSoakRecorder.js";

let t = 0;
const recorder = new BenchmarkSoakRecorder({ sampleIntervalMs: 1000, now: () => t });
recorder.start(() => ({ frames: 1, longFrames: 0, fps: 144, frameTimeMs: { average: 6.9, p95: 7.1, p99: 8 }, heap: { currentBytes: 1000, peakBytes: 1000, growthBytes: 0, gcPressureProxyBytes: 0 } }));
t = 1000;
recorder.record(() => ({ frames: 145, longFrames: 2, fps: 144, frameTimeMs: { average: 7, p95: 8, p99: 11 }, heap: { currentBytes: 5000, peakBytes: 5000, growthBytes: 4000, gcPressureProxyBytes: 6000 } }));
const summary = recorder.summary();
assert.equal(summary.sampleCount, 2);
assert.equal(summary.durationMs, 1000);
assert.equal(summary.deltas.heapBytes, 4000);
assert.equal(summary.deltas.longFrames, 2);
assert.equal(summary.deltas.frames, 144);
recorder.stop();
console.log("Benchmark diagnostics contracts passed: 1 Hz time-series sampling, heap/long-frame/frame deltas, deterministic clock.");
