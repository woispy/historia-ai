const RING_SLOT_COUNT = 4;
const QUERY_VALUES_PER_SLOT = 2;
const QUERY_BYTES_PER_SLOT = QUERY_VALUES_PER_SLOT * 8;
const RESOLVE_STRIDE = 256;
const RESOLVE_BUFFER_SIZE = RING_SLOT_COUNT * RESOLVE_STRIDE;
const STAGING_BUFFER_SIZE = RESOLVE_STRIDE;
const TIMESTAMP_SAMPLE_INTERVAL_FRAMES = 8;
const SLOT_STATES = Object.freeze({
  FREE: "FREE",
  RECORDING: "RECORDING",
  RESOLVED: "RESOLVED",
  READBACK_PENDING: "READBACK_PENDING",
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
  let frameCounter = 0;
  let nextRingSlot = 0;
  let collectPromise = null;
  let disposed = false;
  const slots = Array.from({ length: RING_SLOT_COUNT }, (_, slot) => ({
    slot,
    state: SLOT_STATES.FREE,
    submitted: false,
    beginWritten: false,
    endWritten: false,
    resolveOffset: slot * RESOLVE_STRIDE,
    stagingBuffer: null,
  }));

  const timestampSupported = Boolean(device?.features?.has?.("timestamp-query"));

  if (timestampSupported && typeof device.createQuerySet === "function") {
    try {
      querySet = device.createQuerySet({
        type: "timestamp",
        count: RING_SLOT_COUNT * QUERY_VALUES_PER_SLOT,
      });
      resolveBuffer = device.createBuffer({
        size: RESOLVE_BUFFER_SIZE,
        usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC,
      });
      for (const slot of slots) {
        slot.stagingBuffer = device.createBuffer({
          size: STAGING_BUFFER_SIZE,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
      }
      telemetry.gpuTiming = "supported";
    } catch (error) {
      telemetry.timestampError = String(error?.message || error);
      for (const slot of slots) slot.stagingBuffer?.destroy?.();
      querySet?.destroy?.();
      resolveBuffer?.destroy?.();
      querySet = null;
      resolveBuffer = null;
    }
  }

  function beginFrame() {
    frameCounter += 1;
    if (!querySet || disposed) return -1;
    if (frameCounter % TIMESTAMP_SAMPLE_INTERVAL_FRAMES !== 0) return -1;

    for (let i = 0; i < RING_SLOT_COUNT; i += 1) {
      const index = (nextRingSlot + i) % RING_SLOT_COUNT;
      const slot = slots[index];
      if (slot.state !== SLOT_STATES.FREE) continue;

      nextRingSlot = (index + 1) % RING_SLOT_COUNT;
      slot.state = SLOT_STATES.RECORDING;
      slot.submitted = false;
      slot.beginWritten = false;
      slot.endWritten = false;
      return slot.slot;
    }

    telemetry.timestampSamplesDropped += 1;
    telemetry.timestampError = "WebGPU timestamp ring buffer exhausted";
    return -1;
  }

  function writeTimestamp(encoder, slotId, phase) {
    const slot = slots[slotId];
    if (!querySet || !slot || slot.state !== SLOT_STATES.RECORDING || typeof encoder?.writeTimestamp !== "function") {
      return false;
    }

    const isBegin = phase === "begin";
    const isEnd = phase === "end";
    if (!isBegin && !isEnd) throw new Error(`Unknown timestamp phase: ${phase}`);
    if (isBegin && slot.beginWritten) return false;
    if (isEnd && (!slot.beginWritten || slot.endWritten)) return false;

    const queryIndex = slot.slot * QUERY_VALUES_PER_SLOT + (isEnd ? 1 : 0);
    try {
      encoder.writeTimestamp(querySet, queryIndex);
      if (isBegin) slot.beginWritten = true;
      else slot.endWritten = true;
      return true;
    } catch (error) {
      telemetry.timestampSamplesDropped += 1;
      telemetry.timestampError = String(error?.message || error);
      slot.state = SLOT_STATES.FREE;
      return false;
    }
  }

  function finishFrame(encoder, slotId) {
    const slot = slots[slotId];
    if (!querySet || !slot || slot.state !== SLOT_STATES.RECORDING) return false;
    if (!slot.beginWritten || !slot.endWritten) {
      telemetry.timestampSamplesDropped += 1;
      telemetry.timestampError = "Timestamp pair was not completely written";
      slot.state = SLOT_STATES.FREE;
      return false;
    }

    try {
      encoder.resolveQuerySet(
        querySet,
        slot.slot * QUERY_VALUES_PER_SLOT,
        QUERY_VALUES_PER_SLOT,
        resolveBuffer,
        slot.resolveOffset,
      );
      slot.state = SLOT_STATES.RESOLVED;
      return true;
    } catch (error) {
      telemetry.timestampSamplesDropped += 1;
      telemetry.timestampError = String(error?.message || error);
      slot.state = SLOT_STATES.FREE;
      return false;
    }
  }

  function recordSubmit() {
    telemetry.queueSubmits += 1;
    for (const slot of slots) {
      if (slot.state === SLOT_STATES.RESOLVED && !slot.submitted) slot.submitted = true;
    }
  }

  async function collect() {
    if (collectPromise) return collectPromise;
    if (disposed || !resolveBuffer || !device?.queue?.onSubmittedWorkDone) return;

    const candidates = slots.filter(
      (slot) => slot.state === SLOT_STATES.RESOLVED && slot.submitted,
    );
    if (!candidates.length) return;

    for (const slot of candidates) slot.state = SLOT_STATES.READBACK_PENDING;

    collectPromise = (async () => {
      try {
        // First fence: the resolve writes from the render submission are complete.
        await device.queue.onSubmittedWorkDone();

        const copyEncoder = device.createCommandEncoder();
        for (const slot of candidates) {
          copyEncoder.copyBufferToBuffer(
            resolveBuffer,
            slot.resolveOffset,
            slot.stagingBuffer,
            0,
            QUERY_BYTES_PER_SLOT,
          );
        }
        device.queue.submit([copyEncoder.finish()]);

        // Second fence: the staging copies are complete before mapAsync.
        await device.queue.onSubmittedWorkDone();

        for (const slot of candidates) {
          let mapped = false;
          try {
            await slot.stagingBuffer.mapAsync(GPUMapMode.READ, 0, QUERY_BYTES_PER_SLOT);
            mapped = true;
            const mappedRange = slot.stagingBuffer.getMappedRange(0, QUERY_BYTES_PER_SLOT);
            const data = new BigUint64Array(mappedRange);
            const begin = Number(data[0]);
            const end = Number(data[1]);
            const deltaNs = end - begin;

            if (telemetry.timestampRawSamples.length < 4) {
              telemetry.timestampRawSamples.push({ slot: slot.slot, begin, end, deltaNs });
            }

            if (!Number.isFinite(begin) || !Number.isFinite(end) || end < begin) {
              telemetry.timestampSamplesDropped += 1;
              telemetry.timestampError = "Invalid WebGPU timestamp pair";
            } else if (deltaNs <= 0) {
              telemetry.timestampSamplesDropped += 1;
              telemetry.timestampSamplesZero += 1;
            } else {
              telemetry.gpuSamples.push(deltaNs / 1e6);
            }
          } catch (error) {
            telemetry.timestampSamplesDropped += 1;
            telemetry.timestampError = String(error?.message || error);
          } finally {
            if (mapped) {
              try {
                slot.stagingBuffer.unmap();
              } catch (error) {
                telemetry.timestampError = String(error?.message || error);
              }
            }
            slot.state = SLOT_STATES.FREE;
            slot.submitted = false;
            slot.beginWritten = false;
            slot.endWritten = false;
          }
        }
      } catch (error) {
        telemetry.timestampSamplesDropped += candidates.length;
        telemetry.timestampError = String(error?.message || error);
        for (const slot of candidates) {
          try { slot.stagingBuffer?.unmap?.(); } catch {}
          slot.state = SLOT_STATES.FREE;
          slot.submitted = false;
          slot.beginWritten = false;
          slot.endWritten = false;
        }
      } finally {
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
      timestampRingSlotCount: RING_SLOT_COUNT,
      adapter: telemetry.adapter,
    };
  }

  function dispose() {
    disposed = true;
    for (const slot of slots) {
      try { slot.stagingBuffer?.unmap?.(); } catch {}
      slot.stagingBuffer?.destroy?.();
      slot.stagingBuffer = null;
      slot.state = SLOT_STATES.FREE;
    }
    querySet?.destroy?.();
    resolveBuffer?.destroy?.();
    querySet = null;
    resolveBuffer = null;
    collectPromise = null;
    frameCounter = 0;
    nextRingSlot = 0;
  }

  return {
    telemetry,
    beginFrame,
    writeTimestamp,
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
