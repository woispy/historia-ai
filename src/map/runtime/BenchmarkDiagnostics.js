const TARGET_MS = 1000 / 144;

export class BenchmarkDiagnostics {
  constructor({ targetFrameMs = TARGET_MS, longFrameMs = 16.667 } = {}) {
    this.targetFrameMs = targetFrameMs;
    this.longFrameMs = longFrameMs;
    this.reset();
  }

  reset() {
    this.frames = 0;
    this.frameTimes = [];
    this.longFrames = 0;
    this.pickLatencies = [];
    this.drawCalls = 0;
    this.startedAt = 0;
    this.lastFrameAt = 0;
    this.peakHeapBytes = 0;
    this.heapSamples = 0;
  }

  start(now = performance.now()) {
    this.reset();
    this.startedAt = now;
    this.lastFrameAt = now;
  }

  frame(now = performance.now(), drawCalls = 0) {
    if (!this.startedAt) this.start(now);
    const dt = Math.max(0, now - this.lastFrameAt);
    this.lastFrameAt = now;
    if (this.frames > 0) {
      this.frameTimes.push(dt);
      if (dt > this.longFrameMs) this.longFrames += 1;
    }
    this.frames += 1;
    this.drawCalls += Number(drawCalls) || 0;
    this.sampleHeap();
  }

  pickStart(now = performance.now()) { return now; }

  pickEnd(start, end = performance.now()) {
    const latency = Math.max(0, end - Number(start));
    if (Number.isFinite(latency)) this.pickLatencies.push(latency);
  }

  sampleHeap() {
    const used = globalThis.performance?.memory?.usedJSHeapSize;
    if (Number.isFinite(used)) {
      this.peakHeapBytes = Math.max(this.peakHeapBytes, used);
      this.heapSamples += 1;
    }
  }

  summary(now = performance.now()) {
    const durationMs = Math.max(0, now - this.startedAt);
    const frame = stats(this.frameTimes);
    const pick = stats(this.pickLatencies);
    const heap = globalThis.performance?.memory;
    return {
      target: { hz: 144, frameMs: this.targetFrameMs, viewport: "3840x2160", dpr: 2, internal: "7680x4320" },
      durationMs,
      frames: this.frames,
      fps: durationMs > 0 ? (this.frames * 1000) / durationMs : 0,
      frameTimeMs: frame,
      longFrames: this.longFrames,
      longFrameRate: this.frames ? this.longFrames / this.frames : 0,
      drawCalls: this.drawCalls,
      pickLatencyMs: pick,
      heap: {
        supported: this.heapSamples > 0,
        currentBytes: heap?.usedJSHeapSize ?? null,
        peakBytes: this.peakHeapBytes || null,
        totalBytes: heap?.totalJSHeapSize ?? null,
        limitBytes: heap?.jsHeapSizeLimit ?? null,
      },
      gpuTimeMs: null,
      gpuTiming: "not instrumented",
      notes: ["GPU time remains null until timestamp-query or EXT_disjoint_timer_query2 is available and enabled.", "A 144 FPS claim requires a real GPU/browser run; this collector does not infer it from CPU frame cadence."],
    };
  }
}

function stats(values) {
  if (!values.length) return { count: 0, average: null, p95: null, p99: null, max: null, min: null };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    max: sorted[sorted.length - 1],
    min: sorted[0],
  };
}

function percentile(sorted, p) {
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1));
  return sorted[index];
}

export const BENCHMARK_TARGET = Object.freeze({ viewportWidth: 3840, viewportHeight: 2160, dpr: 2, internalWidth: 7680, internalHeight: 4320, frameBudgetMs: TARGET_MS, soakMs: 30 * 60 * 1000 });
export default BenchmarkDiagnostics;
