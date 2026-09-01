const MAX_QUERY_PAIRS = 2048;
const QUERY_STRIDE = 256;
const TIMESTAMP_SAMPLE_INTERVAL_FRAMES = 8;

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
  let readbackBuffer = null;
  let nextQueryPair = 0;
  let frameCounter = 0;
  const pendingSamples = new Set();
  const timestampSupported = Boolean(device?.features?.has?.("timestamp-query"));

  if (timestampSupported && typeof device.createQuerySet === "function") {
    try {
      querySet = device.createQuerySet({ type: "timestamp", count: MAX_QUERY_PAIRS * 2 });
      resolveBuffer = device.createBuffer({
        size: MAX_QUERY_PAIRS * QUERY_STRIDE,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
      readbackBuffer = device.createBuffer({
        size: MAX_QUERY_PAIRS * QUERY_STRIDE,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      telemetry.gpuTiming = "supported";
    } catch (error) {
      telemetry.timestampError = String(error?.message || error);
    }
  }

  function beginFrame() {
    frameCounter += 1;
    if (!querySet) return -1;
    if (frameCounter % TIMESTAMP_SAMPLE_INTERVAL_FRAMES !== 0) return -1;
    if (nextQueryPair >= MAX_QUERY_PAIRS) {
      telemetry.timestampSamplesDropped += 1;
      return -1;
    }
    return nextQueryPair++;
  }

  function writeTimestamp(encoder, slot, phase) {
    if (!querySet || slot < 0 || !encoder?.writeTimestamp) return false;
    try {
      encoder.writeTimestamp(querySet, slot * 2 + (phase === "end" ? 1 : 0));
      return true;
    } catch (error) {
      telemetry.timestampError = String(error?.message || error);
      return false;
    }
  }

  function getTimestampWrites(slot, phase) {
    if (!querySet || slot < 0) return undefined;
    if (phase === "begin") {
      return { querySet, beginningOfPassWriteIndex: slot * 2 };
    }
    if (phase === "end") {
      return { querySet, endOfPassWriteIndex: slot * 2 + 1 };
    }
    throw new Error(`Unknown timestamp phase: ${phase}`);
  }

  function finishFrame(encoder, slot) {
    if (!querySet || slot < 0) return;
    try {
      encoder.resolveQuerySet(querySet, slot * 2, 2, resolveBuffer, slot * QUERY_STRIDE);
      encoder.copyBufferToBuffer(resolveBuffer, slot * QUERY_STRIDE, readbackBuffer, slot * QUERY_STRIDE, 16);
      pendingSamples.add(slot);
    } catch (error) {
      telemetry.gpuTiming = "unsupported";
      telemetry.timestampError = String(error?.message || error);
    }
  }

  async function collect() {
    if (!readbackBuffer || !pendingSamples.size) return;
    try {
      await device.queue.onSubmittedWorkDone();
      await readbackBuffer.mapAsync(GPUMapMode.READ);
      const data = new BigUint64Array(readbackBuffer.getMappedRange());
      for (const slot of pendingSamples) {
        const base = (slot * QUERY_STRIDE) / 8;
        const begin = Number(data[base]);
        const end = Number(data[base + 1]);
        const deltaNs = end - begin;
        if (telemetry.timestampRawSamples.length < 4) {
          telemetry.timestampRawSamples.push({ slot, begin, end, deltaNs });
        }
        if (!Number.isFinite(begin) || !Number.isFinite(end) || end < begin) {
          telemetry.timestampSamplesDropped += 1;
          continue;
        }
        if (deltaNs <= 0) {
          telemetry.timestampSamplesZero += 1;
          continue;
        }
        telemetry.gpuSamples.push(deltaNs / 1e6);
      }
      readbackBuffer.unmap();
      pendingSamples.clear();
      if (!telemetry.gpuSamples.length && telemetry.timestampSamplesZero > 0 && !telemetry.timestampError) {
        telemetry.timestampError = "Timestamp query returned no positive measurable GPU interval";
      }
    } catch (error) {
      telemetry.gpuTiming = "unsupported";
      telemetry.timestampError = String(error?.message || error);
      try { readbackBuffer.unmap(); } catch {}
    }
  }

  function recordComputePass() { telemetry.computePasses += 1; }
  function recordDispatch() { telemetry.dispatchCalls += 1; }
  function recordRenderPass() { telemetry.renderPasses += 1; }
  function recordDraw() { telemetry.drawCalls += 1; }
  function recordSubmit() { telemetry.queueSubmits += 1; }
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
    querySet?.destroy?.();
    resolveBuffer?.destroy?.();
    readbackBuffer?.destroy?.();
    querySet = null;
    resolveBuffer = null;
    readbackBuffer = null;
    pendingSamples.clear();
    frameCounter = 0;
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
