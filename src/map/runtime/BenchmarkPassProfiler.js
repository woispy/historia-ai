const PASS_NAMES = Object.freeze({ compute: ["cull", "finalize"], render: ["draw"], picking: ["picking"] });
const QUERY_COUNT = 16;
const QUERY_BYTES = QUERY_COUNT * 8;
const RESOLVE_BYTES = 256;
const DEFAULT_SAMPLE_INTERVAL_FRAMES = 256;

export function createBenchmarkPassProfiler(device, { sampleIntervalFrames = DEFAULT_SAMPLE_INTERVAL_FRAMES } = {}) {
  const prototype = globalThis.GPUCommandEncoder?.prototype;
  const supported = Boolean(device?.features?.has?.("timestamp-query") && prototype?.beginComputePass && prototype?.beginRenderPass && prototype?.finish);
  if (!supported) return { supported: false, beginOperation() {}, endOperation() {}, notifySubmit() {}, async collect() {}, snapshot() { return { supported: false, sampleIntervalFrames, samples: 0, dropped: 0, error: null, passes: {} }; }, dispose() {} };

  let frameCounter = 0;
  let currentSample = null;
  let collectScheduled = false;
  let disposed = false;
  const samples = [];
  const pending = [];
  const dropped = { count: 0, error: null };
  const commandSamples = new WeakMap();

  function beginOperation(operation) {
    if (disposed) return;
    frameCounter += 1;
    currentSample = frameCounter % sampleIntervalFrames === 0 ? createSample(operation) : null;
  }

  function endOperation() {
    currentSample = null;
  }

  function createSample(operation) {
    try {
      return { operation, querySet: device.createQuerySet({ type: "timestamp", count: QUERY_COUNT }), resolveBuffer: device.createBuffer({ size: RESOLVE_BYTES, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC }), stagingBuffer: device.createBuffer({ size: QUERY_BYTES, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ }), nextQuery: 0, passes: [], submitted: false, collected: false };
    } catch (error) {
      dropped.count += 1;
      dropped.error = String(error?.message || error);
      return null;
    }
  }

  const originalBeginComputePass = prototype.beginComputePass;
  const originalBeginRenderPass = prototype.beginRenderPass;
  const originalFinish = prototype.finish;

  prototype.beginComputePass = function benchmarkPassBeginComputePass(descriptor = {}) {
    const sample = currentSample;
    const passIndex = sample?.passes.length ?? 0;
    const name = PASS_NAMES.compute[passIndex] || `compute-${passIndex + 1}`;
    let effective = descriptor;
    if (sample && sample.operation === "render") {
      const index = sample.nextQuery;
      if (index + 1 < QUERY_COUNT) {
        sample.nextQuery += 2;
        sample.passes.push({ name, begin: index, end: index + 1 });
        effective = { ...descriptor, timestampWrites: { querySet: sample.querySet, beginningOfPassWriteIndex: index, endOfPassWriteIndex: index + 1 } };
      }
    }
    return originalBeginComputePass.call(this, effective);
  };

  prototype.beginRenderPass = function benchmarkPassBeginRenderPass(descriptor = {}) {
    const sample = currentSample;
    let effective = descriptor;
    if (sample) {
      const index = sample.nextQuery;
      if (index + 1 < QUERY_COUNT) {
        sample.nextQuery += 2;
        const name = sample.operation === "picking" ? "picking" : "draw";
        sample.passes.push({ name, begin: index, end: index + 1 });
        effective = { ...descriptor, timestampWrites: { querySet: sample.querySet, beginningOfPassWriteIndex: index, endOfPassWriteIndex: index + 1 } };
      }
    }
    return originalBeginRenderPass.call(this, effective);
  };

  prototype.finish = function benchmarkPassFinish(...args) {
    const sample = currentSample;
    if (sample && sample.nextQuery > 0) {
      try {
        this.resolveQuerySet(sample.querySet, 0, sample.nextQuery, sample.resolveBuffer, 0);
        this.copyBufferToBuffer(sample.resolveBuffer, 0, sample.stagingBuffer, 0, sample.nextQuery * 8);
      } catch (error) {
        dropped.count += 1;
        dropped.error = String(error?.message || error);
        sample.collected = true;
      }
    }
    const commandBuffer = originalFinish.apply(this, args);
    if (sample && !sample.collected && sample.nextQuery > 0) {
      commandSamples.set(commandBuffer, sample);
      pending.push(sample);
    }
    return commandBuffer;
  };

  function notifySubmit(commandBuffers) {
    if (disposed || !Array.isArray(commandBuffers)) return;
    const submitted = commandBuffers.map((buffer) => commandSamples.get(buffer)).filter(Boolean);
    if (!submitted.length) return;
    for (const sample of submitted) sample.submitted = true;
    scheduleCollect();
  }

  function scheduleCollect() {
    if (collectScheduled || disposed) return;
    collectScheduled = true;
    queueMicrotask(() => void collect());
  }

  async function collect() {
    try {
      if (!pending.some((sample) => sample.submitted && !sample.collected)) return;
      await device.queue.onSubmittedWorkDone();
      for (const sample of pending) {
        if (!sample.submitted || sample.collected) continue;
        try {
          await sample.stagingBuffer.mapAsync(GPUMapMode.READ, 0, sample.nextQuery * 8);
          const values = new BigUint64Array(sample.stagingBuffer.getMappedRange(0, sample.nextQuery * 8)).slice();
          sample.stagingBuffer.unmap();
          const measured = {};
          for (const pass of sample.passes) {
            const delta = Number(values[pass.end] - values[pass.begin]);
            if (delta > 0 && Number.isFinite(delta)) measured[pass.name] = delta / 1e6;
          }
          samples.push({ operation: sample.operation, passes: measured });
        } catch (error) {
          dropped.count += 1;
          dropped.error = String(error?.message || error);
        } finally {
          sample.collected = true;
          sample.querySet.destroy?.();
          sample.resolveBuffer.destroy?.();
          sample.stagingBuffer.destroy?.();
        }
      }
    } finally {
      collectScheduled = false;
      if (pending.some((sample) => sample.submitted && !sample.collected)) scheduleCollect();
    }
  }

  function snapshot() {
    const grouped = {};
    for (const sample of samples) {
      for (const [name, value] of Object.entries(sample.passes)) {
        grouped[name] ??= [];
        grouped[name].push(value);
      }
    }
    const passes = {};
    for (const [name, values] of Object.entries(grouped)) passes[name] = summarize(values);
    return { supported: true, sampleIntervalFrames, samples: samples.length, dropped: dropped.count, error: dropped.error, passes };
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    currentSample = null;
    prototype.beginComputePass = originalBeginComputePass;
    prototype.beginRenderPass = originalBeginRenderPass;
    prototype.finish = originalFinish;
    collectScheduled = false;
  }

  return { supported: true, beginOperation, endOperation, notifySubmit, collect, snapshot, dispose };
}

function summarize(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const percentile = (q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1))];
  return { count: values.length, average: values.reduce((sum, value) => sum + value, 0) / values.length, p50: percentile(0.5), p95: percentile(0.95), p99: percentile(0.99), max: sorted[sorted.length - 1], min: sorted[0] };
}
