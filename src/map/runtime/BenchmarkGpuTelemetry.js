const MAX_QUERY_PAIRS = 2048;
const QUERY_STRIDE = 256;

export function installWebGpuBenchmarkTelemetry(renderer) {
  if (!renderer?.device?.queue) return null;
  const device = renderer.device;
  const queue = device.queue;
  const telemetry = {
    gpuTiming: "unsupported",
    timestampPeriodNs: null,
    timestampPeriodSource: null,
    computePasses: 0,
    dispatchCalls: 0,
    renderPasses: 0,
    drawCalls: 0,
    queueSubmits: 0,
    picking: { renderPasses: 0, drawCalls: 0, queueSubmits: 0 },
    gpuSamples: [],
    timestampSamplesDropped: 0,
  };

  let pickingActive = false;
  let querySet = null;
  let resolveBuffer = null;
  let readbackBuffer = null;
  let nextQueryPair = 0;
  const pendingSamples = new Map();
  const timestampSupported = Boolean(device.features?.has?.("timestamp-query"));

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
      const period = Number(device.limits?.timestampPeriod);
      if (Number.isFinite(period) && period > 0) {
        telemetry.timestampPeriodNs = period;
        telemetry.timestampPeriodSource = "device.limits.timestampPeriod";
      } else {
        telemetry.timestampPeriodNs = 1;
        telemetry.timestampPeriodSource = "WebGPU timestamp values are nanoseconds";
      }
    } catch (error) {
      telemetry.gpuTiming = "unsupported";
      telemetry.timestampError = String(error?.message || error);
    }
  }

  const originalCreateCommandEncoder = device.createCommandEncoder.bind(device);
  const originalSubmit = queue.submit.bind(queue);
  const originalOnSubmittedWorkDone = queue.onSubmittedWorkDone?.bind(queue);
  const originalPick = typeof renderer.pick === "function" ? renderer.pick.bind(renderer) : null;

  device.createCommandEncoder = (descriptor) => {
    const encoder = originalCreateCommandEncoder(descriptor);
    let querySlot = -1;

    if (querySet && nextQueryPair < MAX_QUERY_PAIRS && typeof encoder.writeTimestamp === "function") {
      querySlot = nextQueryPair++;
      try {
        encoder.writeTimestamp(querySet, querySlot * 2);
      } catch (error) {
        telemetry.gpuTiming = "unsupported";
        telemetry.timestampError = String(error?.message || error);
        querySlot = -1;
      }
    } else if (querySet) {
      telemetry.timestampSamplesDropped += 1;
    }

    const beginPass = (kind, original, passDescriptor) => {
      const pass = original(passDescriptor);
      if (kind === "compute") {
        telemetry.computePasses += 1;
      } else {
        telemetry.renderPasses += 1;
        if (pickingActive) telemetry.picking.renderPasses += 1;
      }
      return new Proxy(pass, {
        get(target, property, receiver) {
          if (property === "dispatchWorkgroups" || property === "dispatchWorkgroupsIndirect") {
            return (...args) => {
              telemetry.dispatchCalls += 1;
              return target[property](...args);
            };
          }
          if (property === "draw" || property === "drawIndexed" || property === "drawIndirect" || property === "drawIndexedIndirect") {
            return (...args) => {
              telemetry.drawCalls += 1;
              if (pickingActive) telemetry.picking.drawCalls += 1;
              return target[property](...args);
            };
          }
          return Reflect.get(target, property, receiver);
        },
      });
    };

    return new Proxy(encoder, {
      get(target, property, receiver) {
        if (property === "beginComputePass") return (passDescriptor) => beginPass("compute", target.beginComputePass.bind(target), passDescriptor);
        if (property === "beginRenderPass") return (passDescriptor) => beginPass("render", target.beginRenderPass.bind(target), passDescriptor);
        if (property === "finish") {
          return (...args) => {
            if (querySet && querySlot >= 0) {
              try {
                target.writeTimestamp(querySet, querySlot * 2 + 1);
                target.resolveQuerySet(querySet, querySlot * 2, 2, resolveBuffer, querySlot * QUERY_STRIDE);
                target.copyBufferToBuffer(resolveBuffer, querySlot * QUERY_STRIDE, readbackBuffer, querySlot * QUERY_STRIDE, 16);
                pendingSamples.set(querySlot, true);
              } catch (error) {
                telemetry.gpuTiming = "unsupported";
                telemetry.timestampError = String(error?.message || error);
              }
            }
            return target.finish(...args);
          };
        }
        return Reflect.get(target, property, receiver);
      },
    });
  };

  queue.submit = (commandBuffers) => {
    const count = commandBuffers?.length || 0;
    telemetry.queueSubmits += count;
    if (pickingActive) telemetry.picking.queueSubmits += count;
    return originalSubmit(commandBuffers);
  };

  if (originalPick) {
    renderer.pick = (...args) => {
      pickingActive = true;
      try {
        return originalPick(...args);
      } finally {
        pickingActive = false;
      }
    };
  }

  const collect = async () => {
    if (!readbackBuffer || !pendingSamples.size || !originalOnSubmittedWorkDone) return;
    try {
      await originalOnSubmittedWorkDone();
      await readbackBuffer.mapAsync(GPUMapMode.READ);
      const data = new BigInt64Array(readbackBuffer.getMappedRange());
      for (const slot of pendingSamples.keys()) {
        const base = (slot * QUERY_STRIDE) / 8;
        const begin = Number(data[base]);
        const end = Number(data[base + 1]);
        if (Number.isFinite(begin) && Number.isFinite(end) && end >= begin) {
          telemetry.gpuSamples.push((end - begin) * telemetry.timestampPeriodNs / 1e6);
        }
      }
      readbackBuffer.unmap();
      pendingSamples.clear();
    } catch (error) {
      telemetry.gpuTiming = "unsupported";
      telemetry.timestampError = String(error?.message || error);
      try { readbackBuffer.unmap(); } catch {}
    }
  };

  const snapshot = () => ({
    computePasses: telemetry.computePasses,
    dispatchCalls: telemetry.dispatchCalls,
    renderPasses: telemetry.renderPasses,
    drawCalls: telemetry.drawCalls,
    queueSubmits: telemetry.queueSubmits,
    picking: { ...telemetry.picking },
    gpuTiming: telemetry.gpuTiming,
    gpuTimeMs: telemetry.gpuSamples.length ? summarize(telemetry.gpuSamples) : null,
    timestampPeriodNs: telemetry.timestampPeriodNs,
    timestampPeriodSource: telemetry.timestampPeriodSource,
    timestampSamplesDropped: telemetry.timestampSamplesDropped,
    timestampError: telemetry.timestampError || null,
  });

  renderer.__benchmarkGpuTelemetry = { telemetry, collect, snapshot };
  return renderer.__benchmarkGpuTelemetry;
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
