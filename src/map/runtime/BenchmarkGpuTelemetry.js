const MAX_QUERY_PAIRS = 2048;
const QUERY_STRIDE = 256;
const TIMESTAMP_SAMPLE_INTERVAL_FRAMES = 8;
const SLOT_STATES = Object.freeze({
  PENDING_SUBMIT: "PENDING_SUBMIT",
  RESOLVED: "RESOLVED",
  READBACK_PENDING: "READBACK_PENDING",
  COMPLETED: "COMPLETED",
});

export function createWebGpuBenchmarkTelemetry(device) {
  const telemetry = {
    gpuTiming: "unsupported",
    computePasses: 0,
    dispatchCalls: 0,
    renderPasses: 0,
    drawCalls: 0,
    queueSubmits: 0,
    picking: { renderPasses: 0, drawCalls: 0, queueSubmits: 0 },
    gpuSamples: [],
    timestampSamplesDropped: 0,
    timestampSamplesZero: 0,
    timestampError: null,
    timestampRawSamples: [],
    adapter: readAdapterInfo(device),
  };

  let querySet = null;
  let resolveBuffer = null;
  let nextQueryPair = 0;
  let frameCounter = 0;
  let collectPromise = null;
  let disposed = false;
  const slots = new Map();
  const timestampSupported = Boolean(device?.features?.has?.("timestamp-query"));

  if (timestampSupported && typeof device.createQuerySet === "function") {
    try {
      querySet = device.createQuerySet({ type: "timestamp", count: MAX_QUERY_PAIRS * 2 });
      resolveBuffer = device.createBuffer({
        size: MAX_QUERY_PAIRS * QUERY_STRIDE,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
      telemetry.gpuTiming = "supported";
    } catch (error) {
      telemetry.timestampError = String(error?.message || error);
    }
  }

  function beginFrame() {
    frameCounter += 1;
    if (!querySet || disposed) return -1;
    if (frameCounter % TIMESTAMP_SAMPLE_INTERVAL_FRAMES !== 0) return -1;
    if (nextQueryPair >= MAX_QUERY_PAIRS) {
      telemetry.timestampSamplesDropped += 1;
      return -1;
    }

    const slot = nextQueryPair++;
    slots.set(slot, {
      slot,
      state: SLOT_STATES.PENDING_SUBMIT,
      submitted: false,
      resolveOffset: slot * QUERY_STRIDE,
    });
    return slot;
  }

  function writeTimestamp(encoder, slot, phase) {
    const entry = slots.get(slot);
    if (!querySet || !entry || entry.state !== SLOT_STATES.PENDING_SUBMIT || !encoder?.writeTimestamp) return false;

    try {
      encoder.writeTimestamp(querySet, slot * 2 + (phase === "end" ? 1 : 0));
      return true;
    } catch (error) {
      telemetry.timestampError = String(error?.message || error);
      return false;
    }
  }

  function getTimestampWrites(slot, phase) {
    const entry = slots.get(slot);
    if (!querySet || !entry || entry.state !== SLOT_STATES.PENDING_SUBMIT) return undefined;
    if (phase === "begin") return { querySet, beginningOfPassWriteIndex: slot * 2 };
    if (phase === "end") return { querySet, endOfPassWriteIndex: slot * 2 + 1 };
    throw new Error(`Unknown timestamp phase: ${phase}`);
  }

  function finishFrame(encoder, slot) {
    const entry = slots.get(slot);
    if (!querySet || !entry || entry.state !== SLOT_STATES.PENDING_SUBMIT) return false;

    try {
      encoder.resolveQuerySet(querySet, slot * 2, 2, resolveBuffer, entry.resolveOffset);
      entry.state = SLOT_STATES.RESOLVED;
      return true;
    } catch (error) {
      entry.state = SLOT_STATES.COMPLETED;
      telemetry.timestampSamplesDropped += 1;
      telemetry.timestampError = String(error?.message || error);
      return false;
    }
  }

  function recordSubmit() {
    telemetry.queueSubmits += 1;
    for (const entry of slots.values()) {
      if (entry.state === SLOT_STATES.RESOLVED && !entry.submitted) entry.submitted = true;
    }
  }

  async function collect() {
    if (collectPromise) return collectPromise;
    if (disposed || !resolveBuffer || !device?.queue?.onSubmittedWorkDone) return;

    const candidates = [...slots.values()].filter(
      (entry) => entry.state === SLOT_STATES.RESOLVED && entry.submitted,
    );
    if (!candidates.length) return;

    for (const entry of candidates) entry.state = SLOT_STATES.READBACK_PENDING;

    collectPromise = (async () => {
      let readbackBuffer = null;
      let mapped = false;
      try {
        await device.queue.onSubmittedWorkDone();

        const maxOffset = Math.max(...candidates.map((entry) => entry.resolveOffset));
        const readbackSize = maxOffset + 16;
        readbackBuffer = device.createBuffer({
          size: readbackSize,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        const encoder = device.createCommandEncoder();
        for (const entry of candidates) {
          encoder.copyBufferToBuffer(
            resolveBuffer,
            entry.resolveOffset,
            readbackBuffer,
            entry.resolveOffset,
            16,
          );
        }
        device.queue.submit([encoder.finish()]);
        await device.queue.onSubmittedWorkDone();

        await readbackBuffer.mapAsync(GPUMapMode.READ, 0, readbackSize);
        mapped = true;
        const data = new BigUint64Array(readbackBuffer.getMappedRange(0, readbackSize));

        for (const entry of candidates) {
          const base = entry.resolveOffset / 8;
          const begin = Number(data[base]);
          const end = Number(data[base + 1]);
          const deltaNs = end - begin;

          if (telemetry.timestampRawSamples.length < 4) {
            telemetry.timestampRawSamples.push({ slot: entry.slot, begin, end, deltaNs });
          }

          if (!Number.isFinite(begin) || !Number.isFinite(end) || end < begin) {
            telemetry.timestampSamplesDropped += 1;
          } else if (deltaNs <= 0) {
            telemetry.timestampSamplesZero += 1;
          } else {
            telemetry.gpuSamples.push(deltaNs / 1e6);
          }

          entry.state = SLOT_STATES.COMPLETED;
        }
      } catch (error) {
        telemetry.gpuTiming = "unsupported";
        telemetry.timestampError = String(error?.message || error);
        for (const entry of candidates) {
          if (entry.state === SLOT_STATES.READBACK_PENDING) entry.state = SLOT_STATES.RESOLVED;
        }
      } finally {
        if (mapped) {
          try { readbackBuffer?.unmap?.(); } catch {}
        }
        readbackBuffer?.destroy?.();
        collectPromise = null;
      }
    })();

    return collectPromise;
  }

  function recordComputePass() { telemetry.computePasses += 1; }
  function recordDispatch() { telemetry.dispatchCalls += 1; }
  function recordRenderPass() { telemetry.renderPasses += 1; }
  function recordDraw() { telemetry.drawCalls += 1; }
  function recordPickingRenderPass() { telemetry.picking.renderPasses += 1; }
  function recordPickingDraw() { telemetry.picking.drawCalls += 1; }
  function recordPickingSubmit() { telemetry.picking.queueSubmits += 1; }

  function snapshot() {
    return {
      computePasses: telemetry.computePasses,
      dispatchCalls: telemetry.dispatchCalls,
      renderPasses: telemetry.renderPasses,
      drawCalls: telemetry.drawCalls,
      queueSubmits: telemetry.queueSubmits,
      picking: { ...telemetry.picking },
      gpuTiming: telemetry.gpuTiming,
      gpuTimeMs: telemetry.gpuSamples.length ? summarize(telemetry.gpuSamples) : null,
      timestampSamplesDropped: telemetry.timestampSamplesDropped,
      timestampSamplesZero: telemetry.timestampSamplesZero,
      timestampError: telemetry.timestampError,
      timestampRawSamples: [...telemetry.timestampRawSamples],
      timestampSampleIntervalFrames: TIMESTAMP_SAMPLE_INTERVAL_FRAMES,
      adapter: telemetry.adapter,
    };
  }

  function dispose() {
    disposed = true;
    querySet?.destroy?.();
    resolveBuffer?.destroy?.();
    querySet = null;
    resolveBuffer = null;
    slots.clear();
    frameCounter = 0;
    nextQueryPair = 0;
  }

  return {
    telemetry,
    beginFrame,
    writeTimestamp,
    getTimestampWrites,
    finishFrame,
    collect,
    snapshot,
    recordComputePass,
    recordDispatch,
    recordRenderPass,
    recordDraw,
    recordSubmit,
    recordPickingRenderPass,
    recordPickingDraw,
    recordPickingSubmit,
    dispose,
  };
}

function readAdapterInfo(device) {
  const info = device?.adapterInfo;
  if (!info) return null;
  return {
    vendor: info.vendor || null,
    architecture: info.architecture || null,
    device: info.device || null,
    description: info.description || null,
    isFallbackAdapter: typeof info.isFallbackAdapter === "boolean" ? info.isFallbackAdapter : null,
  };
}

function summarize(values) {
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
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * p) - 1))];
}
