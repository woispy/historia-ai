import { test } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const output = process.env.HISTORIA_BENCHMARK_OUTPUT || "artifacts/benchmark-result.json";

const WORKLOADS = [
  { workgroups: 1, iterations: 1 },
  { workgroups: 16, iterations: 1 },
  { workgroups: 64, iterations: 1 },
  { workgroups: 256, iterations: 1 },
  { workgroups: 1024, iterations: 1 },
];

async function calibrate(page) {
  return page.evaluate(async (workloads) => {
    const result = {
      supported: false,
      adapter: null,
      feature: null,
      samples: [],
      positiveSamples: 0,
      zeroSamples: 0,
      firstPositiveWorkload: null,
      minPositiveDeltaNs: null,
      classification: "unsupported",
      error: null,
    };

    if (!navigator.gpu) {
      result.error = "navigator.gpu unavailable";
      return result;
    }

    let adapter;
    let device;
    let workload;
    try {
      adapter = await navigator.gpu.requestAdapter({ powerPreference: "high-performance" });
      if (!adapter) {
        result.error = "no adapter";
        return result;
      }
      const info = adapter.info || adapter.adapterInfo || null;
      result.adapter = info ? {
        vendor: info.vendor || null,
        architecture: info.architecture || null,
        device: info.device || null,
        description: info.description || null,
        isFallbackAdapter: typeof info.isFallbackAdapter === "boolean" ? info.isFallbackAdapter : null,
      } : null;
      result.feature = adapter.features?.has?.("timestamp-query") ? "timestamp-query" : null;
      if (!result.feature) {
        result.error = "adapter lacks timestamp-query";
        return result;
      }
      result.supported = true;
      device = await adapter.requestDevice({ requiredFeatures: ["timestamp-query"] });

      const shader = device.createShaderModule({ code: `
        @group(0) @binding(0) var<storage, read_write> data: array<u32>;
        @compute @workgroup_size(64)
        fn main(@builtin(global_invocation_id) id: vec3<u32>) {
          var x = id.x + 1u;
          for (var i = 0u; i < 256u; i = i + 1u) {
            x = x * 1664525u + 1013904223u;
          }
          data[id.x] = x;
        }
      ` });
      const pipeline = device.createComputePipeline({ layout: "auto", compute: { module: shader, entryPoint: "main" } });
      const maxWorkgroups = Math.max(...workloads.map((w) => w.workgroups));
      workload = device.createBuffer({ size: Math.max(4, maxWorkgroups * 64 * 4), usage: GPUBufferUsage.STORAGE });
      const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: workload } }] });

      for (const spec of workloads) {
        const querySet = device.createQuerySet({ type: "timestamp", count: 2 });
        const resolve = device.createBuffer({ size: 16, usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC });
        const readback = device.createBuffer({ size: 16, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });
        try {
          const encoder = device.createCommandEncoder();
          encoder.writeTimestamp(querySet, 0);
          const pass = encoder.beginComputePass();
          pass.setPipeline(pipeline);
          pass.setBindGroup(0, bindGroup);
          for (let i = 0; i < spec.iterations; i += 1) pass.dispatchWorkgroups(spec.workgroups);
          pass.end();
          encoder.writeTimestamp(querySet, 1);
          encoder.resolveQuerySet(querySet, 0, 2, resolve, 0);
          encoder.copyBufferToBuffer(resolve, 0, readback, 0, 16);
          device.queue.submit([encoder.finish()]);
          await device.queue.onSubmittedWorkDone();
          await readback.mapAsync(GPUMapMode.READ);
          const data = new BigUint64Array(readback.getMappedRange());
          const begin = Number(data[0]);
          const end = Number(data[1]);
          const deltaNs = end - begin;
          result.samples.push({ ...spec, begin, end, deltaNs, positive: Number.isFinite(deltaNs) && deltaNs > 0 });
          if (Number.isFinite(deltaNs) && deltaNs > 0) {
            result.positiveSamples += 1;
            if (!result.firstPositiveWorkload) result.firstPositiveWorkload = { ...spec, deltaNs };
            result.minPositiveDeltaNs = result.minPositiveDeltaNs == null ? deltaNs : Math.min(result.minPositiveDeltaNs, deltaNs);
          } else if (deltaNs === 0) {
            result.zeroSamples += 1;
          }
          readback.unmap();
        } finally {
          try { readback.unmap(); } catch {}
          querySet.destroy();
          resolve.destroy();
          readback.destroy();
        }
      }

      if (result.positiveSamples === 0) result.classification = "no-positive-interval";
      else if (result.zeroSamples > 0) result.classification = "quantized-or-below-resolution";
      else result.classification = "measurable";
    } catch (error) {
      result.error = String(error?.message || error);
      result.classification = "probe-error";
    } finally {
      workload?.destroy?.();
      device?.destroy?.();
    }
    return result;
  }, WORKLOADS);
}

test("Historia AI WebGPU timestamp resolution calibration", async ({ page }) => {
  await page.goto("/benchmarks/map-benchmark.html?backend=webgpu&durationMs=1", { waitUntil: "load" });
  const result = await calibrate(page);
  const file = output.replace(/\.json$/i, "-timestamp-calibration.json");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(result, null, 2));
  console.log(`HISTORIA_TIMESTAMP_CALIBRATION ${JSON.stringify(result)}`);

  if (process.env.HISTORIA_REQUIRE_GPU_TIMESTAMP === "1") {
    if (!result.supported) throw new Error(`Timestamp calibration unavailable: ${result.error || "unknown reason"}`);
    if (result.error) throw new Error(`Timestamp calibration failed: ${result.error}`);
    if (result.positiveSamples === 0) throw new Error("Timestamp calibration produced no positive measurable interval");
  }
});
