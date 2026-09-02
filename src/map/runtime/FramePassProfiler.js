const EMPTY_STATS = Object.freeze({ count: 0, average: null, p50: null, p95: null, p99: null, max: null, min: null });

export class FramePassProfiler {
  constructor() {
    this.reset();
  }

  reset() {
    this.startedAt = 0;
    this.renderCalls = 0;
    this.renderDurations = [];
    this.queueSubmits = 0;
    this.queueSubmitDurations = [];
    this.pickRequested = 0;
    this.pickAccepted = 0;
    this.pickSkippedBusy = 0;
    this.pickCompleted = 0;
    this.pickLatencies = [];
    this.rafFrames = 0;
    this.rafIntervals = [];
    this.lastRafAt = null;
    this.detach = [];
  }

  start(now = performance.now()) {
    this.reset();
    this.startedAt = now;
  }

  recordRender(durationMs) {
    this.renderCalls += 1;
    if (Number.isFinite(durationMs)) this.renderDurations.push(Math.max(0, durationMs));
  }

  recordQueueSubmit(durationMs) {
    this.queueSubmits += 1;
    if (Number.isFinite(durationMs)) this.queueSubmitDurations.push(Math.max(0, durationMs));
  }

  recordPickRequested() {
    this.pickRequested += 1;
  }

  recordPickAccepted() {
    this.pickAccepted += 1;
  }

  recordPickSkippedBusy() {
    this.pickSkippedBusy += 1;
  }

  recordPickCompleted(durationMs) {
    this.pickCompleted += 1;
    if (Number.isFinite(durationMs)) this.pickLatencies.push(Math.max(0, durationMs));
  }

  recordRaf(now = performance.now()) {
    this.rafFrames += 1;
    if (this.lastRafAt !== null) this.rafIntervals.push(Math.max(0, now - this.lastRafAt));
    this.lastRafAt = now;
  }

  summary(now = performance.now()) {
    const durationMs = Math.max(0, now - this.startedAt);
    const raf = stats(this.rafIntervals);
    const render = stats(this.renderDurations);
    const submit = stats(this.queueSubmitDurations);
    const pick = stats(this.pickLatencies);
    const cadenceHz = raf.average && raf.average > 0 ? 1000 / raf.average : null;
    return {
      schema: "historia-frame-pass-profiling/v1",
      durationMs,
      cadence: {
        rafFrames: this.rafFrames,
        intervalMs: raf,
        observedHz: cadenceHz,
        targetHz: 144,
        likelyBrowserCadenceLimited: raf.p50 !== null && raf.p50 >= (1000 / 144) * 1.5,
      },
      render: {
        calls: this.renderCalls,
        cpuDurationMs: render,
      },
      queueSubmit: {
        calls: this.queueSubmits,
        cpuDurationMs: submit,
      },
      picking: {
        requested: this.pickRequested,
        accepted: this.pickAccepted,
        skippedBusy: this.pickSkippedBusy,
        completed: this.pickCompleted,
        completionRate: this.pickAccepted ? this.pickCompleted / this.pickAccepted : null,
        endToEndMs: pick,
      },
    };
  }
}

function stats(values) {
  if (!values.length) return EMPTY_STATS;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50: percentile(sorted, 0.5),
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

export default FramePassProfiler;
