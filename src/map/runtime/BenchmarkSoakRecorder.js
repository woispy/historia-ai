export class BenchmarkSoakRecorder {
  constructor({ sampleIntervalMs = 1000, now = () => performance.now() } = {}) {
    this.sampleIntervalMs = sampleIntervalMs;
    this.now = now;
    this.samples = [];
    this.startedAt = null;
    this.lastSampleAt = null;
    this.timer = null;
  }

  start(snapshot) {
    this.stop();
    this.samples = [];
    this.startedAt = this.now();
    this.lastSampleAt = this.startedAt;
    this.record(snapshot, this.startedAt);
    this.timer = setInterval(() => this.record(snapshot), this.sampleIntervalMs);
  }

  record(snapshot, timestamp = this.now()) {
    const value = typeof snapshot === "function" ? snapshot() : snapshot;
    this.samples.push({ tMs: Math.max(0, timestamp - (this.startedAt ?? timestamp)), ...compact(value) });
  }

  stop() {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
    this.lastSampleAt = this.now();
  }

  summary() {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    return {
      schema: "historia-benchmark-soak/v1",
      sampleIntervalMs: this.sampleIntervalMs,
      sampleCount: this.samples.length,
      durationMs: first && last ? last.tMs - first.tMs : 0,
      samples: this.samples,
      deltas: {
        heapBytes: delta(last?.heap?.usedBytes, first?.heap?.usedBytes),
        longFrames: delta(last?.longFrames, first?.longFrames),
        frames: delta(last?.frames, first?.frames),
      },
    };
  }
}

function compact(value = {}) {
  return {
    frames: finite(value.frames),
    longFrames: finite(value.longFrames),
    frameAverageMs: finite(value.frameTimeMs?.average),
    frameP95Ms: finite(value.frameTimeMs?.p95),
    frameP99Ms: finite(value.frameTimeMs?.p99),
    fps: finite(value.fps),
    drawCalls: finite(value.drawCalls),
    pickP95Ms: finite(value.pickLatencyMs?.p95),
    pickP99Ms: finite(value.pickLatencyMs?.p99),
    heap: {
      usedBytes: finite(value.heap?.currentBytes),
      peakBytes: finite(value.heap?.peakBytes),
      growthBytes: finite(value.heap?.growthBytes),
      gcPressureProxyBytes: finite(value.heap?.gcPressureProxyBytes),
    },
    gpuTimeMs: finite(value.gpuTimeMs),
    backend: value.backend ?? null,
  };
}

function finite(value) { return Number.isFinite(value) ? value : null; }
function delta(a, b) { return Number.isFinite(a) && Number.isFinite(b) ? a - b : null; }

export default BenchmarkSoakRecorder;
